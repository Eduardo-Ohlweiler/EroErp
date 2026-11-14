import { z } from 'zod';
import { api } from '../../../shared/api/cliente';
import { papelSchema, temaApiSchema } from '../../../shared/api/tipos';

/*
 * Minha conta (só os próprios dados — docs/04 "Telas sem grupo"):
 *   GET /api/auth/eu/perfil              → MeuPerfilResponseDto                   (ACESSO_LIBERADO)
 *   PUT /api/auth/eu/perfil              → { nome, telefone, version } (409 se a version mudou)
 *   PUT /api/auth/senha                  → { senhaAtual, novaSenha } → 204 (encerra as outras sessões)
 *   GET /api/sessoes                     → SessaoResponseDto[] (as minhas)
 *   PATCH /api/sessoes/{id}/encerrar     → 204
 *   PATCH /api/sessoes/encerrar-outras   → 204
 * O tema continua no `PUT /api/auth/eu/tema` da sessão (`trocarTemaPreferido`).
 */

/** MeuPerfilResponseDto. `tenantNome` é "Plataforma" para o superadmin, mesmo atuando num contratante. */
export const perfilSchema = z.object({
  id: z.string(),
  nome: z.string(),
  email: z.string(),
  telefone: z.string().nullable().optional(),
  papel: papelSchema,
  tenantNome: z.string().nullable().optional(),
  temaPreferido: temaApiSchema.nullable().optional(),
  version: z.number().int(),
});
export type MeuPerfil = z.infer<typeof perfilSchema>;

/** MeuPerfilUpdateDto (sem e-mail, papel nem id: o id vem da sessão). */
export type MeuPerfilUpdate = { nome: string; telefone: string | null; version: number };

/** SessaoResponseDto */
export const sessaoSchema = z.object({
  id: z.string(),
  ip: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  iniciadaEm: z.string(),
  ultimoUsoEm: z.string().nullable().optional(),
  expiraEm: z.string().nullable().optional(),
  atual: z.boolean(),
});
export type Sessao = z.infer<typeof sessaoSchema>;

export const contaApi = {
  perfil: (): Promise<MeuPerfil> => api.requisitar('/api/auth/eu/perfil', { schema: perfilSchema }),

  alterarPerfil: (corpo: MeuPerfilUpdate): Promise<MeuPerfil> =>
    api.requisitar('/api/auth/eu/perfil', { metodo: 'PUT', corpo, schema: perfilSchema }),

  trocarSenha: (corpo: { senhaAtual: string; novaSenha: string }): Promise<void> =>
    api.requisitar<void>('/api/auth/senha', { metodo: 'PUT', corpo }),

  sessoes: (): Promise<Sessao[]> => api.requisitar('/api/sessoes', { schema: z.array(sessaoSchema) }),

  encerrarSessao: (id: string): Promise<void> =>
    api.requisitar<void>(`/api/sessoes/${encodeURIComponent(id)}/encerrar`, { metodo: 'PATCH' }),

  encerrarOutras: (): Promise<void> => api.requisitar<void>('/api/sessoes/encerrar-outras', { metodo: 'PATCH' }),
};
