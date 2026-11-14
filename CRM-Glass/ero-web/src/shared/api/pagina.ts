import { z, type ZodType } from 'zod';

/**
 * Lista paginada da ero-api (`PaginaDto`, docs/01): página começando em 0. Parâmetros da rota: `page`, `size`
 * (no máximo 100, `PaginacaoUtils.TAMANHO_MAXIMO`) e `sort=campo,asc`, mais os filtros.
 */
export type PaginaDto<T> = {
  conteudo: T[];
  pagina: number;
  tamanho: number;
  totalElementos: number;
  totalPaginas: number;
};

/** Maior página que a API devolve (pedir mais devolve 100, calado). */
export const TAMANHO_MAXIMO_PAGINA = 100;

/** Schema zod do `PaginaDto<T>`, a partir do schema do item: `api.requisitar(url, { schema: paginaSchema(tenantSchema) })`. */
export function paginaSchema<T>(item: ZodType<T>): ZodType<PaginaDto<T>> {
  return z.object({
    conteudo: z.array(item),
    pagina: z.number().int().nonnegative(),
    tamanho: z.number().int().nonnegative(),
    totalElementos: z.number().int().nonnegative(),
    totalPaginas: z.number().int().nonnegative(),
  }) as unknown as ZodType<PaginaDto<T>>;
}
