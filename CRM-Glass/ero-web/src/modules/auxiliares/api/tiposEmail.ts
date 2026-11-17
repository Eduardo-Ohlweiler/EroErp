import { criarApiAuxiliar, tipoAuxiliarSchema, type TipoAuxiliarResponse } from '../../../shared/api/auxiliares';

/*
 * Tipos de e-mail (ero-api, /api/tipos-email; grupo CADASTROS_AUXILIARES): o cliente genérico dos auxiliares
 * (shared/api/auxiliares.ts) com o recurso e o nome do campo do código desta tela.
 * Cópia: troca só o recurso, o campo do código e os nomes abaixo.
 */

/** TipoEmailResponseDto (o código chega como `codigo`) */
export type TipoEmailResponse = TipoAuxiliarResponse; // troca: nome
export const tipoEmailSchema = tipoAuxiliarSchema('codTipoEmail'); // troca: nome e campo do código

export const tiposEmailApi = criarApiAuxiliar('tipos-email', 'codTipoEmail'); // troca: nome, recurso, campo do código
