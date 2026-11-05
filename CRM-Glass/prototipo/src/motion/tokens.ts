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
 * Fundo de cena (escritório, cidade): troca de tema como um plano de cinema.
 * Progresso p: 0 = noite, 1 = dia. Os trechos são frações de p; o tema escuro percorre o caminho ao contrário.
 */
export const cena = {
  /** Duração da sequência completa, em segundos: amanhecer/acender e anoitecer/apagar. */
  duracaoClaro: 4.4,
  duracaoEscuro: 3.4,
  /** Movimento reduzido: só esmaece. */
  duracaoReduzida: 0.35,
  progressoEase: 'linear' as const,
  curva: (v: number) => v * v * (3 - 2 * v),

  /** Céu da janela clareando (ou escurecendo). */
  ceu: [0, 0.62] as [number, number],
  /** Luz quente do amanhecer/entardecer: sobe e desce dentro deste trecho (pico no meio). */
  aurora: [0, 0.78] as [number, number],
  /** Luzes da cidade apagando (claro) ou acendendo (escuro), cada uma no seu tempo. */
  cidade: [0.04, 0.52] as [number, number],

  /** Fileiras de luminárias: uma por vez, como circuitos; dentro da fileira, pequena diferença entre lâmpadas. */
  fileiras: { inicio: 0.22, passo: 0.07, acender: 0.12, apagar: 0.025, dispersao: 0.02 },
  /**
   * Partida de lâmpada: multiplicador da luz de cada lâmpada enquanto acende ([x, y], linha reta).
   * Acessibilidade (WCAG 2.3.1): uma única falha leve (−8 %, abaixo de 10 % de luminância) por lâmpada —
   * nada de piscar de verdade, que passaria de 3 flashes por segundo.
   */
  piscada: [
    [0, 1],
    [0.32, 1],
    [0.36, 0.92],
    [0.52, 0.92],
    [0.56, 1],
    [1, 1],
  ] as [number, number][],

  /** Exposição automática da câmera: uma única subida suave enquanto as luzes acendem, depois se ajusta. */
  exposicao: { intensidade: 0.12, trecho: [0.24, 0.8] as [number, number] },
  /** Câmera: enquadramento com folga para a deriva, leve aproximação e respiro de foco durante a troca. */
  camera: { zoomBase: 1.02, aproximacao: 0.03, focoExtra: 1.1 },
  /** Ao inverter no meio, o quadro antigo se mistura ao novo por este tempo (s), sem saltos. */
  inversao: 0.18,
  /** Ondulação da água (cenas com reflexo): amplitude em fração da foto, frequência das faixas, velocidade. */
  agua: { amplitude: 0.0042, frequencia: 520, velocidade: 0.9 },
  /** Estrelas (cenas externas): fração de células com estrela, brilho e velocidade da cintilação. */
  estrelas: { densidade: 0.0035, brilho: 0.55, cintilar: 1.8 },
  /** Neblina de luz sobre a cidade acesa (0–1). */
  neblina: 0.18,
  /** Granulação de filme e vinheta. */
  grao: 0.035,
  vinheta: 0.32,
  /** Deriva lenta em repouso: s por ciclo, amplitude (fração da foto) e quadros por segundo (economiza GPU). */
  deriva: 70,
  derivaAmplitude: [0.006, 0.004] as [number, number],
  derivaFps: 12,
  /** Teto de quadros por segundo durante a troca (monitores de 120/144 Hz). */
  trocaFps: 60,
  /**
   * Resolução interna do canvas conforme o foco do fundo (Aparência): nítido precisa de mais pixels;
   * a partir de `desfocadoDesde` px de desfoque, o mínimo basta. Entre os dois, proporcional.
   */
  canvasMaxPixels: { nitido: 2_800_000, desfocado: 1_200_000, desfocadoDesde: 3 },
  /** O canvas surge esmaecendo quando as fotos terminam de carregar (s). */
  surgir: 0.6,

  /** A interface troca de tema quando a cena passa deste ponto (luz já subindo / caindo). */
  trocaInterface: { claro: 0.4, escuro: 0.45 },
  /** Esmaecimento da interface na troca, em segundos. */
  esmaecerInterface: 0.9,
  esmaecerEase: ease.inOut,
};
