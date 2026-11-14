import type { RouteObject } from 'react-router';

/** Rotas públicas do módulo de acesso (fora da casca), num pedaço próprio do build. */
export const rotasAuth: RouteObject[] = [
  {
    path: 'login',
    lazy: async () => ({ Component: (await import('./pages/LoginPage')).LoginPage }),
  },
];
