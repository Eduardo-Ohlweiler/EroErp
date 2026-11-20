import { z } from 'zod';
import { api } from '../../../shared/api/cliente';
import { paginaSchema, type PaginaDto } from '../../../shared/api/pagina';
import { tipoSelectSchema } from '../../../shared/api/auxiliares';

/*
 * Pessoas (ero-api, módulo `pessoa`, /api/pessoas; grupo PESSOAS — docs/04-permissoes.md; PLANO-PESSOAS §3.5):
 *   GET   /api/pessoas?codPessoa&busca&documento&tipoPessoa&tipoCadastroId&ativo&page&size&sort → PaginaDto<PessoaListaDto> (PESSOAS_LER)
 *   GET   /api/pessoas/selecao?busca&ignorarId    → PessoaSelectDto[]  (até 20 ativas; PESSOAS_LER)
 *   GET   /api/pessoas/{id}                       → PessoaResponseDto  (PESSOAS_LER)
 *   POST  /api/pessoas                            → 201 PessoaResponseDto (PESSOAS_ESCREVER)
 *   PUT   /api/pessoas/{id}                       → com `version` (409 = alterada por outra pessoa; também por vínculo)
 *   PATCH /api/pessoas/{id}/inativar | /ativar    → 204
 * Datas em ISO-8601 (a de nascimento é só data, `yyyy-MM-dd`). CPF, CNPJ e telefone chegam só com dígitos.
 */

export type TipoPessoa = 'FISICA' | 'JURIDICA';
export type Sexo = 'MASCULINO' | 'FEMININO';
/** "B é <tipo> de A": o inverso (RESPONSAVEL ↔ DEPENDENTE, CONTATO ↔ EMPRESA) a API já resolve na visão da pessoa aberta. */
export type TipoVinculo = 'RESPONSAVEL' | 'DEPENDENTE' | 'CONJUGE' | 'FAMILIAR' | 'CONTATO' | 'EMPRESA';

const tipoPessoaSchema = z.enum(['FISICA', 'JURIDICA']);
const sexoSchema = z.enum(['MASCULINO', 'FEMININO']);
const tipoVinculoSchema = z.enum(['RESPONSAVEL', 'DEPENDENTE', 'CONJUGE', 'FAMILIAR', 'CONTATO', 'EMPRESA']);
const cidadeSchema = z.object({ id: z.string(), nome: z.string(), uf: z.string() });

/** PessoaListaDto: a lista e a exportação (sem nascimento, RG nem auditoria). */
export const pessoaListaSchema = z.object({
  id: z.string(),
  codPessoa: z.number().int(),
  tipoPessoa: tipoPessoaSchema,
  nome: z.string(),
  nomeFantasia: z.string().nullable().optional(),
  documento: z.string().nullable().optional(),
  tiposCadastro: z.array(tipoSelectSchema),
  telefonePrincipal: z.string().nullable().optional(),
  emailPrincipal: z.string().nullable().optional(),
  cidadePrincipal: z.string().nullable().optional(),
  ufPrincipal: z.string().nullable().optional(),
  ativo: z.boolean(),
});
export type PessoaLista = z.infer<typeof pessoaListaSchema>;

/** PessoaSelectDto: o combo de pessoas (vínculos). */
export const pessoaSelectSchema = z.object({ id: z.string(), codPessoa: z.number().int(), nome: z.string() });
export type PessoaSelect = z.infer<typeof pessoaSelectSchema>;

/** "9 · Solar Energia Ltda.": como a pessoa aparece no combo de vínculos e no rótulo do que já está escolhido. */
export const rotuloDaPessoa = (p: Pick<PessoaSelect, 'codPessoa' | 'nome'>): string => `${p.codPessoa} · ${p.nome}`;

/** PessoaResponseDto: a ficha. As filhas voltam ordenadas; o tipo de cada uma vem como `<X>SelectDto`. */
export const pessoaSchema = z.object({
  id: z.string(),
  codPessoa: z.number().int(),
  tipoPessoa: tipoPessoaSchema,
  nome: z.string(),
  nomeFantasia: z.string().nullable().optional(),
  cpf: z.string().nullable().optional(),
  rg: z.string().nullable().optional(),
  dataNascimento: z.string().nullable().optional(),
  sexo: sexoSchema.nullable().optional(),
  cnpj: z.string().nullable().optional(),
  inscricaoEstadual: z.string().nullable().optional(),
  inscricaoMunicipal: z.string().nullable().optional(),
  observacao: z.string().nullable().optional(),
  ativo: z.boolean(),
  tiposCadastro: z.array(tipoSelectSchema),
  telefones: z.array(
    z.object({ tipo: tipoSelectSchema, numero: z.string(), observacao: z.string().nullable().optional(), principal: z.boolean() }),
  ),
  emails: z.array(
    z.object({ tipo: tipoSelectSchema, email: z.string(), observacao: z.string().nullable().optional(), principal: z.boolean() }),
  ),
  redesSociais: z.array(
    z.object({ tipo: tipoSelectSchema, usuario: z.string().nullable().optional(), url: z.string().nullable().optional() }),
  ),
  enderecos: z.array(
    z.object({
      tipo: tipoSelectSchema,
      cep: z.string().nullable().optional(),
      cidade: cidadeSchema,
      rua: z.string().nullable().optional(),
      numero: z.string().nullable().optional(),
      bairro: z.string().nullable().optional(),
      complemento: z.string().nullable().optional(),
      principal: z.boolean(),
    }),
  ),
  vinculos: z.array(
    z.object({
      pessoa: pessoaSelectSchema,
      pessoaAtiva: z.boolean(),
      tipo: tipoVinculoSchema,
      observacao: z.string().nullable().optional(),
    }),
  ),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
  criadoPorNome: z.string().nullable().optional(),
  alteradoPorNome: z.string().nullable().optional(),
  version: z.number().int(),
});
export type PessoaResponse = z.infer<typeof pessoaSchema>;

