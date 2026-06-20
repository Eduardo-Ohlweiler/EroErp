// Cálculo da dieta enteral (contínua / intermitente) — espelha a planilha de Terapia Nutricional.
// Funções puras, sem React.

import type {
  EntradaDieta, ResultadoDietaEnteral, ProgressaoDia, ModuloProteicoItem,
} from "./types"

const VAZIO: ResultadoDietaEnteral = {
  vt: null, kcal: null, ptn: null, kcalKg: null, ptnKg: null,
  percVct: null, percPtn: null, volumePleno: null,
  ptnPleno: null, ptnSuplementar: null, progressao: [], moduloProteico: [],
}

// Módulos proteicos da planilha (aba Suplementos, "Módulos proteicos").
// dose = g de produto por dosador; ptn = g de proteína; cho = g de carboidrato na dose.
const MODULOS_PROTEICOS = [
  { nome: "Nutren Just Protein",      dose: 15, ptn: 13,   cho: 0    },
  { nome: "Fresubin Protein Powder",  dose: 12, ptn: 10.4, cho: 0    },
  { nome: "Nutridrink Protein",       dose: 20, ptn: 6,    cho: 9.66 },
] as const

const PROGRESSAO_PCTS = [25, 50, 75, 100] as const

// Modelo de progressão da dieta: 1º–4º dia (25→100% da meta), com o volume de cada
// dia (ml/h ou ml/horário) na densidade da fórmula selecionada. Espelha R11/1.5/S2.
export function progressaoDieta(
  kcalMeta: number | null, densidade: number | null, tempo: number | null,
): ProgressaoDia[] {
  if (kcalMeta == null || kcalMeta <= 0) return []
  return PROGRESSAO_PCTS.map((pct, i) => {
    const kcalDia = kcalMeta * pct / 100
    const volume = densidade != null && densidade > 0 && tempo != null && tempo > 0
      ? kcalDia / densidade / tempo
      : null
    return { dia: i + 1, pct, kcalDia, volume }
  })
}

// Sugestão de módulo proteico para fechar a lacuna (ptnSuplementar em g/dia).
// gramas = lacuna × dose / ptn_por_dose ; kcal = lacuna×4 + cho aportado pelo módulo.
export function moduloProteico(ptnSuplementar: number | null): ModuloProteicoItem[] {
  if (ptnSuplementar == null || ptnSuplementar <= 0) return []
  return MODULOS_PROTEICOS.map(m => {
    const gramas = ptnSuplementar * m.dose / m.ptn
    const kcalAdicionada = ptnSuplementar * 4 + gramas * m.cho / m.dose
    return { nome: m.nome, gramas, kcalAdicionada }
  })
}

export function calcularDietaEnteral(e: EntradaDieta): ResultadoDietaEnteral {
  const r: ResultadoDietaEnteral = { ...VAZIO, progressao: [], moduloProteico: [] }

  const dens   = e.densidadeKcalMl
  const ptnGL  = e.proteinaGL
  const volume = e.volume       // ml/h (contínuo) ou ml/horário (intermitente)
  const tempo  = e.tempo        // horas de infusão (contínuo) ou nº de horários (intermitente)
  const peso   = e.peso

  if (volume != null && volume > 0 && tempo != null && tempo > 0) {
    r.vt = volume * tempo
  }

  if (r.vt != null) {
    if (dens != null)  r.kcal = dens * r.vt
    if (ptnGL != null) r.ptn  = ptnGL * r.vt / 1000

    if (peso != null && peso > 0) {
      if (r.kcal != null) r.kcalKg = r.kcal / peso
      if (r.ptn  != null) r.ptnKg  = r.ptn / peso
    }

    if (e.kcalMeta != null && e.kcalMeta > 0 && r.kcal != null) {
      r.percVct = r.kcal * 100 / e.kcalMeta
    }
    if (e.ptnMeta != null && e.ptnMeta > 0 && r.ptn != null) {
      r.percPtn = r.ptn * 100 / e.ptnMeta
    }
  }

  // Volume pleno: volume (ml/h ou ml/horário) necessário para atingir a meta calórica.
  if (e.kcalMeta != null && e.kcalMeta > 0 && dens != null && dens > 0 && tempo != null && tempo > 0) {
    r.volumePleno = (e.kcalMeta / dens) / tempo
    // Proteína entregue nesse volume pleno (M = L×S2×C/1000).
    if (ptnGL != null) r.ptnPleno = (r.volumePleno * tempo * ptnGL) / 1000
  }

  // Lacuna proteica = meta − ofertada pela dieta (N = P5 − G).
  if (e.ptnMeta != null && e.ptnMeta > 0 && r.ptn != null) {
    r.ptnSuplementar = e.ptnMeta - r.ptn
  }

  // Modelo de progressão (1º–4º dia) e sugestão de módulo proteico.
  r.progressao     = progressaoDieta(e.kcalMeta, dens, tempo)
  r.moduloProteico = moduloProteico(r.ptnSuplementar)

  return r
}
