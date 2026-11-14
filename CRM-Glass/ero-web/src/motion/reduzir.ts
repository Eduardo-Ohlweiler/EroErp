import { useContext, useSyncExternalStore } from 'react';
import { MotionConfigContext } from 'motion/react';

const CONSULTA = '(prefers-reduced-motion: reduce)';

function lista(): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(CONSULTA) : null;
}

function assinar(avisar: () => void) {
  const m = lista();
  if (!m) return () => {};
  m.addEventListener('change', avisar);
  return () => m.removeEventListener('change', avisar);
}

const agora = () => lista()?.matches ?? false;

/**
 * `prefers-reduced-motion: reduce` do sistema, AO VIVO: ligar ou desligar com o app aberto atualiza quem usa.
 * O `useReducedMotion` do Motion guarda o valor da montagem (useState) e não acompanha a mudança; por isso
 * este hook assina o `matchMedia` direto.
 */
export function usePrefereMenosMovimento() {
  return useSyncExternalStore(assinar, agora, () => false);
}

/**
 * Mesmo resultado de `useReduce()` (prefers-reduced-motion do sistema ou animações REDUZIDAS do contratante),
 * lendo só o <MotionConfig reducedMotion> que o AparenciaProvider monta ('always' = contratante pediu reduzidas;
 * 'user' = vale o sistema; 'never' = nunca reduz). Não assina o contexto da aparência: blocos, contadores e
 * contêineres não re-renderizam quando o tema, o destaque, o fundo ou a prévia mudam.
 * A preferência do sistema é lida ao vivo (usePrefereMenosMovimento): RotaAnimada, Tela, blocos e fundo passam
 * a só esmaecer assim que a pessoa liga o movimento reduzido, sem recarregar.
 */
export function useReduzirMovimento() {
  const { reducedMotion } = useContext(MotionConfigContext);
  const sistema = usePrefereMenosMovimento();
  if (reducedMotion === 'always') return true;
  if (reducedMotion === 'never') return false;
  return sistema;
}
