export interface ServicoRankingDto {
  servicoNome:  string
  atendimentos: number
  qtdTotal:     number
  precoMedio:   number
  receitaTotal: number
}

export interface DiaSemanaDto {
  diaSemana:   string
  atendimentos: number
  receita:      number
}

export interface ClienteRankingDto {
  pessoaNome:   string
  consultas:    number
  receitaTotal: number
}

export interface DiaReceitaDto {
  data:         string
  atendimentos: number
  receita:      number
}

export interface ConsultaDashboardResponse {
  totalConcluidas:      number
  concluidasEsteMes:    number
  receitaTotal:         number
  receitaMes:           number
  ticketMedio:          number
  servicosMaisVendidos: ServicoRankingDto[]
  porDiaSemana:         DiaSemanaDto[]
  clientesMaisVieis:    ClienteRankingDto[]
  receitaUltimos30Dias: DiaReceitaDto[]
}
