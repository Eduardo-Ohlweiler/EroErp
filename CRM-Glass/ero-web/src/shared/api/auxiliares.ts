import { z } from 'zod';
import type { OpcaoCombo } from '../../design-system/kit';
import { api } from './cliente';
import { paginaSchema, type PaginaDto } from './pagina';

/*
 * Cadastros auxiliares (ero-api, módulo `auxiliar`; grupo CADASTROS_AUXILIARES — docs/04-permissoes.md). São 8, todos
 * com a mesma forma; o que muda é o recurso (a rota) e o nome do campo do código (`codTipoCadastro`...):
 *
 *   GET   /api/<recurso>?page&size&sort        → PaginaDto<ResponseDto>   (CADASTROS_AUXILIARES_LER; ativos e inativos)
 *   GET   /api/<recurso>/selecao?inativos=     → SelectDto[]              (ACESSO_LIBERADO; os combos de Pessoas)
 *   POST  /api/<recurso>                       → 201 ResponseDto          (CADASTROS_AUXILIARES_ESCREVER)
 *   PUT   /api/<recurso>/{id}                  → com `version`; item do sistema = 422
 *   PATCH /api/<recurso>/{id}/inativar | /ativar → 204; item do sistema = 422
 *
 * Itens do sistema (`sistema: true`, `chave` preenchida) são pré-cadastrados em cada contratante e imutáveis.
 * Fica em `shared/` porque é usado pelas telas dos auxiliares e pelo cadastro de Pessoas.
 */

/** Os 8 recursos (a rota depois de `/api/`). */
export type RecursoAuxiliar =
  | 'tipos-cadastro'
  | 'tipos-telefone'
  | 'tipos-email'
  | 'tipos-endereco'
  | 'tipos-rede-social'
  | 'estados-civis'
  | 'profissoes'
  | 'categorias-servico';

/** Nome do campo do código em cada recurso (`cod_<tabela>` do contratante, só leitura). */
export type CampoCodigoAuxiliar =
  | 'codTipoCadastro'
  | 'codTipoTelefone'
  | 'codTipoEmail'
  | 'codTipoEndereco'
  | 'codTipoRedeSocial'
  | 'codEstadoCivil'
  | 'codProfissao'
  | 'codCategoriaServico';

/** `<X>SelectDto`: o que os combos e as pessoas (o tipo de cada telefone, e-mail...) trazem. */
export const tipoSelectSchema = z.object({
  id: z.string(),
  nome: z.string(),
  /** `CELULAR`, `CLIENTE`...: preenchida só nos itens do sistema (o cadastro rápido acha "Cliente" e "Celular" por ela) */
  chave: z.string().nullable().optional(),
  ativo: z.boolean(),
});
export type TipoSelect = z.infer<typeof tipoSelectSchema>;

/** `<X>ResponseDto` com o código normalizado em `codigo` (a API manda `codTipoCadastro`, `codTipoTelefone`...). */
export type TipoAuxiliarResponse = {
  id: string;
  codigo: number;
  nome: string;
  sistema: boolean;
  ativo: boolean;
  createdAt: string;
  updatedAt?: string | null;
  criadoPorNome?: string | null;
  alteradoPorNome?: string | null;
  version: number;
};

/** `<X>CreateDto` (o código nasce na API; nunca vai no corpo) */
export type TipoAuxiliarCreate = { nome: string };

/** `<X>UpdateDto` */
export type TipoAuxiliarUpdate = TipoAuxiliarCreate & { version: number };

export type ListaAuxiliarApi = { page: number; size: number; sort?: string };

/** Schema do `ResponseDto` de um recurso: lê o código pelo nome que a API usa e entrega `codigo`. */
export function tipoAuxiliarSchema(campoCodigo: CampoCodigoAuxiliar) {
  return z
    .looseObject({
      id: z.string(),
      nome: z.string(),
      sistema: z.boolean(),
      ativo: z.boolean(),
      createdAt: z.string(),
      updatedAt: z.string().nullable().optional(),
      criadoPorNome: z.string().nullable().optional(),
      alteradoPorNome: z.string().nullable().optional(),
      version: z.number().int(),
    })
    .transform((r): TipoAuxiliarResponse => {
      const codigo = r[campoCodigo];
      if (typeof codigo !== 'number') throw new Error(`Resposta sem ${campoCodigo}.`);
      return {
        id: r.id,
        codigo,
        nome: r.nome,
        sistema: r.sistema,
        ativo: r.ativo,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        criadoPorNome: r.criadoPorNome,
        alteradoPorNome: r.alteradoPorNome,
        version: r.version,
      };
    });
}

