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
  /**
   * Troca de tema sem cena (fundo vivo): revelação circular a partir do último toque/clique
   * (ex.: o cartão Escuro/Claro da Configuração). Clique mais antigo que `memoria` (s) → centro da tela.
   */
  revelacao: { duracao: 0.7, ease: ease.out, memoria: 1.5 },
  /** Troca de contratante com cena nova: espera as fotos carregarem até este limite (s) antes da sequência. */
  esperaFotos: 1.2,
  /** O canvas WebGL reservado (canvasReserva.ts) é criado em tempo ocioso; sem tempo ocioso, no máximo após isto (s). */
  aquecerGpu: 1.5,
};

/* =====================================================================================
 * Fundo vivo: troca de fundo (contratante novo, prévia da Configuração) em esmaecimento cruzado.
 * A camada nova entra por cima; a antiga só esmaece depois, para nunca aparecer um quadro vazio
 * enquanto as fotos da cena carregam (a própria cena ainda surge em `cena.surgir`).
 * ===================================================================================== */
export const fundo = {
  entrada: 0.9,
  saida: 0.4,
  atrasoSaida: 0.9,
};
/** Camada de fundo (LiveBackground): a nova entra por cima, a antiga esmaece depois. Só opacidade. */
export const camadaFundo: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: fundo.entrada, ease: ease.inOut } },
  exit: { opacity: 0, transition: { duration: fundo.saida, delay: fundo.atrasoSaida, ease: ease.inOut } },
};

/* =====================================================================================
 * Montagem e desmontagem em blocos (DIRECAO-VISUAL, seção 6).
 * A tela só orquestra; os blocos são os próprios componentes (GlassCard, PageHeader, CampoForm,
 * Tabela, BarraAcoes), que animam opacidade e transform em si mesmos. Nada de `filter` em
 * elemento com backdrop-filter e nada de opacidade em contêiner que tenha vidro dentro.
 * ===================================================================================== */
export const montagem = {
  /** um bloco encaixando: mola (y e escala); referência para durações derivadas (s) */
  entrada: 0.5,
  /** opacidade do bloco entrando (mais curta que o encaixe, para o conteúdo ficar legível cedo) */
  opacidade: 0.32,
  /**
   * um bloco saindo (s). A saída inteira de uma tela comum fica em ~0,24 s (saida + limiteSaida × passoSaida),
   * perto dos 0,22 s do protótipo: a próxima tela só monta depois (modo 'wait'), então a saída não pode segurar o usuário.
   */
  saida: 0.18,
  /** intervalo entre blocos na entrada (s): 40–60 ms */
  passo: 0.05,
  /** intervalo entre blocos na saída (s), de baixo para cima */
  passoSaida: 0.015,
  /** a partir deste bloco o resto entra junto: a tela fica utilizável sem esperar a cascata */
  limiteBlocos: 8,
  /** na saída a cascata é curta: a partir deste bloco o resto sai junto */
  limiteSaida: 4,
  /** espera antes do primeiro bloco (s) */
  inicio: 0.02,
  /** movimento reduzido: só esmaece, sem cascata, nesta duração (s) */
  reduzida: 0.15,
  /** de onde o bloco sobe (px) e a escala com que começa */
  distancia: 18,
  escala: 0.97,
  /** deslocamento do contêiner na navegação em profundidade (px): entra da direita, sai pela esquerda */
  deslize: { entrada: 56, saida: 40 },
  /** a troca de tema em vídeo espera a tela parar de montar (sem fantasma na View Transition), até este limite (s) */
  esperaTema: 2.5,
  /** quanto tempo sem nenhuma montagem conta como "parada" (s); cobre o quadro entre a saída e a entrada */
  folgaTema: 0.1,
};

/** Mola do encaixe dos blocos: firme, sem quicar (peça encaixando, não bola). */
export const encaixe: Transition = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 };

