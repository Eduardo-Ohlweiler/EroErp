import type { RouteObject } from 'react-router';
import { ExigeTela } from '../../shared/sessao';

/*
 * Rotas de Serviços (dentro da casca), cada uma num pedaço próprio do build (lazy), todas com a guarda da tela
 * (ExigeTela, dentro de um contratante; docs/04-permissoes.md, grupo SERVICOS).
 *   /cadastros/servicos            lista                       (ExigeTela servico-list)
 *   /cadastros/servicos/novo · /:id  ficha                     (ExigeTela servico-form)
 */
export const rotasServicos: RouteObject[] = [
  {
    path: 'cadastros/servicos',
    lazy: async () => {
      const { ServicoList } = await import('./pages/ServicoList');
      return { element: <ExigeTela tela="servico-list" escopo="contratante"><ServicoList /></ExigeTela> };
    },
  },
  {
    path: 'cadastros/servicos/novo',
    lazy: async () => {
      const { ServicoForm } = await import('./pages/ServicoForm');
      return { element: <ExigeTela tela="servico-form" escopo="contratante"><ServicoForm /></ExigeTela> };
    },
  },
  {
    path: 'cadastros/servicos/:id',
    lazy: async () => {
      const { ServicoForm } = await import('./pages/ServicoForm');
      return { element: <ExigeTela tela="servico-form" escopo="contratante"><ServicoForm /></ExigeTela> };
    },
  },
];
