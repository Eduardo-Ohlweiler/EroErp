import { forwardRef } from 'react';
import { motion, type HTMLMotionProps, type Variants } from 'motion/react';
import { useVariantesBloco } from '../../design-system/ui/bloco';
import { useReduzirMovimento } from '../reduzir';
import { telaReduzida } from '../tokens';

type Tag = 'div' | 'section' | 'header' | 'footer' | 'nav' | 'ul' | 'li' | 'p' | 'h1' | 'h2' | 'h3' | 'span';

export type BlocoProps = Omit<HTMLMotionProps<'div'>, 'variants'> & {
  /** elemento HTML (padrão div) */
  as?: Tag;
  /** variantes próprias (ex.: coreografias.login.variantes.esfera); sem elas, o bloco da coreografia */
  variants?: Variants;
  /**
   * Parte que só orquestra os blocos de dentro (ex.: `coreografias.login.variantes.vitrine`).
   * Com movimento reduzido ela não anima nada (os blocos de dentro esmaecem); sem isso, esmaeceria inteira.
   */
  orquestra?: boolean;
};

/**
 * Qualquer elemento como bloco da montagem (o que não é GlassCard, PageHeader, CampoForm, Tabela ou BarraAcoes):
 * esfera, marca, título e chips da vitrine do login, uma linha de atalhos, um título solto.
 * Movimento reduzido: só esmaece (~150 ms), quaisquer que sejam as variantes.
 * Não use variantes com opacidade num Bloco que tenha cartões de vidro dentro (o backdrop-filter pisca);
 * para esses, `orquestra`.
 */
export const Bloco = forwardRef<HTMLDivElement, BlocoProps>(function Bloco({ as = 'div', variants, orquestra = false, ...rest }, ref) {
  const reduzir = useReduzirMovimento();
  const doBloco = useVariantesBloco(true, variants);
  const v = orquestra ? (reduzir ? telaReduzida : variants) : doBloco;
  const Comp = motion[as] as typeof motion.div;
  return <Comp ref={ref} variants={v} {...rest} />;
});
