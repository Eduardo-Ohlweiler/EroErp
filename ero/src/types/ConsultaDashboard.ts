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

// ── novo contrato analítico (casa 1:1 com /consultas/dashboard/analitico) ────────

export interface StatusDistribuicaoDto { status: string; quantidade: number }
export interface PeriodoDto            { periodo: string; consultas: number; receita: number } // "MM/yy"
export interface ServicoRankingAnaliticoDto { servicoNome: string; atendimentos: number; qtdTotal: number; precoMedio: number; receitaTotal: number }
export interface EmitenteRankingDto    { emitenteId: number; nome: string; cor: string; consultas: number; receita: number }
export interface ClienteRankingAnaliticoDto  { pessoaId: number; pessoaNome: string; consultas: number; receitaTotal: number }
export interface DiaSemanaAnaliticoDto        { diaSemana: string; atendimentos: number; receita: number }

export interface ConsultaAnaliticoResponse {
  totalConsultas: number; totalConcluidas: number; totalCanceladas: number
  totalReconsultas: number; taxaReconsulta: number
  receitaTotal: number; receitaMes: number; ticketMedio: number
  porStatus: StatusDistribuicaoDto[]
  porPeriodo: PeriodoDto[]
  servicosMaisVendidos: ServicoRankingAnaliticoDto[]
  porEmitente: EmitenteRankingDto[]
  clientesMaisFieis: ClienteRankingAnaliticoDto[]
  porDiaSemana: DiaSemanaAnaliticoDto[]
}
