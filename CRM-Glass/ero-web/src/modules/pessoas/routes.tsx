import type { RouteObject } from 'react-router';
import { ExigeTela } from '../../shared/sessao';

/*
 * Rotas de Pessoas (dentro da casca), cada uma num pedaço próprio do build (lazy), todas com a guarda da tela
 * (ExigeTela, dentro de um contratante; docs/04-permissoes.md, grupo PESSOAS).
 *   /cadastros/pessoas            lista                       (ExigeTela pessoa-list)
 *   /cadastros/pessoas/novo · /:id  ficha                     (ExigeTela pessoa-form)
 */
export const rotasPessoas: RouteObject[] = [
  {
    path: 'cadastros/pessoas',
    lazy: async () => {
      const { PessoaList } = await import('./pages/PessoaList');
      return { element: <ExigeTela tela="pessoa-list" escopo="contratante"><PessoaList /></ExigeTela> };
    },
  },
  {
    path: 'cadastros/pessoas/novo',
    lazy: async () => {
      const { PessoaForm } = await import('./pages/PessoaForm');
      return { element: <ExigeTela tela="pessoa-form" escopo="contratante"><PessoaForm /></ExigeTela> };
    },
  },
  {
    path: 'cadastros/pessoas/:id',
    lazy: async () => {
      const { PessoaForm } = await import('./pages/PessoaForm');
      return { element: <ExigeTela tela="pessoa-form" escopo="contratante"><PessoaForm /></ExigeTela> };
    },
  },
];
