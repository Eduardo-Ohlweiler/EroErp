import { criarApiAuxiliar, tipoAuxiliarSchema, type TipoAuxiliarResponse } from '../../../shared/api/auxiliares';

/*
 * Tipos de telefone (ero-api, /api/tipos-telefone; grupo CADASTROS_AUXILIARES): o cliente genérico dos auxiliares
 * (shared/api/auxiliares.ts) com o recurso e o nome do campo do código desta tela.
 * Cópia: troca só o recurso, o campo do código e os nomes abaixo.
 */

/** TipoTelefoneResponseDto (o código chega como `codigo`) */
export type TipoTelefoneResponse = TipoAuxiliarResponse; // troca: nome
export const tipoTelefoneSchema = tipoAuxiliarSchema('codTipoTelefone'); // troca: nome e campo do código

export const tiposTelefoneApi = criarApiAuxiliar('tipos-telefone', 'codTipoTelefone'); // troca: nome, recurso, campo do código
