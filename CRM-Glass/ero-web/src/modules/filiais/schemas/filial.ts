import { z } from 'zod';
import { FORMATO_DA_COR } from '../../../design-system/kit';
import type { Filial, FilialCreate } from '../api/filiais';

/*
 * Formulário de Filial: o schema espelha o FilialCreateDto/UpdateDto. Validação aqui é conforto (campo vazio, formato da
 * cor, matriz da filial): as regras de verdade (pessoa livre e ativa, matriz ativa, matriz que é filial) são da API e
 * voltam em 400/409 com `erros[]`, que o `msg.erroApi(e, form)` põe no campo.
 */

export const schema = z
  .object({
    pessoaId: z.string().min(1, 'Escolha a pessoa'),
    tipo: z.enum(['MATRIZ', 'FILIAL']),
    matrizId: z.string(),
    cor: z.string().regex(FORMATO_DA_COR, 'Escolha a cor'),
  })
  .superRefine((d, ctx) => {
    if (d.tipo === 'FILIAL' && d.matrizId.trim() === '') {
      ctx.addIssue({ code: 'custom', path: ['matrizId'], message: 'Informe a matriz' });
    }
  });

export type Dados = z.infer<typeof schema>;

/** Filial nova: abre como Matriz (a primeira de um contratante é sempre matriz) e sem cor (a escolha é consciente). */
export const VAZIO: Dados = { pessoaId: '', tipo: 'MATRIZ', matrizId: '', cor: '' };

/** Filial gravada → formulário (a matriz volta como texto vazio na matriz). */
export function paraForm(f: Filial): Dados {
  return { pessoaId: f.pessoa.id, tipo: f.tipo, matrizId: f.matriz?.id ?? '', cor: f.cor };
}

/** Formulário → corpo da API: matriz só na Filial, cor em maiúsculas (a API grava assim). */
export function paraCorpo(d: Dados): FilialCreate {
  return {
    pessoaId: d.pessoaId,
    tipo: d.tipo,
    matrizId: d.tipo === 'FILIAL' && d.matrizId.trim() !== '' ? d.matrizId : null,
    cor: d.cor.trim().toUpperCase(),
  };
}
