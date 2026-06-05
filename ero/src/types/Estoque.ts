export interface EstoqueResponse {
  id:                 number
  clienteId:          number
  emitenteId:         number
  emitenteNome:       string
  produtoId:          number
  produtoNome:        string
  produtoCodigo:      string | null
  unidadeMedidaSigla: string
  quantidade:         number
  quantidadeMinima:   number | null
  precoVenda:         number | null
  custoMedio:         number
  bloqueado:          boolean
  baixarEstoque:      boolean
  createdByNome:      string | null
  updatedByNome:      string | null
  createdAt:          string
  updatedAt:          string | null
}

export interface EstoqueAlertaResponse {
  estoqueId:          number
  emitenteId:         number
  emitenteNome:       string
  produtoId:          number
  produtoNome:        string
  produtoCodigo:      string | null
  unidadeMedidaSigla: string
  quantidade:         number
  quantidadeMinima:   number
}

export interface MovimentacaoResponse {
  id:                 number
  clienteId:          number
  estoqueId:          number
  emitenteId:         number
  emitenteNome:       string
  produtoId:          number
  produtoNome:        string
  tipo:               TipoMovimentacao
  quantidade:         number
  quantidadeAnterior: number
  quantidadePosterior:number
  motivo:             string | null
  transferenciaId:    number | null
  createdByNome:      string | null
  createdAt:          string
}

export interface TransferenciaResponse {
  id:                  number
  clienteId:           number
  produtoId:           number
  produtoNome:         string
  emitenteOrigemId:    number
  emitenteOrigemNome:  string
  emitenteDestinoId:   number
  emitenteDestinoNome: string
  quantidade:          number
  observacao:          string | null
  createdByNome:       string | null
  createdAt:           string
}

export type TipoMovimentacao =
  | "ENTRADA"
  | "SAIDA"
  | "AJUSTE"
  | "TRANSFERENCIA_ENTRADA"
  | "TRANSFERENCIA_SAIDA"
