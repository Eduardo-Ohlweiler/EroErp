import { criarApiAuxiliar, tipoAuxiliarSchema, type TipoAuxiliarResponse } from '../../../shared/api/auxiliares';

/*
 * Categorias de serviço (ero-api, /api/categorias-servico; grupo CADASTROS_AUXILIARES): o cliente genérico dos auxiliares
 * (shared/api/auxiliares.ts) com o recurso e o nome do campo do código desta tela.
 * Cópia: troca só o recurso, o campo do código e os nomes abaixo.
 */

/** CategoriaServicoResponseDto (o código chega como `codigo`) */
export type CategoriaServicoResponse = TipoAuxiliarResponse; // troca: nome
export const categoriaServicoSchema = tipoAuxiliarSchema('codCategoriaServico'); // troca: nome e campo do código

export const categoriasServicoApi = criarApiAuxiliar('categorias-servico', 'codCategoriaServico'); // troca: nome, recurso, campo do código
