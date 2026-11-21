import { criarApiAuxiliar, tipoAuxiliarSchema, type TipoAuxiliarResponse } from '../../../shared/api/auxiliares';

/*
 * Estados civis (ero-api, /api/estados-civis; grupo CADASTROS_AUXILIARES): o cliente genérico dos auxiliares
 * (shared/api/auxiliares.ts) com o recurso e o nome do campo do código desta tela.
 * Cópia: troca só o recurso, o campo do código e os nomes abaixo.
 */

/** EstadoCivilResponseDto (o código chega como `codigo`) */
export type EstadoCivilResponse = TipoAuxiliarResponse; // troca: nome
export const estadoCivilSchema = tipoAuxiliarSchema('codEstadoCivil'); // troca: nome e campo do código

export const estadosCivisApi = criarApiAuxiliar('estados-civis', 'codEstadoCivil'); // troca: nome, recurso, campo do código
