import { z } from 'zod';
import { api } from '../../../shared/api/cliente';
import { paginaSchema, type PaginaDto } from '../../../shared/api/pagina';

/*
 * Logs (ero-api, /api/auditoria; grupo AUDITORIA — docs/04-permissoes.md):
 *   GET /api/auditoria/eventos?tipos&usuarioId&tenantId&de&ate&page&size → PaginaDto<EventoSegurancaResponseDto>
 *       mais recentes primeiro; `de` inclusivo e `ate` exclusivo, ISO-8601 UTC; `tenantId` só vale na plataforma.
 *   GET /api/auditoria/tipos → TipoEventoDto[] (rótulo, categoria e se é falha), na ordem do enum.
 */

/** EventoSegurancaResponseDto. `suporte`: feito pelo superadmin, visto de dentro do contratante (sem id, IP, navegador). */
export const eventoSchema = z.object({
  id: z.string(),
  tipo: z.string(),
  tenantId: z.string().nullable().optional(),
  tenantNome: z.string().nullable().optional(),
  usuarioId: z.string().nullable().optional(),
  usuarioNome: z.string().nullable().optional(),
  autorId: z.string().nullable().optional(),
  autorNome: z.string().nullable().optional(),
  suporte: z.boolean(),
  ip: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  detalhe: z.string().nullable().optional(),
  ocorridoEm: z.string(),
});
export type EventoResponse = z.infer<typeof eventoSchema>;

/** TipoEventoDto */
export const tipoEventoSchema = z.object({
  codigo: z.string(),
  rotulo: z.string(),
  categoria: z.string(),
  categoriaRotulo: z.string(),
  falha: z.boolean(),
});
export type TipoEvento = z.infer<typeof tipoEventoSchema>;

export type ConsultaEventos = {
  tipos?: string[];
  usuarioId?: string;
  tenantId?: string;
  de?: string;
  ate?: string;
  page: number;
  size: number;
};

/** Query string só com o que tem valor; os tipos vão separados por vírgula (a API aceita os dois jeitos). */
export function consultaDeEventos(c: ConsultaEventos): string {
  const p = new URLSearchParams();
  if (c.tipos?.length) p.set('tipos', c.tipos.join(','));
  if (c.usuarioId) p.set('usuarioId', c.usuarioId);
  if (c.tenantId) p.set('tenantId', c.tenantId);
  if (c.de) p.set('de', c.de);
  if (c.ate) p.set('ate', c.ate);
  p.set('page', String(c.page));
  p.set('size', String(c.size));
  return p.toString();
}

export const auditoriaApi = {
  listar: (c: ConsultaEventos): Promise<PaginaDto<EventoResponse>> =>
    api.requisitar(`/api/auditoria/eventos?${consultaDeEventos(c)}`, { schema: paginaSchema(eventoSchema) }),

  tipos: (): Promise<TipoEvento[]> => api.requisitar('/api/auditoria/tipos', { schema: z.array(tipoEventoSchema) }),
};
