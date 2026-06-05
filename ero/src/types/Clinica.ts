export type StatusConsulta =
    | "AGENDADA"
    | "EM_ATENDIMENTO"
    | "CONCLUIDA"
    | "CANCELADA"

export type TipoAjuste   = "DESCONTO" | "ACRESCIMO"
export type TipoCalculo  = "FIXO" | "PERCENTUAL"

export interface ConsultaServicoResponse {
    id:            number
    produtoId:     number
    produtoNome:   string
    quantidade:    number
    precoUnitario: number
    tipoAjuste:    TipoAjuste | null
    tipoCalculo:   TipoCalculo | null
    valorAjuste:   number | null
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
    tipoAjuste:    TipoAjuste | null
    tipoCalculo:   TipoCalculo | null
    valorAjuste:   number | null
    total:         number
    createdAt:     string
}

export interface ConsultaResponse {
    id:                  number
    status:              StatusConsulta
    emitenteId:          number
    emitenteNome:        string
    emitenteDocumento:   string | null
    pessoaId:            number
    pessoaNome:          string
    pessoaDocumento:     string | null
    compromissoId:       number | null
    inicio:              string
    fim:                 string
    observacao:          string | null
    motivoCancelamento:  string | null
    consultaPaiId:       number | null
    servicos:            ConsultaServicoResponse[]
    produtos:            ConsultaProdutoResponse[]
    tipoAjusteGeral:     TipoAjuste | null
    tipoCalculoGeral:    TipoCalculo | null
    valorAjusteGeral:    number | null
    createdAt:           string
    createdByNome:       string | null
    updatedAt:           string | null
    updatedByNome:       string | null
}
