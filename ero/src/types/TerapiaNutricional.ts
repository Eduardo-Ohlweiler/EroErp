// Tipos da API do módulo Terapia Nutricional (Fórmulas Enterais e Suplementos).

import type { Sexo, Raca, FaseTerapia, ModoDieta } from "../pages/terapia-nutricional/calculo/types"

// ── Fórmulas Enterais ─────────────────────────────────────────────────────────

export interface FormulaEnteralResponse {
  id:              number
  nome:            string
  densidadeKcalMl: number
  proteinaGL:      number
  categoria:       string | null
  cho:             number | null
  lip:             number | null
  fibras:          number | null
  potassio:        number | null
  osmolaridade:    number | null
  ativo:           boolean
  global:          boolean   // true = default do sistema (somente leitura)
}

export interface FormulaEnteralPayload {
  nome:            string
  densidadeKcalMl: number
  proteinaGL:      number
  categoria:       string | null
  cho:             number | null
  lip:             number | null
  fibras:          number | null
  potassio:        number | null
  osmolaridade:    number | null
  ativo:           boolean
}

export interface FormulaEnteralOption {
  id:              number
  nome:            string
  densidadeKcalMl: number
  proteinaGL:      number
  categoria:       string | null
}

// ── Suplementos ───────────────────────────────────────────────────────────────

export interface SuplementoResponse {
  id:        number
  nome:      string
  qtdG:      number | null
  kcal:      number | null
  ptn:       number | null
  cho:       number | null
  acucar:    number | null
  lip:       number | null
  sodio:     number | null
  potassio:  number | null
  fosforo:   number | null
  ferro:     number | null
  fibras:    number | null
  osmolaridade: number | null
  ativo:     boolean
  global:    boolean
}

export interface SuplementoPayload {
  nome:      string
  qtdG:      number | null
  kcal:      number | null
  ptn:       number | null
  cho:       number | null
  acucar:    number | null
  lip:       number | null
  sodio:     number | null
  potassio:  number | null
  fosforo:   number | null
  ferro:     number | null
  fibras:    number | null
  osmolaridade: number | null
  ativo:     boolean
}

export interface SuplementoOption {
  id:    number
  nome:  string
}

// ── Avaliações Nutricionais ─────────────────────────────────────────────────────

export interface AvaliacaoNutricionalSummary {
  id:            number
  pessoaId:      number
  pessoaNome:    string
  dataAvaliacao: string
  pesoAtual:     number | null
  imc:           number | null
  classifImcOms: string | null
  formulaNome:   string | null
}

export interface AvaliacaoNutricionalResponse {
  id:                       number
  pessoaId:                 number
  pessoaNome:               string
  usuarioId:                number | null
  dataAvaliacao:            string
  // entradas
  sexo:                     Sexo
  raca:                     Raca
  idade:                    number | null
  cb:                       number | null
  cp:                       number | null
  ca:                       number | null
  aj:                       number | null
  pesoAtual:                number | null
  pesoUsual:                number | null
  altura:                   number | null
  // antropometria (resultados)
  alturaEstimada:           number | null
  pesoEstimadoChumlea:      number | null
  pesoEstimadoJung:         number | null
  pesoEstimadoRabito:       number | null
  imc:                      number | null
  classifImcOms:            string | null
  classifImcOpas:           string | null
  pesoIdeal:                number | null
  pesoIdealImc25:           number | null
  pesoAjustado:             number | null
  percPerdaPeso:            number | null
  classifPerdaPeso:         string | null
  percAdequacaoCb:          number | null
  classifAdequacaoCb:       string | null
  classifDeplecaoCp:        string | null
  // necessidades
  fase:                     FaseTerapia
  kcalKgAlvo:               number | null
  ptnKgAlvo:                number | null
  kcalMin:                  number | null
  kcalMax:                  number | null
  ptnMin:                   number | null
  ptnMax:                   number | null
  kcalTotal:                number | null
  ptnTotal:                 number | null
  ptnHdIntermitente:        number | null
  ptnHdContinua:            number | null
  // dieta enteral
  formulaEnteralId:         number | null
  formulaNome:              string | null
  formulaDensidadeKcalMl:   number | null
  formulaProteinaGL:        number | null
  modoDieta:                ModoDieta
  volumeDieta:              number | null
  tempoDieta:               number | null
  dietaVt:                  number | null
  dietaKcal:                number | null
  dietaPtn:                 number | null
  dietaKcalKg:              number | null
  dietaPtnKg:               number | null
  dietaPercVct:             number | null
  dietaPercPtn:             number | null
  dietaVolumePleno:         number | null
  // hidratação
  hidratacaoVolumeDieta:    number | null
  hidratacaoNecMin:         number | null
  hidratacaoNecIdeal:       number | null
  hidratacaoAguaDieta:      number | null
  hidratacaoAguaExtraMin:   number | null
  hidratacaoAguaExtraIdeal: number | null
  observacao:               string | null
  createdAt:                string | null
  updatedAt:                string | null
}

