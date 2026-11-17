import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { Splash } from '../design-system/ui/Splash';
import { rotasAdmin } from '../modules/admin/routes';
import { rotasAuxiliares } from '../modules/auxiliares/routes';
import { rotasAuth } from '../modules/auth/routes';
import { rotasConta } from '../modules/conta/routes';
import { rotasInicio } from '../modules/inicio/routes';
import { rotasPessoas } from '../modules/pessoas/routes';
import { CascaProtegida } from './casca/Casca';
import { Raiz } from './Raiz';

/** Catálogo do design system: só em desenvolvimento (fica fora do build de produção). */
const DesignSystem = import.meta.env.DEV ? lazy(() => import('../design-system/catalogo/DesignSystem')) : null;

/*
 * Raiz (sessão + TrocaDeArea)
 *   /login                 área de login (pública)
 *   casca protegida        sem sessão → /login?voltar=<rota>; troca de senha pendente → /login
 *     /                    Início
 *     /cadastros/pessoas/...     Pessoas: lista e ficha (modules/pessoas/routes.tsx)
 *     /cadastros/auxiliares/...  Cadastros auxiliares: FormList de tipos (modules/auxiliares/routes.tsx)
 *     /admin/...           Administrativo: Contratantes (superadmin na plataforma), Usuários e Logs (modules/admin/routes.tsx)
 *     /minha-conta         Minha conta (modules/conta/routes.tsx)
 *     *                    → Início
 *
 * Cada tela é um pedaço próprio do build (lazy); o Splash cobre o primeiro carregamento dela.
 */
const rotas: RouteObject[] = [
  {
    element: <Raiz />,
    hydrateFallbackElement: <Splash />,
    children: [
      ...rotasAuth,
      {
        element: <CascaProtegida />,
        children: [
          ...rotasInicio,
          ...rotasPessoas,
          ...rotasAuxiliares,
          ...rotasAdmin,
          ...rotasConta,
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
];

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
