import type { RouteObject } from 'react-router';
import { ExigeTela } from '../../shared/sessao';
import { PrimeiroAuxiliar } from './components/PrimeiroAuxiliar';
import { RAIZ_DOS_AUXILIARES, TELAS_AUXILIARES } from './telas';

/*
 * Rotas dos cadastros auxiliares (dentro da casca), cada uma num pedaço próprio do build (lazy), todas com a guarda da
 * tela (ExigeTela, dentro de um contratante). Os caminhos e os códigos das telas vêm de `telas.ts`.
 *   /cadastros/auxiliares                              → abre o primeiro auxiliar liberado
 *   /cadastros/auxiliares/tipos-de-cadastro            FormList  (tipo-cadastro-formlist)  ← o modelo
 *   /cadastros/auxiliares/tipos-de-telefone | -email | -endereco | -rede-social   FormList (cópias do modelo)
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
  {
    path: caminhoDe('tipo-telefone-formlist'),
    lazy: async () => {
      const { TipoTelefoneFormList } = await import('./pages/TipoTelefoneFormList');
      return { element: <ExigeTela tela="tipo-telefone-formlist" escopo="contratante"><TipoTelefoneFormList /></ExigeTela> };
    },
  },
  {
    path: caminhoDe('tipo-email-formlist'),
    lazy: async () => {
      const { TipoEmailFormList } = await import('./pages/TipoEmailFormList');
      return { element: <ExigeTela tela="tipo-email-formlist" escopo="contratante"><TipoEmailFormList /></ExigeTela> };
    },
  },
  {
    path: caminhoDe('tipo-endereco-formlist'),
    lazy: async () => {
      const { TipoEnderecoFormList } = await import('./pages/TipoEnderecoFormList');
      return { element: <ExigeTela tela="tipo-endereco-formlist" escopo="contratante"><TipoEnderecoFormList /></ExigeTela> };
    },
  },
  {
    path: caminhoDe('tipo-rede-social-formlist'),
    lazy: async () => {
      const { TipoRedeSocialFormList } = await import('./pages/TipoRedeSocialFormList');
      return { element: <ExigeTela tela="tipo-rede-social-formlist" escopo="contratante"><TipoRedeSocialFormList /></ExigeTela> };
    },
  },
];
