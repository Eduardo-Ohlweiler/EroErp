import type { RouteObject } from 'react-router';
import { ExigeTela } from '../../shared/sessao';
import { PrimeiroAuxiliar } from './components/PrimeiroAuxiliar';
import { RAIZ_DOS_AUXILIARES, TELAS_AUXILIARES } from './telas';

/*
 * Rotas dos cadastros auxiliares (dentro da casca), cada uma num pedaço próprio do build (lazy), todas com a guarda da
 * tela (ExigeTela, dentro de um contratante). Os caminhos e os códigos das telas vêm de `telas.ts`.
 *   /cadastros/auxiliares                              → abre o primeiro auxiliar liberado
 *   /cadastros/auxiliares/tipos-de-cadastro            FormList  (tipo-cadastro-formlist)  ← o modelo
 *   /cadastros/auxiliares/tipos-de-telefone | -email | -endereco | -rede-social
 *                                                      provisórias (EmConstrucao) até a E4a copiar o modelo
 */
const caminhoDe = (tela: string) => TELAS_AUXILIARES.find((t) => t.tela === tela)!.to.slice(1);

export const rotasAuxiliares: RouteObject[] = [
  { path: RAIZ_DOS_AUXILIARES.slice(1), element: <PrimeiroAuxiliar /> },
  {
    path: caminhoDe('tipo-cadastro-formlist'),
    lazy: async () => {
      const { TipoCadastroFormList } = await import('./pages/TipoCadastroFormList');
      return { element: <ExigeTela tela="tipo-cadastro-formlist" escopo="contratante"><TipoCadastroFormList /></ExigeTela> };
    },
  },
  ...TELAS_AUXILIARES.filter((t) => t.tela !== 'tipo-cadastro-formlist').map(
    (t): RouteObject => ({
      path: t.to.slice(1),
      lazy: async () => {
        // troca (E4a): cada cópia vira `const { TipoXFormList } = await import('./pages/TipoXFormList')`
        const { EmConstrucao } = await import('./pages/EmConstrucao');
        return { element: <ExigeTela tela={t.tela} escopo="contratante"><EmConstrucao titulo={t.label} /></ExigeTela> };
      },
    }),
  ),
];
