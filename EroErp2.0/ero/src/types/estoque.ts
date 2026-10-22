import type { Paginacao } from './comum'

/** Espelha `TipoMovimentacao`. */
export type TipoMovimentacao =
  | 'ENTRADA'
  | 'AJUSTE'
  | 'TRANSFERENCIA_SAIDA'
  | 'TRANSFERENCIA_ENTRADA'
  | 'SAIDA_CONSULTA'

/** Espelha `EstoqueResponseDto`. Campo nulo vem ausente do JSON. */
export interface EstoqueResponse {
  id: string
  produtoId: string
  produtoCodigo: number
  produtoNome: string
  produtoAtivo: boolean
  unidadeSigla: string
  filialId: string
  filialNome: string
  /** #RRGGBB */
  filialCor: string
  filialAtiva: boolean
  quantidade: number
  /** Ausente é não informado — não é zero. */
  precoVenda?: number | null
  /** Sem controle, a linha vale pelo preço: não se movimenta. */
  controlaEstoque: boolean
  quantidadeMinima?: number | null
  ativo: boolean
  createdAt: string
  updatedAt?: string | null
}

/** Espelha `EstoqueMovimentavelDto` — o combo das movimentações. */
export interface EstoqueMovimentavel {
  id: string
  produtoId: string
  produtoCodigo: number
  produtoNome: string
  unidadeSigla: string
  quantidade: number
}

/** Espelha `MovimentacaoResponseDto`. */
export interface MovimentacaoResponse {
  id: string
  estoqueId: string
  tipo: TipoMovimentacao
  /** Com sinal: entrada positiva, saída negativa. */
  quantidade: number
  quantidadeAnterior: number
  quantidadePosterior: number
  motivo?: string | null
  transferenciaId?: string | null
  /** Na saída por consulta, a consulta que baixou. */
  consultaId?: string | null
  produtoId: string
  produtoCodigo: number
  produtoNome: string
  unidadeSigla: string
  filialId: string
  filialNome: string
  filialCor: string
  filialContraparteId?: string | null
  filialContraparteNome?: string | null
  usuarioNome?: string | null
  createdAt: string
}

/** Espelha `EstoqueCreateDto`. */
export interface EstoqueCreateRequest {
  produtoId: string
  filialId: string
  precoVenda: number | null
  controlaEstoque: boolean
  quantidadeMinima: number | null
  quantidadeInicial: number | null
}

/** Espelha `EstoqueUpdateDto` — não toca na quantidade. */
export interface EstoqueUpdateRequest {
  precoVenda: number | null
  controlaEstoque: boolean
  quantidadeMinima: number | null
}

export interface EntradaRequest {
  quantidade: number
  motivo?: string
}

export interface AjusteRequest {
  quantidadeNova: number
  motivo: string
}

export interface TransferenciaRequest {
  produtoId: string
  filialOrigemId: string
  filialDestinoId: string
  quantidade: number
  motivo?: string
}

export interface EstoqueFiltros extends Paginacao {
  /** Nome do produto; quando é número, também o código e o EAN exatos. */
  termo?: string
  filialId?: string
  produtoId?: string
  controla?: boolean
  ativo?: boolean
}

export interface MovimentacaoFiltros extends Paginacao {
  estoqueId?: string
  filialId?: string
  produtoId?: string
  tipo?: TipoMovimentacao
  /** ISO, instante. */
  de?: string
  /** ISO, instante — exclusivo. */
  ate?: string
}
