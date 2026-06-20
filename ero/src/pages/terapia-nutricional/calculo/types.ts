// Tipos compartilhados do módulo Terapia Nutricional (cálculo nutricional adulto).
// Fidelidade à planilha de Terapia Nutricional é o requisito #1.

export type Sexo        = "M" | "F"
export type Raca        = "BRANCO" | "NEGRO"
export type FaseTerapia = "AGUDA" | "REABILITACAO"
export type ModoDieta   = "CONTINUO" | "INTERMITENTE"

// ── Entradas ──────────────────────────────────────────────────────────────────

export interface EntradaAntropometria {
  sexo:      Sexo
  raca:      Raca
  idade:     number | null   // anos
  cb:        number | null   // circunferência do braço (cm)
  cp:        number | null   // circunferência da panturrilha (cm)
  ca:        number | null   // circunferência abdominal (cm)
  aj:        number | null   // altura do joelho (cm)
  pesoAtual: number | null   // kg
  pesoUsual: number | null   // kg
  altura:    number | null   // cm
}

export interface EntradaNecessidades {
  peso:       number | null  // peso atual (kg)
  pesoIdeal:  number | null  // kg
  imc:        number | null
  fase:       FaseTerapia
  kcalKgAlvo: number | null  // opcional — personalizado
  ptnKgAlvo:  number | null  // opcional — personalizado
}

export interface EntradaDieta {
  modo:           ModoDieta
  densidadeKcalMl: number | null  // kcal/ml
  proteinaGL:     number | null   // g/L
  volume:         number | null   // ml/h (contínuo) ou ml/horário (intermitente)
  tempo:          number | null   // horas de infusão (contínuo) ou nº de horários/dia
  peso:           number | null   // kg
  kcalMeta:       number | null   // kcal/dia
  ptnMeta:        number | null   // g/dia
}

export interface EntradaHidratacao {
  peso:            number | null   // kg
  volumeDieta:     number | null   // ml/dia
  densidadeKcalMl: number | null   // kcal/ml (define o % de água da fórmula)
}

// ── Resultados ────────────────────────────────────────────────────────────────

export interface ResultadoAntropometria {
  alturaEstimada:        number | null  // cm (Chumlea 1985)
  pesoEstimadoChumlea:   number | null  // kg (Chumlea 1988)
  pesoEstimadoJung:      number | null  // kg (Jung 2004)
  pesoEstimadoRabito:    number | null  // kg (Rabito 2008)
  imc:                   number | null
  classifImcOms:         string | null  // OMS 1997
  classifImcOpas:        string | null  // OPAS 2002 (idoso ≥ 60)
  pesoIdeal:             number | null  // kg (alvo IMC 22 H / 20.8 M)
  pesoIdealImc25:        number | null  // kg (variante IMC 25)
  pesoAjustado:          number | null  // kg
  percPerdaPeso:         number | null  // %
  classifPerdaPeso:      string | null  // janela 1 mês (default)
  percAdequacaoCb:       number | null  // %
  classifAdequacaoCb:    string | null
  classifDeplecaoCp:     string | null
}

export interface ResultadoNecessidades {
  kcalMin:        number | null  // kcal/dia
  kcalMax:        number | null  // kcal/dia
  ptnMin:         number | null  // g/dia
  ptnMax:         number | null  // g/dia
  kcalTotal:      number | null  // personalizado (kcal/kg × peso)
  ptnTotal:       number | null  // personalizado (g/kg × peso)
  ptnHdIntermitente: number | null  // g/dia
  ptnHdContinua:     number | null  // g/dia
}

export interface ProgressaoDia {
  dia:     number          // 1..4
  pct:     number          // 25 / 50 / 75 / 100
  kcalDia: number          // kcal alvo do dia
  volume:  number | null   // ml/h (contínuo) ou ml/horário (intermitente), na densidade da fórmula
}

export interface ModuloProteicoItem {
  nome:           string
  gramas:         number   // g de produto/dia para fechar a meta proteica
  kcalAdicionada: number   // kcal extras trazidas pelo módulo
}

export interface ResultadoDietaEnteral {
  vt:             number | null  // volume total/dia (ml)
  kcal:           number | null  // kcal/dia
  ptn:            number | null  // g/dia
  kcalKg:         number | null  // kcal/kg
  ptnKg:          number | null  // g/kg
  percVct:        number | null  // % da meta calórica
  percPtn:        number | null  // % da meta proteica
  volumePleno:    number | null  // volume necessário p/ atingir meta
  ptnPleno:       number | null  // proteína entregue no volume pleno (g/dia)
  ptnSuplementar: number | null  // lacuna proteica = meta − ofertada (g/dia)
  progressao:     ProgressaoDia[]       // modelo de progressão 1º–4º dia
  moduloProteico: ModuloProteicoItem[]  // sugestão de módulos p/ fechar a lacuna
}

export interface ResultadoHidratacao {
  necMin:           number | null  // ml/dia (25 ml/kg)
  necIdeal:         number | null  // ml/dia (30 ml/kg)
  percAgua:         number | null  // % de água da fórmula
  aguaDieta:        number | null  // ml/dia provenientes da dieta
  aguaExtraMin:     number | null  // ml/dia
  aguaExtraIdeal:   number | null  // ml/dia
  dist4x:           number | null  // ml por administração (4x/dia)
  dist5x:           number | null
  dist6x:           number | null
  dist8x:           number | null
}

// ── Fórmula enteral (option) ────────────────────────────────────────────────

export interface FormulaEnteralOption {
  id:              number
  nome:            string
  densidadeKcalMl: number
  proteinaGL:      number
  categoria:       string | null
}
