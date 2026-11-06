import { lazy, Suspense } from 'react';
import { createBrowserRouter, Link, Navigate, type RouteObject } from 'react-router';
import { Splash } from '../design-system/ui/Splash';

/** Catálogo do design system: só em desenvolvimento (fica fora do build de produção). */
const DesignSystem = import.meta.env.DEV ? lazy(() => import('../design-system/catalogo/DesignSystem')) : null;

/** Provisório até o frontend-modulos montar as rotas de verdade (app/rotas.tsx). */
function Provisorio() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="glass-solid p-8 max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">CRM Glass</h1>
        <p className="text-sm text-muted mt-2">Base do front pronta. As telas chegam na próxima etapa.</p>
        {import.meta.env.DEV && (
          <Link to="/design-system" className="inline-block mt-5 text-sm font-semibold text-accent-text underline underline-offset-4">
            Abrir o design system
          </Link>
        )}
      </div>
    </main>
  );
}

const rotas: RouteObject[] = [{ path: '/', element: <Provisorio /> }];

if (DesignSystem) {
  rotas.push({
    path: '/design-system',
    element: (
      <Suspense fallback={<Splash />}>
        <DesignSystem />
      </Suspense>
    ),
  });

  /*
   * Demonstração da montagem em blocos (motion-designer), com a forma do app real:
   * raiz (login ↔ casca) → casca (menu, barra, RotaAnimada) → telas.
   */
  const demo = () => import('../design-system/catalogo/DemoMovimento');
  rotas.push({
    path: '/design-system/movimento',
    lazy: async () => ({ Component: (await demo()).DemoRaiz }),
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: 'login', lazy: async () => ({ Component: (await demo()).DemoLogin }) },
      {
        lazy: async () => ({ Component: (await demo()).DemoCasca }),
        children: [
          { path: 'inicio', lazy: async () => ({ Component: (await demo()).DemoInicio }) },
          { path: 'usuarios', lazy: async () => ({ Component: (await demo()).DemoLista }) },
          { path: 'usuarios/:id', lazy: async () => ({ Component: (await demo()).DemoDetalhe }) },
        ],
      },
    ],
  });
}

export const roteador = createBrowserRouter(rotas);
