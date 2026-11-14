import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { ConfirmDialog } from '../ui/Dialogo';

export type Pergunta = {
  mensagem: string;
  /** título da janela (padrão "Confirmar") */
  titulo?: string;
  /** rótulo do botão que confirma (padrão: o nome da variante, "Inativar", ou "Confirmar") */
  confirmar?: string;
  /** `inativar` e `excluir` abrem como perigo: botão vermelho e foco inicial em Cancelar */
  variante?: 'inativar' | 'reativar' | 'excluir' | 'confirmar';
};

export type Perguntar = (pergunta: Pergunta) => Promise<boolean>;

const PerguntaContext = createContext<Perguntar | null>(null);

const ROTULOS = { inativar: 'Inativar', reativar: 'Reativar', excluir: 'Excluir', confirmar: 'Confirmar' } as const;

/** A variante abre como perigo? (função pura) */
export const ehPerigo = (variante: Pergunta['variante']) => variante === 'inativar' || variante === 'excluir';

/**
 * A janela de confirmação do app, uma só, montada uma vez na raiz (main.tsx). As telas perguntam por
 * `useQuestion()`. Por baixo é o `ConfirmDialog` (Radix: foco preso, Esc, `aria-modal`, em portal).
 */
export function TQuestionProvider({ children }: { children: ReactNode }) {
  const [pergunta, setPergunta] = useState<Pergunta>();
  const [aberto, setAberto] = useState(false);
  const responder = useRef<((sim: boolean) => void) | undefined>(undefined);

  const perguntar = useCallback<Perguntar>(
    (nova) =>
      new Promise<boolean>((resolve) => {
        // Uma pergunta aberta trocada por outra conta como "não".
        responder.current?.(false);
        responder.current = resolve;
        setPergunta(nova);
        setAberto(true);
      }),
    [],
  );

  const fechar = useCallback((sim: boolean) => {
    responder.current?.(sim);
    responder.current = undefined;
    setAberto(false);
  }, []);

  const variante = pergunta?.variante ?? 'confirmar';
  return (
    <PerguntaContext.Provider value={perguntar}>
      {children}
      <ConfirmDialog
        aberto={aberto}
        onAbertoChange={(v) => {
          if (!v) fechar(false);
        }}
        titulo={pergunta?.titulo ?? 'Confirmar'}
        descricao={pergunta?.mensagem}
        confirmar={pergunta?.confirmar ?? ROTULOS[variante]}
        perigo={ehPerigo(variante)}
        onConfirmar={() => fechar(true)}
      />
    </PerguntaContext.Provider>
  );
}

/**
 * `const { confirmar } = useQuestion()` e `if (!(await confirmar({ mensagem, variante: 'inativar' }))) return`.
 * Para inativar, reativar, excluir (docs/07 §3.3).
 */
export function useQuestion(): { confirmar: Perguntar } {
  const perguntar = useContext(PerguntaContext);
  if (!perguntar) throw new Error('useQuestion fora do TQuestionProvider (main.tsx)');
  return { confirmar: perguntar };
}
