import type { RouteObject } from 'react-router';

/** Rotas do Início (dentro da casca), num pedaço próprio do build. */
export const rotasInicio: RouteObject[] = [
  {
    index: true,
    lazy: async () => ({ Component: (await import('./pages/InicioPage')).InicioPage }),
  },
];
