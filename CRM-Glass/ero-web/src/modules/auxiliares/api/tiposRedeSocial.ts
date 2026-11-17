import { criarApiAuxiliar, tipoAuxiliarSchema, type TipoAuxiliarResponse } from '../../../shared/api/auxiliares';

/*
 * Tipos de rede social (ero-api, /api/tipos-rede-social; grupo CADASTROS_AUXILIARES): o cliente genérico dos auxiliares
 * (shared/api/auxiliares.ts) com o recurso e o nome do campo do código desta tela.
 * Cópia: troca só o recurso, o campo do código e os nomes abaixo.
 */

/** TipoRedeSocialResponseDto (o código chega como `codigo`) */
export type TipoRedeSocialResponse = TipoAuxiliarResponse; // troca: nome
export const tipoRedeSocialSchema = tipoAuxiliarSchema('codTipoRedeSocial'); // troca: nome e campo do código

export const tiposRedeSocialApi = criarApiAuxiliar('tipos-rede-social', 'codTipoRedeSocial'); // troca: nome, recurso, campo do código
