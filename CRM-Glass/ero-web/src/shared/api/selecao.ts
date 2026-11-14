import { z } from 'zod';
import { api } from './cliente';

/*
 * Listas de seleção (`SelectDto` com `id` e `nome`) usadas por mais de um lugar: o seletor de contratante da casca e
 * os filtros dos Logs. Cada módulo continua com as suas rotas em `modules/<modulo>/api`.
 *   GET /api/tenants/selecao              → contratantes ativos (SUPERADMIN)
 *   GET /api/usuarios/selecao?inativos=   → usuários do contratante, por nome (ACESSO_LIBERADO; o superadmin nunca vem)
 */

export const selectSchema = z.object({ id: z.string(), nome: z.string() });
export type ItemSelecao = z.infer<typeof selectSchema>;

export const selecaoApi = {
  contratantes: (): Promise<ItemSelecao[]> => api.requisitar('/api/tenants/selecao', { schema: z.array(selectSchema) }),

  usuarios: (inativos = false): Promise<ItemSelecao[]> =>
    api.requisitar(`/api/usuarios/selecao?inativos=${inativos}`, { schema: z.array(selectSchema) }),
};