/**
 * Chave do TanStack Query da seleção de um recurso. Começa pelo recurso, então `invalidateQueries({ queryKey:
 * [recurso] })` (o que a tela do auxiliar faz ao salvar, inativar e reativar) renova também os combos.
 */
export const chaveDaSelecao = (recurso: RecursoAuxiliar, inativos = false) => [recurso, 'selecao', inativos] as const;

const caminho = (recurso: RecursoAuxiliar, id: string) => `/api/${recurso}/${encodeURIComponent(id)}`;

/** `GET /api/<recurso>/selecao`: os ativos, por nome; com `inativos`, todos. */
export function selecionarTipos(recurso: RecursoAuxiliar, inativos = false): Promise<TipoSelect[]> {
  return api.requisitar(`/api/${recurso}/selecao?inativos=${inativos}`, { schema: z.array(tipoSelectSchema) });
}

/**
 * As opções do `TCombo` de um tipo: os ativos da `/selecao` e, depois, os **já gravados** no registro que estão
 * inativos (o combo só oferece os ativos; o gravado continua aparecendo, e o kit escreve "Nome (inativo)", por isso o
 * rótulo vai sem o sufixo). `salvos` são os tipos que o registro traz (`tipo` do telefone, do e-mail...).
 */
export function opcoesDeTipo(lista: readonly TipoSelect[], salvos: readonly Pick<TipoSelect, 'id' | 'nome' | 'ativo'>[] = []): OpcaoCombo[] {
  const opcoes: OpcaoCombo[] = lista.filter((t) => t.ativo).map((t) => ({ valor: t.id, rotulo: t.nome }));
  for (const s of salvos) {
    if (!s.ativo && !opcoes.some((o) => o.valor === s.id)) opcoes.push({ valor: s.id, rotulo: s.nome, inativo: true });
  }
  return opcoes;
}

/** O item do sistema pela `chave` ("CLIENTE", "CELULAR"), se estiver ativo na lista. */
export const tipoPorChave = (lista: readonly TipoSelect[], chave: string): TipoSelect | undefined =>
  lista.find((t) => t.chave === chave && t.ativo);

/**
 * O cliente de um recurso. As 7 telas usam o mesmo: só muda o recurso e o nome do campo do código.
 * `criarApiAuxiliar('tipos-telefone', 'codTipoTelefone')`.
 */
export function criarApiAuxiliar(recurso: RecursoAuxiliar, campoCodigo: CampoCodigoAuxiliar) {
  const schema = tipoAuxiliarSchema(campoCodigo);
  return {
    listar: (f: ListaAuxiliarApi): Promise<PaginaDto<TipoAuxiliarResponse>> => {
      const p = new URLSearchParams({ page: String(f.page), size: String(f.size) });
      if (f.sort) p.set('sort', f.sort);
      return api.requisitar(`/api/${recurso}?${p.toString()}`, { schema: paginaSchema(schema) });
    },
    criar: (corpo: TipoAuxiliarCreate): Promise<TipoAuxiliarResponse> =>
      api.requisitar(`/api/${recurso}`, { metodo: 'POST', corpo, schema }),
    alterar: (id: string, corpo: TipoAuxiliarUpdate): Promise<TipoAuxiliarResponse> =>
      api.requisitar(caminho(recurso, id), { metodo: 'PUT', corpo, schema }),
    inativar: (id: string): Promise<void> => api.requisitar<void>(`${caminho(recurso, id)}/inativar`, { metodo: 'PATCH' }),
    ativar: (id: string): Promise<void> => api.requisitar<void>(`${caminho(recurso, id)}/ativar`, { metodo: 'PATCH' }),
  };
}
