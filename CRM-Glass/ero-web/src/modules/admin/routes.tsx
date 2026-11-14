import type { RouteObject } from 'react-router';
import { SoPlataforma } from './components/SoPlataforma';

/*
 * Rotas do Administrativo (dentro da casca), cada uma num pedaço próprio do build (lazy). O `SoPlataforma` vai
 * em cada rota, sem layout com Outlet no meio: a RotaAnimada da casca congela a tela que sai pela rota dela.
 *   /admin/contratantes                 lista
 *   /admin/contratantes/novo            ficha nova (com o administrador inicial)
 *   /admin/contratantes/:id             ficha
 *   /admin/contratantes/:id/aparencia   aparência, com prévia ao vivo
 */
export const rotasAdmin: RouteObject[] = [
  {
    path: 'admin/contratantes',
    lazy: async () => {
      const { ContratanteList } = await import('./pages/ContratanteList');
      return { element: <SoPlataforma><ContratanteList /></SoPlataforma> };
    },
  },
  {
    path: 'admin/contratantes/novo',
    lazy: async () => {
      const { ContratanteForm } = await import('./pages/ContratanteForm');
      return { element: <SoPlataforma><ContratanteForm /></SoPlataforma> };
    },
  },
  {
    path: 'admin/contratantes/:id',
    lazy: async () => {
      const { ContratanteForm } = await import('./pages/ContratanteForm');
      return { element: <SoPlataforma><ContratanteForm /></SoPlataforma> };
    },
  },
  {
    path: 'admin/contratantes/:id/aparencia',
    lazy: async () => {
      const { ContratanteAparencia } = await import('./pages/ContratanteAparencia');
      return { element: <SoPlataforma><ContratanteAparencia /></SoPlataforma> };
    },
  },
];
