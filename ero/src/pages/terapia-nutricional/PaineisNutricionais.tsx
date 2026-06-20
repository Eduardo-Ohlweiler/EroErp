// Os 4 painéis de entrada + resultados em cascata da Terapia Nutricional.
// Compartilhado entre a Calculadora e a Avaliação Nutricional (Form).
// Recebe o estado do hook useCalculoNutricional via props.

import { FaCalculator } from "react-icons/fa6"
import { TPanel }       from "../../components/tpanel"
import { TRow }         from "../../components/trow"
import { TCol }         from "../../components/tcol"
import { TSpace }       from "../../components/tspace"
import { TEntry }       from "../../components/tentry"
import { TCombo }       from "../../components/tcombo"
import { TButton }      from "../../components/tbutton"
import {
  ResultadoAntropometriaView, ResultadoNecessidadesView,
  ResultadoDietaView, ResultadoHidratacaoView,
} from "./ResultadoNutricionalView"
import type { useCalculoNutricional } from "./useCalculoNutricional"
import type { Sexo, Raca, FaseTerapia, ModoDieta } from "./calculo/types"

export const SEXO_OPTIONS = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Feminino"  },
]
export const RACA_OPTIONS = [
  { value: "BRANCO", label: "Branco" },
  { value: "NEGRO",  label: "Negro"  },
]
export const FASE_OPTIONS = [
  { value: "AGUDA",        label: "Aguda" },
  { value: "REABILITACAO", label: "Reabilitação" },
]
export const MODO_OPTIONS = [
  { value: "CONTINUO",     label: "Contínuo" },
  { value: "INTERMITENTE", label: "Intermitente" },
]

type Calc = ReturnType<typeof useCalculoNutricional>

interface Props {
  calc:        Calc
  /** Renderiza o botão "Calcular" no fim do painel de hidratação (type=submit). */
  showCalcular?: boolean
}

