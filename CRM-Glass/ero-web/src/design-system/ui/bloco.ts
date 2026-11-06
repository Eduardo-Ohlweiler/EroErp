import type { Variants } from 'motion/react';
import { item } from '../../motion/tokens';

/**
 * Encaixe dos blocos da coreografia (DIRECAO-VISUAL seção 6).
 * GlassCard, PageHeader, CampoForm, Tabela e BarraAcoes são `motion.*` e usam estas variantes por padrão.
 *
 * Para o motion-designer: quando `bloco` existir em `motion/tokens.ts`, troque `item` por `bloco` aqui —
 * é o único lugar. Uma tela também pode passar `variants` próprias a cada componente.
 */
export const VARIANTES_BLOCO: Variants = item;

export type PropsBloco = {
  /** participa da montagem em blocos da tela (padrão true); false = aparece junto com o pai */
  bloco?: boolean;
  /** variantes vindas de fora (coreografia da tela); sem elas, VARIANTES_BLOCO */
  variants?: Variants;
};

export function variantesDoBloco(bloco = true, variants?: Variants): Variants | undefined {
  return bloco ? (variants ?? VARIANTES_BLOCO) : undefined;
}
