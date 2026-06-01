export interface ProximoDto {
  id:         number
  titulo:     string
  inicio:     string
  fim:        string
  pessoaNome: string | null
}

export interface PorPessoaDto {
  pessoaNome: string
  total:      number
}

export interface PorDiaDto {
  diaSemana: string
  data:      string
  total:     number
}

export interface PorHoraDto {
  hora:  number
  total: number
}

export interface CompromissoDashboard {
  totalAgendados:      number
  totalCancelados:     number
  totalConcluidos:     number
  totalHoje:           number
  totalSemana:         number
  proximosHoje:        ProximoDto[]
  topPessoas:          PorPessoaDto[]
  ultimosSeteDias:     PorDiaDto[]
  distribuicaoHorario: PorHoraDto[]
}
