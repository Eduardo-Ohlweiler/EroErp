import { Children, useId, useState, type ReactNode } from 'react';
import { ChevronDown, Lock } from 'lucide-react';
import { Bloco } from '../../motion/coreografia/Bloco';
import { cn } from '../../shared/util/utils';
import { SomenteLeituraDoForm, useSomenteLeituraDoForm } from './somenteLeitura';

export type TPanelProps = {
  title?: string;
  /** nota que qualifica o título */
  subtitle?: string;
  /** começa recolhido (o título vira botão de abrir) */
  recolhido?: boolean;
  /** botões à direita do título */
  actions?: ReactNode;
  /**
   * Só este painel fica só leitura, dentro de um formulário editável (ex.: "Acesso aos módulos" quando o usuário é
   * você mesmo): os campos de dentro ficam como no `TForm somenteLeitura` e os botões que gravam somem. Dentro de um
   * `TForm somenteLeitura` o painel já é só leitura.
   */
  somenteLeitura?: boolean;
  /** os campos; sem conteúdo (`null`, `false`), o painel fica só com o título, sem corpo vazio */
  children?: ReactNode;
};

/**
 * Seção por assunto dentro do formulário (Administrador, Endereços…), recolhível pelo título (docs/07 §3.1).
 * **Sem vidro próprio**: está dentro do cartão `glass-solid` do `TForm`, e a região não passa de duas camadas de
 * `backdrop-filter`. Separa por borda `--line` e título. Recolhido, os campos continuam montados (o formulário
 * não perde valor nem erro), só escondidos.
 *
 * Com `somenteLeitura`, o título ganha a marca "Só leitura" (cadeado), e só o conteúdo do painel muda.
 *
 * O primeiro painel do formulário não desenha a borda de cima (ficaria colada à borda do cartão, linha dupla). Sem
 * conteúdo (ex.: o ADMIN não tem grupos a escolher), não há corpo: nada de 16 px de vão embaixo do título.
 */
export function TPanel({ title, subtitle, recolhido, actions, somenteLeitura: soEste = false, children }: TPanelProps) {
  const doForm = useSomenteLeituraDoForm();
  const somenteLeitura = doForm || soEste;
  const id = useId();
  // `Children.toArray` descarta null, undefined e booleanos: `{ehAdmin ? null : <TRow…/>}` conta como vazio.
  const temConteudo = Children.toArray(children).length > 0;
  // Sem corpo não há o que recolher: o título não vira botão (um aria-controls apontaria para o nada).
  const recolhivel = recolhido !== undefined && temConteudo;
  const [aberto, setAberto] = useState(!recolhido);
  const corpoId = `${id}-corpo`;

  const titulo = title && (
    <span className="min-w-0">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[15px] font-semibold tracking-tight">{title}</span>
        {soEste && !doForm && (
          <span className="chip inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-medium text-muted">
            <Lock aria-hidden className="size-3" />
            Só leitura
          </span>
        )}
      </span>
      {subtitle && <span className="block text-xs text-muted mt-0.5">{subtitle}</span>}
    </span>
  );

  return (
    <section
      data-kit="TPanel"
      data-somente-leitura={soEste || undefined}
      aria-labelledby={title ? `${id}-titulo` : undefined}
      className="flex flex-col gap-4 border-t border-line pt-4 first:border-t-0 first:pt-0"
    >
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
      {temConteudo && (
        <div id={corpoId} hidden={!aberto} className="flex flex-col gap-4">
          <SomenteLeituraDoForm.Provider value={somenteLeitura}>{children}</SomenteLeituraDoForm.Provider>
        </div>
      )}
    </section>
  );
}
