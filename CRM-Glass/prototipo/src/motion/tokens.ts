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

/**
 * Fundo de cena (escritório): troca de tema acende ou apaga as luzes uma a uma.
 * Os trechos são frações do progresso 0 → 1 (0 = noite, 1 = dia); o tema escuro percorre o mesmo caminho ao contrário.
 */
export const cena = {
  /** Sequência completa, em segundos. */
  duracao: 2.8,
  /** Movimento reduzido: só esmaece, sem sequência. */
  duracaoReduzida: 0.35,
  /** Janela amanhecendo / anoitecendo. */
  janela: [0, 0.62] as [number, number],
  /** Primeira luz começa em `inicio`, a última em `fim`; cada uma leva `luz` para acender. */
  luzes: { inicio: 0.06, fim: 0.66, luz: 0.16 },
  /** Depois da última luz, o resto do ambiente clareia. */
  preencher: [0.74, 1] as [number, number],
  /** Quanto o ambiente todo já clareou quando todas as luzes acenderam, antes do preenchimento final (0–1). */
  ambiente: 0.5,
  /** Quanto o brilho das luminárias fica depois que tudo clareou (0–1). */
  brilhoFinal: 0.3,
  /** As tintas de contraste seguem o tema logo, sem esperar a sequência (mesma duração da revelação circular). */
  tinta: 0.7,
  tintaEase: ease.out,
  /** O progresso corre linear; cada trecho aplica a própria curva (`curva`). */
  progressoEase: 'linear' as const,
  curva: (v: number) => v * v * (3 - 2 * v),
  /** Piscada de lâmpada ao acender: pontos [x, y], interpolados em linha reta (sobe, falha, volta, falha de leve, firma). */
  piscada: [
    [0, 0],
    [0.12, 0.9],
    [0.121, 0.15],
    [0.22, 0.15],
    [0.221, 0.85],
    [0.34, 0.85],
    [0.341, 0.35],
    [0.44, 0.35],
    [1, 1],
  ] as [number, number][],
  /** Deriva lenta da foto em repouso, em segundos. */
  deriva: 60,
};
