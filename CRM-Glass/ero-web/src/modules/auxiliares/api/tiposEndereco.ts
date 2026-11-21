import { criarApiAuxiliar, tipoAuxiliarSchema, type TipoAuxiliarResponse } from '../../../shared/api/auxiliares';

/*
 * Tipos de endereço (ero-api, /api/tipos-endereco; grupo CADASTROS_AUXILIARES): o cliente genérico dos auxiliares
 * (shared/api/auxiliares.ts) com o recurso e o nome do campo do código desta tela.
 * Cópia: troca só o recurso, o campo do código e os nomes abaixo.
 */

/** TipoEnderecoResponseDto (o código chega como `codigo`) */
export type TipoEnderecoResponse = TipoAuxiliarResponse; // troca: nome
export const tipoEnderecoSchema = tipoAuxiliarSchema('codTipoEndereco'); // troca: nome e campo do código

export const tiposEnderecoApi = criarApiAuxiliar('tipos-endereco', 'codTipoEndereco'); // troca: nome, recurso, campo do código
