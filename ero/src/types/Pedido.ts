import type { TipoAjuste, TipoCalculo } from "./Clinica"

export type StatusPedido     = "ABERTO" | "CONCLUIDO" | "CANCELADO"
export type MovimentaEstoque = "NENHUM" | "ENTRADA" | "SAIDA"
export type GeraFinanceiro   = "NENHUM" | "CONTAS_RECEBER" | "CONTAS_PAGAR"

export interface PedidoProdutoResponse {
    id:            number
    produtoId:     number
    produtoNome:   string
    emitenteId:    number
    emitenteNome:  string
    quantidade:    number
    precoUnitario: number
    tipoAjuste:    TipoAjuste | null
    tipoCalculo:   TipoCalculo | null
    valorAjuste:   number | null
    total:         number
    createdAt:     string
}

export interface PedidoResponse {
    id:                  number
    status:              StatusPedido
    emitenteId:          number
    emitenteNome:        string
    emitenteDocumento:   string | null
    pessoaId:            number
    pessoaNome:          string
    pessoaDocumento:     string | null
    tipoPedidoId:        number
    tipoPedidoNome:      string
    movimentaEstoque:    MovimentaEstoque
    geraFinanceiro:      GeraFinanceiro
    vendedorId:          number | null
    vendedorNome:        string | null
    dataPedido:          string
    dataEntrega:         string | null
    observacao:          string | null
    motivoCancelamento:  string | null
    faturado:            boolean
    contaId:             number | null
    produtos:            PedidoProdutoResponse[]
    tipoAjusteGeral:     TipoAjuste | null
    tipoCalculoGeral:    TipoCalculo | null
    valorAjusteGeral:    number | null
    createdAt:           string
    createdByNome:       string | null
    updatedAt:           string | null
    updatedByNome:       string | null
}

export interface TipoPedidoSummary {
    id:               number
    nome:             string
    movimentaEstoque: MovimentaEstoque
    geraFinanceiro:   GeraFinanceiro
    ativo:            boolean
}

export interface TipoPedidoResponse extends TipoPedidoSummary {
    createdAt: string
    updatedAt: string | null
}
