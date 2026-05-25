export interface CompromissoResponse {
    id:                    number
    titulo:                string
    descricao:             string | null
    cor:                   string
    inicio:                string
    fim:                   string
    cancelado:             boolean
    concluido:             boolean
    motivoCancelamento:    string | null
    recorrenciaSimNao:     boolean
    tipoRecorrencia:       TipoRecorrencia | null
    quantidadeRecorrencia: number | null
    compromissoPaiId:      number | null
    emitenteId:            number | null
    emitenteNome:          string | null
    usuarioId:             number
    usuarioNome:           string
    pessoaId:              number | null
    pessoaNome:            string | null
    createdAt:             string
    createdByNome:         string | null
    updatedAt:             string | null
    updatedByNome:         string | null
}

export type TipoRecorrencia =
    | "DIARIO"
    | "SEMANAL"
    | "QUINZENAL"
    | "MENSAL"
    | "TRIMESTRAL"
    | "SEMESTRAL"
    | "ANUAL";

export interface Evento {
    id:                 number;
    titulo:             string;
    cor:                string;
    inicio:             string;
    fim:                string;
    cancelado:          boolean;
    concluido:          boolean;
    emitenteId:         number | null
    emitenteNome:       string | null
    pessoaNome:         string | null;
    tipoRecorrencia:    TipoRecorrencia | null;
    compromissoPaiId:   number | null;
}