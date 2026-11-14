// @vitest-environment jsdom
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { MotionConfig } from 'motion/react';
import { RotaAnimada } from './coreografia/RotaAnimada';
import { useReduzirMovimento } from './reduzir';

/*
 * Movimento reduzido ligado no sistema COM O APP ABERTO: quem usa useReduzirMovimento (RotaAnimada, Tela, blocos,
 * fundo) muda na hora. Antes, o valor ficava o da montagem e a troca de tela dava um salto seco de 40 px.
 */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** matchMedia simulado: `reduzir` muda e avisa quem assinou, como o sistema faz. */
let reduzir = false;
const ouvintes = new Set<(e: { matches: boolean }) => void>();
function mudarSistema(valor: boolean) {
  reduzir = valor;
  ouvintes.forEach((f) => f({ matches: valor }));
}
const original = window.matchMedia;
beforeAll(() => {
  window.matchMedia = ((consulta: string) => ({
    media: consulta,
    get matches() {
      return consulta.includes('prefers-reduced-motion') && reduzir;
    },
    onchange: null,
    addEventListener: (_: string, f: (e: { matches: boolean }) => void) => ouvintes.add(f),
    removeEventListener: (_: string, f: (e: { matches: boolean }) => void) => ouvintes.delete(f),
    addListener: (f: (e: { matches: boolean }) => void) => ouvintes.add(f),
    removeListener: (f: (e: { matches: boolean }) => void) => ouvintes.delete(f),
    dispatchEvent: () => true,
  })) as unknown as typeof window.matchMedia;
});
afterAll(() => {
  window.matchMedia = original;
});

let raiz: Root | null = null;
let caixa: HTMLDivElement | null = null;
function montar(el: ReactElement) {
  caixa = document.createElement('div');
  document.body.appendChild(caixa);
  raiz = createRoot(caixa);
  act(() => raiz!.render(el));
  return caixa;
}
afterEach(() => {
  act(() => raiz?.unmount());
  caixa?.remove();
  raiz = null;
  caixa = null;
  act(() => mudarSistema(false)); // o Motion também ouve o sistema: volta ao normal para o próximo teste
});

function Mostra() {
  return <span data-reduzir>{String(useReduzirMovimento())}</span>;
}
const valor = (c: HTMLElement) => c.querySelector('[data-reduzir]')!.textContent;

describe('useReduzirMovimento ao vivo', () => {
  it('acompanha o sistema depois da montagem (MotionConfig "user")', () => {
    const c = montar(
      <MotionConfig reducedMotion="user">
        <Mostra />
      </MotionConfig>,
    );
    expect(valor(c)).toBe('false');
    act(() => mudarSistema(true));
    expect(valor(c)).toBe('true');
    act(() => mudarSistema(false));
    expect(valor(c)).toBe('false');
  });

  it('"always" (contratante com animações reduzidas) reduz sempre; fora de MotionConfig não reduz', () => {
    const c = montar(
      <>
        <MotionConfig reducedMotion="always">
          <Mostra />
        </MotionConfig>
        <div data-fora>
          <Mostra />
        </div>
      </>,
    );
    const [dentro, fora] = [...c.querySelectorAll('[data-reduzir]')].map((e) => e.textContent);
    expect([dentro, fora]).toEqual(['true', 'false']);
  });
});

describe('RotaAnimada com o movimento reduzido ligado depois de abrir o app', () => {
  /** Monta a RotaAnimada em /lista; devolve o navegar e o transform de cada contêiner de rota. */
  function app() {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: (
            <MotionConfig reducedMotion="user">
              <RotaAnimada className="rota" rolarAoTopo={false} />
            </MotionConfig>
          ),
          children: [
            { path: 'lista', element: <p>Lista</p> },
            { path: 'lista/1', element: <p>Ficha</p> },
          ],
        },
      ],
      { initialEntries: ['/lista'] },
    );
    const c = montar(<RouterProvider router={router} />);
    const navegar = (to: string) =>
      act(async () => {
        await router.navigate(to);
      });
    const transforms = () => [...c.querySelectorAll<HTMLElement>('.rota')].map((e) => e.style.transform);
    /** Junta os transforms vistos durante a troca inteira (saída + entrada), quadro a quadro. */
    /** Inclui saltos instantâneos (o MutationObserver vê cada escrita no style, mesmo as de um quadro só). */
    const durante = async (s: number, acao: () => Promise<void>) => {
      const vistos: string[] = [];
      const obs = new MutationObserver((ms) =>
        ms.forEach((m) => (m.target as HTMLElement).classList?.contains('rota') && vistos.push((m.target as HTMLElement).style.transform)),
      );
      obs.observe(c, { subtree: true, attributes: true, attributeFilter: ['style'] });
      await acao();
      const fim = performance.now() + s * 1000;
      while (performance.now() < fim) {
        vistos.push(...transforms());
        await act(() => new Promise<void>((ok) => setTimeout(ok, 16)));
      }
      obs.disconnect();
      return vistos;
    };
    return { navegar, durante };
  }
  const deslocado = (t: string) => /translateX\((?!0px\))/.test(t);

  it('controle: com movimento completo, a ficha entra deslizando (o teste enxerga o deslocamento)', async () => {
    const { navegar, durante } = app();
    expect((await durante(1, () => navegar('/lista/1'))).some(deslocado)).toBe(true);
  });

  it('ligado com o app aberto: a próxima troca não desloca o contêiner, só esmaece', async () => {
    const { navegar, durante } = app();
    act(() => mudarSistema(true));
    expect((await durante(1, () => navegar('/lista/1'))).some(deslocado)).toBe(false);
  });
});
