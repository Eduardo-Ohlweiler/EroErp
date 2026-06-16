// Lógica de cálculo nutricional pediátrico — espelha a planilha Pediatria.xlsx.
// Estado nutricional pela OMS (percentis), necessidades pelas DRIs (2002) e dieta láctea prescrita.

import { PERCENTIL_M, PERCENTIL_F, type PercentilLinha } from "./percentilOMS"
import type { EntradaPediatrica, ResultadoPediatrico, Sexo } from "./types"

function linhaPercentil(sexo: Sexo, idadeMeses: number): PercentilLinha | undefined {
  const tabela = sexo === "M" ? PERCENTIL_M : PERCENTIL_F
  return tabela.find(l => l.m === idadeMeses)
}

// Replica CHOOSE(1 + (valor>=p15) + (valor>p85), baixo, medio, alto) da planilha.
function classificar(
  valor: number, p15: number, p85: number, labels: [string, string, string],
): string {
  const idx = (valor >= p15 ? 1 : 0) + (valor > p85 ? 1 : 0)
  return labels[idx]
}

const RESULTADO_VAZIO: ResultadoPediatrico = {
  imc: null,
  classifPesoIdade: null,
  classifEstaturaIdade: null,
  classifImcIdade: null,
  vet: null,
  proteinaNecessidade: null,
  vezesDia: null,
  volumeTotal: null,
  caloriasTotais: null,
  proteinaTotal: null,
  percCalorico: null,
  percProteico: null,
}

export function calcularPediatria(e: EntradaPediatrica): ResultadoPediatrico {
  const r: ResultadoPediatrico = { ...RESULTADO_VAZIO }

  const peso  = e.pesoKg ?? NaN
  const est   = e.estaturaCm ?? NaN
  const idade = e.idadeMeses

  // IMC
  if (peso > 0 && est > 0) {
    r.imc = peso / Math.pow(est / 100, 2)
  }

  // Estado nutricional (OMS) — válido de 0 a 60 meses
  if (idade != null && idade >= 0 && idade <= 60) {
    const linha = linhaPercentil(e.sexo, idade)
    if (linha) {
      if (peso > 0) {
        r.classifPesoIdade = classificar(peso, linha.pP15, linha.pP85,
          ["Baixo peso", "Peso adequado", "Acima do peso"])
      }
      if (est > 0) {
        r.classifEstaturaIdade = classificar(est, linha.eP15, linha.eP85,
          ["Baixa estatura", "Adequada", "Estatura alta"])
      }
      if (r.imc != null) {
        r.classifImcIdade = classificar(r.imc, linha.iP15, linha.iP85,
          ["Magreza", "IMC adequado", "Sobrepeso"])
      }
    }
  }

  // VET (kcal/dia) — DRIs, válido até 35 meses: (89·peso − 100) + ajuste por faixa
  if (idade != null && peso > 0) {
    let ajuste: number | null = null
    if (idade <= 3)       ajuste = 175
    else if (idade <= 6)  ajuste = 56
    else if (idade <= 12) ajuste = 22
    else if (idade <= 35) ajuste = 20
    if (ajuste != null) r.vet = (89 * peso - 100) + ajuste
  }

  // Proteína (g/dia) — DRIs, válido até 36 meses
  if (idade != null && idade >= 0) {
    if (idade <= 6)       r.proteinaNecessidade = 9.1
    else if (idade <= 12) r.proteinaNecessidade = 11
    else if (idade <= 36) r.proteinaNecessidade = 13
  }

  // Dieta láctea prescrita
  const kcal = e.kcalPor100ml ?? null
  const prot = e.proteinaPor100ml ?? null
  const vol  = e.volumeMl ?? null
  const freq = e.frequenciaHoras ?? null

  if (freq != null && freq > 0) {
    r.vezesDia = 24 / freq
    if (vol != null && vol > 0) {
      r.volumeTotal = r.vezesDia * vol
      if (kcal != null) {
        r.caloriasTotais = (kcal * r.volumeTotal) / 100
        if (r.vet != null && r.vet > 0) r.percCalorico = (r.caloriasTotais / r.vet) * 100
      }
      if (prot != null) {
        r.proteinaTotal = (prot * r.volumeTotal) / 100
        if (r.proteinaNecessidade != null && r.proteinaNecessidade > 0) {
          r.percProteico = (r.proteinaTotal / r.proteinaNecessidade) * 100
        }
      }
    }
  }

  return r
}
