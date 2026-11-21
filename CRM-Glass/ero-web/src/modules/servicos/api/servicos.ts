import { z } from 'zod';
import { api } from '../../../shared/api/cliente';
import { paginaSchema, type PaginaDto } from '../../../shared/api/pagina';
import { tipoSelectSchema } from '../../../shared/api/auxiliares';
import { formatarMoeda, AUSENTE } from '../../../shared/util/format';
import { filialSelectSchema } from '../../filiais/api/filiais';

/*
 * Serviços (ero-api, módulo `servico`, /api/servicos; grupo SERVICOS — docs/04-permissoes.md; PLANO-SERVICOS §3.7):
 *   GET   /api/servicos?codServico&busca&categoriaId&filialId&ativo&page&size&sort → PaginaDto<ServicoResponseDto> (SERVICOS_LER)
 *         `filialId` traz só os serviços prestados nela; cada linha continua com TODAS as filiais em `valores`.
 *         `sort`: `nome` (padrão) ou `codServico`; outro campo = 422.
 *   GET   /api/servicos/selecao?busca → ServicoSelectDto[] (até 20 ativos por nome; ACESSO_LIBERADO, nunca preço)
 *   GET   /api/servicos/{id}          → ServicoResponseDto (SERVICOS_LER)
 *   POST  /api/servicos               → 201 ServicoResponseDto (SERVICOS_ESCREVER)
 *   PUT   /api/servicos/{id}          → com `version` (409 = alterado por outra pessoa)
 *   PATCH /api/servicos/{id}/inativar | /ativar → 204
 * O preço só existe por filial (`valores[].valor`): `null` = não informado, `0` = gratuito (vazio nunca vira zero).
 * A lista `valores` é o estado completo e diz onde o serviço é prestado (pelo menos uma filial).
 */

/** ServicoFilialResponseDto: a filial do serviço com o preço dela (`valor` nulo = não informado). */
export const servicoFilialSchema = z.object({
  filial: filialSelectSchema,
  valor: z.number().nullable(),
  /** `false` = filial inativada depois de gravada: continua na lista, sinalizada. */
  filialAtiva: z.boolean(),
});
export type ServicoFilial = z.infer<typeof servicoFilialSchema>;

/** ServicoResponseDto: serve à lista, à exportação e ao formulário. */
export const servicoSchema = z.object({
  id: z.string(),
  codServico: z.number().int(),
  nome: z.string(),
  /** `null` = sem categoria; `ativo: false` = categoria inativada depois de gravada ("Nome (inativo)") */
  categoria: tipoSelectSchema.nullable().optional(),
  duracaoMinutos: z.number().int().nullable().optional(),
  descricao: z.string().nullable().optional(),
  valores: z.array(servicoFilialSchema),
  ativo: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
  criadoPorNome: z.string().nullable().optional(),
  alteradoPorNome: z.string().nullable().optional(),
  version: z.number().int(),
});
export type Servico = z.infer<typeof servicoSchema>;

/** ServicoSelectDto: o combo de serviços (sem preço nem duração). */
export const servicoSelectSchema = z.object({
  id: z.string(),
  codServico: z.number().int(),
  nome: z.string(),
});
export type ServicoSelect = z.infer<typeof servicoSelectSchema>;

/** "3 · Instalação de ar-condicionado": como o serviço aparece nos combos e no rótulo do que já está escolhido. */
export const rotuloDoServico = (s: Pick<ServicoSelect, 'codServico' | 'nome'>): string => `${s.codServico} · ${s.nome}`;

/** ServicoFilialItemDto: a linha do corpo (a filial é a chave; `valor` nulo = não informado). */
export type ServicoFilialItem = { filialId: string; valor: number | null };

/** ServicoCreateDto (código e auditoria nascem na API; `valores` tem de 1 a 100 linhas). */
export type ServicoCreate = {
  nome: string;
  categoriaId: string | null;
  duracaoMinutos: number | null;
  descricao: string | null;
  valores: ServicoFilialItem[];
};

/** ServicoUpdateDto */
export type ServicoUpdate = ServicoCreate & { version: number };

/**
 * O que a coluna Preço mostra quando a lista não está filtrada por filial: o único preço, a faixa "menor – maior" ou
 * travessão quando nenhuma filial tem preço (preço não informado não entra na conta; zero entra: é gratuito).
 */
export function faixaDePrecos(valores: readonly Pick<ServicoFilial, 'valor'>[]): string {
  const precos = valores.map((v) => v.valor).filter((v): v is number => v !== null && v !== undefined);
  if (precos.length === 0) return AUSENTE;
  const menor = Math.min(...precos);
  const maior = Math.max(...precos);
  return menor === maior ? formatarMoeda(menor) : `${formatarMoeda(menor)} – ${formatarMoeda(maior)}`;
}

export type FiltrosServicoApi = {
  codServico?: number;
  busca?: string;
  categoriaId?: string;
  filialId?: string;
  ativo?: boolean;
  page: number;
  size: number;
  sort?: string;
};

/** Monta a query string só com o que tem valor (ausente = todos; sem `sort` a API ordena por nome). */
export function consultaDeServicos(f: FiltrosServicoApi): string {
  const p = new URLSearchParams();
  if (f.codServico !== undefined) p.set('codServico', String(f.codServico));
  if (f.busca) p.set('busca', f.busca);
  if (f.categoriaId) p.set('categoriaId', f.categoriaId);
  if (f.filialId) p.set('filialId', f.filialId);
  if (f.ativo !== undefined) p.set('ativo', String(f.ativo));
  p.set('page', String(f.page));
  p.set('size', String(f.size));
  if (f.sort) p.set('sort', f.sort);
  return p.toString();
}

const caminho = (id: string) => `/api/servicos/${encodeURIComponent(id)}`;

export const servicosApi = {
  listar: (f: FiltrosServicoApi): Promise<PaginaDto<Servico>> =>
    api.requisitar(`/api/servicos?${consultaDeServicos(f)}`, { schema: paginaSchema(servicoSchema) }),

  buscar: (id: string): Promise<Servico> => api.requisitar(caminho(id), { schema: servicoSchema }),

  criar: (corpo: ServicoCreate): Promise<Servico> =>
    api.requisitar('/api/servicos', { metodo: 'POST', corpo, schema: servicoSchema }),

  alterar: (id: string, corpo: ServicoUpdate): Promise<Servico> =>
    api.requisitar(caminho(id), { metodo: 'PUT', corpo, schema: servicoSchema }),

  inativar: (id: string): Promise<void> => api.requisitar<void>(`${caminho(id)}/inativar`, { metodo: 'PATCH' }),

  ativar: (id: string): Promise<void> => api.requisitar<void>(`${caminho(id)}/ativar`, { metodo: 'PATCH' }),

  /** Até 20 ativos por nome, sem preço (o combo dos movimentos futuros). */
  selecionar: (busca?: string): Promise<ServicoSelect[]> => {
    const termo = busca?.trim();
    const consulta = termo ? `?${new URLSearchParams({ busca: termo }).toString()}` : '';
    return api.requisitar(`/api/servicos/selecao${consulta}`, { schema: z.array(servicoSelectSchema) });
  },
};
