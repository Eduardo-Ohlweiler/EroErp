export interface StatusDistribuicaoDto { status: string; quantidade: number }
export interface PeriodoDto            { periodo: string; pedidos: number; valor: number } // "MM/yy"
export interface TipoPedidoRankingDto  { tipoPedidoNome: string; pedidos: number; valor: number }
export interface ProdutoRankingDto     { produtoNome: string; pedidos: number; qtdTotal: number; valorTotal: number }
export interface EmitenteRankingDto    { emitenteId: number; nome: string; cor: string; pedidos: number; valor: number }
export interface ClienteRankingDto     { pessoaId: number; pessoaNome: string; pedidos: number; valor: number }
export interface DiaSemanaDto          { diaSemana: string; pedidos: number; valor: number }

export interface PedidoDashboardResponse {
  totalPedidos:   number
  totalAbertos:   number
  totalConcluidos: number
  totalCancelados: number
  valorTotal:     number
  valorMes:       number
  ticketMedio:    number
  porStatus:            StatusDistribuicaoDto[]
  porPeriodo:           PeriodoDto[]
  porTipoPedido:        TipoPedidoRankingDto[]
  produtosMaisVendidos: ProdutoRankingDto[]
  porEmitente:          EmitenteRankingDto[]
  clientesMaisFieis:    ClienteRankingDto[]
  porDiaSemana:         DiaSemanaDto[]
}
