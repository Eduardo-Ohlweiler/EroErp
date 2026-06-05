import type { StatusConta, ParcelaContaResponse } from "./ContaPagar"

export interface ContaReceberResponse {
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

export type { StatusConta, ParcelaContaResponse }
