import type { ReactNode } from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useReduzirMovimento } from '../reduzir';
import { coreografias, type NomeCoreografia } from '../tokens';
import { useMarcarMontagem } from './andamento';
import { AtrasoMontagem, useAtrasoMontagem } from './contexto';
import { Congelado } from './RotaAnimada';

/** A área em si não anima nada: quem monta e desmonta são as partes dela (menu, barra, telas). */
const area: Variants = { hidden: {}, show: {}, exit: {} };

export type TrocaDeAreaProps = {
  /**
   * Identifica a área. Trocou → a área atual se desmonta inteira e a nova monta depois.
   * Ex.: 'login' | `casca:${tenantId}` (a troca de contratante remonta a casca).
   */
  chave: string;
  /** coreografia da troca: `contexto` (troca de contratante) soma uma pausa curta antes de montar a nova área */
  coreografia?: NomeCoreografia;
  children: ReactNode;
  className?: string;
};

/**
 * Troca entre áreas inteiras, um nível acima da RotaAnimada: login ↔ casca, casca de um contratante ↔ casca
 * de outro. A área que sai fica congelada (mesmo outlet) até todas as suas partes terminarem de sair.
 * O fundo (LiveBackground) fica fora, fixo por baixo, e faz o próprio esmaecimento quando o fundo muda.
 *
 *   function Raiz() {
 *     const outlet = useOutlet();
 *     const { pathname } = useLocation();
 *     const { usuario, trocouContratante } = useSessao();
 *     const chave = pathname.startsWith('/login') ? 'login' : `casca:${usuario?.tenantId}`;
 *     return (
 *       <div className="relative z-10">
 *         <TrocaDeArea chave={chave} coreografia={trocouContratante ? 'contexto' : undefined}>{outlet}</TrocaDeArea>
 *       </div>
 *     );
 *   }
 */
export function TrocaDeArea({ chave, coreografia, children, className }: TrocaDeAreaProps) {
  const reduzir = useReduzirMovimento();
  const herdado = useAtrasoMontagem();
  const c = coreografia ? coreografias[coreografia] : null;
  const pausa = herdado + (c && !reduzir ? c.atraso : 0);
  const marca = useMarcarMontagem();

  return (
    <AnimatePresence mode={c?.modo ?? 'wait'} propagate>
      <motion.div key={chave} variants={area} initial="hidden" animate="show" exit="exit" className={className} {...marca}>
        <AtrasoMontagem.Provider value={pausa}>
          <Congelado>{children}</Congelado>
        </AtrasoMontagem.Provider>
      </motion.div>
    </AnimatePresence>
  );
}
