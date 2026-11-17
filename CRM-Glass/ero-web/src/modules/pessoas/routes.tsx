import type { RouteObject } from 'react-router';
import { ExigeTela } from '../../shared/sessao';

/*
 * Rotas de Pessoas (dentro da casca), cada uma num pedaço próprio do build (lazy), todas com a guarda da tela
 * (ExigeTela, dentro de um contratante; docs/04-permissoes.md, grupo PESSOAS).
 *   /cadastros/pessoas            lista                       (ExigeTela pessoa-list)
 *   /cadastros/pessoas/novo · /:id  ficha                     (ExigeTela pessoa-form)
 *                                 provisória (PessoaEmConstrucao) até a E4b trazer o PessoaForm
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
      // troca (E4b): `const { PessoaForm } = await import('./pages/PessoaForm')`
      const { PessoaEmConstrucao } = await import('./pages/PessoaEmConstrucao');
      return { element: <ExigeTela tela="pessoa-form" escopo="contratante"><PessoaEmConstrucao /></ExigeTela> };
    },
  },
  {
    path: 'cadastros/pessoas/:id',
    lazy: async () => {
      const { PessoaEmConstrucao } = await import('./pages/PessoaEmConstrucao');
      return { element: <ExigeTela tela="pessoa-form" escopo="contratante"><PessoaEmConstrucao /></ExigeTela> };
    },
  },
];
