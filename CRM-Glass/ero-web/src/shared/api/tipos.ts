import { z } from 'zod';

/*
 * Formatos da ero-api usados pela sessão (auth). Os módulos definem os seus em `modules/<modulo>/api`.
 * Datas chegam em ISO-8601 (UTC) e o front formata em pt-BR.
 */

export const papelSchema = z.enum(['SUPERADMIN', 'ADMIN', 'USUARIO']);
export type Papel = z.infer<typeof papelSchema>;

export const pendenciaSchema = z.enum(['NENHUMA', 'TROCAR_SENHA']);
export type Pendencia = z.infer<typeof pendenciaSchema>;

/**
 * Aparência do contratante (AparenciaDto). Fica solta aqui de propósito: quem valida campo a campo,
 * com lista branca e limites, é o `deApi` da aparência (shared/aparencia/mapear.ts).
 */
const aparenciaSchema = z.record(z.string(), z.unknown()).nullable().optional();

/** UsuarioLogadoDto (`GET /api/auth/eu`, e dentro da resposta do verificar e do refresh). */
export const usuarioLogadoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  email: z.string(),
  papel: papelSchema,
  tenantId: z.string().nullable().optional(),
  tenantNome: z.string().nullable().optional(),
  aparencia: aparenciaSchema,
  superadminAtuando: z.boolean().optional().default(false),
  pendencia: pendenciaSchema,
  permissoes: z.array(z.string()).optional().default([]),
  telas: z.array(z.string()).optional().default([]),
});
export type UsuarioLogado = z.infer<typeof usuarioLogadoSchema>;

const instante = z.string().nullable().optional();

/**
 * AutenticacaoRespostaDto. Login com senha certa: `requerDoisFatores` e os dados do código enviado.
 * Verificar e refresh: `tokenAcesso` (só em memória) e `usuario`. O refresh token vai no cookie httpOnly.
 */
export const autenticacaoRespostaSchema = z.object({
  requerDoisFatores: z.boolean(),
  desafioDoisFatores: z.string().nullable().optional(),
  emailMascarado: z.string().nullable().optional(),
  codigoExpiraEm: instante,
  reenvioDisponivelEm: instante,
  tokenAcesso: z.string().nullable().optional(),
  tokenExpiraEm: instante,
  usuario: usuarioLogadoSchema.nullable().optional(),
});
export type AutenticacaoResposta = z.infer<typeof autenticacaoRespostaSchema>;
