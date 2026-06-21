// Tipos da API do módulo Otorrinolaringologia (Audiometrias).

export type OrelhaAudiometria = "OD" | "OE"
export type ViaAudiometria    = "AEREA" | "OSSEA"

export type GrauPerda  = "NORMAL" | "LEVE" | "MODERADA" | "SEVERA" | "PROFUNDA"
export type TipoPerda  = "NORMAL" | "CONDUTIVA" | "NEUROSSENSORIAL" | "MISTA"

// ── Limiar individual (ponto do audiograma) ──────────────────────────────────

export interface AudiometriaLimiar {
  orelha:     OrelhaAudiometria
  via:        ViaAudiometria
  frequencia: number
  limiarDb:   number | null
  mascarado:  boolean
  semResposta: boolean
}

// ── Resumo (listagem) ─────────────────────────────────────────────────────────

export interface AudiometriaSummary {
  id:         number
  pessoaId:   number
  pessoaNome: string
  dataExame:  string
  grauOd:     GrauPerda | null
  grauOe:     GrauPerda | null
}

// ── Resposta completa ─────────────────────────────────────────────────────────

export interface AudiometriaResponse {
  id:          number
  pessoaId:    number
  pessoaNome:  string
  usuarioNome: string | null
  consultaId:  number | null
  dataExame:   string
  srtOdDb:     number | null
  srtOeDb:     number | null
  irfOdPerc:   number | null
  irfOePerc:   number | null
  mediaOd:     number | null
  mediaOe:     number | null
  grauOd:      GrauPerda | null
  grauOe:      GrauPerda | null
  tipoPerdaOd: TipoPerda | null
  tipoPerdaOe: TipoPerda | null
  norma:       string | null
  observacao:  string | null
  createdAt:   string
  updatedAt:   string | null
  limiares:    AudiometriaLimiar[]
}

// ── Payload de criação/atualização ─────────────────────────────────────────────

export interface AudiometriaPayload {
  pessoaId:   number
  consultaId: number | null
  dataExame:  string
  srtOdDb:    number | null
  srtOeDb:    number | null
  irfOdPerc:  number | null
  irfOePerc:  number | null
  norma:      string | null
  observacao: string | null
  limiares:   AudiometriaLimiar[]
}
