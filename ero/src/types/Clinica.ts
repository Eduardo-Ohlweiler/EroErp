export type StatusConsulta =
    | "AGENDADA"
    | "EM_ATENDIMENTO"
    | "CONCLUIDA"
    | "CANCELADA"

export interface ConsultaServicoResponse {
    id:            number
    produtoId:     number
    produtoNome:   string
    quantidade:    number
    precoUnitario: number
    total:         number
    createdAt:     string
}

export interface ConsultaProdutoResponse {
    id:            number
    produtoId:     number
    produtoNome:   string
    emitenteId:    number
    emitenteNome:  string
    quantidade:    number
    precoUnitario: number
    total:         number
    createdAt:     string
}

export interface ConsultaResponse {
    id:                  number
    status:              StatusConsulta
    emitenteId:          number
    emitenteNome:        string
    pessoaId:            number
    pessoaNome:          string
    compromissoId:       number | null
    inicio:              string
    fim:                 string
    observacao:          string | null
    motivoCancelamento:  string | null
    consultaPaiId:       number | null
    servicos:            ConsultaServicoResponse[]
    produtos:            ConsultaProdutoResponse[]
    createdAt:           string
    createdByNome:       string | null
    updatedAt:           string | null
    updatedByNome:       string | null
}
