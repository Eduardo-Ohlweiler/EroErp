// Tabelas de referência da planilha de Terapia Nutricional.
// Mantidas separadas das funções de cálculo para facilitar conferência com a planilha.

import type { Sexo } from "./types"

// ── CB P50 por faixa etária (anos) e sexo — Frisancho ──────────────────────────
export interface CbP50Linha {
  idadeMin:  number
  idadeMax:  number
  p50Homem:  number
  p50Mulher: number
}

export const CB_P50: CbP50Linha[] = [
  { idadeMin: 18,   idadeMax: 18.9, p50Homem: 30,   p50Mulher: 26.7 },
  { idadeMin: 19,   idadeMax: 19.9, p50Homem: 30.5, p50Mulher: 26.8 },
  { idadeMin: 20,   idadeMax: 29.9, p50Homem: 31.8, p50Mulher: 28.1 },
  { idadeMin: 30,   idadeMax: 39.9, p50Homem: 32.3, p50Mulher: 30.3 },
  { idadeMin: 40,   idadeMax: 49.9, p50Homem: 33,   p50Mulher: 31.4 },
  { idadeMin: 50,   idadeMax: 59.9, p50Homem: 32.6, p50Mulher: 31.9 },
  { idadeMin: 60,   idadeMax: 69.9, p50Homem: 32,   p50Mulher: 31.4 },
  { idadeMin: 70,   idadeMax: 79.9, p50Homem: 30.6, p50Mulher: 29.9 },
  { idadeMin: 80,   idadeMax: 90.9, p50Homem: 28.9, p50Mulher: 27.8 },
]

export function cbP50(idade: number, sexo: Sexo): number | null {
  const linha = CB_P50.find(l => idade >= l.idadeMin && idade <= l.idadeMax)
  if (!linha) {
    // Fora da faixa: usa o extremo mais próximo (≥80 usa última, <18 usa primeira).
    if (idade < CB_P50[0].idadeMin)               return sexo === "M" ? CB_P50[0].p50Homem : CB_P50[0].p50Mulher
    const ult = CB_P50[CB_P50.length - 1]
    if (idade > ult.idadeMax)                      return sexo === "M" ? ult.p50Homem : ult.p50Mulher
    return null
  }
  return sexo === "M" ? linha.p50Homem : linha.p50Mulher
}

// ── % de membros amputados — Osterkamp 1995 ────────────────────────────────────
export const PERC_AMPUTACAO: Record<string, number> = {
  MAO:                0.7,
  ANTEBRACO:          1.6,
  ANTEBRACO_MAO:      2.3,
  BRACO:              2.7,
  MEMBRO_SUPERIOR:    5,
  PE:                 1.5,
  PERNA:              4.4,
  MEMBRO_INFERIOR:    16,
}

// ── Classificação % adequação CB — padrão Frisancho/Blackburn ──────────────────
export function classifAdequacaoCb(perc: number): string {
  if (perc < 70)  return "Desnutrição grave"
  if (perc < 80)  return "Desnutrição moderada"
  if (perc < 90)  return "Desnutrição leve"
  if (perc <= 110) return "Eutrofia"
  if (perc <= 120) return "Sobrepeso"
  return "Obesidade"
}

// ── Classificação IMC OMS 1997 (adulto) ────────────────────────────────────────
export function classifImcOms(imc: number): string {
  if (imc < 18.5) return "Desnutrição"
  if (imc < 25)   return "Eutrofia"
  if (imc < 30)   return "Sobrepeso"
  return "Obesidade"
}

// ── Classificação IMC OPAS 2002 (idoso ≥ 60) ───────────────────────────────────
export function classifImcOpas(imc: number): string {
  if (imc < 23) return "Desnutrição"
  if (imc <= 28) return "Eutrofia"
  return "Excesso de peso"
}

// ── Classificação % perda de peso — Blackburn ──────────────────────────────────
// Janela em meses (ou fração: 0.25 ≈ 1 semana).
export type JanelaPerda = "1_SEMANA" | "1_MES" | "3_MESES" | "6_MESES"

const LIMITE_GRAVE: Record<JanelaPerda, number> = {
  "1_SEMANA": 2,
  "1_MES":    5,
  "3_MESES":  7.5,
  "6_MESES":  10,
}

export function classifPerdaPeso(perc: number, janela: JanelaPerda): string {
  const limite = LIMITE_GRAVE[janela]
  if (perc >= limite) return "Perda grave"
  if (perc > 0)       return "Perda significativa"
  return "Sem perda significativa"
}
