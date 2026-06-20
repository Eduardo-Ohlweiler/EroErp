// Necessidades nutricionais (kcal e proteína) — espelha a planilha de Terapia Nutricional.
// Funções puras, sem React.

import type { EntradaNecessidades, ResultadoNecessidades } from "./types"

const VAZIO: ResultadoNecessidades = {
  kcalMin: null, kcalMax: null, ptnMin: null, ptnMax: null,
  kcalTotal: null, ptnTotal: null, ptnHdIntermitente: null, ptnHdContinua: null,
}

export function calcularNecessidades(e: EntradaNecessidades): ResultadoNecessidades {
  const r: ResultadoNecessidades = { ...VAZIO }

  const peso      = e.peso
  const pesoIdeal = e.pesoIdeal
  const imc       = e.imc

  if (peso != null && peso > 0) {
    const obeso = imc != null && imc > 30

    if (obeso) {
      // Obeso: faixas por peso atual (>30) ou peso ideal (>40); proteína por peso ideal.
      const pBase = imc! > 40 && pesoIdeal != null && pesoIdeal > 0 ? pesoIdeal : peso
      if (imc! > 40) {
        r.kcalMin = 22 * pBase
        r.kcalMax = 25 * pBase
      } else {
        r.kcalMin = 11 * peso
        r.kcalMax = 14 * peso
      }
      const pPtn = pesoIdeal != null && pesoIdeal > 0 ? pesoIdeal : peso
      const ptnKgMin = 2.0
      const ptnKgMax = imc! > 50 ? 2.5 : 2.0
      r.ptnMin = ptnKgMin * pPtn
      r.ptnMax = ptnKgMax * pPtn
    } else if (e.fase === "AGUDA") {
      r.kcalMin = 15 * peso
      r.kcalMax = 20 * peso
      r.ptnMin  = 1.2 * peso
      r.ptnMax  = 1.5 * peso
    } else {
      // REABILITACAO
      r.kcalMin = 25 * peso
      r.kcalMax = 30 * peso
      r.ptnMin  = 1.5 * peso
      r.ptnMax  = 2.0 * peso
    }

    // Hemodiálise
    r.ptnHdIntermitente = 1.8 * peso
    r.ptnHdContinua     = 2.0 * peso

    // Personalizado
    if (e.kcalKgAlvo != null && e.kcalKgAlvo > 0) r.kcalTotal = e.kcalKgAlvo * peso
    if (e.ptnKgAlvo  != null && e.ptnKgAlvo  > 0) r.ptnTotal  = e.ptnKgAlvo  * peso
  }

  return r
}
