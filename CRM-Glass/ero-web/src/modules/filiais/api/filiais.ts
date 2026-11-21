import { z } from 'zod';
import { api } from '../../../shared/api/cliente';
import { paginaSchema, type PaginaDto } from '../../../shared/api/pagina';

/*
 * Filiais (ero-api, módulo `filial`, /api/filiais; grupo FILIAIS — docs/04-permissoes.md; PLANO-FILIAIS §3.5):
 *   GET   /api/filiais?codFilial&busca&documento&tipo&ativo&page&size → PaginaDto<FilialResponseDto> (FILIAIS_LER)
 *         Sem `sort`: a ordem é fixa (cada matriz seguida das suas filiais) e a API recusa qualquer `sort` com 422.
 *   GET   /api/filiais/selecao?busca&tipo&ignorarId → FilialSelectDto[] (até 20 ativas por nome; ACESSO_LIBERADO, sem documento)
 *   GET   /api/filiais/{id}                         → FilialResponseDto (FILIAIS_LER)
 *   POST  /api/filiais                              → 201 FilialResponseDto (FILIAIS_ESCREVER)
 *   PUT   /api/filiais/{id}                         → com `version` (409 = alterada por outra pessoa)
 *   PATCH /api/filiais/{id}/inativar | /ativar      → 204
 * A filial aponta para uma Pessoa; `documento` chega só com dígitos/letras (a tela formata). A cor é `#RRGGBB`.
 */

export type TipoFilial = 'MATRIZ' | 'FILIAL';

const tipoFilialSchema = z.enum(['MATRIZ', 'FILIAL']);

export const TIPO_FILIAL_OPCOES: { valor: TipoFilial; rotulo: string }[] = [
  { valor: 'MATRIZ', rotulo: 'Matriz' },
  { valor: 'FILIAL', rotulo: 'Filial' },
];

/** FilialSelectDto: o combo de filiais e a matriz dentro da filial (nome = nome da pessoa; sem documento). */
export const filialSelectSchema = z.object({
  id: z.string(),
  codFilial: z.number().int(),
  nome: z.string(),
  tipo: tipoFilialSchema,
  cor: z.string(),
});
export type FilialSelect = z.infer<typeof filialSelectSchema>;

/** FilialPessoaDto: a pessoa da filial, só o que a lista precisa. */
export const filialPessoaSchema = z.object({
  id: z.string(),
  codPessoa: z.number().int(),
  tipoPessoa: z.enum(['FISICA', 'JURIDICA']),
  nome: z.string(),
  nomeFantasia: z.string().nullable().optional(),
  documento: z.string().nullable().optional(),
  ativo: z.boolean(),
});
export type FilialPessoa = z.infer<typeof filialPessoaSchema>;

/** FilialResponseDto: serve à lista, à exportação e ao formulário. */
export const filialSchema = z.object({
  id: z.string(),
  codFilial: z.number().int(),
  tipo: tipoFilialSchema,
  pessoa: filialPessoaSchema,
  matriz: filialSelectSchema.nullable().optional(),
  cor: z.string(),
  ativo: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
  criadoPorNome: z.string().nullable().optional(),
  alteradoPorNome: z.string().nullable().optional(),
  version: z.number().int(),
});
export type Filial = z.infer<typeof filialSchema>;

/** "3 · Solar Energia Ltda.": como a filial aparece nos combos, na coluna Matriz e no rótulo do que já está escolhido. */
export const rotuloDaFilial = (f: Pick<FilialSelect, 'codFilial' | 'nome'>): string => `${f.codFilial} · ${f.nome}`;

/** FilialCreateDto (código e auditoria nascem na API; `matrizId` nulo na matriz). */
export type FilialCreate = {
  pessoaId: string;
  tipo: TipoFilial;
  matrizId: string | null;
  cor: string;
};

/** FilialUpdateDto */
export type FilialUpdate = FilialCreate & { version: number };

export type FiltrosFilialApi = {
  codFilial?: number;
  busca?: string;
  documento?: string;
  tipo?: TipoFilial;
  ativo?: boolean;
  page: number;
  size: number;
};

/** Monta a query string só com o que tem valor (ausente = todas). Nunca leva `sort`: a API recusa. */
export function consultaDeFiliais(f: FiltrosFilialApi): string {
  const p = new URLSearchParams();
  if (f.codFilial !== undefined) p.set('codFilial', String(f.codFilial));
  if (f.busca) p.set('busca', f.busca);
  if (f.documento) p.set('documento', f.documento);
  if (f.tipo) p.set('tipo', f.tipo);
  if (f.ativo !== undefined) p.set('ativo', String(f.ativo));
  p.set('page', String(f.page));
  p.set('size', String(f.size));
  return p.toString();
}

const caminho = (id: string) => `/api/filiais/${encodeURIComponent(id)}`;

export const filiaisApi = {
  listar: (f: FiltrosFilialApi): Promise<PaginaDto<Filial>> =>
    api.requisitar(`/api/filiais?${consultaDeFiliais(f)}`, { schema: paginaSchema(filialSchema) }),

  buscar: (id: string): Promise<Filial> => api.requisitar(caminho(id), { schema: filialSchema }),

  criar: (corpo: FilialCreate): Promise<Filial> =>
    api.requisitar('/api/filiais', { metodo: 'POST', corpo, schema: filialSchema }),

  alterar: (id: string, corpo: FilialUpdate): Promise<Filial> =>
    api.requisitar(caminho(id), { metodo: 'PUT', corpo, schema: filialSchema }),

  inativar: (id: string): Promise<void> => api.requisitar<void>(`${caminho(id)}/inativar`, { metodo: 'PATCH' }),

  ativar: (id: string): Promise<void> => api.requisitar<void>(`${caminho(id)}/ativar`, { metodo: 'PATCH' }),

  /** Até 20 ativas por nome (o `TDBCombo` de matriz usa `tipo = 'MATRIZ'`); `ignorarId` tira a própria filial. */
  selecionar: (busca?: string, tipo?: TipoFilial, ignorarId?: string): Promise<FilialSelect[]> => {
    const p = new URLSearchParams();
    const termo = busca?.trim();
    if (termo) p.set('busca', termo);
    if (tipo) p.set('tipo', tipo);
    if (ignorarId) p.set('ignorarId', ignorarId);
    const consulta = p.toString();
    return api.requisitar(`/api/filiais/selecao${consulta ? `?${consulta}` : ''}`, { schema: z.array(filialSelectSchema) });
  },
};
