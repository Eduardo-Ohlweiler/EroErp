import type { ReactNode } from 'react';
import { Badge, type Tone } from '../ui/Bits';

/** Tons do 2.0 (`sucesso`, `erro`...) e os do `Badge` de baixo (`success`, `danger`...), os dois aceitos. */
export type TomTBadge = 'neutro' | 'sucesso' | 'alerta' | 'erro' | 'info' | 'destaque' | Tone;

const TOM: Record<TomTBadge, Tone> = {
  neutro: 'neutral',
  sucesso: 'success',
  alerta: 'warning',
  erro: 'danger',
  info: 'info',
  destaque: 'accent',
  neutral: 'neutral',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  accent: 'accent',
};

/**
 * Etiqueta do kit (situação, tipo), sobre o `Badge`. A cor nunca é a única portadora da informação: o texto diz,
 * e o ponto (`ponto`) ou o ícone acompanham.
 */
export function TBadge({ tom = 'neutro', icone, ponto, children }: { tom?: TomTBadge; icone?: ReactNode; ponto?: boolean; children: ReactNode }) {
  return (
    <Badge tone={TOM[tom]} dot={ponto}>
      {icone}
      {children}
    </Badge>
  );
}
