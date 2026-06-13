export interface PendenciaItemDto {
  parcelaId:      number
  contaId:        number
  pessoaId:       number
  pessoaNome:     string
  emitenteId:     number | null
  emitenteNome:   string | null
  descricao:      string | null
  numeroParcela:  number
  dataVencimento: string        // "YYYY-MM-DD"
  valor:          number
  vencida:        boolean
  diasAtraso:     number
}

export interface PendenciasFinanceirasDto {
  contasPagar:   PendenciaItemDto[]
  contasReceber: PendenciaItemDto[]
}
