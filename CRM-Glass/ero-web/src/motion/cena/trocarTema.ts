import { flushSync } from 'react-dom';
import type { Theme, TrocarTema } from '../../shared/aparencia/AparenciaProvider';
import { cena } from '../tokens';
import { aguardarTelaParada } from '../coreografia/andamento';
import { cenaAtiva, cenaPronta, pedirCena } from './sceneSync';

/*
 * Troca de tema em estilo vídeo. É a lógica do ThemeToggle do protótipo (prototipo/src/components/layout/Topbar.tsx),
 * agora disparada pelo AparenciaProvider quando o tema aplicado muda: prévia da Configuração (Escuro/Claro),
 * superadmin entrando ou saindo de um contratante, login → Início com tema diferente do padrão.
 *
 *  - Com fundo de cena: a luz muda primeiro (céu, cidade, luminárias acendendo aos poucos) e a interface
 *    esmaece para o tema novo no meio da sequência (cena.trocaInterface), não no começo.
 *  - Com fundo vivo: revelação circular (View Transitions API) a partir do último toque/clique.
 *  - Movimento reduzido: troca direta; a cena só esmaece (cena.duracaoReduzida, no SceneBackground).
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

const curva = (c: readonly number[]) => `cubic-bezier(${c.join(',')})`;
const espera = (s: number) => new Promise<void>((r) => setTimeout(r, s * 1000));

/** Troca em andamento: uma nova toma o lugar da anterior (como o `vez` do ThemeToggle). */
let vez = 0;

async function trocarComCena(novo: Theme, aplicar: (t: Theme) => void) {
  const minha = ++vez;
  const root = document.documentElement;
  try {
    // Cena recém-montada (contratante novo): a sequência começa com as fotos no canvas.
    await Promise.race([cenaPronta(), espera(cena.esperaFotos)]);
    if (minha !== vez) return;
    const pode = await pedirCena(novo === 'light' ? 1 : 0);
    if (!pode || minha !== vez) return; // outra troca tomou o lugar desta
    const doc = document as DocComVT;
    if (!doc.startViewTransition) {
      aplicar(novo);
      return;
    }
    await aguardarTelaParada();
    if (minha !== vez) return;
    root.classList.add('vt-cena');
    const t = doc.startViewTransition(() => {
      flushSync(() => aplicar(novo));
      root.dataset.theme = novo;
    });
    const opcoes = { duration: cena.esmaecerInterface * 1000, easing: curva(cena.esmaecerEase) };
    t.ready
      .then(() => {
        root.animate({ opacity: [1, 0] }, { ...opcoes, fill: 'forwards', pseudoElement: '::view-transition-old(root)' });
        root.animate({ opacity: [0, 1] }, { ...opcoes, pseudoElement: '::view-transition-new(root)' });
      })
      .catch(() => {});
    await t.finished.catch(() => {});
  } finally {
    if (minha === vez) root.classList.remove('vt-cena');
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
  const t = doc.startViewTransition(() => {
    flushSync(() => aplicar(novo));
    document.documentElement.dataset.theme = novo;
  });
  t.ready
    .then(() =>
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: cena.revelacao.duracao * 1000, easing: curva(cena.revelacao.ease), pseudoElement: '::view-transition-new(root)' },
      ),
    )
    .catch(() => {
      /* transição abortada (aba oculta, troca seguida): o tema já foi trocado */
    });
  await t.finished.catch(() => {});
}

/** Ponto de extensão do AparenciaProvider: <AparenciaProvider trocarTema={trocarTema}>. */
export const trocarTema: TrocarTema = async ({ novo, aplicar, reduzir }) => {
  if (cenaAtiva() && !reduzir) return trocarComCena(novo, aplicar);
  if (reduzir) {
    ++vez;
    aplicar(novo); // a cena segue sozinha em cena.duracaoReduzida
    return;
  }
  return trocarComRevelacao(novo, aplicar);
};
