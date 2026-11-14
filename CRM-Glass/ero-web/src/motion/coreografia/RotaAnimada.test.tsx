// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, useContext, useEffect, type ReactElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createMemoryRouter, RouterProvider, UNSAFE_LocationContext, useLocation, useOutlet } from 'react-router';
import { AnimatePresence, usePresence } from 'motion/react';
import { Congelado, LocalCongelado } from './RotaAnimada';

/*
 * F7: a tela que sai lê a URL com que estava (LocalCongelado) até sumir; a nova lê a URL nova.
 * Sem isso, o indicador do menu (layoutId) pulava de item dentro da casca que saía e a troca de contratante
 * a partir de outra tela ficava presa.
 */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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
});

/** Mostra o pathname que o roteador entrega a quem está dentro. */
function Onde({ id }: { id: string }) {
  const { pathname, search } = useLocation();
  return <span data-tela={id}>{pathname + search}</span>;
}

/** Segura a saída (como uma animação de saída longa) até `liberar` ser chamado. */
const liberadores: (() => void)[] = [];
function SaidaPresa({ children }: { children: ReactNode }) {
  const [presente, liberar] = usePresence();
  useEffect(() => {
    if (!presente && liberar) liberadores.push(liberar);
  }, [presente, liberar]);
  return <>{children}</>;
}

/** Layout como a RotaAnimada, sem motion.div: AnimatePresence 'wait' chaveado pelo pathname + Congelado. */
function Layout() {
  const outlet = useOutlet();
  const { pathname } = useLocation();
  return (
    <AnimatePresence mode="wait">
      <SaidaPresa key={pathname}>
        <Congelado>{outlet}</Congelado>
      </SaidaPresa>
    </AnimatePresence>
  );
}

function telas() {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <Layout />,
        children: [
          { path: 'a', element: <Onde id="a" /> },
          { path: 'b', element: <Onde id="b" /> },
        ],
      },
    ],
    { initialEntries: ['/a'] },
  );
  const c = montar(<RouterProvider router={router} />);
  const navegar = (to: string) =>
    act(async () => {
      await router.navigate(to);
    });
  const texto = (id: string) => c.querySelector(`[data-tela="${id}"]`)?.textContent ?? null;
  return { router, navegar, texto };
}

describe('LocalCongelado', () => {
  it('entrega aos de dentro a localização recebida, não a do roteador', () => {
    function Teste() {
      const local = useContext(UNSAFE_LocationContext);
      const congelado = { ...local, location: { ...local.location, pathname: '/antiga', search: '?x=1' } };
      return (
        <>
          <Onde id="fora" />
          <LocalCongelado local={congelado}>
            <Onde id="dentro" />
          </LocalCongelado>
        </>
      );
    }
    const router = createMemoryRouter([{ path: '/atual', element: <Teste /> }], { initialEntries: ['/atual'] });
    const c = montar(<RouterProvider router={router} />);
    expect(c.querySelector('[data-tela="fora"]')?.textContent).toBe('/atual');
    expect(c.querySelector('[data-tela="dentro"]')?.textContent).toBe('/antiga?x=1');
  });
});

describe('Congelado (tela que sai)', () => {
  it('enquanto presente, acompanha a URL (mesma tela, busca nova)', async () => {
    const { navegar, texto } = telas();
    expect(texto('a')).toBe('/a');
    await navegar('/a?pagina=2');
    expect(texto('a')).toBe('/a?pagina=2');
  });

  it('saindo, fica com a URL e o conteúdo antigos; a próxima só monta depois e lê a URL nova', async () => {
    const { router, navegar, texto } = telas();
    await navegar('/b');
    // a URL já é a nova, mas a tela que sai continua inteira, com a URL dela
    expect(router.state.location.pathname).toBe('/b');
    expect(texto('a')).toBe('/a');
    expect(texto('b')).toBeNull();

    // terminou de sair: a próxima monta com a URL nova
    await act(async () => {
      liberadores.splice(0).forEach((f) => f());
    });
    expect(texto('a')).toBeNull();
    expect(texto('b')).toBe('/b');
  });

  it('uma atualização do roteador no meio da saída não vaza para a tela que sai', async () => {
    const { navegar, texto } = telas();
    await navegar('/b');
    await navegar('/b?filtro=ativos');
    expect(texto('a')).toBe('/a');
    await act(async () => {
      liberadores.splice(0).forEach((f) => f());
    });
    expect(texto('b')).toBe('/b?filtro=ativos');
  });
});
