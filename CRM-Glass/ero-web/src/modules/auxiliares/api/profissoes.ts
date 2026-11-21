import { criarApiAuxiliar, tipoAuxiliarSchema, type TipoAuxiliarResponse } from '../../../shared/api/auxiliares';

/*
 * Profissões (ero-api, /api/profissoes; grupo CADASTROS_AUXILIARES): o cliente genérico dos auxiliares
 * (shared/api/auxiliares.ts) com o recurso e o nome do campo do código desta tela.
 * Cópia: troca só o recurso, o campo do código e os nomes abaixo.
 */

/** ProfissaoResponseDto (o código chega como `codigo`) */
export type ProfissaoResponse = TipoAuxiliarResponse; // troca: nome
export const profissaoSchema = tipoAuxiliarSchema('codProfissao'); // troca: nome e campo do código

export const profissoesApi = criarApiAuxiliar('profissoes', 'codProfissao'); // troca: nome, recurso, campo do código
