// Endpoint existente: GET /financeiro/dashboard — posição atual (não filtrada)
export interface FinanceiroDashboardDto {
  totalPendenteReceber:         number
  totalPendenteAtrasadoReceber: number
  totalPendentePagar:           number
  totalPendenteAtrasadoPagar:   number
  totalRecebidoMes:             number
  totalPagoMes:                 number
  saldoGeral:                   number
  fluxoMensal:   { mes: string; recebido: number; pago: number }[]
  saldoPorConta: { nome: string; saldo: number }[]
}

// Endpoint novo: GET /financeiro/dashboard/fluxo — Créditos × Débitos (filtrado)
export interface FluxoPeriodoDto  { periodo: string; creditos: number; debitos: number; saldo: number } // "MM/yy"
export interface PessoaFluxoDto   { pessoaId: number; nome: string; creditos: number; debitos: number }
export interface EmitenteFluxoDto { emitenteId: number; nome: string; cor: string; creditos: number; debitos: number }
export interface FinanceiroFluxoResponse {
  regime: string
  totalCreditos: number; totalDebitos: number; saldoPeriodo: number
  qtdCreditos: number; qtdDebitos: number
  porPeriodo: FluxoPeriodoDto[]
  porPessoa: PessoaFluxoDto[]
  porEmitente: EmitenteFluxoDto[]
}