export interface AvaliacaoNutricionalPayload {
  pessoaId:                 number
  usuarioId?:               number | null
  dataAvaliacao:            string
  // entradas
  sexo:                     Sexo
  raca:                     Raca
  idade:                    number | null
  cb:                       number | null
  cp:                       number | null
  ca:                       number | null
  aj:                       number | null
  pesoAtual:                number | null
  pesoUsual:                number | null
  altura:                   number | null
  // antropometria
  alturaEstimada:           number | null
  pesoEstimadoChumlea:      number | null
  pesoEstimadoJung:         number | null
  pesoEstimadoRabito:       number | null
  imc:                      number | null
  classifImcOms:            string | null
  classifImcOpas:           string | null
  pesoIdeal:                number | null
  pesoIdealImc25:           number | null
  pesoAjustado:             number | null
  percPerdaPeso:            number | null
  classifPerdaPeso:         string | null
  percAdequacaoCb:          number | null
  classifAdequacaoCb:       string | null
  classifDeplecaoCp:        string | null
  // necessidades
  fase:                     FaseTerapia
  kcalKgAlvo:               number | null
  ptnKgAlvo:                number | null
  kcalMin:                  number | null
  kcalMax:                  number | null
  ptnMin:                   number | null
  ptnMax:                   number | null
  kcalTotal:                number | null
  ptnTotal:                 number | null
  ptnHdIntermitente:        number | null
  ptnHdContinua:            number | null
  // dieta enteral
  formulaEnteralId:         number | null
  formulaNome:              string | null
  formulaDensidadeKcalMl:   number | null
  formulaProteinaGL:        number | null
  modoDieta:                ModoDieta
  volumeDieta:              number | null
  tempoDieta:               number | null
  dietaVt:                  number | null
  dietaKcal:                number | null
  dietaPtn:                 number | null
  dietaKcalKg:              number | null
  dietaPtnKg:               number | null
  dietaPercVct:             number | null
  dietaPercPtn:             number | null
  dietaVolumePleno:         number | null
  // hidratação
  hidratacaoVolumeDieta:    number | null
  hidratacaoNecMin:         number | null
  hidratacaoNecIdeal:       number | null
  hidratacaoAguaDieta:      number | null
  hidratacaoAguaExtraMin:   number | null
  hidratacaoAguaExtraIdeal: number | null
  observacao:               string | null
}

// ── Dashboard do paciente (Terapia Nutricional) ─────────────────────────────────

export interface UltimaAvaliacaoNutricional {
  pesoAtual:       number | null
  imc:             number | null
  classifImcOms:   string | null
  pesoIdeal:       number | null
  pesoAjustado:    number | null
  percAdequacaoCb: number | null
  kcalTotal:       number | null
  ptnTotal:        number | null
  dietaKcal:       number | null
  dietaPtn:        number | null
  percVct:         number | null
  percPtn:         number | null
  formulaNome:     string | null
  dataAvaliacao:   string
}

export interface PontoEvolutivoNutricional {
  dataAvaliacao:   string
  pesoAtual:       number | null
  imc:             number | null
  percAdequacaoCb: number | null
  kcalTotal:       number | null
  ptnTotal:        number | null
  dietaKcal:       number | null
  dietaPtn:        number | null
  percVct:         number | null
  percPtn:         number | null
  cb:              number | null
  cp:              number | null
}

