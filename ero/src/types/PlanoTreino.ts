export type DiaSemanaGym =
  | "SEGUNDA" | "TERCA" | "QUARTA" | "QUINTA" | "SEXTA" | "SABADO" | "DOMINGO"

export type TipoExecucao = "NORMAL" | "DROPSET" | "DROPSET_INVERTIDO"

export interface ItemPlanoTreinoResponse {
  id:            number
  diaSemana:     DiaSemanaGym
  ordem:         number
  exercicioId:   number | null
  exercicioNome: string | null
  series:        number | null
  repeticoes:    string | null
  tipoExecucao:  TipoExecucao | null
  pausaSegundos: number | null
  observacao:    string | null
}

export interface PlanoTreinoResponse {
  id:           number
  pessoaId:     number
  pessoaNome:   string
  emitenteId:   number | null
  emitenteNome: string | null
  nome:         string
  dataInicio:   string
  dataFim:      string | null
  observacao:   string | null
  ativo:        boolean
  itens:        ItemPlanoTreinoResponse[]
  createdAt:    string
  updatedAt:    string
}

export interface PlanoTreinoSummary {
  id:         number
  pessoaId:   number
  pessoaNome: string
  nome:       string
  dataInicio: string
  dataFim:    string | null
  ativo:      boolean
}
