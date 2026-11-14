import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Bloco } from '../../motion/coreografia/Bloco';
import { cn } from '../../shared/util/utils';

export type TPanelProps = {
  title?: string;
  /** nota que qualifica o título */
  subtitle?: string;
  /** começa recolhido (o título vira botão de abrir) */
  recolhido?: boolean;
  /** botões à direita do título */
  actions?: ReactNode;
  children: ReactNode;
};

/**
 * Seção por assunto dentro do formulário (Administrador, Endereços…), recolhível pelo título (docs/07 §3.1).
 * **Sem vidro próprio**: está dentro do cartão `glass-solid` do `TForm`, e a região não passa de duas camadas de
 * `backdrop-filter`. Separa por borda `--line` e título. Recolhido, os campos continuam montados (o formulário
 * não perde valor nem erro), só escondidos.
 */
export function TPanel({ title, subtitle, recolhido, actions, children }: TPanelProps) {
  const id = useId();
  const recolhivel = recolhido !== undefined;
  const [aberto, setAberto] = useState(!recolhido);
  const corpoId = `${id}-corpo`;

  const titulo = title && (
    <span className="min-w-0">
      <span className="block text-[15px] font-semibold tracking-tight">{title}</span>
      {subtitle && <span className="block text-xs text-muted mt-0.5">{subtitle}</span>}
    </span>
  );

  return (
    <section data-kit="TPanel" aria-labelledby={title ? `${id}-titulo` : undefined} className="flex flex-col gap-4 border-t border-line pt-4">
      {(title || actions) && (
        <Bloco className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          {title && (
            <h2 id={`${id}-titulo`} className="min-w-0">
              {recolhivel ? (
                <button
                  type="button"
                  aria-expanded={aberto}
                  aria-controls={corpoId}
                  onClick={() => setAberto((v) => !v)}
                  className="flex items-start gap-2 text-left rounded-lg"
                >
                  <ChevronDown aria-hidden className={cn('size-4 mt-0.5 shrink-0 text-muted transicao-giro', !aberto && '-rotate-90')} />
                  {titulo}
                </button>
              ) : (
                titulo
              )}
            </h2>
          )}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </Bloco>
      )}
      <div id={corpoId} hidden={!aberto} className="flex flex-col gap-4">
        {children}
      </div>
    </section>
  );
}
