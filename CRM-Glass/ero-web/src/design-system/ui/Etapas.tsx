import { useId, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { spring } from '../../motion/tokens';
import { cn } from '../../shared/util/utils';

export type Etapa = { rotulo: string; descricao?: ReactNode };

export type EtapasProps = {
  etapas: Etapa[];
  /** índice da etapa atual (0 = primeira) */
  atual: number;
  /** permite voltar clicando numa etapa já concluída */
  onIr?: (indice: number) => void;
  /** nome do indicador para leitores de tela */
  rotulo?: string;
  className?: string;
};

/**
 * Indicador de etapas de um formulário (Dados → Administrador → Aparência).
 * A marca da etapa atual desliza entre as etapas (layoutId).
 */
export function Etapas({ etapas, atual, onIr, rotulo = 'Etapas', className }: EtapasProps) {
  const id = useId();
  return (
    <nav aria-label={rotulo} className={className}>
      <ol className="flex items-center gap-1.5 sm:gap-2">
        {etapas.map((e, i) => {
          const feita = i < atual;
          const agora = i === atual;
          const clicavel = !!onIr && feita;
          const conteudo = (
            <>
              <span
                aria-hidden
                className={cn(
                  'relative size-8 shrink-0 rounded-full grid place-items-center text-xs font-bold tabular-nums transition-colors',
                  agora ? 'text-on-accent' : feita ? 'bg-accent/15 text-accent-text' : 'chip text-muted',
                )}
              >
                {agora && (
                  <motion.span
                    layoutId={`${id}-atual`}
                    transition={spring.snappy}
                    className="absolute inset-0 rounded-full accent-gradient accent-glow"
                  />
                )}
                <span className="relative">{feita ? <Check className="size-4" strokeWidth={3} /> : i + 1}</span>
              </span>
              <span className="min-w-0 text-left sr-only sm:not-sr-only sm:block">
                <span className={cn('block text-[13px] font-semibold leading-tight', agora ? 'text-fg' : 'text-muted')}><span className="sr-only">Etapa {i + 1} de {etapas.length}: </span>
                  {e.rotulo}
                  {feita && <span className="sr-only"> (concluída)</span>}
                </span>
                {e.descricao && <span className="block text-[11px] text-subtle leading-tight mt-0.5 truncate">{e.descricao}</span>}
              </span>
            </>
          );
          return (
            <li key={e.rotulo} aria-current={agora ? 'step' : undefined} className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 last:flex-none">
              {clicavel ? (
                <button
                  type="button"
                  onClick={() => onIr?.(i)}
                  className="flex items-center gap-2.5 rounded-2xl p-1 pr-2 hover:bg-[var(--chip)] transition-colors"
                  aria-label={`Voltar para a etapa ${i + 1}: ${e.rotulo} (concluída)`}
                >
                  {conteudo}
                </button>
              ) : (
                <span className="flex items-center gap-2.5 p-1 pr-2">
                  {conteudo}
                </span>
              )}
              {i < etapas.length - 1 && (
                <span aria-hidden className="h-px flex-1 min-w-4 rounded-full bg-[var(--line)] relative overflow-hidden">
                  <motion.span
                    className="absolute inset-0 accent-gradient origin-left"
                    initial={false}
                    animate={{ scaleX: feita ? 1 : 0 }}
                    transition={spring.soft}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
