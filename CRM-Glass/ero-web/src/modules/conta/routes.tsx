import type { RouteObject } from 'react-router';

/*
 * Minha conta (dentro da casca), sem guarda de tela: todo usuário logado mexe nos próprios dados, senha, tema e
 * sessões (docs/04 "Telas sem grupo"). Entra pelo MenuUsuario e pelo Ctrl+K.
 *   /minha-conta   abas Meus dados · Senha · Sessões
 */
export const rotasConta: RouteObject[] = [
  {
    path: 'minha-conta',
    lazy: async () => {
      const { MinhaContaPage } = await import('./pages/MinhaContaPage');
      return { Component: MinhaContaPage };
    },
  },
];
