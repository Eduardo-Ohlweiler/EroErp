import { useEffect, useRef, useState, type ComponentType, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Eye, ShieldAlert } from 'lucide-react';
import { spring } from '../../motion/tokens';
import { useBlocoDaTela } from '../../motion/coreografia/contexto';
import { cn } from '../../shared/util/utils';
import { Button } from './Button';
import { useVariantesBloco } from './bloco';

export type AvisoContextoProps = {
  /** mostra/esconde com animação */
  visivel?: boolean;
  /** `superadmin`: "Você está dentro de X"; `previa`: selo "Prévia de X" */
  tipo?: 'superadmin' | 'previa';
  children: ReactNode;
  /** ex.: { rotulo: 'Sair do contratante', onClick } */
  acao?: { rotulo: string; onClick: () => void; carregando?: boolean };
  icone?: ComponentType<{ className?: string }>;
  /** fixo embaixo, no centro da tela (portal); sem isso, fica no fluxo onde for colocado */
  flutuante?: boolean;
  className?: string;
};

/**
 * Aviso permanente de contexto: superadmin atuando dentro de um contratante, ou prévia de aparência.
 * Fica numa região role=status: o leitor de tela anuncia quando aparece, sem interromper. Uma região viva que já nasce
 * com o texto costuma não ser lida (a faixa monta junto com a casca); por isso a região monta vazia e o texto para o
 * leitor de tela entra nela `ATRASO_DO_ANUNCIO_MS` depois. O texto visível fica `aria-hidden` (não lê duas vezes).
 *
 * Flutuante (ou dentro da `FaixaDaCasca` fixa), escreve a própria altura em `--folga-inferior` no `<html>`: a pilha de
 * toasts sobe e não cobre o "Sair do contratante" (no celular os dois ficam no mesmo lugar).
 *
 * No fluxo (não flutuante) e dentro de uma <Tela>, é um bloco da montagem: entra e sai com a coreografia da tela
 * (as variantes de bloco dela), em vez de ficar parado na tela vazia enquanto os cartões desmontam.
 * Flutuante (portal), ou fora de uma <Tela>, mantém a animação própria.
 *
 * Não imprime (`nao-imprime`): a faixa é da tela, não do papel. No celular o botão desce para baixo do texto.
 */
export function AvisoContexto({
  visivel = true,
  tipo = 'superadmin',
  children,
  acao,
  icone,
  flutuante,
  className,
}: AvisoContextoProps) {
  const regiao = useRef<HTMLDivElement>(null);
  const anunciar = useAnuncioAtrasado(visivel);
  useFolgaDosToasts(regiao, !!flutuante);
  const Icone = icone ?? (tipo === 'previa' ? Eye : ShieldAlert);
  const daTela = useBlocoDaTela();
  const variantesDoBloco = useVariantesBloco(true);
  const naTela = !flutuante && !!daTela;
  // Na <Tela>: herda hidden/show/exit da coreografia (entra e sai na ordem dos blocos). O `exit` vai como objeto, não
  // como rótulo: um rótulo tornaria o aviso dono das próprias variantes e ele deixaria de seguir a saída da tela.
  // O objeto só serve para `visivel={false}` (o AnimatePresence daqui).
  const saidaDoBloco = variantesDoBloco?.exit;
  const movimento = naTela
    ? { variants: variantesDoBloco, ...(saidaDoBloco && typeof saidaDoBloco === 'object' ? { exit: saidaDoBloco } : {}) }
    : {
        initial: { opacity: 0, y: flutuante ? 24 : -8, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: flutuante ? 16 : -6, scale: 0.98 },
        transition: spring.soft,
      };
  const corpo = (
    <AnimatePresence>
      {visivel && (
        <motion.div
          key="aviso"
          {...movimento}
          className={cn(
            // Numa linha só é uma pílula; no celular (360 px) o botão desce para a linha de baixo e a pílula vira
            // um cartão de cantos redondos (rounded-full num bloco de duas linhas ficaria um estádio).
            'glass-flutuante !rounded-[22px] sm:!rounded-full flex max-w-full flex-wrap items-center justify-end gap-x-3 gap-y-1.5 p-1.5 pr-2 text-sm',
            flutuante && 'pointer-events-auto',
            className,
          )}
        >
          <span className="flex min-w-0 grow basis-[13.75rem] items-center gap-3">
            <span
              aria-hidden
              className={cn(
                'size-8 rounded-full grid place-items-center shrink-0',
                tipo === 'previa' ? 'accent-gradient' : 'bg-warning/15 text-warning',
              )}
            >
              <Icone className="size-4" />
            </span>
            <span aria-hidden className="min-w-0 font-medium pr-1">
              {children}
            </span>
          </span>
          {acao && (
            <Button size="sm" onClick={acao.onClick} disabled={acao.carregando} className="!rounded-full shrink-0">
              {acao.rotulo}
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
  // A região viva monta com o texto vazio; o texto entra depois (ver acima). O aviso de vidro é o `div` filho.
  const texto = <span className="sr-only">{anunciar ? children : null}</span>;
  if (!flutuante)
    return (
      <div ref={regiao} role="status" className="nao-imprime flex justify-center">
        {texto}
        {corpo}
      </div>
    );
  return createPortal(
    <div
      ref={regiao}
      role="status"
      className="nao-imprime fixed inset-x-0 bottom-24 md:bottom-5 z-faixa flex justify-center px-3 pointer-events-none"
    >
      {texto}
      {corpo}
    </div>,
    document.body,
  );
}

/**
 * Espera entre a região viva aparecer (vazia) e o texto entrar nela. Não é animação: é o tempo de o leitor de tela
 * registrar a região antes da mudança que ele deve anunciar.
 */
export const ATRASO_DO_ANUNCIO_MS = 150;

/** Verdadeiro `ATRASO_DO_ANUNCIO_MS` depois de o aviso ficar visível; volta a falso quando ele some. */
function useAnuncioAtrasado(visivel: boolean): boolean {
  const [anunciar, setAnunciar] = useState(false);
  useEffect(() => {
    if (!visivel) return;
    const t = window.setTimeout(() => setAnunciar(true), ATRASO_DO_ANUNCIO_MS);
    return () => {
      window.clearTimeout(t);
      setAnunciar(false);
    };
  }, [visivel]);
  return anunciar;
}

/** Respiro entre o topo da faixa e o toast de baixo da pilha. */
const RESPIRO_DA_FAIXA_PX = 8;

/**
 * Enquanto o aviso está fixo embaixo (flutuante, ou dentro da `FaixaDaCasca` fixa), põe a altura dele + o respiro em
 * `--folga-inferior` no `<html>`; ao desmontar (a faixa saiu), tira. O `Toast` soma a folga ao `bottom` da pilha.
 */
function useFolgaDosToasts(regiao: RefObject<HTMLDivElement | null>, flutuante: boolean) {
  useEffect(() => {
    const el = regiao.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const fixo = flutuante ? el : el.closest<HTMLElement>('[data-faixa-casca]');
    if (!fixo || getComputedStyle(fixo).position !== 'fixed') return;
    const raiz = document.documentElement;
    const medir = () => {
      const altura = el.offsetHeight;
      if (altura > 0) raiz.style.setProperty('--folga-inferior', `${altura + RESPIRO_DA_FAIXA_PX}px`);
      else raiz.style.removeProperty('--folga-inferior');
    };
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    medir();
    return () => {
      observador.disconnect();
      raiz.style.removeProperty('--folga-inferior');
    };
  }, [regiao, flutuante]);
}
