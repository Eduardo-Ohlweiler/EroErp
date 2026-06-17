// Tipos do módulo de dashboards de Pediatria.
// Casam 1:1 com:
//   - PediatriaPacienteDashboardDto  (GET /pediatria/dashboard/paciente)
//   - PediatriaGeralDashboardDto     (GET /pediatria/dashboard/geral)
// BigDecimal/long/Integer do Java = number no TS. Campos anuláveis no Java = | null.

// ── Dashboard do paciente ────────────────────────────────────────────────────────

export interface UltimaAvaliacao {
  peso:                 number | null
  estatura:             number | null
  imc:                  number | null
  classifPesoIdade:     string | null
  classifEstaturaIdade: string | null
  classifImcIdade:      string | null
  vet:                  number | null
  proteinaNecessidade:  number | null
  formulaNome:          string | null
  caloriasTotais:       number | null
  proteinaTotal:        number | null
  percCalorico:         number | null
  percProteico:         number | null
  observacao:           string | null
  dataAvaliacao:        string
  idadeMeses:           number | null
}

export interface PontoEvolutivo {
  dataAvaliacao:       string
  idadeMeses:          number | null
  peso:                number | null
  estatura:            number | null
  imc:                 number | null
  vet:                 number | null
  caloriasTotais:      number | null
  proteinaTotal:       number | null
  proteinaNecessidade: number | null
  percCalorico:        number | null
  percProteico:        number | null
  formulaNome:         string | null
  classifPesoIdade:     string | null
  classifEstaturaIdade: string | null
  classifImcIdade:      string | null
}

export interface HistoricoFormula {
  dataAvaliacao: string
  idadeMeses:    number | null
  formulaNome:   string
  volumeTotal:   number | null
  vezesDia:      number | null
}

export interface PediatriaPacienteDashboardDto {
  pessoaId:            number
  pessoaNome:          string | null
  sexo:                string | null
  dataNascimento:      string | null
  idadeMesesAtual:     number | null
  totalAvaliacoes:     number
  primeiraAvaliacao:   string | null
  ultimaAvaliacaoData: string | null
  ultimaAvaliacao:     UltimaAvaliacao | null
  evolucao:            PontoEvolutivo[]
  historicoFormulas:   HistoricoFormula[]
}

// ── Dashboard geral ──────────────────────────────────────────────────────────────

export interface PediatriaPeriodoDto       { periodo: string; avaliacoes: number }
export interface PediatriaClassificacaoDto { classificacao: string; quantidade: number }
export interface PediatriaFormulaDto       { formulaNome: string; quantidade: number }
export interface PediatriaFaixaEtariaDto   { faixa: string; quantidade: number }
export interface PediatriaSexoDto          { sexo: string; quantidade: number }
export interface PediatriaPacienteRankingDto {
  pessoaId:   number
  pessoaNome: string
  avaliacoes: number
}

export interface PediatriaGeralDashboardDto {
  totalAvaliacoes:         number
  totalPacientes:          number
  avaliacoesMes:           number
  idadeMediaMeses:         number
  pesoMedio:               number
  imcMedio:                number
  percImcAdequado:         number
  coberturaCaloricaMedia:  number

  porPeriodo:              PediatriaPeriodoDto[]
  porClassifPesoIdade:     PediatriaClassificacaoDto[]
  porClassifEstaturaIdade: PediatriaClassificacaoDto[]
  porClassifImcIdade:      PediatriaClassificacaoDto[]
  porFormula:              PediatriaFormulaDto[]
  porFaixaEtaria:          PediatriaFaixaEtariaDto[]
  porSexo:                 PediatriaSexoDto[]
  pacientesMaisAvaliados:  PediatriaPacienteRankingDto[]
}
