import { z } from 'zod';
import { api } from '../../../shared/api/cliente';
import { paginaSchema, type PaginaDto } from '../../../shared/api/pagina';
import type { AparenciaApiCompleta, FundoCatalogo } from '../../../shared/aparencia/mapear';

/*
 * Contratantes (ero-api, /api/tenants; só o superadmin na visão de plataforma — docs/04 "Telas sem grupo"):
 *   GET    /api/tenants?busca&ativo&page&size&sort   → PaginaDto<TenantResponseDto>
 *   GET    /api/tenants/{id}                         → TenantResponseDto
 *   POST   /api/tenants                              → 201 TenantResponseDto (com o administrador inicial)
 *   PUT    /api/tenants/{id}                         → dados cadastrais, com `version` (409 se outra pessoa salvou)
 *   PUT    /api/tenants/{id}/configuracao            → aparência e cena exclusiva, com `version`
 *   PATCH  /api/tenants/{id}/inativar | /ativar      → 204
 *   GET    /api/tenants/fundos?tenantId=             → fundos que o contratante pode usar
 */

/**
 * AparenciaDto. Aqui só se confere a forma; quem valida valor a valor (lista branca e limites) é o `deApi` de
 * shared/aparencia/mapear.ts, antes de qualquer coisa chegar ao CSS.
 */
const aparenciaSchema = z.object({
  corDestaque: z.string(),
  temaPadrao: z.string(),
  fundo: z.string(),
  fundoAnimado: z.boolean(),
  vidroDesfoque: z.number(),
  fundoFoco: z.number(),
  animacoes: z.string(),
  /** "Otimizar desempenho em computadores mais fracos"; ausente equivale a `false` (o `deApi` resolve). */
  desempenhoAutomatico: z.boolean().optional(),
});

/** TenantResponseDto (contrato em docs/03). Datas em ISO-8601 (UTC); a tela formata em pt-BR. */
export const tenantSchema = z.object({
  id: z.string(),
  nome: z.string(),
  documento: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  ativo: z.boolean(),
  limiteUsuarios: z.number().int().nullable().optional(),
  usuariosAtivos: z.number().int(),
  aparencia: aparenciaSchema.nullable().optional(),
  fundoExclusivo: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
  criadoPorNome: z.string().nullable().optional(),
  alteradoPorNome: z.string().nullable().optional(),
  version: z.number().int(),
});
export type TenantResponse = z.infer<typeof tenantSchema>;

/** FundoCatalogoDto */
const fundoCatalogoSchema = z.object({
  codigo: z.string(),
  rotulo: z.string(),
  tipo: z.enum(['VIVO', 'CENA']),
  exclusiva: z.boolean(),
});

export type FiltrosTenant = {
  busca?: string;
  ativo?: boolean;
  page: number;
  size: number;
  sort?: string;
};

/** TenantUpdateDto */
export type TenantUpdate = {
  nome: string;
  documento: string | null;
  email: string | null;
  limiteUsuarios: number | null;
  version: number;
};

/** TenantCreateDto (a aparência fica com o padrão do sistema: a criação não pede). */
export type TenantCreate = Omit<TenantUpdate, 'version'> & {
  administrador: { nome: string; email: string; senha: string };
};

/** TenantConfiguracaoUpdateDto */
export type TenantConfiguracao = {
  /** sempre com `desempenhoAutomatico`: ausente, a API grava `false` */
  aparencia: AparenciaApiCompleta;
  fundoExclusivo: string | null;
  version: number;
};

/** Monta a query string só com o que tem valor (vazio não vai: a API entende ausência como "todos"). */
export function consultaDe(f: FiltrosTenant): string {
  const p = new URLSearchParams();
  if (f.busca) p.set('busca', f.busca);
  if (f.ativo !== undefined) p.set('ativo', String(f.ativo));
  p.set('page', String(f.page));
  p.set('size', String(f.size));
  if (f.sort) p.set('sort', f.sort);
  return p.toString();
}

const caminho = (id: string) => `/api/tenants/${encodeURIComponent(id)}`;

export const tenantsApi = {
  listar: (f: FiltrosTenant): Promise<PaginaDto<TenantResponse>> =>
    api.requisitar(`/api/tenants?${consultaDe(f)}`, { schema: paginaSchema(tenantSchema) }),

  buscar: (id: string): Promise<TenantResponse> => api.requisitar(caminho(id), { schema: tenantSchema }),

  criar: (corpo: TenantCreate): Promise<TenantResponse> =>
    api.requisitar('/api/tenants', { metodo: 'POST', corpo, schema: tenantSchema }),

  alterar: (id: string, corpo: TenantUpdate): Promise<TenantResponse> =>
    api.requisitar(caminho(id), { metodo: 'PUT', corpo, schema: tenantSchema }),

  configurar: (id: string, corpo: TenantConfiguracao): Promise<TenantResponse> =>
    api.requisitar(`${caminho(id)}/configuracao`, { metodo: 'PUT', corpo, schema: tenantSchema }),

  inativar: (id: string): Promise<void> => api.requisitar<void>(`${caminho(id)}/inativar`, { metodo: 'PATCH' }),

  ativar: (id: string): Promise<void> => api.requisitar<void>(`${caminho(id)}/ativar`, { metodo: 'PATCH' }),

  fundos: (tenantId: string): Promise<FundoCatalogo[]> =>
    api.requisitar(`/api/tenants/fundos?tenantId=${encodeURIComponent(tenantId)}`, { schema: z.array(fundoCatalogoSchema) }),
};
