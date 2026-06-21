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

// ════════════════════════════════════════════════════════════════════════════
//  IMITANCIOMETRIA
// ════════════════════════════════════════════════════════════════════════════

// Curva timpanométrica (classificação de Jerger)
export type CurvaJerger = "A" | "As" | "Ad" | "B" | "C"

// Resultado de reflexo estapédico
export type ResultadoReflexo = "PRESENTE" | "AUSENTE" | "NAO_TESTADO"

// ── Resumo (listagem) ─────────────────────────────────────────────────────────

export interface ImitanciometriaSummary {
  id:         number
  pessoaId:   number
  pessoaNome: string
  dataExame:  string
  curvaOd:    CurvaJerger | null
  curvaOe:    CurvaJerger | null
}

// ── Resposta completa ─────────────────────────────────────────────────────────

export interface ImitanciometriaResponse {
  id:                 number
  pessoaId:           number
  pessoaNome:         string
  usuarioNome:        string | null
  consultaId:         number | null
  dataExame:          string
  curvaOd:            CurvaJerger | null
  curvaOe:            CurvaJerger | null
  picoPressaoOdDapa:  number | null
  picoPressaoOeDapa:  number | null
  complacenciaOdMl:   number | null
  complacenciaOeMl:   number | null
  volumeCanalOdMl:    number | null
  volumeCanalOeMl:    number | null
  reflexoIpsiOd:      ResultadoReflexo | null
  reflexoContraOd:    ResultadoReflexo | null
  reflexoIpsiOe:      ResultadoReflexo | null
  reflexoContraOe:    ResultadoReflexo | null
  observacao:         string | null
  createdAt:          string
  updatedAt:          string | null
}

// ── Payload de criação/atualização ─────────────────────────────────────────────

export interface ImitanciometriaPayload {
  pessoaId:           number
  consultaId:         number | null
  dataExame:          string
  curvaOd:            CurvaJerger | null
  curvaOe:            CurvaJerger | null
  picoPressaoOdDapa:  number | null
  picoPressaoOeDapa:  number | null
  complacenciaOdMl:   number | null
  complacenciaOeMl:   number | null
  volumeCanalOdMl:    number | null
  volumeCanalOeMl:    number | null
  reflexoIpsiOd:      ResultadoReflexo | null
  reflexoContraOd:    ResultadoReflexo | null
  reflexoIpsiOe:      ResultadoReflexo | null
  reflexoContraOe:    ResultadoReflexo | null
  observacao:         string | null
}

// ════════════════════════════════════════════════════════════════════════════
//  ESCALAS / QUESTIONÁRIOS
// ════════════════════════════════════════════════════════════════════════════

// ── Catálogo de escalas ─────────────────────────────────────────────────────

export interface QuestionarioSummary {
  id:        number
  codigo:    string
  nome:      string
  descricao: string | null
}

export interface QuestionarioOpcao {
  id:     number
  ordem:  number
  rotulo: string
  valor:  number
}

export interface QuestionarioItem {
  id:        number
  ordem:     number
  enunciado: string
  dominio:   string | null
}

export interface QuestionarioDetalhe {
  id:        number
  codigo:    string
  nome:      string
  descricao: string | null
  instrucao: string | null
  opcoes:    QuestionarioOpcao[]
  itens:     QuestionarioItem[]
}

// ── Aplicação de escala ──────────────────────────────────────────────────────

export interface QuestionarioAplicadoSummary {
  id:                 number
  pessoaId:           number
  pessoaNome:         string
  questionarioCodigo: string
  questionarioNome:   string
  dataAplicacao:      string
  scoreTotal:         number | null
  classificacao:      string | null
}

export interface RespostaItem {
  itemId:     number
  enunciado?: string
  valor:      number
}

export interface QuestionarioAplicadoResponse {
  id:                 number
  pessoaId:           number
  pessoaNome:         string
  usuarioNome:        string | null
  consultaId:         number | null
  questionarioId:     number
  questionarioCodigo: string
  questionarioNome:   string
  dataAplicacao:      string
  scoreTotal:         number | null
  classificacao:      string | null
  interpretacao:      string | null
  createdAt:          string
  respostas:          RespostaItem[]
}

export interface QuestionarioAplicadoPayload {
  pessoaId:       number
  questionarioId: number
  consultaId:     number | null
  dataAplicacao:  string
  respostas:      { itemId: number; valor: number }[]
}

