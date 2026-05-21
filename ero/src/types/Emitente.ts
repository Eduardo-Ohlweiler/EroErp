export type TipoEmitente = "MATRIZ" | "FILIAL"

export interface EmitenteRequest {
    pessoaId:       number
    tipo:           TipoEmitente
    pessoaMatrizId: number | null
    cor:            string
    bloqueado:      boolean
}

export interface EmitenteResponse {
    id:               number
    clienteId:        number

    pessoaId:         number
    pessoaNome:       string
    pessoaDocumento:  string | null   // CPF ou CNPJ dependendo do tipo_pessoa

    tipo:             TipoEmitente

    pessoaMatrizId:   number | null
    pessoaMatrizNome: string | null

    cor:              string
    bloqueado:        boolean

    createdAt:        string
    updatedAt:        string | null
}

export interface EmitenteSelect {
    id:               number
    pessoaId:         number
    pessoaNome:       string
    pessoaDocumento:  string | null
    tipo:             TipoEmitente
    cor:              string
}