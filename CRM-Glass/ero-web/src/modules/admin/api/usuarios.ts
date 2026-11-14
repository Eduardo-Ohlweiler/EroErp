import { z } from 'zod';
import { api } from '../../../shared/api/cliente';
import { paginaSchema, type PaginaDto } from '../../../shared/api/pagina';
import { papelSchema } from '../../../shared/api/tipos';

/*
 * Usuários do contratante (ero-api, /api/usuarios; grupo USUARIOS — docs/04-permissoes.md):
 *   GET    /api/usuarios?busca&ativo&papel&bloqueado&page&size&sort   → PaginaDto<UsuarioResponseDto>  (USUARIOS_LER)
 *   GET    /api/usuarios/{id}                                         → UsuarioResponseDto              (USUARIOS_LER)
 *   POST   /api/usuarios                                              → 201 UsuarioResponseDto          (USUARIOS_ESCREVER)
 *   PUT    /api/usuarios/{id}                                         → com `version` (409 se outra pessoa salvou)
 *   PATCH  /api/usuarios/{id}/inativar | /ativar                      → 204 (422 no último administrador ativo)
 *   PATCH  /api/usuarios/{id}/desbloquear | /redefinir-senha          → 204 (só ADMIN/SUPERADMIN, nunca em si mesmo)
 */

/** UsuarioResponseDto. Datas em ISO-8601 (UTC); telefone só com dígitos. */
export const usuarioSchema = z.object({
  id: z.string(),
  nome: z.string(),
  email: z.string(),
  telefone: z.string().nullable().optional(),
  papel: papelSchema,
  ativo: z.boolean(),
  exigirTrocaSenha: z.boolean(),
  ultimoLoginEm: z.string().nullable().optional(),
  bloqueadoAte: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
  criadoPorNome: z.string().nullable().optional(),
  alteradoPorNome: z.string().nullable().optional(),
  version: z.number().int(),
});
export type UsuarioResponse = z.infer<typeof usuarioSchema>;

/** Papel que se dá a um usuário do contratante (o SUPERADMIN só existe pelo seed). */
export type PapelDoContratante = 'ADMIN' | 'USUARIO';

export type FiltrosUsuarioApi = {
  busca?: string;
  ativo?: boolean;
  papel?: PapelDoContratante;
  bloqueado?: boolean;
  page: number;
  size: number;
  sort?: string;
};

/** UsuarioUpdateDto */
export type UsuarioUpdate = {
  nome: string;
  email: string;
  telefone: string | null;
  papel: PapelDoContratante;
  version: number;
};

/** UsuarioCreateDto (a senha é temporária: troca no primeiro acesso) */
export type UsuarioCreate = Omit<UsuarioUpdate, 'version'> & { senha: string };

/** Monta a query string só com o que tem valor (ausente = todos). */
export function consultaDeUsuarios(f: FiltrosUsuarioApi): string {
  const p = new URLSearchParams();
  if (f.busca) p.set('busca', f.busca);
  if (f.ativo !== undefined) p.set('ativo', String(f.ativo));
  if (f.papel) p.set('papel', f.papel);
  if (f.bloqueado !== undefined) p.set('bloqueado', String(f.bloqueado));
  p.set('page', String(f.page));
  p.set('size', String(f.size));
  if (f.sort) p.set('sort', f.sort);
  return p.toString();
}

const caminho = (id: string) => `/api/usuarios/${encodeURIComponent(id)}`;

export const usuariosApi = {
  listar: (f: FiltrosUsuarioApi): Promise<PaginaDto<UsuarioResponse>> =>
    api.requisitar(`/api/usuarios?${consultaDeUsuarios(f)}`, { schema: paginaSchema(usuarioSchema) }),

  buscar: (id: string): Promise<UsuarioResponse> => api.requisitar(caminho(id), { schema: usuarioSchema }),

  criar: (corpo: UsuarioCreate): Promise<UsuarioResponse> =>
    api.requisitar('/api/usuarios', { metodo: 'POST', corpo, schema: usuarioSchema }),

  alterar: (id: string, corpo: UsuarioUpdate): Promise<UsuarioResponse> =>
    api.requisitar(caminho(id), { metodo: 'PUT', corpo, schema: usuarioSchema }),

  inativar: (id: string): Promise<void> => api.requisitar<void>(`${caminho(id)}/inativar`, { metodo: 'PATCH' }),

  ativar: (id: string): Promise<void> => api.requisitar<void>(`${caminho(id)}/ativar`, { metodo: 'PATCH' }),

  desbloquear: (id: string): Promise<void> => api.requisitar<void>(`${caminho(id)}/desbloquear`, { metodo: 'PATCH' }),

  redefinirSenha: (id: string, novaSenha: string): Promise<void> =>
    api.requisitar<void>(`${caminho(id)}/redefinir-senha`, { metodo: 'PATCH', corpo: { novaSenha } }),
};
