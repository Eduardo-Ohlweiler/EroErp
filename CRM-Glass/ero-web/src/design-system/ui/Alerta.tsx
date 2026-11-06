import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from 'lucide-react';
import { cn } from '../../shared/util/utils';

export type TomAlerta = 'info' | 'sucesso' | 'aviso' | 'perigo';

const estilo: Record<TomAlerta, { caixa: string; icone: string; Icone: typeof Info }> = {
  info: { caixa: 'bg-info/10 border-info/30', icone: 'text-info', Icone: Info },
  sucesso: { caixa: 'bg-success/10 border-success/30', icone: 'text-success', Icone: CheckCircle2 },
  aviso: { caixa: 'bg-warning/10 border-warning/35', icone: 'text-warning', Icone: AlertTriangle },
  perigo: { caixa: 'bg-danger/10 border-danger/30', icone: 'text-danger', Icone: OctagonAlert },
};

export type AlertaProps = {
  tom?: TomAlerta;
  titulo?: ReactNode;
  children?: ReactNode;
  /** botão ou link à direita */
  acao?: ReactNode;
  className?: string;
};

/**
 * Aviso dentro de um formulário ou cartão (ex.: erro 422 da API, desafio de 2FA expirado).
 * O texto fica na cor do tema (contraste garantido); a cor do tom vai no ícone, no fundo e na borda.
 * `perigo` e `aviso` usam role=alert (anunciados na hora); os outros, role=status.
 */
export function Alerta({ tom = 'info', titulo, children, acao, className }: AlertaProps) {
  const { caixa, icone, Icone } = estilo[tom];
  return (
    <div
      role={tom === 'perigo' || tom === 'aviso' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-2xl border p-3.5', caixa, className)}
    >
      <Icone aria-hidden className={cn('size-[18px] shrink-0 mt-px', icone)} />
      <div className="min-w-0 flex-1 text-sm">
        {titulo && <div className="font-semibold text-fg">{titulo}</div>}
        {children && <div className={cn('text-muted', !!titulo && 'mt-0.5')}>{children}</div>}
      </div>
      {acao && <div className="shrink-0">{acao}</div>}
    </div>
  );
}
