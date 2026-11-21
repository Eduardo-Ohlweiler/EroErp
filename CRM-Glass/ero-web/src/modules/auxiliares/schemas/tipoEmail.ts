import { z } from 'zod';
import type { TipoAuxiliarCreate } from '../../../shared/api/auxiliares';
import type { TipoEmailResponse } from '../api/tiposEmail';

/*
 * Formulário do tipo de e-mail: espelha o TipoEmailCreateDto / UpdateDto (nome de 1 a 25 caracteres, o mesmo
 * nome do campo, para o 409 de nome repetido cair nele). Validação aqui é conforto: a regra (nome único no
 * contratante, sem diferenciar maiúsculas nem acento; item do sistema imutável) é da API.
 * Cópia: troca só os nomes dos tipos importados (`TipoEmailResponse`).
 */

/** Tamanho máximo do nome (o rótulo "Nome (inativo)" ainda cabe no combo das telas de Pessoas). */
export const NOME_MAXIMO = 25;

export const schema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.').max(NOME_MAXIMO, `No máximo ${NOME_MAXIMO} caracteres.`),
});

export type Dados = z.infer<typeof schema>;

export const VAZIO: Dados = { nome: '' };

/** Registro da grade → valores do formulário. */
export const paraForm = (t: Pick<TipoEmailResponse, 'nome'>): Dados => ({ nome: t.nome }); // troca: tipo

/** Formulário → corpo da API (sem a `version`, que vem do registro da grade, nem o código, que nasce na API). */
export const paraCorpo = (d: Dados): TipoAuxiliarCreate => ({ nome: d.nome.trim() });
