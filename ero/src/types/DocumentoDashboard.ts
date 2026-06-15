export interface StatusDistribuicaoDto { status: string; quantidade: number; valor: number }
export interface PeriodoDto            { periodo: string; quantidade: number; valor: number }   // "MM/yy"
export interface EmitenteRankingDto    { emitenteId: number; nome: string; cor: string; quantidade: number; valor: number }
export interface CidadeRankingDto      { cidadeId: number | null; nome: string; uf: string; quantidade: number; valor: number }
export interface PessoaRankingDto      { pessoaId: number; nome: string; quantidade: number; valor: number }
export interface DocumentoDashboardResponse {
  totalDocumentos: number; totalEmitidos: number; totalRascunhos: number; totalCancelados: number
  valorTotalEmitido: number; valorEmitidoMes: number; ticketMedio: number
  porStatus: StatusDistribuicaoDto[]
  porPeriodo: PeriodoDto[]
  porEmitente: EmitenteRankingDto[]
  porCidade: CidadeRankingDto[]
  porPessoa: PessoaRankingDto[]
}
