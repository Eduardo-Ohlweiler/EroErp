import { z } from 'zod';
import { api } from '../../../shared/api/cliente';
import { papelSchema } from '../../../shared/api/tipos';

/*
 * Liberações de acesso (ero-api, /api/permissoes — docs/04-permissoes.md):
 *   GET /api/permissoes/catalogo         → CatalogoGrupoDto[]      (ACESSO_LIBERADO)
 *   GET /api/permissoes/usuarios/{id}    → LiberacoesResponseDto   (USUARIOS_LER)
 *   PUT /api/permissoes/usuarios/{id}    → substitui tudo, com a `version` do usuário (USUARIOS_LIBERAR_ACESSO)
 * A `version` é a do usuário: o PUT do cadastro e o das liberações andam em cadeia.
 */

const itemSchema = z.object({ codigo: z.string(), rotulo: z.string() });

/** CatalogoGrupoDto: um grupo de liberação com as telas e as ações extras dele. */
export const grupoCatalogoSchema = z.object({
  codigo: z.string(),
  rotulo: z.string(),
  telas: z.array(itemSchema),
  acoes: z.array(itemSchema),
});
export type GrupoCatalogo = z.infer<typeof grupoCatalogoSchema>;

export const nivelSchema = z.enum(['LER', 'ESCREVER']);
export type NivelAcesso = z.infer<typeof nivelSchema>;

/** LiberacoesResponseDto (ADMIN/SUPERADMIN vêm sem lista: já têm tudo). */
export const liberacoesSchema = z.object({
  usuarioId: z.string(),
  papel: papelSchema,
  liberacoes: z.array(z.object({ grupo: z.string(), nivel: nivelSchema })),
  acoes: z.array(z.string()),
  version: z.number().int(),
});
export type LiberacoesResponse = z.infer<typeof liberacoesSchema>;

/** LiberacoesUpdateDto */
export type LiberacoesUpdate = {
  liberacoes: { grupo: string; nivel: NivelAcesso }[];
  acoes: string[];
  version: number;
};

const caminho = (id: string) => `/api/permissoes/usuarios/${encodeURIComponent(id)}`;

export const permissoesApi = {
  catalogo: (): Promise<GrupoCatalogo[]> => api.requisitar('/api/permissoes/catalogo', { schema: z.array(grupoCatalogoSchema) }),

  doUsuario: (id: string): Promise<LiberacoesResponse> => api.requisitar(caminho(id), { schema: liberacoesSchema }),

  substituir: (id: string, corpo: LiberacoesUpdate): Promise<LiberacoesResponse> =>
    api.requisitar(caminho(id), { metodo: 'PUT', corpo, schema: liberacoesSchema }),
};
