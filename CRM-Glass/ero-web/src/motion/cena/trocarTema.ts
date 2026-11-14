import { flushSync } from 'react-dom';
import type { Theme, TrocarTema } from '../../shared/aparencia/AparenciaProvider';
import { cena, curvaCss as curva, desempenho, montagem } from '../tokens';
import { aguardarTelaParada } from '../coreografia/andamento';
import { modoLeve } from '../desempenho';
import { cenaAtiva, cenaPronta, pedirCena } from './sceneSync';
import { pausarFundo } from './pausaFundo';

/*
 * Troca de tema em estilo vídeo. É a lógica do ThemeToggle do protótipo (prototipo/src/components/layout/Topbar.tsx),
 * agora disparada pelo AparenciaProvider quando o tema aplicado muda: prévia da Configuração (Escuro/Claro),
 * superadmin entrando ou saindo de um contratante, login → Início com tema diferente do padrão.
 *
 *  - Com fundo de cena: a luz muda primeiro (céu, cidade, luminárias acendendo aos poucos) e a interface
 *    esmaece para o tema novo no meio da sequência (cena.trocaInterface), não no começo.
 *  - Com fundo vivo: revelação circular (View Transitions API) a partir do último toque/clique.
 *  - Movimento reduzido: troca direta; a cena só esmaece (cena.duracaoReduzida, no SceneBackground).
 *  - Modo leve (aparelho fraco, motion/desempenho.ts): esmaecimento da página inteira em desempenho.esmaecer,
 *    no lugar da revelação circular e da sequência da cena. A cena salta para o tema novo dentro da captura nova
 *    (SceneBackground), então a foto esmaece junto com a interface, só com opacidade no compositor.
 *
 * Diferenças do protótipo, todas para a troca disparada sem clique:
 *  - a View Transition espera a tela parar de montar/desmontar (captura sem cartões em movimento);
 *  - com cena nova (troca de contratante), espera as fotos carregarem (até cena.esperaFotos) antes da sequência;
 *  - a origem da revelação circular é o último toque recente; sem ele, o centro da tela.
 */

type ViewTransition = { ready: Promise<void>; finished: Promise<void> };
type DocComVT = Document & { startViewTransition?: (cb: () => void) => ViewTransition };

/** Último toque/clique (origem da revelação circular). */
let toque: { x: number; y: number; t: number } | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', (e) => (toque = { x: e.clientX, y: e.clientY, t: performance.now() }), {
    capture: true,
    passive: true,
  });
}

function origemDaRevelacao() {
  if (toque && performance.now() - toque.t <= cena.revelacao.memoria * 1000) return { x: toque.x, y: toque.y };
  return { x: innerWidth / 2, y: innerHeight / 2 };
}

const espera = (s: number) => new Promise<void>((r) => setTimeout(r, s * 1000));

/**
 * Classe no <html> durante a troca (dentro da captura nova até o fim da View Transition). O index.css desliga as
 * transições CSS com ela: sem isso, cada campo, botão e cartão anima a cor de um tema ao outro POR BAIXO da
 * revelação (a imagem nova é ao vivo), repintando o vidro a cada quadro, e a borda do círculo mostra cores no meio
 * do caminho. Medido no /design-system (F11): menos quadros perdidos e o pior quadro cai pela metade.
 */
export const TEMA_EM_TROCA = 'tema-em-troca';

/** Troca em andamento: uma nova toma o lugar da anterior (como o `vez` do ThemeToggle). */
let vez = 0;

async function trocarComCena(novo: Theme, aplicar: (t: Theme) => void) {
  const minha = ++vez;
  // Cena recém-montada (contratante novo): a sequência começa com as fotos no canvas.
  await Promise.race([cenaPronta(), espera(cena.esperaFotos)]);
  if (minha !== vez) return;
  const pode = await pedirCena(novo === 'light' ? 1 : 0);
  if (!pode || minha !== vez) return; // outra troca tomou o lugar desta
  await esmaecerInterface(novo, aplicar, minha, cena.esmaecerInterface, cena.esmaecerEase);
}

/** Modo leve: só o esmaecimento da página inteira, sem círculo e sem a sequência da cena. */
function trocarComEsmaecimento(novo: Theme, aplicar: (t: Theme) => void) {
  const minha = ++vez;
  return esmaecerInterface(novo, aplicar, minha, desempenho.esmaecer.duracao, desempenho.esmaecer.ease);
}

/**
 * Esmaecimento cruzado da página inteira (View Transition): a captura antiga some enquanto a nova aparece, só
 * opacidade no compositor (html.vt-cena soma as duas no index.css, sem perder brilho no meio). Usado pela troca
 * com cena (depois que a luz mudou o bastante) e pelo modo leve (direto).
 */
async function esmaecerInterface(
  novo: Theme,
  aplicar: (t: Theme) => void,
  minha: number,
  duracao: number,
  ease: readonly number[],
) {
  const root = document.documentElement;
  try {
    const doc = document as DocComVT;
    if (!doc.startViewTransition) {
      aplicar(novo);
      return;
    }
    await aguardarTelaParada();
    if (minha !== vez) return;
    root.classList.add('vt-cena');
    const t = doc.startViewTransition(() => {
      root.classList.add(TEMA_EM_TROCA);
      flushSync(() => aplicar(novo));
      root.dataset.theme = novo;
    });
    const opcoes = { duration: duracao * 1000, easing: curva(ease) };
    t.ready
      .then(() => {
        root.animate({ opacity: [1, 0] }, { ...opcoes, fill: 'forwards', pseudoElement: '::view-transition-old(root)' });
        root.animate({ opacity: [0, 1] }, { ...opcoes, pseudoElement: '::view-transition-new(root)' });
        cortarDepois(duracao, minha);
      })
      .catch(cortar);
    await t.finished.catch(() => {});
  } finally {
    if (minha === vez) root.classList.remove('vt-cena', TEMA_EM_TROCA);
  }
}

