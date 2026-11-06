import { useReducedMotionConfig } from 'motion/react';

/**
 * Mesmo resultado de `useReduce()` (prefers-reduced-motion do sistema ou animações REDUZIDAS do contratante),
 * lendo só o <MotionConfig reducedMotion> que o AparenciaProvider monta. Não assina o contexto da aparência:
 * blocos, contadores e contêineres não re-renderizam quando o tema, o destaque, o fundo ou a prévia mudam
 * (a troca de tema em vídeo e a prévia da Configuração ficam leves mesmo com muitos cartões na tela).
 */
export function useReduzirMovimento() {
  return !!useReducedMotionConfig();
}
