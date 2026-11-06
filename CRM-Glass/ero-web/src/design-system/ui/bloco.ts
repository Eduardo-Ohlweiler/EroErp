import type { Variants } from 'motion/react';
import { bloco as blocoMotion, blocoReduzido } from '../../motion/tokens';
import { useReduzirMovimento } from '../../motion/reduzir';
import { useBlocoDaTela } from '../../motion/coreografia/contexto';

/**
 * Encaixe dos blocos da coreografia (DIRECAO-VISUAL seção 6).
 * GlassCard, PageHeader, CampoForm, Tabela e BarraAcoes são `motion.*` e usam estas variantes por padrão;
 * quem orquestra (a ordem, o ritmo, o limite de blocos) é a <Tela coreografia> em volta.
 * Uma tela também pode passar `variants` próprias a cada componente (ex.: coreografias.login.variantes.cartao).
 */
export const VARIANTES_BLOCO: Variants = blocoMotion;

export type PropsBloco = {
  /** participa da montagem em blocos da tela (padrão true); false = aparece junto com o pai */
  bloco?: boolean;
  /** variantes vindas de fora (coreografia da tela); sem elas, VARIANTES_BLOCO */
  variants?: Variants;
};

/** Variantes do bloco sem olhar o movimento reduzido (fora de componente). Prefira `useVariantesBloco`. */
export function variantesDoBloco(bloco = true, variants?: Variants): Variants | undefined {
  return bloco ? (variants ?? VARIANTES_BLOCO) : undefined;
}

/**
 * Variantes do bloco para um componente: as recebidas, senão o bloco da coreografia da <Tela> em volta,
 * senão o padrão. Com movimento reduzido (sistema ou contratante), só esmaece (`blocoReduzido`, ~150 ms).
 */
export function useVariantesBloco(bloco = true, variants?: Variants): Variants | undefined {
  const reduzir = useReduzirMovimento();
  const daTela = useBlocoDaTela();
  if (!bloco) return undefined;
  return reduzir ? blocoReduzido : (variants ?? daTela ?? VARIANTES_BLOCO);
}