/** Itens de entrada das listas filhas (sem `id`: a lista enviada é o estado completo e substitui a anterior). */
export type PessoaTelefoneItem = { tipoId: string; numero: string; observacao: string | null; principal: boolean };
export type PessoaEmailItem = { tipoId: string; email: string; observacao: string | null; principal: boolean };
export type PessoaRedeSocialItem = { tipoId: string; usuario: string | null; url: string | null };
export type PessoaEnderecoItem = {
  tipoId: string;
  cep: string | null;
  cidadeId: string;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  complemento: string | null;
  principal: boolean;
};
/** `tipo` = o que a OUTRA pessoa é desta. */
export type PessoaVinculoItem = { pessoaId: string; tipo: TipoVinculo; observacao: string | null };

/** PessoaCreateDto (código e auditoria nascem na API). */
export type PessoaCreate = {
  tipoPessoa: TipoPessoa;
  nome: string;
  cpf: string | null;
  rg: string | null;
  dataNascimento: string | null;
  sexo: Sexo | null;
  cnpj: string | null;
  nomeFantasia: string | null;
  inscricaoEstadual: string | null;
  inscricaoMunicipal: string | null;
  observacao: string | null;
  tiposCadastroIds: string[];
  telefones: PessoaTelefoneItem[];
  emails: PessoaEmailItem[];
  redesSociais: PessoaRedeSocialItem[];
  enderecos: PessoaEnderecoItem[];
  vinculos: PessoaVinculoItem[];
};

/** PessoaUpdateDto */
export type PessoaUpdate = PessoaCreate & { version: number };

export type FiltrosPessoaApi = {
  codPessoa?: number;
  busca?: string;
  documento?: string;
  tipoPessoa?: TipoPessoa;
  tipoCadastroId?: string;
  ativo?: boolean;
  page: number;
  size: number;
  sort?: string;
};

/** Monta a query string só com o que tem valor (ausente = todas). */
export function consultaDePessoas(f: FiltrosPessoaApi): string {
  const p = new URLSearchParams();
  if (f.codPessoa !== undefined) p.set('codPessoa', String(f.codPessoa));
  if (f.busca) p.set('busca', f.busca);
  if (f.documento) p.set('documento', f.documento);
  if (f.tipoPessoa) p.set('tipoPessoa', f.tipoPessoa);
  if (f.tipoCadastroId) p.set('tipoCadastroId', f.tipoCadastroId);
  if (f.ativo !== undefined) p.set('ativo', String(f.ativo));
  p.set('page', String(f.page));
  p.set('size', String(f.size));
  if (f.sort) p.set('sort', f.sort);
  return p.toString();
}

const caminho = (id: string) => `/api/pessoas/${encodeURIComponent(id)}`;

export const pessoasApi = {
  listar: (f: FiltrosPessoaApi): Promise<PaginaDto<PessoaLista>> =>
    api.requisitar(`/api/pessoas?${consultaDePessoas(f)}`, { schema: paginaSchema(pessoaListaSchema) }),

  buscar: (id: string): Promise<PessoaResponse> => api.requisitar(caminho(id), { schema: pessoaSchema }),

  criar: (corpo: PessoaCreate): Promise<PessoaResponse> =>
    api.requisitar('/api/pessoas', { metodo: 'POST', corpo, schema: pessoaSchema }),

  alterar: (id: string, corpo: PessoaUpdate): Promise<PessoaResponse> =>
    api.requisitar(caminho(id), { metodo: 'PUT', corpo, schema: pessoaSchema }),

  inativar: (id: string): Promise<void> => api.requisitar<void>(`${caminho(id)}/inativar`, { metodo: 'PATCH' }),

  ativar: (id: string): Promise<void> => api.requisitar<void>(`${caminho(id)}/ativar`, { metodo: 'PATCH' }),

  /** Até 20 ativas por nome (o `TDBCombo` de vínculos); `ignorarId` tira a própria pessoa da lista. */
  selecionar: (busca?: string, ignorarId?: string): Promise<PessoaSelect[]> => {
    const p = new URLSearchParams();
    const termo = busca?.trim();
    if (termo) p.set('busca', termo);
    if (ignorarId) p.set('ignorarId', ignorarId);
    const consulta = p.toString();
    return api.requisitar(`/api/pessoas/selecao${consulta ? `?${consulta}` : ''}`, { schema: z.array(pessoaSelectSchema) });
  },
};
