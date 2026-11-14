import { z } from 'zod';
import { paraNumero, textoDaMascara } from '../../../shared/util/format';
import type { TenantCreate, TenantResponse, TenantUpdate } from '../api/tenants';

/*
 * Formulário do contratante: espelha o TenantCreateDto / TenantUpdateDto da ero-api, com os mesmos caminhos de
 * campo (`administrador.email`), para o 400 da API cair no campo certo. Validação aqui é conforto: a regra mora
 * na API (documento válido e único, e-mail livre, política de senha).
 *
 * As máscaras gravam texto: documento cru (dígitos, ou o CNPJ alfanumérico em maiúsculas) e o limite como
 * "1.000"; o `paraCorpo` converte com `paraNumero`.
 */

const SENHA_MINIMO = 12;
const SENHA_MAXIMO = 128;

const limiteUsuarios = z.string().refine((v) => {
  const n = paraNumero(v);
  return n !== undefined && Number.isInteger(n) && n >= 1 && n <= 10000;
}, 'Informe de 1 a 10.000.');

const emailOpcional = z.union([
  z.literal(''),
  z.email('E-mail inválido.').max(255, 'No máximo 255 caracteres.'),
]);

const nome = z.string().trim().min(1, 'Informe o nome.').max(150, 'No máximo 150 caracteres.');

/** Edição: só os dados cadastrais (o administrador nasce na criação e depois é usuário do contratante). */
export const schemaEdicao = z.object({
  nome,
  documento: z.string().max(18, 'Documento inválido.'),
  email: emailOpcional,
  limiteUsuarios,
  administrador: z.object({ nome: z.string(), email: z.string(), senha: z.string() }).optional(),
});

/** Criação: os mesmos dados mais o administrador inicial (senha temporária, troca no primeiro acesso). */
export const schemaCriacao = schemaEdicao.extend({
  administrador: z.object({
    nome: z.string().trim().min(1, 'Informe o nome do administrador.').max(150, 'No máximo 150 caracteres.'),
    email: z
      .string()
      .trim()
      .min(1, 'Informe o e-mail do administrador.')
      .pipe(z.email('E-mail inválido.').max(255, 'No máximo 255 caracteres.')),
    senha: z
      .string()
      .min(SENHA_MINIMO, `Use ${SENHA_MINIMO} ou mais caracteres.`)
      .max(SENHA_MAXIMO, `No máximo ${SENHA_MAXIMO} caracteres.`),
  }),
});

export type DadosContratante = z.infer<typeof schemaEdicao>;

export const VAZIO: DadosContratante = {
  nome: '',
  documento: '',
  email: '',
  limiteUsuarios: '',
  administrador: { nome: '', email: '', senha: '' },
};

/** Resposta da API → valores do formulário. */
export const paraForm = (t: TenantResponse): DadosContratante => ({
  nome: t.nome,
  documento: t.documento ?? '',
  email: t.email ?? '',
  limiteUsuarios: textoDaMascara(t.limiteUsuarios ?? null, 0),
  administrador: undefined,
});

/** Formulário → corpo da alteração (sem a `version`, que vem do registro lido). */
export const paraCorpo = (d: DadosContratante): Omit<TenantUpdate, 'version'> => ({
  nome: d.nome.trim(),
  documento: d.documento.trim() || null,
  email: d.email.trim() || null,
  limiteUsuarios: paraNumero(d.limiteUsuarios) ?? null,
});

/** Formulário → corpo da criação (dados + administrador inicial). */
export const paraCorpoCriacao = (d: DadosContratante): TenantCreate => ({
  ...paraCorpo(d),
  administrador: {
    nome: (d.administrador?.nome ?? '').trim(),
    email: (d.administrador?.email ?? '').trim(),
    senha: d.administrador?.senha ?? '',
  },
});

/* ---------------- Filtros da lista ---------------- */

export type FiltrosContratante = { busca: string; ativo: string };

/** A situação começa em Ativos (decisão do dono). */
export const FILTROS_VAZIOS: FiltrosContratante = { busca: '', ativo: 'true' };

/** Filtros do formulário → parâmetros da API (`ativo` vazio = todas). */
export const paraConsulta = (f: FiltrosContratante): { busca?: string; ativo?: boolean } => ({
  busca: f.busca.trim() || undefined,
  ativo: f.ativo === '' ? undefined : f.ativo === 'true',
});

/** "2 de 5"; sem limite, só os ativos. */
export const usuariosDe = (t: Pick<TenantResponse, 'usuariosAtivos' | 'limiteUsuarios'>): string =>
  t.limiteUsuarios ? `${t.usuariosAtivos} de ${t.limiteUsuarios}` : `${t.usuariosAtivos}`;
