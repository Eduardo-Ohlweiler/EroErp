export type TipoCredito = "ENTRADA" | "USO"

export interface CreditoSaldo {
    pessoaId: number
    saldo:    number
}

export interface CreditoMovimento {
    id:             number
    pessoaId:       number
    pessoaNome:     string
    tipo:           TipoCredito
    valor:          number
    origem:         string | null
    pedidoId:       number | null
    contaReceberId: number | null
    data:           string
}