/** Ritmo de uma coreografia: como os blocos se sucedem. */
export type Ritmo = {
  passo: number;
  passoSaida: number;
  limiteBlocos: number;
  limiteSaida: number;
  inicio: number;
};

/** Ordem dos blocos: `documento` = de cima para baixo; `reversa` = de baixo para cima; `junto` = todos de uma vez. */
export type Ordem = 'documento' | 'reversa' | 'junto';

/** Atraso de cada filho (i de n, na ordem do documento). Depois de `limite` blocos, o resto vai junto. */
export const atrasoDoBloco =
  (ordem: Ordem, passo: number, limite: number, base = 0) =>
  (i: number, total: number) => {
    if (ordem === 'junto') return base;
    const pos = ordem === 'documento' ? i : total - 1 - i;
    return base + Math.min(pos, limite) * passo;
  };

/**
 * Variantes de um contêiner que só orquestra (não anima nada em si).
 * Entrada em ordem de documento; saída em ordem reversa, e o contêiner termina depois dos filhos.
 * `atraso` soma um tempo antes do primeiro bloco (ex.: o conteúdo espera o menu e a barra da casca).
 */
export function orquestrar(
  ritmo: Ritmo,
  { atraso = 0, entrada = 'documento', saida = 'reversa' }: { atraso?: number; entrada?: Ordem; saida?: Ordem } = {},
): Variants {
  return {
    hidden: {},
    show: { transition: { delayChildren: atrasoDoBloco(entrada, ritmo.passo, ritmo.limiteBlocos, atraso + ritmo.inicio) } },
    exit: {
      transition: {
        when: 'afterChildren',
        staggerDirection: -1,
        delayChildren: atrasoDoBloco(saida, ritmo.passoSaida, ritmo.limiteSaida),
      },
    },
  };
}

/** Tela: só orquestra a montagem dos blocos (ritmo padrão). */
export const tela: Variants = orquestrar(montagem);
/** Tela com movimento reduzido: sem cascata; os blocos esmaecem juntos. */
export const telaReduzida: Variants = { hidden: {}, show: {}, exit: { transition: { when: 'afterChildren' } } };

/** Bloco: o próprio cartão ou componente encaixando (opacidade, y e escala nele mesmo). */
export const bloco: Variants = {
  hidden: { opacity: 0, y: montagem.distancia, scale: montagem.escala },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...encaixe, opacity: { duration: montagem.opacidade, ease: ease.out } },
  },
  /** desencaixa ao contrário de como entrou: desce um pouco, encolhe e some */
  exit: {
    opacity: 0,
    y: montagem.distancia * 0.6,
    scale: montagem.escala,
    transition: { duration: montagem.saida, ease: ease.inOut },
  },
};

/** Bloco curto (formulários longos, etapas e linhas de tabela): só sobe um pouco, sem escala. */
export const blocoCurto: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: montagem.entrada * 0.7, ease: ease.out } },
  exit: { opacity: 0, y: 4, transition: { duration: montagem.saida * 0.8, ease: ease.inOut } },
};

/** Bloco com movimento reduzido: só esmaece. */
export const blocoReduzido: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: montagem.reduzida, ease: 'linear' } },
  exit: { opacity: 0, transition: { duration: montagem.reduzida, ease: 'linear' } },
};

/**
 * Texto puro (títulos sem vidro): entra com um leve desfoque que termina em `filter: none`.
 * Só em elemento sem backdrop-filter e de tamanho moderado.
 */
export const blocoTexto: Variants = {
  hidden: { opacity: 0, y: montagem.distancia, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transitionEnd: { filter: 'none' },
    transition: {
      ...encaixe,
      opacity: { duration: montagem.opacidade * 1.4, ease: ease.out },
      filter: { duration: montagem.entrada, ease: ease.out },
    },
  },
  exit: { opacity: 0, y: montagem.distancia * 0.6, filter: 'blur(6px)', transition: { duration: montagem.saida, ease: ease.inOut } },
};

