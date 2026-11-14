import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { staggerGroup } from '../../motion/tokens';
import { DentroDoCartao } from '../../motion/coreografia';
import { Dialogo } from '../ui/Dialogo';

/** Verdadeiro dentro de um `TModal`: o `TForm` de dentro não põe outro cartão de vidro (docs/07 §6). */
export const DentroDoModal = createContext(false);

export function useDentroDoModal(): boolean {
  return useContext(DentroDoModal);
}

/** Largura máxima do modal no desktop (no celular, a tela menos 2 rem). */
export const LARGURA_DO_MODAL = { sm: 448, md: 672, lg: 896 } as const;

export type TModalProps = {
  aberto: boolean;
  titulo: string;
  /** frase curta embaixo do título (ligada por `aria-describedby`) */
  descricao?: string;
  /** Esc, clique fora e o X chamam; quem chama fecha (`aberto={false}`) */
  onFechar: () => void;
  /**
   * Botões do rodapé quando o modal **não** tem formulário (aviso, confirmação com conteúdo). Com um `TForm` dentro,
   * os botões vão no `TFormFooter` do próprio formulário (o Salvar tem de estar dentro do `<form>`).
   */
  acoes?: ReactNode;
  /** `sm` 448 px (padrão: formulário de um ou dois campos) · `md` 672 px · `lg` 896 px */
  largura?: keyof typeof LARGURA_DO_MODAL;
  /** enquanto grava: Esc, clique fora e o X não fecham */
  bloquearFechar?: boolean;
  children: ReactNode;
};

/**
 * Janela do kit (docs/07 §3.1 e §6), sobre o `Dialogo` (Radix): foco preso dentro, Esc fecha, `aria-modal`, foco de
 * volta ao botão que abriu, `glass-solid` em portal com o fundo escurecido **sem** desfoque (o modal é a camada de
 * vidro). Nunca passa de `calc(100vw - 2rem)`.
 *
 * Dentro dele as regras de tela continuam: `TForm`, `TRow`, larguras padrão (relativas à coluna do modal) e
 * `TFormFooter` com os botões embaixo, à esquerda. O `TForm` de dentro não desenha cartão. Ao abrir, o foco vai para
 * o primeiro campo (não use `autoFocus` dentro do modal); sem campo, para o primeiro botão.
 */
export function TModal({ aberto, titulo, descricao, onFechar, acoes, largura = 'sm', bloquearFechar, children }: TModalProps) {
  const corpo = useRef<HTMLDivElement>(null);
  // O primeiro campo do corpo, lido na hora em que o Dialogo abre (os campos já estão montados).
  const primeiroCampo = useMemo(
    () => ({
      get current() {
        return corpo.current?.querySelector<HTMLElement>('input:not([type="hidden"]):not(:disabled), textarea:not(:disabled), [role="combobox"]:not(:disabled)') ?? null;
      },
    }),
    [],
  );

  return (
    <Dialogo
      aberto={aberto}
      onAbertoChange={(v) => {
        if (!v) onFechar();
      }}
      titulo={titulo}
      descricao={descricao}
      largura={LARGURA_DO_MODAL[largura]}
      bloquearFechar={bloquearFechar}
      focoInicial={primeiroCampo}
    >
      <DentroDoModal.Provider value>
        {/* Os campos de dentro encaixam como `campo`, em cascata curta, depois que o modal aparece. */}
        <DentroDoCartao>
          <motion.div ref={corpo} data-kit="TModal" variants={staggerGroup} initial="hidden" animate="show" className="flex min-w-0 flex-col gap-4">
            {children}
          </motion.div>
        </DentroDoCartao>
      </DentroDoModal.Provider>
      {acoes && (
        <div className="mt-5 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto">{acoes}</div>
      )}
    </Dialogo>
  );
}
