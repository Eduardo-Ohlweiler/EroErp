// Cálculos antropométricos — espelha a planilha de Terapia Nutricional.
// Funções puras, sem React. Fidelidade à planilha é o requisito #1.

import type { EntradaAntropometria, ResultadoAntropometria } from "./types"
import {
  cbP50, classifAdequacaoCb, classifImcOms, classifImcOpas,
  classifPerdaPeso, type JanelaPerda,
} from "./tabelas"

const VAZIO: ResultadoAntropometria = {
  alturaEstimada: null, pesoEstimadoChumlea: null, pesoEstimadoJung: null,
  pesoEstimadoRabito: null, imc: null, classifImcOms: null, classifImcOpas: null,
  pesoIdeal: null, pesoIdealImc25: null, pesoAjustado: null, percPerdaPeso: null,
  classifPerdaPeso: null, percAdequacaoCb: null, classifAdequacaoCb: null,
  classifDeplecaoCp: null,
}

// Altura estimada — Chumlea 1985 (a partir da altura do joelho).
export function alturaEstimadaChumlea(sexo: "M" | "F", idade: number, aj: number): number {
  return sexo === "M"
    ? 64.19 - 0.04 * idade + 2.02 * aj
    : 84.88 - 0.24 * idade + 1.83 * aj
}

// Peso estimado — Chumlea 1988 (sexo + raça + faixa etária; ≥60 = idoso).
export function pesoEstimadoChumlea(
  sexo: "M" | "F", raca: "BRANCO" | "NEGRO", idade: number, aj: number, cb: number,
): number {
  const idoso = idade >= 60
  if (sexo === "M") {
    if (raca === "BRANCO") return idoso ? 1.1 * aj + 3.07 * cb - 75.81 : 1.19 * aj + 3.14 * cb - 86.82
    return idoso ? 0.44 * aj + 2.86 * cb - 39.21 : 1.09 * aj + 3.14 * cb - 83.72
  }
  if (raca === "BRANCO") return idoso ? 1.09 * aj + 2.68 * cb - 65.51 : 1.01 * aj + 2.81 * cb - 66.04
  return idoso ? 1.5 * aj + 2.58 * cb - 84.22 : 1.24 * aj + 2.97 * cb - 82.48
}

// Peso estimado — Jung 2004.
export function pesoEstimadoJung(sexo: "M" | "F", idade: number, aj: number, cb: number): number {
  return sexo === "M"
    ? 0.928 * aj + 2.508 * cb - 0.144 * idade - 42.543
    : 0.826 * aj + 2.116 * cb - 0.133 * idade - 31.486
}

// Peso estimado — Rabito 2008 (s = 1 Homem, 2 Mulher).
export function pesoEstimadoRabito(sexo: "M" | "F", cb: number, ca: number, cp: number): number {
  const s = sexo === "M" ? 1 : 2
  return 0.5759 * cb + 0.5263 * ca + 1.2452 * cp - 4.8689 * s - 32.9241
}

// Peso ideal a partir de IMC alvo.
export function pesoIdealPorImc(sexo: "M" | "F", alturaCm: number, imcAlvo?: number): number {
  const alvo = imcAlvo ?? (sexo === "M" ? 22 : 20.8)
  const m = alturaCm / 100
  return alvo * m * m
}

export function pesoAjustado(pesoAtual: number, pesoIdeal: number): number {
  return (pesoAtual - pesoIdeal) * 0.33 + pesoIdeal
}

export function calcularAntropometria(e: EntradaAntropometria): ResultadoAntropometria {
  const r: ResultadoAntropometria = { ...VAZIO }

  const sexo  = e.sexo
  const raca  = e.raca
  const idade = e.idade
  const aj    = e.aj
  const cb    = e.cb
  const ca    = e.ca
  const cp    = e.cp
  const pAtual = e.pesoAtual
  const pUsual = e.pesoUsual

  // Altura: usa a informada; senão estima por Chumlea.
  let altura = e.altura
  if ((altura == null || altura <= 0) && idade != null && aj != null && aj > 0) {
    r.alturaEstimada = alturaEstimadaChumlea(sexo, idade, aj)
    altura = r.alturaEstimada
  } else if (idade != null && aj != null && aj > 0) {
    r.alturaEstimada = alturaEstimadaChumlea(sexo, idade, aj)
  }

  // Pesos estimados
  if (idade != null && aj != null && aj > 0 && cb != null && cb > 0) {
    r.pesoEstimadoChumlea = pesoEstimadoChumlea(sexo, raca, idade, aj, cb)
    r.pesoEstimadoJung    = pesoEstimadoJung(sexo, idade, aj, cb)
  }
  if (cb != null && cb > 0 && ca != null && ca > 0 && cp != null && cp > 0) {
    r.pesoEstimadoRabito = pesoEstimadoRabito(sexo, cb, ca, cp)
  }

  // Peso para os cálculos seguintes: informado ou (na ausência) estimativa de Chumlea.
  const peso = (pAtual != null && pAtual > 0) ? pAtual : r.pesoEstimadoChumlea

  // IMC + classificações
  if (peso != null && peso > 0 && altura != null && altura > 0) {
    const m = altura / 100
    r.imc = peso / (m * m)
    r.classifImcOms = classifImcOms(r.imc)
    if (idade != null && idade >= 60) r.classifImcOpas = classifImcOpas(r.imc)
  }

  // Peso ideal (alvo padrão IMC 22 H / 20.8 M) + variante IMC 25 + peso ajustado
  if (altura != null && altura > 0) {
    r.pesoIdeal      = pesoIdealPorImc(sexo, altura)
    r.pesoIdealImc25 = pesoIdealPorImc(sexo, altura, 25)
    if (peso != null && peso > 0) r.pesoAjustado = pesoAjustado(peso, r.pesoIdeal)
  }

  // % perda de peso (janela default 1 mês)
  if (pUsual != null && pUsual > 0 && pAtual != null && pAtual > 0) {
    r.percPerdaPeso    = (pUsual - pAtual) * 100 / pUsual
    r.classifPerdaPeso = classifPerdaPesoJanela(r.percPerdaPeso, "1_MES")
  }

  // % adequação CB
  if (cb != null && cb > 0 && idade != null) {
    const p50 = cbP50(idade, sexo)
    if (p50 != null && p50 > 0) {
      r.percAdequacaoCb    = cb / p50 * 100
      r.classifAdequacaoCb = classifAdequacaoCb(r.percAdequacaoCb)
    }
  }

  // Depleção da panturrilha
  if (cp != null && cp > 0) {
    const limite = sexo === "M" ? 34 : 33
    r.classifDeplecaoCp = cp < limite ? "Depleção muscular" : "Adequado"
  }

  return r
}

// Exposta recebendo a janela, conforme requisito.
export function classifPerdaPesoJanela(perc: number, janela: JanelaPerda): string {
  return classifPerdaPeso(perc, janela)
}
