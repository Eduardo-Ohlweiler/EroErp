import { z } from 'zod';
import { AUSENTE, mascararTelefone, soDigitos } from './format';

/*
 * Telefone opcional (usuário e Minha conta): com DDD, 10 ou 11 dígitos, gravado só com os dígitos. O `TEntry`
 * com `mascara="celular"` já grava cru; aqui ficam a validação de conforto (a regra é do `@Pattern` da API), a ida
 * para o corpo e a volta para a tela.
 */

export const MENSAGEM_TELEFONE = 'Telefone deve ter 10 ou 11 dígitos.';

/** Vazio ou 10–11 dígitos (o valor do formulário já vem sem máscara). */
export const telefoneOpcionalSchema = z
  .string()
  .refine((v) => v === '' || /^\d{10,11}$/.test(soDigitos(v)), MENSAGEM_TELEFONE);

/** Formulário → corpo: só dígitos; vazio vira `null` (não informado). */
export const telefoneParaApi = (valor: string): string | null => soDigitos(valor) || null;

/** Resposta → formulário. */
export const telefoneParaForm = (valor?: string | null): string => soDigitos(valor ?? '');

/** Para a grade e a folha: "(11) 98765-4321"; sem telefone, travessão. */
export const formatarTelefone = (valor?: string | null): string => (valor ? mascararTelefone(valor) : AUSENTE);
