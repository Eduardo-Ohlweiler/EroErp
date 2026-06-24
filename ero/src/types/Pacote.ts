import type { StatusConsulta } from "./Clinica"

export type StatusPacote = "ATIVO" | "CONCLUIDO" | "CANCELADO"

export interface SessaoResumo {
    consultaId: number
    sessao:     number
    status:     StatusConsulta
    inicio:     string
    fim:        string
}

export interface PacoteContratadoResponse {
    id:                 number
    nome:               string
    status:             StatusPacote
    emitenteId:         number
    emitenteNome:       string
    pessoaId:           number
    pessoaNome:         string
    pessoaDocumento:    string | null
    produtoId:          number
    produtoNome:        string
    quantidadeSessoes:  number
    valorTotal:         number
    contaReceberId:     number | null
    observacao:         string | null
    motivoCancelamento: string | null
    documentoId:        number | null
    documentoNumero:    string | null
    fichaAnamneseId:    number | null
    fichaAnamneseNome:  string | null
    sessoesUsadas:      number
    sessoesRestantes:   number
    sessoes:            SessaoResumo[]
    createdAt:          string
}

export interface SessaoSlotRequest {
    inicio: string   // ISO LocalDateTime, ex: "2025-06-10T09:00:00"
    fim:    string
}

export interface ParcelaPacoteRequest {
    dataVencimento:    string
    valor:             number
    formaPagamentoId:  number | null
    contaFinanceiraId: number | null
    observacao:        string | null
    dataPagamento:     string | null
    valorPago:         number | null
    credito?:          boolean | null
}

export interface ContratarPacoteRequest {
    emitenteId:        number
    pessoaId:          number
    produtoId:         number
    nome:              string
    quantidadeSessoes: number
    valorTotal:        number
    observacao?:       string | null
    documentoId?:      number | null
    fichaAnamneseId?:  number | null
    sessoes:           SessaoSlotRequest[]
    parcelas:          ParcelaPacoteRequest[]
}

export interface AnexosPacoteRequest {
    documentoId:     number | null
    fichaAnamneseId: number | null
}