export function PaineisNutricionais({ calc, showCalcular = true }: Props) {
  const formulaOptions = calc.formulas.map(f => ({
    value: String(f.id),
    label: `${f.nome} (${f.densidadeKcalMl} kcal/ml · ${f.proteinaGL} g prot/L)`,
  }))

  const labelVolume = calc.modoVal === "CONTINUO" ? "Volume (ml/h)"    : "Volume (ml/horário)"
  const labelTempo  = calc.modoVal === "CONTINUO" ? "Horas de infusão" : "Nº de horários/dia"

  return (
    <>
      {/* ── Painel 1 ──────────────────────────────────────────────────────── */}
      <TPanel title="Antropometria & Estimativas">
        <TRow>
          <TCol>
            <TCombo name="sexo" label="Sexo" width="100%" options={SEXO_OPTIONS}
              defaultValue={calc.sexoVal} onChange={v => calc.setSexoVal(v as Sexo)} />
          </TCol>
          <TCol>
            <TCombo name="raca" label="Raça" width="100%" options={RACA_OPTIONS}
              defaultValue={calc.racaVal} onChange={v => calc.setRacaVal(v as Raca)} />
          </TCol>
          <TCol>
            <TEntry name="idade" label="Idade (anos)" placeholder="Ex: 65" width="100%"
              mask="numero" defaultValue={calc.idadeVal} onChange={calc.setIdadeVal} />
          </TCol>
          <TCol>
            <TEntry name="altura" label="Altura (cm)" placeholder="Ex: 170,00" width="100%"
              mask="numerodecimal2" defaultValue={calc.alturaVal} onChange={calc.setAlturaVal} />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry name="cb" label="CB — braço (cm)" placeholder="Ex: 28,00" width="100%"
              mask="numerodecimal2" defaultValue={calc.cbVal} onChange={calc.setCbVal} />
          </TCol>
          <TCol>
            <TEntry name="cp" label="CP — panturrilha (cm)" placeholder="Ex: 33,00" width="100%"
              mask="numerodecimal2" defaultValue={calc.cpVal} onChange={calc.setCpVal} />
          </TCol>
          <TCol>
            <TEntry name="ca" label="CA — abdominal (cm)" placeholder="Ex: 90,00" width="100%"
              mask="numerodecimal2" defaultValue={calc.caVal} onChange={calc.setCaVal} />
          </TCol>
          <TCol>
            <TEntry name="aj" label="AJ — altura do joelho (cm)" placeholder="Ex: 50,00" width="100%"
              mask="numerodecimal2" defaultValue={calc.ajVal} onChange={calc.setAjVal} />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry name="pesoAtual" label="Peso atual (kg)" placeholder="Ex: 70,00" width="100%"
              mask="numerodecimal2" defaultValue={calc.pesoVal} onChange={calc.setPesoVal} />
          </TCol>
          <TCol>
            <TEntry name="pesoUsual" label="Peso usual (kg)" placeholder="Ex: 75,00" width="100%"
              mask="numerodecimal2" defaultValue={calc.pesoUVal} onChange={calc.setPesoUVal} />
          </TCol>
          <TSpace />
        </TRow>

        <div className="border-t border-(--border) my-2" />
        <ResultadoAntropometriaView r={calc.antro} />
      </TPanel>

      {/* ── Painel 2 ──────────────────────────────────────────────────────── */}
      <TPanel title="Necessidades Nutricionais">
        <TRow>
          <TCol>
            <TCombo name="fase" label="Fase da terapia" width="100%" options={FASE_OPTIONS}
              defaultValue={calc.faseVal} onChange={v => calc.setFaseVal(v as FaseTerapia)} />
          </TCol>
          <TCol>
            <TEntry name="kcalKgAlvo" label="Alvo kcal/kg (opcional)" placeholder="Ex: 25" width="100%"
              mask="numerodecimal2" defaultValue={calc.kcalKgVal} onChange={calc.setKcalKgVal} />
          </TCol>
          <TCol>
            <TEntry name="ptnKgAlvo" label="Alvo proteína g/kg (opcional)" placeholder="Ex: 1,5" width="100%"
              mask="numerodecimal2" defaultValue={calc.ptnKgVal} onChange={calc.setPtnKgVal} />
          </TCol>
          <TSpace />
        </TRow>

        {calc.antro.imc != null && calc.antro.imc > 30 ? (
          <p className="text-xs text-(--text-muted) mt-1">
            IMC &gt; 30: aplicada a regra de obesidade (calorias por peso atual/ideal e proteína por peso ideal).
            A <strong>fase</strong> não altera este cálculo.
          </p>
        ) : (
          <p className="text-xs text-(--text-muted) mt-1">
            Deixe os alvos em branco para usar a faixa da fase selecionada; preencha para calcular metas personalizadas.
          </p>
        )}

        <div className="border-t border-(--border) my-2" />
        <ResultadoNecessidadesView r={calc.nec} />
      </TPanel>

      {/* ── Painel 3 ──────────────────────────────────────────────────────── */}
      <TPanel title="Dieta Enteral">
        <TRow>
          <TCol flex={2}>
            <TCombo name="formulaEnteralId" label="Fórmula Enteral" width="100%"
              placeholder="Selecione a fórmula..." options={formulaOptions}
              defaultValue={calc.formulaId} onChange={calc.setFormulaId} />
          </TCol>
          <TCol>
            <TCombo name="modo" label="Modo de infusão" width="100%" options={MODO_OPTIONS}
              defaultValue={calc.modoVal} onChange={v => calc.setModoVal(v as ModoDieta)} />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry name="volume" label={labelVolume} placeholder="Ex: 100" width="100%"
              mask="numerodecimal2" defaultValue={calc.volumeVal} onChange={calc.setVolumeVal} />
          </TCol>
          <TCol>
            <TEntry name="tempo" label={labelTempo} placeholder="Ex: 20" width="100%"
              mask="numerodecimal2" defaultValue={calc.tempoVal} onChange={calc.setTempoVal} />
          </TCol>
          <TSpace />
        </TRow>

        <div className="border-t border-(--border) my-2" />
        <ResultadoDietaView r={calc.dieta} />
      </TPanel>

      {/* ── Painel 4 ──────────────────────────────────────────────────────── */}
      <TPanel title="Hidratação">
        <TRow>
          <TCol>
            <TEntry name="volumeDieta" label="Volume de dieta/dia (ml — opcional)"
              placeholder="Vazio = usa o volume total calculado" width="100%"
              mask="numerodecimal2" defaultValue={calc.volDietaVal} onChange={calc.setVolDietaVal} />
          </TCol>
          <TSpace />
        </TRow>

        <div className="border-t border-(--border) my-2" />
        <ResultadoHidratacaoView r={calc.hidrat} />

        {showCalcular && (
          <div className="flex justify-end mt-2">
            <TButton label="Calcular" type="submit" icon={<FaCalculator />} />
          </div>
        )}
      </TPanel>
    </>
  )
}
