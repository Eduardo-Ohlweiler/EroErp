import type { CompromissoRequest, CompromissoResponse, StatusCompromisso } from '@/types/compromisso'

/** Espelha `TipoAjuste`. */
export type TipoAjuste = 'DESCONTO' | 'ACRESCIMO'

/** Espelha `TipoCalculo`: o próprio valor, ou um percentual da base (até 100). */
export type TipoCalculo = 'FIXO' | 'PERCENTUAL'

/** O ajuste de um item ou da consulta: os três juntos, ou nenhum. */
export interface Ajuste {
  tipoAjuste?: TipoAjuste | null
  tipoCalculo?: TipoCalculo | null
  valorAjuste?: number | null
}

/** Espelha `ConsultaServicoItemDto`. */
export interface ConsultaServicoItem extends Ajuste {
  /** O item já gravado — mantém o retrato da descrição. Ausente, item novo. */
  id?: string
  servicoId: string
  quantidade: number
  /** Ausente, o servidor usa o valor do serviço na filial. */
  precoUnitario?: number | null
}

/** Espelha `ConsultaProdutoItemDto`. */
export interface ConsultaProdutoItem extends Ajuste {
  id?: string
  produtoId: string
  quantidade: number
  precoUnitario?: number | null
}

/** O compromisso dentro da consulta: o corpo do PUT da agenda, sem recorrência. */
export type CompromissoDaConsulta = Omit<CompromissoRequest, 'recorrencia' | 'ocorrencias'>

interface AjusteGeral {
  tipoAjusteGeral?: TipoAjuste | null
  tipoCalculoGeral?: TipoCalculo | null
  valorAjusteGeral?: number | null
}

/**
 * Espelha `ConsultaCreateDto`: `compromissoId` converte, `compromisso` cria
 * junto — um dos dois. Lista nula não mexe; enviada sem a permissão é 403.
 */
export interface ConsultaCreateRequest extends AjusteGeral {
  compromissoId?: string
  compromisso?: CompromissoDaConsulta
  observacao?: string
  servicos?: ConsultaServicoItem[] | null
  produtos?: ConsultaProdutoItem[] | null
}

/** Espelha `ConsultaUpdateDto`. */
export interface ConsultaUpdateRequest extends AjusteGeral {
  compromisso: CompromissoDaConsulta
  observacao?: string
  servicos?: ConsultaServicoItem[] | null
  produtos?: ConsultaProdutoItem[] | null
}

/** Espelha `ConsultaCalculoRequestDto`: o mesmo corpo, sem gravar. */
export interface ConsultaCalculoRequest extends AjusteGeral {
  consultaId?: string
  filialId: string
  servicos?: ConsultaServicoItem[] | null
  produtos?: ConsultaProdutoItem[] | null
}

/** Os valores que o servidor publica de cada item. `ajuste` tem sinal. */
interface ValoresDoItem {
  subtotal: number
  ajuste: number
  total: number
}

/** Espelha `ConsultaServicoResponseDto`. */
export interface ConsultaServicoResponse extends ValoresDoItem, Ajuste {
  id: string
  servicoId: string
  servicoCodigo: number
  /** O retrato do nome, como estava ao entrar. */
  descricao: string
  quantidade: number
  precoUnitario: number
}

/** Espelha `ConsultaProdutoResponseDto`. */
export interface ConsultaProdutoResponse extends ValoresDoItem, Ajuste {
  id: string
  produtoId: string
  produtoCodigo: number
  descricao: string
  unidadeSigla: string
  quantidade: number
  precoUnitario: number
  /** Concluir vai baixar o estoque deste. */
  controlaEstoque: boolean
  /** O saldo de agora, só quando controla. */
  saldoDisponivel?: number | null
}

/** Os totais, iguais na resposta e na prévia. `ajusteGeral` tem sinal. */
export interface TotaisConsulta {
  subtotalServicos: number
  subtotalProdutos: number
  subtotal: number
  ajusteGeral: number
  total: number
}

/** Espelha `ConsultaResponseDto`. As listas faltam para quem não as lê. */
export interface ConsultaResponse extends TotaisConsulta, AjusteGeral {
  id: string
  compromisso: CompromissoResponse
  observacao?: string | null
  consultaOrigemId?: string | null
  servicos?: ConsultaServicoResponse[]
  produtos?: ConsultaProdutoResponse[]
  criadoPorNome?: string | null
  createdAt: string
  updatedAt?: string | null
}

/** Espelha `ConsultaCalculoDto`. */
export interface ConsultaCalculo extends TotaisConsulta {
  servicos: (ValoresDoItem & { precoUnitario: number })[]
  produtos: (ValoresDoItem & { precoUnitario: number })[]
}

/** Espelha `ConsultaListaDto`. */
export interface ConsultaLista {
  id: string
  compromissoId: string
  titulo: string
  inicio: string
  fim: string
  status: StatusCompromisso
  filialId: string
  filialNome: string
  filialCor: string
  responsavelNome: string
  pessoaNome?: string | null
  total: number
}

export interface ConsultaFiltros {
  filialId?: string
  responsavelId?: string
  pessoaId?: string
  status?: StatusCompromisso
  de?: string
  ate?: string
  page?: number
  size?: number
}

/** Espelha `PrecoSugeridoDto`. O preço falta quando a filial não tem um: vazio não é zero. */
export interface PrecoSugerido {
  precoUnitario?: number | null
  controlaEstoque?: boolean | null
  saldo?: number | null
  unidadeSigla?: string | null
}

export interface ReconsultaRequest {
  inicio: string
  fim: string
  responsavelId?: string
}