export interface TerapiaNutricionalPacienteDashboard {
  pessoaId:            number
  pessoaNome:          string | null
  totalAvaliacoes:     number
  primeiraAvaliacao:   string | null
  ultimaAvaliacaoData: string | null
  ultimaAvaliacao:     UltimaAvaliacaoNutricional | null
  evolucao:            PontoEvolutivoNutricional[]
}

// ── Painel de Acompanhamento Diário ─────────────────────────────────────────────

export interface PontoDiario {
  data:            string
  volPrescrito24h: number | null
  volRecebido24h:  number | null
  percRecebidoNe:  number | null
  ingestaoMedia:   number | null
  k:               number | null
  na:              number | null
  mg:              number | null
  lact:            number | null
  pcr:             number | null
  ph:              number | null
  pco2:            number | null
  hco3:            number | null
  bh:              number | null
  diurese:         number | null
}

export interface UltimoRegistroDiario {
  data:            string
  dieta:           string | null
  percRecebidoNe:  number | null
  volPrescrito24h: number | null
  volRecebido24h:  number | null
  ingestaoMedia:   number | null
  bh:              number | null
  diurese:         number | null
  k:               number | null
  na:              number | null
  mg:              number | null
  lact:            number | null
  pcr:             number | null
  ph:              number | null
  pco2:            number | null
  hco3:            number | null
}

export interface TerapiaNutricionalAcompanhamentoDashboard {
  pessoaId:           number
  pessoaNome:         string | null
  totalRegistros:     number
  primeiroRegistro:   string | null
  ultimoRegistroData: string | null
  ultimoRegistro:     UltimoRegistroDiario | null
  evolucao:           PontoDiario[]
}

// ── Registros Diários de UTI (acompanhamento diário) ────────────────────────────

export interface RegistroDiarioUtiSummary {
  id:             number
  pessoaId:       number
  pessoaNome:     string
  data:           string
  dieta:          string | null
  percRecebidoNE: number | null
  volPrescrito24h: number | null
  volRecebido24h:  number | null
  percRecebido:    number | null
}

export interface RegistroDiarioUtiResponse {
  id:              number
  pessoaId:        number
  pessoaNome:      string
  data:            string
  dieta:           string | null
  // clínico / laboratório
  hgt:             number | null
  vmO2:            number | null
  pa:              string | null
  mg:              number | null
  k:               number | null
  na:              number | null
  lact:            number | null
  pcr:             number | null
  ph:              number | null
  pco2:            number | null
  hco3:            number | null
  bh:              number | null
  diurese:         number | null
  evacuacao:       string | null
  // dieta & TNE
  percRecebidoNE:  number | null
  volPrescrito24h: number | null
  volRecebido24h:  number | null
  percRecebido:    number | null
  // ingestão oral (% por refeição)
  cafeManha:       number | null
  lancheManha:     number | null
  almoco:          number | null
  lancheTarde:     number | null
  jantar:          number | null
  ceia:            number | null
  observacao:      string | null
  createdAt:       string | null
  updatedAt:       string | null
}

export interface RegistroDiarioUtiPayload {
  pessoaId:        number
  data:            string
  dieta:           string | null
  hgt:             number | null
  vmO2:            number | null
  pa:              string | null
  mg:              number | null
  k:               number | null
  na:              number | null
  lact:            number | null
  pcr:             number | null
  ph:              number | null
  pco2:            number | null
  hco3:            number | null
  bh:              number | null
  diurese:         number | null
  evacuacao:       string | null
  percRecebidoNE:  number | null
  volPrescrito24h: number | null
  volRecebido24h:  number | null
  cafeManha:       number | null
  lancheManha:     number | null
  almoco:          number | null
  lancheTarde:     number | null
  jantar:          number | null
  ceia:            number | null
  observacao:      string | null
}

// ── Dashboard geral (Terapia Nutricional) ───────────────────────────────────────

export interface ContagemItem {
  label: string
  total: number
}

export interface RankingPacienteNutricional {
  pessoaNome: string
  total:      number
}

export interface TerapiaNutricionalGeralDashboard {
  totalAvaliacoes:      number
  totalPacientes:       number
  avaliacoesNoPeriodo:  number
  mediaKcalKg:          number | null
  mediaPtnKg:           number | null
  porClassificacaoImc:  ContagemItem[]
  porFase:              ContagemItem[]
  porFormula:           ContagemItem[]
  rankingPacientes:     RankingPacienteNutricional[]
}
