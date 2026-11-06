import { forwardRef, useMemo, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { useReduzirMovimento } from '../reduzir';
import { coreografias, telaReduzida, type NomeCoreografia } from '../tokens';
import { useMarcarMontagem } from './andamento';
import { BlocoDaTela, useAtrasoMontagem } from './contexto';

export type TelaProps = Omit<HTMLMotionProps<'div'>, 'variants' | 'initial' | 'animate' | 'exit' | 'custom'> & {
  /** coreografia de entrada e saída (motion/tokens.ts, `coreografias`) */
  coreografia?: NomeCoreografia;
  /** direção para coreografias que deslizam (`etapa`): 1 avança, −1 volta */
  direcao?: number;
  /** atraso extra antes do primeiro bloco (s), somado ao herdado (casca, contexto) */
  atraso?: number;
  children?: ReactNode;
};

/**
 * Contêiner de uma tela: orquestra a montagem e a desmontagem em blocos. Não anima nada em si
 * (nem opacidade: o backdrop-filter dos cartões tem de funcionar desde o primeiro quadro), exceto
 * na coreografia `etapa`, que desliza o contêiner (só transform).
 *
 * Os blocos são os componentes do design system (GlassCard, PageHeader, CampoForm, Tabela, BarraAcoes)
 * e o <Bloco> para qualquer outro elemento. Movimento reduzido: sem cascata, cada bloco só esmaece.
 *
 *   <Tela coreografia="inicio">
 *     <PageHeader title="Bom dia, Ana" />
 *     <div className="grid grid-cols-4 gap-4">{kpis.map((k) => <GlassCard key={k.id}>…</GlassCard>)}</div>
 *   </Tela>
 */
export const Tela = forwardRef<HTMLDivElement, TelaProps>(function Tela(
  { coreografia = 'padrao', direcao, atraso = 0, children, onAnimationStart, onAnimationComplete, ...rest },
  ref,
) {
  const reduzir = useReduzirMovimento();
  const herdado = useAtrasoMontagem();
  const c = coreografias[coreografia];
  const total = herdado + c.atraso + atraso;
  const variants = useMemo(() => (reduzir ? telaReduzida : total === 0 ? c.variantes.tela : c.tela(total)), [reduzir, total, c]);
  const marca = useMarcarMontagem();

  return (
    <motion.div
      ref={ref}
      variants={variants}
      custom={direcao}
      initial="hidden"
      animate="show"
      exit="exit"
      data-coreografia={coreografia}
      onAnimationStart={(d) => {
        marca.onAnimationStart();
        onAnimationStart?.(d);
      }}
      onAnimationComplete={(d) => {
        marca.onAnimationComplete();
        onAnimationComplete?.(d);
      }}
      {...rest}
    >
      <BlocoDaTela.Provider value={c.variantes.bloco}>{children}</BlocoDaTela.Provider>
    </motion.div>
  );
});