async function trocarComRevelacao(novo: Theme, aplicar: (t: Theme) => void) {
  const minha = ++vez;
  const doc = document as DocComVT;
  if (!doc.startViewTransition) {
    aplicar(novo);
    return;
  }
  await aguardarTelaParada();
  if (minha !== vez) return;
  const { x, y } = origemDaRevelacao();
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  // O fundo vivo para durante a revelação: a imagem nova é ao vivo e os orbs desfocados se mexendo por baixo
  // do clip-path custam quadros. Para dentro da captura (sem salto: só congela onde está) e volta no fim.
  const t = doc.startViewTransition(() => {
    document.documentElement.classList.add(TEMA_EM_TROCA);
    flushSync(() => {
      pausarFundo(true);
      aplicar(novo);
    });
    document.documentElement.dataset.theme = novo;
  });
  t.ready
    .then(() =>
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: cena.revelacao.duracao * 1000, easing: curva(cena.revelacao.ease), pseudoElement: '::view-transition-new(root)' },
      ),
    )
    .then(() => cortarDepois(cena.revelacao.duracao, minha))
    .catch(() => {
      /* transição abortada (aba oculta, troca seguida): o tema já foi trocado */
      cortar();
    });
  const esta = ++revelacao;
  await t.finished.catch(() => {});
  if (esta === revelacao) {
    pausarFundo(false); // só a revelação mais recente solta o fundo
    document.documentElement.classList.remove(TEMA_EM_TROCA);
  }
}

/** Revelações circulares em andamento: a última a terminar solta a pausa do fundo. */
let revelacao = 0;

/* ---------------- Trocas em andamento (para quem precisa esperar a interface trocar) ---------------- */
let emCurso = 0;
const aoTerminar = new Set<() => void>();
/** Quem espera o ponto de corte (cena.corteDaSaida) da troca em andamento. */
const aoCortar = new Set<() => void>();

function cortar() {
  [...aoCortar].forEach((f) => f());
}
/**
 * Marca o corte quando a animação da interface (`duracao` s) tiver percorrido `cena.corteDaSaida`, se esta troca
 * (`minha`) ainda for a atual: o relógio de uma troca anterior não corta a seguinte.
 */
function cortarDepois(duracao: number, minha: number) {
  setTimeout(() => minha === vez && cortar(), duracao * cena.corteDaSaida * 1000);
}

/** true enquanto alguma troca de tema (cena + esmaecimento, ou revelação circular) está em andamento. */
export function temaEmTroca() {
  return emCurso > 0;
}

/**
 * Resolve quando não houver troca de tema em andamento (na hora, se não houver nenhuma), ou depois de
 * `limite` segundos. Com cena, a troca termina quando a interface acabou de esmaecer para o tema novo
 * (a luz da cena ainda pode estar subindo, sozinha). Para montar a próxima tela antes do fim, aguardarCorteDaTroca.
 */
export function aguardarTrocaDeTema(limite = montagem.esperaSaida) {
  if (!emCurso) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const fim = () => {
      clearTimeout(teto);
      aoTerminar.delete(fim);
      resolve();
    };
    const teto = setTimeout(fim, limite * 1000);
    aoTerminar.add(fim);
  });
}

/**
 * Resolve no ponto de corte da troca de tema em andamento: a interface já está no tema novo e a revelação
 * (ou o esmaecimento da cena) percorreu `cena.corteDaSaida`. Na hora, se não houver troca; no fim da troca,
 * se ela terminar sem animar (sem View Transition, movimento reduzido, troca substituída); ou em `limite` s.
 * Usado por usePreviaDaTela: a próxima tela monta junto com o fim da revelação.
 */
export function aguardarCorteDaTroca(limite = montagem.esperaSaida) {
  if (!emCurso) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const fim = () => {
      clearTimeout(teto);
      aoCortar.delete(fim);
      aoTerminar.delete(fim);
      resolve();
    };
    const teto = setTimeout(fim, limite * 1000);
    aoCortar.add(fim);
    aoTerminar.add(fim);
  });
}

function executar(troca: Parameters<TrocarTema>[0]) {
  const { novo, aplicar, reduzir } = troca;
  // Movimento reduzido manda (troca direta, logo abaixo); o modo leve só troca o vídeo por um esmaecimento.
  if (!reduzir && modoLeve()) return trocarComEsmaecimento(novo, aplicar);
  if (cenaAtiva() && !reduzir) return trocarComCena(novo, aplicar);
  if (reduzir) {
    ++vez;
    aplicar(novo); // a cena segue sozinha em cena.duracaoReduzida
    return Promise.resolve();
  }
  return trocarComRevelacao(novo, aplicar);
}

/** Ponto de extensão do AparenciaProvider: <AparenciaProvider trocarTema={trocarTema}>. */
export const trocarTema: TrocarTema = (troca) => {
  emCurso++;
  const terminou = () => {
    emCurso--;
    if (emCurso) return;
    [...aoTerminar].forEach((f) => f());
  };
  const p = executar(troca);
  p.then(terminou, terminou);
  return p;
};
