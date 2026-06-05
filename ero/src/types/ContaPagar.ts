export type StatusConta = "ABERTO" | "PARCIALMENTE_PAGO" | "PAGO" | "CANCELADO"

export interface ParcelaContaResponse {
    id:                  number
    numeroParcela:       number
    dataVencimento:      string
    valor:               number
    formaPagamentoId:    number | null
    formaPagamentoNome:  string | null
    contaFinanceiraId:   number | null
    contaFinanceiraNome: string | null
    dataPagamento:       string | null
    valorPago:           number | null
    status:              StatusConta
    observacao:          string | null
}

export interface ContaPagarResponse {
    id:                  number
    emitenteId:          number | null
    emitenteNome:        string | null
    emitenteDocumento:   string | null
    pessoaId:            number
    pessoaNome:          string
    pessoaDocumento:     string | null
    data:         string
    descricao:    string | null
    valorTotal:   number
    status:       StatusConta
    observacao:   string | null
    ativo:        boolean
    parcelas:     ParcelaContaResponse[]
    createdAt:    string
    updatedAt:    string | null
}

export interface ParcelaLocal {
    _tempId:            string
    numeroParcela?:     number
    dataVencimento:     string
    valor:              string
    formaPagamentoId:   string
    formaPagamentoNome: string
    contaFinanceiraId:  string
    contaFinanceiraNome: string
    observacao:         string
    status?:            StatusConta
}