/**
 * Contêiner da rota (RotaAnimada): só transform, conforme a direção (`custom`):
 *  0 → troca de módulo (os blocos fazem tudo) · 1 → mais fundo (entra da direita) · −1 → voltando (entra da esquerda).
 * Opacidade nunca aqui: o backdrop-filter dos cartões precisa funcionar desde o primeiro quadro.
 */
export const rota: Variants = {
  hidden: (dir: number = 0) => ({ x: montagem.deslize.entrada * dir }),
  show: { x: 0, transition: { duration: 0.5, ease: ease.out } },
  exit: (dir: number = 0) => ({
    x: -montagem.deslize.saida * dir,
    transition: { duration: montagem.saida + montagem.limiteSaida * montagem.passoSaida, ease: ease.inOut },
  }),
};
export const rotaReduzida: Variants = { hidden: { x: 0 }, show: { x: 0 }, exit: { x: 0 } };

/**
 * Casca do app: menu lateral → barra superior → conteúdo. Ao sair (logout, troca de contratante),
 * o inverso: conteúdo, barra, menu. `atraso` empurra a entrada inteira (coreografia `contexto`).
 */
export const casca = {
  /** entrada do menu e da barra (s) — a mesma do protótipo */
  entrada: 0.7,
  /** atraso da barra em relação ao menu (s) */
  atrasoBarra: 0.08,
  /** atraso do primeiro bloco do conteúdo quando a casca acabou de montar (s) */
  atrasoConteudo: 0.22,
  /** na saída: o conteúdo vai primeiro, depois a barra, depois o menu (s) */
  saidaBarra: 0.16,
  saidaMenu: 0.24,
};

export function cascaMenu(atraso = 0): Variants {
  return {
    hidden: { x: -48, opacity: 0 },
    show: { x: 0, opacity: 1, transition: { duration: casca.entrada, ease: ease.out, delay: atraso } },
    exit: { x: -36, opacity: 0, transition: { duration: montagem.saida, ease: ease.inOut, delay: casca.saidaMenu } },
  };
}
export function cascaBarra(atraso = 0): Variants {
  return {
    hidden: { y: -28, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: casca.entrada, ease: ease.out, delay: atraso + casca.atrasoBarra } },
    exit: { y: -20, opacity: 0, transition: { duration: montagem.saida, ease: ease.inOut, delay: casca.saidaBarra } },
  };
}

