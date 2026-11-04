import type { Transition, Variants } from 'motion/react';

/**
 * Tokens de movimento. Todo o sistema importa daqui — nada de durações ou curvas soltas nas telas.
 */
export const ease = {
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
};

export const spring = {
  soft: { type: 'spring', stiffness: 260, damping: 30, mass: 0.9 } as Transition,
  snappy: { type: 'spring', stiffness: 480, damping: 38 } as Transition,
  bouncy: { type: 'spring', stiffness: 520, damping: 26 } as Transition,
};

/** Item que entra em cascata (cartões, cabeçalhos). */
export const item: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: ease.out } },
};

/**
 * Transição de tela. `custom` = direção:
 *  0  → troca de módulo (sai com desfoque + fade + leve encolhida)
 *  1  → indo mais fundo (lista → detalhe): desliza para a esquerda
 * -1  → voltando: desliza para a direita
 * A entrada anima só transform no contêiner; opacidade fica nos filhos,
 * para o backdrop-filter dos cartões funcionar desde o primeiro quadro.
 */
export const page: Variants = {
  hidden: (dir: number) => (dir === 0 ? { y: 10 } : { x: 56 * dir }),
  show: {
    x: 0,
    y: 0,
    transition: { duration: 0.5, ease: ease.out, staggerChildren: 0.045, delayChildren: 0.02 },
  },
  exit: (dir: number) => ({
    opacity: 0,
    filter: 'blur(10px)',
    scale: dir === 0 ? 0.985 : 1,
    x: dir === 0 ? 0 : -40 * dir,
    transition: { duration: 0.22, ease: ease.inOut },
  }),
};

export const staggerGroup: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035 } },
};
