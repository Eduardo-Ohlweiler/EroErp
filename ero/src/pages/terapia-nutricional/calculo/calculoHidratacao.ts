// Cálculo de hidratação — espelha a planilha de Terapia Nutricional.
// Funções puras, sem React.

import type { EntradaHidratacao, ResultadoHidratacao } from "./types"

const VAZIO: ResultadoHidratacao = {
  necMin: null, necIdeal: null, percAgua: null, aguaDieta: null,
  aguaExtraMin: null, aguaExtraIdeal: null,
  dist4x: null, dist5x: null, dist6x: null, dist8x: null,
}

// % de água da fórmula conforme densidade calórica.
export function percAguaPorDensidade(densidadeKcalMl: number): number {
  if (densidadeKcalMl >= 2.0) return 70
  if (densidadeKcalMl >= 1.5) return 75
  if (densidadeKcalMl >= 1.2) return 80
  return 85
}

export function calcularHidratacao(e: EntradaHidratacao): ResultadoHidratacao {
  const r: ResultadoHidratacao = { ...VAZIO }

  const peso = e.peso
  const vol  = e.volumeDieta
  const dens = e.densidadeKcalMl

  if (peso != null && peso > 0) {
    r.necMin   = peso * 25
    r.necIdeal = peso * 30
  }

  if (dens != null && dens > 0) {
    r.percAgua = percAguaPorDensidade(dens)
    if (vol != null && vol > 0) {
      r.aguaDieta = vol * r.percAgua / 100
    }
  }

  if (r.necMin != null && r.aguaDieta != null) {
    r.aguaExtraMin = r.necMin - r.aguaDieta
  }
  if (r.necIdeal != null && r.aguaDieta != null) {
    r.aguaExtraIdeal = r.necIdeal - r.aguaDieta
    r.dist4x = r.aguaExtraIdeal / 4
    r.dist5x = r.aguaExtraIdeal / 5
    r.dist6x = r.aguaExtraIdeal / 6
    r.dist8x = r.aguaExtraIdeal / 8
  }

  return r
}