/* ---------------- Microanimações e dados ---------------- */
/** Título da tela na barra superior (chip sem vidro: pode desfocar; termina em filter none). */
export const tituloTela: Variants = {
  hidden: { y: 16, opacity: 0, filter: 'blur(4px)' },
  show: { y: 0, opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' }, transition: { duration: 0.35, ease: ease.out } },
  exit: { y: -16, opacity: 0, filter: 'blur(4px)', transition: { duration: 0.35, ease: ease.out } },
};
/** Saída rápida de dicas e menus pequenos (s). */
export const micro = { saidaRapida: 0.12 };
/** Dados vivos: contagem dos KPIs e barra de progresso crescendo (só na primeira exibição). */
export const dados = {
  contagem: { duracao: 1.3, atraso: 0.15 },
  barra: { duracao: 1, atraso: 0.2 },
};
/** Brilho do esqueleto de carregamento (s por passada). Vai para o CSS como --mov-esqueleto. */
export const esqueleto = { brilho: 1.6 };

/** Durações usadas no CSS (index.css lê as variáveis; nada de número solto lá). Chamado no main.tsx. */
export function aplicarVariaveisDeMovimento(root: HTMLElement = document.documentElement) {
  root.style.setProperty('--mov-esqueleto', `${esqueleto.brilho}s`);
}

/* =====================================================================================
 * Coreografias por tela. Cada tela declara a sua: <Tela coreografia="inicio">.
 * `modo` é o do AnimatePresence que troca a tela: 'wait' (sai inteira, depois a outra monta);
 * 'sync' fica previsto para morph de elemento compartilhado (layoutId) entre telas.
 * ===================================================================================== */
export type NomeCoreografia = 'login' | 'inicio' | 'padrao' | 'formulario' | 'etapa' | 'contexto';

export type Coreografia = {
  ritmo: Ritmo;
  ordem: { entrada: Ordem; saida: Ordem };
  modo: 'wait' | 'sync';
  /** atraso antes do primeiro bloco (s), somado ao herdado (casca recém-montada, troca de contratante) */
  atraso: number;
  /** variantes do contêiner com um atraso antes do primeiro bloco (a <Tela> chama com o atraso total) */
  tela: (atraso: number) => Variants;
  /** variantes: `tela` (sem atraso), `bloco` (padrão dos blocos) e partes nomeadas da coreografia */
  variantes: { tela: Variants; bloco: Variants } & Record<string, Variants>;
};

const ritmoPadrao: Ritmo = montagem;
/** Login: ritmo mais lento entre as partes (esfera, vitrine, cartão); sai em ~0,8 s. */
const ritmoLogin: Ritmo = { passo: 0.07, passoSaida: 0.14, limiteBlocos: 6, limiteSaida: 6, inicio: 0.05 };
const ritmoVitrine: Ritmo = { passo: 0.035, passoSaida: 0.05, limiteBlocos: 6, limiteSaida: 6, inicio: 0 };
/** Chips de vidro da vitrine: o grupo só orquestra; cada chip anima a opacidade em si (nunca no grupo). */
const ritmoChips: Ritmo = { passo: 0.04, passoSaida: 0.03, limiteBlocos: 6, limiteSaida: 6, inicio: 0 };
const ritmoFormulario: Ritmo = { passo: 0.035, passoSaida: 0.015, limiteBlocos: 10, limiteSaida: 4, inicio: 0.02 };
const ritmoEtapa: Ritmo = { passo: 0.04, passoSaida: 0.015, limiteBlocos: 8, limiteSaida: 4, inicio: 0.04 };
/** Troca de contratante: momento raro, a casca inteira se desfaz com um pouco mais de cascata. */
const ritmoContexto: Ritmo = { passo: 0.05, passoSaida: 0.03, limiteBlocos: 8, limiteSaida: 6, inicio: 0.02 };

/** Tempos do login (s). */
export const login = {
  /** o cartão começa a subir depois da esfera e da vitrine */
  atrasoCartao: 0.25,
  /** os campos da primeira etapa esperam o cartão subir (TrocaEtapa atrasoInicial) */
  atrasoCampos: 0.4,
  /** na saída, o cartão espera os campos começarem a sair (de baixo para cima) */
  saidaCartao: 0.15,
};

/** Contêiner da etapa: desliza na direção (`custom`) e orquestra os campos. */
function variantesEtapa(atraso = 0): Variants {
  return {
    hidden: (dir: number = 1) => ({ x: 28 * dir }),
    show: {
      x: 0,
      transition: { ...encaixe, delayChildren: atrasoDoBloco('documento', ritmoEtapa.passo, ritmoEtapa.limiteBlocos, atraso + ritmoEtapa.inicio) },
    },
    exit: (dir: number = 1) => ({
      x: -20 * dir,
      transition: {
        duration: montagem.saida,
        ease: ease.inOut,
        delayChildren: atrasoDoBloco('reversa', ritmoEtapa.passoSaida, ritmoEtapa.limiteSaida),
      },
    }),
  };
}

/** Coreografia que só orquestra blocos com um ritmo e uma ordem. */
function simples(ritmo: Ritmo, ordem: { entrada: Ordem; saida: Ordem }, atraso: number, partes: Record<string, Variants> & { bloco: Variants }): Coreografia {
  const tela = (a: number) => orquestrar(ritmo, { atraso: a, entrada: ordem.entrada, saida: ordem.saida });
  return { ritmo, ordem, modo: 'wait', atraso, tela, variantes: { ...partes, tela: tela(0) } };
}

const reversa = { entrada: 'documento', saida: 'reversa' } as const;

export const coreografias: Record<NomeCoreografia, Coreografia> = {
  /**
   * Login. Monta: a esfera de partículas cresce, a vitrine (marca, título, chips) entra em cascata,
   * o cartão sobe e os campos encaixam. Desmonta: campos de baixo para cima, título do cartão, cartão,
   * chips e título da vitrine; por último a esfera encolhe e some.
   * Filhos da <Tela coreografia="login"> na ordem: esfera → vitrine → cartão.
   */
  login: simples(ritmoLogin, reversa, 0, {
    bloco,
    esfera: {
      hidden: { opacity: 0, scale: 0.85 },
      show: { opacity: 1, scale: 1, transition: { duration: 1.6, ease: ease.out } },
      exit: { opacity: 0, scale: 0.55, transition: { duration: 0.5, ease: ease.inOut } },
    },
    /** grupo da esquerda (marca, título, chips): orquestra os seus blocos */
    vitrine: orquestrar(ritmoVitrine),
    /** grupo dos chips de vidro: <Bloco orquestra variants={v.chips}>, cada chip um <Bloco> */
    chips: orquestrar(ritmoChips),
    /** título grande da vitrine (texto puro: entra desfocando) */
    titulo: blocoTexto,
    /** cartão de vidro do formulário: entra como no protótipo; os campos vêm pela TrocaEtapa */
    cartao: {
      hidden: { opacity: 0, y: 30, scale: 0.96 },
      show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: 0.9,
          ease: ease.out,
          delay: login.atrasoCartao,
          delayChildren: atrasoDoBloco('documento', montagem.passo, montagem.limiteBlocos, login.atrasoCartao + montagem.inicio),
        },
      },
      exit: {
        opacity: 0,
        y: 24,
        scale: 0.96,
        transition: {
          when: 'afterChildren',
          delay: login.saidaCartao,
          duration: montagem.saida,
          ease: ease.inOut,
          delayChildren: atrasoDoBloco('reversa', montagem.passoSaida, montagem.limiteSaida, login.saidaCartao),
        },
      },
    },
  }),
  /**
   * Início: a casca traz menu e barra (casca.atrasoConteudo); os blocos do painel encaixam em cascata.
   * KPIs com CountUp, linha que se desenha e barras que crescem ficam dentro dos blocos.
   */
  inicio: simples(ritmoPadrao, reversa, 0, { bloco, menu: cascaMenu(), barra: cascaBarra() }),
  /** Qualquer tela de lista ou detalhe. */
  padrao: simples(ritmoPadrao, reversa, 0, { bloco }),
  /** Formulários longos: movimento curto e funcional, cascata rápida, saída de uma vez. */
  formulario: simples(ritmoFormulario, { entrada: 'documento', saida: 'junto' }, 0, { bloco: blocoCurto }),
  /**
   * Etapa dentro de um cartão (login: credenciais → código → trocar senha). O contêiner desliza na direção
   * (`custom`: 1 avança, −1 volta) e os campos encaixam; ao sair, os campos vão de baixo para cima.
   * Uso: <TrocaEtapa etapa={…} direcao={…}>.
   */
  etapa: {
    ritmo: ritmoEtapa,
    ordem: reversa,
    modo: 'wait',
    atraso: 0,
    tela: variantesEtapa,
    variantes: { tela: variantesEtapa(), bloco: blocoCurto },
  },
  /**
   * Troca de contexto (superadmin entra ou sai de um contratante): a casca inteira se desfaz, o fundo
   * esmaece para o do contratante (LiveBackground) e a casca nova monta depois de uma pausa curta.
   * Uso: <TrocaDeArea chave={`casca:${tenantId}`} coreografia="contexto">.
   */
  contexto: simples(ritmoContexto, reversa, 0.15, { bloco }),
};
