// Hook compartilhado pela Calculadora Nutricional e pela Avaliação Nutricional (Form).
// Centraliza o estado dos 4 painéis de entrada e a cascata de cálculo (calcularTudo),
// evitando duplicação das fórmulas. As funções de cálculo continuam puras em ./calculo/.

import { useEffect, useState } from "react"
import { api }                  from "../../services/api"
import { useMessage }           from "../../hooks/useMessage"
import { calcularAntropometria } from "./calculo/calculoAntropometria"
import { calcularNecessidades }  from "./calculo/calculoNecessidades"
import { calcularDietaEnteral }  from "./calculo/calculoDietaEnteral"
import { calcularHidratacao }    from "./calculo/calculoHidratacao"
import type {
  EntradaAntropometria, ResultadoAntropometria,
  ResultadoNecessidades, ResultadoDietaEnteral, ResultadoHidratacao,
  FormulaEnteralOption, Sexo, Raca, FaseTerapia, ModoDieta,
} from "./calculo/types"

export const ANTRO_VAZIO: ResultadoAntropometria = {
  alturaEstimada: null, pesoEstimadoChumlea: null, pesoEstimadoJung: null,
  pesoEstimadoRabito: null, imc: null, classifImcOms: null, classifImcOpas: null,
  pesoIdeal: null, pesoIdealImc25: null, pesoAjustado: null, percPerdaPeso: null,
  classifPerdaPeso: null, percAdequacaoCb: null, classifAdequacaoCb: null,
  classifDeplecaoCp: null,
}
export const NEC_VAZIO: ResultadoNecessidades = {
  kcalMin: null, kcalMax: null, ptnMin: null, ptnMax: null,
  kcalTotal: null, ptnTotal: null, ptnHdIntermitente: null, ptnHdContinua: null,
}
export const DIETA_VAZIO: ResultadoDietaEnteral = {
  vt: null, kcal: null, ptn: null, kcalKg: null, ptnKg: null,
  percVct: null, percPtn: null, volumePleno: null,
  ptnPleno: null, ptnSuplementar: null, progressao: [], moduloProteico: [],
}
export const HIDRAT_VAZIO: ResultadoHidratacao = {
  necMin: null, necIdeal: null, percAgua: null, aguaDieta: null,
  aguaExtraMin: null, aguaExtraIdeal: null,
  dist4x: null, dist5x: null, dist6x: null, dist8x: null,
}

export function num(v: string): number | null {
  if (!v || v.trim() === "") return null
  const n = parseFloat(v.replace(",", "."))
  return Number.isNaN(n) ? null : n
}

export interface CalculoTudoResult {
  rAntro:   ResultadoAntropometria
  rNec:     ResultadoNecessidades
  rDieta:   ResultadoDietaEnteral
  rHidrat:  ResultadoHidratacao
  formula:  FormulaEnteralOption | undefined
  pesoBase: number | null
  entAntro: EntradaAntropometria
}

