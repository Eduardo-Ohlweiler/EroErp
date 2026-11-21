import { criarApiAuxiliar, tipoAuxiliarSchema, type TipoAuxiliarResponse } from '../../../shared/api/auxiliares';

/*
 * Tipos de cadastro (ero-api, /api/tipos-cadastro; grupo CADASTROS_AUXILIARES): o cliente genérico dos auxiliares
 * (shared/api/auxiliares.ts) com o recurso e o nome do campo do código desta tela.
 * Cópia: troca só o recurso, o campo do código e os nomes abaixo.
 */

/** TipoCadastroResponseDto (o código chega como `codigo`) */
export type TipoCadastroResponse = TipoAuxiliarResponse; // troca: nome
export const tipoCadastroSchema = tipoAuxiliarSchema('codTipoCadastro'); // troca: nome e campo do código

export const tiposCadastroApi = criarApiAuxiliar('tipos-cadastro', 'codTipoCadastro'); // troca: nome, recurso, campo do código