// ════════════════════════════════════════════════════════════════════════════
//  LAUDOS DESCRITIVOS (ExameLaudo)
// ════════════════════════════════════════════════════════════════════════════

export type TipoExameLaudo =
  | "NASOFIBROSCOPIA"
  | "LARINGOSCOPIA"
  | "VIDEOLARINGOSCOPIA"
  | "RINOSCOPIA"
  | "OUTRO"

// ── Resumo (listagem) ─────────────────────────────────────────────────────────

export interface ExameLaudoSummary {
  id:         number
  pessoaId:   number
  pessoaNome: string
  dataExame:  string
  tipoExame:  TipoExameLaudo
}

// ── Resposta completa ─────────────────────────────────────────────────────────

export interface ExameLaudoResponse {
  id:          number
  pessoaId:    number
  pessoaNome:  string
  usuarioNome: string | null
  consultaId:  number | null
  dataExame:   string
  tipoExame:   TipoExameLaudo
  laudo:       string | null
  conclusao:   string | null
  cid:         string | null
  createdAt:   string
  updatedAt:   string | null
}

// ── Payload de criação/atualização ─────────────────────────────────────────────

export interface ExameLaudoPayload {
  pessoaId:   number
  consultaId: number | null
  dataExame:  string
  tipoExame:  TipoExameLaudo
  laudo:      string | null
  conclusao:  string | null
  cid:        string | null
}

// ════════════════════════════════════════════════════════════════════════════
//  DASHBOARDS
//  Casam 1:1 com:
//    - OtorrinoPacienteDashboard  (GET /otorrino/dashboard/paciente)
//    - OtorrinoGeralDashboard     (GET /otorrino/dashboard/geral)
// ════════════════════════════════════════════════════════════════════════════

// ── Dashboard do paciente ──────────────────────────────────────────────────────

export interface OtorrinoAudiometriaEvolucao {
  data:    string             // "YYYY-MM-DD"
  mediaOd: number | null
  mediaOe: number | null
  grauOd:  GrauPerda | string | null
  grauOe:  GrauPerda | string | null
}

export interface OtorrinoEscalaEvolucao {
  data:          string       // "YYYY-MM-DD"
  codigo:        string
  nome:          string
  scoreTotal:    number
  classificacao: string | null
}

export interface OtorrinoPacienteResumo {
  totalAudiometrias:     number
  totalImitanciometrias: number
  totalEscalas:          number
  totalLaudos:           number
}

export interface OtorrinoUltimaAudiometria {
  data:   string
  grauOd: GrauPerda | string | null
  grauOe: GrauPerda | string | null
}

export interface OtorrinoPacienteDashboard {
  pessoaId:           number
  pessoaNome:         string | null
  audiometriaEvolucao: OtorrinoAudiometriaEvolucao[]   // ASC
  escalaEvolucao:      OtorrinoEscalaEvolucao[]         // ASC
  resumo:              OtorrinoPacienteResumo
  ultimaAudiometria:   OtorrinoUltimaAudiometria | null
}

// ── Dashboard geral ────────────────────────────────────────────────────────────

export interface OtorrinoGeralKpis {
  totalAudiometrias:     number
  totalImitanciometrias: number
  totalEscalas:          number
  totalLaudos:           number
  totalPacientes:        number
}

export interface OtorrinoExamePorTipo        { tipo: string;          total: number }
export interface OtorrinoAudiometriaPeriodo  { periodo: string;       total: number }   // "YYYY-MM"
export interface OtorrinoGrauPerdaDist        { classificacao: string; quantidade: number }
export interface OtorrinoEscalaPorTipo        { codigo: string; nome: string; quantidade: number; scoreMedio: number | null }
export interface OtorrinoLaudoPorTipo         { tipo: string;          total: number }

export interface OtorrinoGeralDashboard {
  kpis:                   OtorrinoGeralKpis
  examesPorTipo:          OtorrinoExamePorTipo[]
  audiometriasPorPeriodo: OtorrinoAudiometriaPeriodo[]   // ASC
  distribuicaoGrauPerda:  OtorrinoGrauPerdaDist[]         // NORMAL/LEVE/MODERADA/SEVERA/PROFUNDA
  escalasPorTipo:         OtorrinoEscalaPorTipo[]
  laudosPorTipo:          OtorrinoLaudoPorTipo[]
}
