import type { RouteObject } from 'react-router';
import { ExigeTela } from '../../shared/sessao';

/*
 * Rotas de Filiais (dentro da casca), cada uma num pedaço próprio do build (lazy), todas com a guarda da tela
 * (ExigeTela, dentro de um contratante; docs/04-permissoes.md, grupo FILIAIS).
 *   /cadastros/filiais            lista                       (ExigeTela filial-list)
 *   /cadastros/filiais/novo · /:id  ficha                     (ExigeTela filial-form)
 */
export const rotasFiliais: RouteObject[] = [
  {
    path: 'cadastros/filiais',
    lazy: async () => {
      const { FilialList } = await import('./pages/FilialList');
      return { element: <ExigeTela tela="filial-list" escopo="contratante"><FilialList /></ExigeTela> };
    },
  },
  {
    path: 'cadastros/filiais/novo',
    lazy: async () => {
      const { FilialForm } = await import('./pages/FilialForm');
      return { element: <ExigeTela tela="filial-form" escopo="contratante"><FilialForm /></ExigeTela> };
    },
  },
  {
    path: 'cadastros/filiais/:id',
    lazy: async () => {
      const { FilialForm } = await import('./pages/FilialForm');
      return { element: <ExigeTela tela="filial-form" escopo="contratante"><FilialForm /></ExigeTela> };
    },
  },
];
