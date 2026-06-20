// Cálculos clínicos avulsos da Terapia Nutricional (aba "Cálculos" da planilha).
// Funções puras — frontend only, sem backend. Retornam null quando faltam dados.

// ── Noradrenalina ───────────────────────────────────────────────────────────────

export type ConcentracaoNora = 32 | 64  // mcg/ml — 32 = simples, 64 = concentrada

/**
 * Noradrenalina por concentração (mcg/ml).
 * mcg/kg/min = volume(ml/h) × concentração / peso / 60.
 */
export function noradrenalinaPorConcentracao(
  volumeMlH:    number | null,
  peso:         number | null,
  concentracao: ConcentracaoNora,
): number | null {
  if (volumeMlH == null || peso == null || peso <= 0) return null
  return (volumeMlH * concentracao) / peso / 60
}

/**
 * Noradrenalina por ampolas (4 mg por ampola).
 * mcg/kg/min = nAmpolas × 4 / qtdSoroMl / 60 / peso × mlNoraH × 1000.
 */
export function noradrenalinaPorAmpolas(
  mlNoraH:   number | null,
  nAmpolas:  number | null,
  qtdSoroMl: number | null,
  peso:      number | null,
): number | null {
  if (mlNoraH == null || nAmpolas == null || qtdSoroMl == null || peso == null) return null
  if (qtdSoroMl <= 0 || peso <= 0) return null
  return ((nAmpolas * 4) / qtdSoroMl / 60 / peso) * mlNoraH * 1000
}

// ── Balanço nitrogenado ──────────────────────────────────────────────────────────

export interface ResultadoBalancoNitrogenado {
  nIngerido:  number | null   // g/dia
  nExcretado: number | null   // g/dia
  balanco:    number | null   // g/dia (positivo = anabolismo)
}

/**
 * Balanço nitrogenado.
 * N ingerido  = proteína ingerida (g) / 6.25.
 * N excretado = ureia urinária 24h / 2.14 + 4 (perdas insensíveis).
 * Balanço     = N ingerido − N excretado.
 */
export function balancoNitrogenado(
  ptnIngeridaG:     number | null,
  ureiaUrinaria24h: number | null,
): ResultadoBalancoNitrogenado {
  const nIngerido  = ptnIngeridaG != null ? ptnIngeridaG / 6.25 : null
  const nExcretado = ureiaUrinaria24h != null ? ureiaUrinaria24h / 2.14 + 4 : null
  const balanco    = nIngerido != null && nExcretado != null ? nIngerido - nExcretado : null
  return { nIngerido, nExcretado, balanco }
}

// ── Calorias do propofol ───────────────────────────────────────────────────────

/**
 * Calorias diárias provenientes do propofol (lipídio 1.1 kcal/ml).
 * kcal/dia = volume(ml/h) × 24 × 1.1.
 */
export function caloriasPropofol(volumeMlH: number | null): number | null {
  if (volumeMlH == null) return null
  return volumeMlH * 24 * 1.1
}
