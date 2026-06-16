// Tipos da API do módulo Pediatria (Fórmulas Lácteas e Avaliações Pediátricas).

import type { Sexo } from "../pages/pediatria/calculo/types"

// ── Fórmulas Lácteas ────────────────────────────────────────────────────────

export interface FormulaLacteaResponse {
  id:               number
  nome:             string
  kcalPor100ml:     number
  proteinaPor100ml: number
  ativo:            boolean
  global:           boolean   // true = default do sistema (somente leitura)
}

export interface FormulaLacteaPayload {
  nome:             string
  kcalPor100ml:     number
  proteinaPor100ml: number
  ativo:            boolean
}

// ── Avaliações Pediátricas ──────────────────────────────────────────────────

export interface AvaliacaoPediatricaSummary {
  id:              number
  pessoaId:        number
  pessoaNome:      string
  dataAvaliacao:   string
  idadeMeses:      number | null
  idadeSemanas:    number | null
  peso:            number | null
  imc:             number | null
  classifImcIdade: string | null
  formulaNome:     string | null
}

export interface AvaliacaoPediatricaResponse {
  id:                       number
  pessoaId:                 number
  pessoaNome:               string
  usuarioId:                number | null
  dataAvaliacao:            string
  sexo:                     Sexo
  idadeMeses:               number | null
  idadeSemanas:             number | null
  peso:                     number | null
  estatura:                 number | null
  formulaLacteaId:          number | null
  formulaNome:              string | null
  formulaKcalPor100ml:      number | null
  formulaProteinaPor100ml:  number | null
  volumeMl:                 number | null
  frequenciaHoras:          number | null
  imc:                      number | null
  classifPesoIdade:         string | null
  classifEstaturaIdade:     string | null
  classifImcIdade:          string | null
  vet:                      number | null
  proteinaNecessidade:      number | null
  vezesDia:                 number | null
  volumeTotal:              number | null
  caloriasTotais:           number | null
  proteinaTotal:            number | null
  percCalorico:             number | null
  percProteico:             number | null
  observacao:               string | null
}

export interface AvaliacaoPediatricaPayload {
  pessoaId:                 number
  usuarioId?:               number | null
  dataAvaliacao:            string
  sexo:                     Sexo
  idadeMeses:               number | null
  idadeSemanas?:            number | null
  peso:                     number | null
  estatura?:                number | null
  formulaLacteaId?:         number | null
  formulaNome?:             string | null
  formulaKcalPor100ml?:     number | null
  formulaProteinaPor100ml?: number | null
  volumeMl?:                number | null
  frequenciaHoras?:         number | null
  imc?:                     number | null
  classifPesoIdade?:        string | null
  classifEstaturaIdade?:    string | null
  classifImcIdade?:         string | null
  vet?:                     number | null
  proteinaNecessidade?:     number | null
  vezesDia?:                number | null
  volumeTotal?:             number | null
  caloriasTotais?:          number | null
  proteinaTotal?:           number | null
  percCalorico?:            number | null
  percProteico?:            number | null
  observacao?:              string | null
}