export function useCalculoNutricional() {
  const { showMessage } = useMessage()

  // ── Painel 1 — Antropometria ──────────────────────────────────────────────
  const [sexoVal,   setSexoVal]   = useState<Sexo>("M")
  const [racaVal,   setRacaVal]   = useState<Raca>("BRANCO")
  const [idadeVal,  setIdadeVal]  = useState("")
  const [cbVal,     setCbVal]     = useState("")
  const [cpVal,     setCpVal]     = useState("")
  const [caVal,     setCaVal]     = useState("")
  const [ajVal,     setAjVal]     = useState("")
  const [pesoVal,   setPesoVal]   = useState("")
  const [pesoUVal,  setPesoUVal]  = useState("")
  const [alturaVal, setAlturaVal] = useState("")

  // ── Painel 2 — Necessidades ───────────────────────────────────────────────
  const [faseVal,    setFaseVal]    = useState<FaseTerapia>("AGUDA")
  const [kcalKgVal,  setKcalKgVal]  = useState("")
  const [ptnKgVal,   setPtnKgVal]   = useState("")

  // ── Painel 3 — Dieta enteral ──────────────────────────────────────────────
  const [formulaId,  setFormulaId]  = useState("")
  const [modoVal,    setModoVal]    = useState<ModoDieta>("CONTINUO")
  const [volumeVal,  setVolumeVal]  = useState("")
  const [tempoVal,   setTempoVal]   = useState("")

  // ── Painel 4 — Hidratação ─────────────────────────────────────────────────
  const [volDietaVal, setVolDietaVal] = useState("")

  const [formulas,  setFormulas]  = useState<FormulaEnteralOption[]>([])

  // Resultados (estado compartilhado em cascata)
  const [antro,   setAntro]   = useState<ResultadoAntropometria>(ANTRO_VAZIO)
  const [nec,     setNec]     = useState<ResultadoNecessidades>(NEC_VAZIO)
  const [dieta,   setDieta]   = useState<ResultadoDietaEnteral>(DIETA_VAZIO)
  const [hidrat,  setHidrat]  = useState<ResultadoHidratacao>(HIDRAT_VAZIO)

  useEffect(() => {
    api.get<FormulaEnteralOption[]>("/formulas-enterais/select")
      .then(r => setFormulas(r.data ?? []))
      .catch(() => showMessage("error", "Erro ao carregar fórmulas enterais"))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function calcularTudo(): CalculoTudoResult {
    // ── 1. Antropometria ──
    const entAntro: EntradaAntropometria = {
      sexo:      sexoVal,
      raca:      racaVal,
      idade:     num(idadeVal),
      cb:        num(cbVal),
      cp:        num(cpVal),
      ca:        num(caVal),
      aj:        num(ajVal),
      pesoAtual: num(pesoVal),
      pesoUsual: num(pesoUVal),
      altura:    num(alturaVal),
    }
    const rAntro = calcularAntropometria(entAntro)
    setAntro(rAntro)

    // Peso compartilhado: peso atual informado ou estimativa de Chumlea.
    const pesoBase = entAntro.pesoAtual ?? rAntro.pesoEstimadoChumlea

    // ── 2. Necessidades ──
    const rNec = calcularNecessidades({
      peso:       pesoBase,
      pesoIdeal:  rAntro.pesoIdeal,
      imc:        rAntro.imc,
      fase:       faseVal,
      kcalKgAlvo: num(kcalKgVal),
      ptnKgAlvo:  num(ptnKgVal),
    })
    setNec(rNec)

    // Metas que alimentam a dieta: personalizadas se houver, senão média das faixas.
    const kcalMeta = rNec.kcalTotal
      ?? (rNec.kcalMin != null && rNec.kcalMax != null ? (rNec.kcalMin + rNec.kcalMax) / 2 : null)
    const ptnMeta  = rNec.ptnTotal
      ?? (rNec.ptnMin != null && rNec.ptnMax != null ? (rNec.ptnMin + rNec.ptnMax) / 2 : null)

    // ── 3. Dieta enteral ──
    const formula = formulas.find(f => String(f.id) === formulaId)
    const rDieta = calcularDietaEnteral({
      modo:            modoVal,
      densidadeKcalMl: formula?.densidadeKcalMl ?? null,
      proteinaGL:      formula?.proteinaGL ?? null,
      volume:          num(volumeVal),
      tempo:           num(tempoVal),
      peso:            pesoBase,
      kcalMeta,
      ptnMeta,
    })
    setDieta(rDieta)

    // ── 4. Hidratação ──
    // Volume de dieta/dia: informado, senão o VT calculado.
    const volDieta = num(volDietaVal) ?? rDieta.vt
    const rHidrat = calcularHidratacao({
      peso:            pesoBase,
      volumeDieta:     volDieta,
      densidadeKcalMl: formula?.densidadeKcalMl ?? null,
    })
    setHidrat(rHidrat)

    return { rAntro, rNec, rDieta, rHidrat, formula, pesoBase, entAntro }
  }

  return {
    // estado das entradas + setters
    sexoVal,   setSexoVal,
    racaVal,   setRacaVal,
    idadeVal,  setIdadeVal,
    cbVal,     setCbVal,
    cpVal,     setCpVal,
    caVal,     setCaVal,
    ajVal,     setAjVal,
    pesoVal,   setPesoVal,
    pesoUVal,  setPesoUVal,
    alturaVal, setAlturaVal,
    faseVal,   setFaseVal,
    kcalKgVal, setKcalKgVal,
    ptnKgVal,  setPtnKgVal,
    formulaId, setFormulaId,
    modoVal,   setModoVal,
    volumeVal, setVolumeVal,
    tempoVal,  setTempoVal,
    volDietaVal, setVolDietaVal,
    // dados auxiliares
    formulas,
    // resultados + setters (para preencher em edição)
    antro,  setAntro,
    nec,    setNec,
    dieta,  setDieta,
    hidrat, setHidrat,
    // ação
    calcularTudo,
  }
}
