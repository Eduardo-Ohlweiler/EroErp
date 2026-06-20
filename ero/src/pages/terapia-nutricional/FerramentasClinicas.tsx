// Ferramentas clínicas avulsas da Terapia Nutricional (aba "Cálculos" + "TNE Sistema aberto").
// Frontend puro — recalcula ao alterar os campos. Resultados em cards (estilo ResultadoNutricionalView).

import { useMemo, useState }    from "react"
import { FaStethoscope }        from "react-icons/fa6"
import { TPage }                from "../../components/tpage"
import { TPanel }               from "../../components/tpanel"
import { TRow }                 from "../../components/trow"
import { TCol }                 from "../../components/tcol"
import { TSpace }               from "../../components/tspace"
import { TEntry }               from "../../components/tentry"
import { TCombo }               from "../../components/tcombo"
import {
  noradrenalinaPorConcentracao, noradrenalinaPorAmpolas,
  balancoNitrogenado, caloriasPropofol,
  type ConcentracaoNora,
} from "./calculo/calculoClinico"
import { calcularSistemaAberto } from "./calculo/calculoSistemaAberto"

// ── helpers de exibição ─────────────────────────────────────────────────────────

function num(v: string): number | null {
  if (!v || v.trim() === "") return null
  const n = parseFloat(v.replace(",", "."))
  return Number.isNaN(n) ? null : n
}

function fmt(valor: number | null, casas = 1, sufixo = ""): string {
  if (valor == null || Number.isNaN(valor)) return "—"
  return `${valor.toFixed(casas)}${sufixo}`
}

function corBalanco(v: number | null): string {
  if (v == null) return "var(--text-primary)"
  return v >= 0 ? "#22c55e" : "#ef4444"
}

function Campo({ label, value, cor }: { label: string; value: string; cor?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-(--text-muted)">{label}</span>
      <div className="flex items-center h-9.5 bg-(--bg-input) border border-(--border) rounded-md px-3 select-none">
        <span className="text-sm font-semibold" style={{ color: cor ?? "var(--text-primary)" }}>{value}</span>
      </div>
    </div>
  )
}

const CONCENTRACAO_OPTIONS = [
  { value: "32", label: "Simples (32 mcg/ml)"      },
  { value: "64", label: "Concentrada (64 mcg/ml)"  },
]

// ── abas da página ───────────────────────────────────────────────────────────────
type AbaFerramenta = "noradrenalina" | "balanco" | "propofol" | "dieta"

const ABAS: { value: AbaFerramenta; label: string }[] = [
  { value: "noradrenalina", label: "Noradrenalina"      },
  { value: "balanco",       label: "Balanço Nitrogenado" },
  { value: "propofol",      label: "Propofol"           },
  { value: "dieta",         label: "Dieta Artesanal"    },
]

export default function FerramentasClinicas() {
  // ── aba ativa ──
  const [aba, setAba] = useState<AbaFerramenta>("noradrenalina")

  // ── Noradrenalina por concentração ──
  const [noraVol,  setNoraVol]  = useState("")
  const [noraPeso, setNoraPeso] = useState("")
  const [noraConc, setNoraConc] = useState<ConcentracaoNora>(32)

  // ── Noradrenalina por ampolas ──
  const [ampMlH,   setAmpMlH]   = useState("")
  const [ampN,     setAmpN]     = useState("")
  const [ampSoro,  setAmpSoro]  = useState("")
  const [ampPeso,  setAmpPeso]  = useState("")

  // ── Balanço nitrogenado ──
  const [bnPtn,    setBnPtn]    = useState("")
  const [bnUreia,  setBnUreia]  = useState("")

  // ── Propofol ──
  const [propVol,  setPropVol]  = useState("")

  // ── Sistema aberto ──
  const [saVet,      setSaVet]      = useState("")
  const [saPeso,     setSaPeso]     = useState("")
  const [saTrophic,  setSaTrophic]  = useState("")
  const [saCarbodex, setSaCarbodex] = useState("")
  const [saAlbumix,  setSaAlbumix]  = useState("")
  const [saOleo,     setSaOleo]     = useState("")

  // ── resultados (memoizados — recalcula ao alterar inputs) ──
  const noraConcRes = useMemo(
    () => noradrenalinaPorConcentracao(num(noraVol), num(noraPeso), noraConc),
    [noraVol, noraPeso, noraConc],
  )
  const noraAmpRes = useMemo(
    () => noradrenalinaPorAmpolas(num(ampMlH), num(ampN), num(ampSoro), num(ampPeso)),
    [ampMlH, ampN, ampSoro, ampPeso],
  )
  const bn = useMemo(
    () => balancoNitrogenado(num(bnPtn), num(bnUreia)),
    [bnPtn, bnUreia],
  )
  const propRes = useMemo(() => caloriasPropofol(num(propVol)), [propVol])
  const sa = useMemo(
    () => calcularSistemaAberto({
      vet:              num(saVet),
      peso:             num(saPeso),
      dosesTrophic:     num(saTrophic),
      dosesCarbodex:    num(saCarbodex),
      medidoresAlbumix: num(saAlbumix),
      colheresOleo:     num(saOleo),
    }),
    [saVet, saPeso, saTrophic, saCarbodex, saAlbumix, saOleo],
  )

  return (
    <TPage title="Ferramentas Clínicas" breadcrumb={["Terapia Nutricional", "Ferramentas"]}>

      {/* ── Seletor de abas (segmented control) ──────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 p-1 bg-(--bg-input) rounded-lg mb-4 overflow-x-auto">
        {ABAS.map((a) => (
          <button
            key      ={a.value}
            type     ="button"
            onClick  ={() => setAba(a.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition
              ${aba === a.value
                ? "bg-(--accent) text-white shadow-sm"
                : "text-(--text-muted) hover:text-(--text-primary)"}`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* ── Noradrenalina ──────────────────────────────────────────────────────── */}
      {aba === "noradrenalina" && (
      <TPanel title="Noradrenalina">
        <TRow>
          <TCol>
            <TEntry name="noraVol" label="Volume da bomba (ml/h)" placeholder="Ex: 10" width="100%"
              mask="numerodecimal2" defaultValue={noraVol} onChange={setNoraVol} />
          </TCol>
          <TCol>
            <TEntry name="noraPeso" label="Peso (kg)" placeholder="Ex: 70" width="100%"
              mask="numerodecimal2" defaultValue={noraPeso} onChange={setNoraPeso} />
          </TCol>
          <TCol>
            <TCombo name="noraConc" label="Concentração" width="100%" options={CONCENTRACAO_OPTIONS}
              defaultValue={String(noraConc)} onChange={(v) => setNoraConc(Number(v) as ConcentracaoNora)} />
          </TCol>
          <TSpace />
        </TRow>
        <div className="border-t border-(--border) my-2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Campo label="Dose por concentração" value={fmt(noraConcRes, 3, " mcg/kg/min")} />
        </div>

        <div className="text-xs font-semibold text-(--text-muted) uppercase tracking-wide mt-5 mb-2">
          Por ampolas (4 mg/ampola)
        </div>
        <TRow>
          <TCol>
            <TEntry name="ampMlH" label="Vazão noradrenalina (ml/h)" placeholder="Ex: 10" width="100%"
              mask="numerodecimal2" defaultValue={ampMlH} onChange={setAmpMlH} />
          </TCol>
          <TCol>
            <TEntry name="ampN" label="Nº de ampolas" placeholder="Ex: 4" width="100%"
              mask="numerodecimal2" defaultValue={ampN} onChange={setAmpN} />
          </TCol>
          <TCol>
            <TEntry name="ampSoro" label="Volume do soro (ml)" placeholder="Ex: 250" width="100%"
              mask="numerodecimal2" defaultValue={ampSoro} onChange={setAmpSoro} />
          </TCol>
          <TCol>
            <TEntry name="ampPeso" label="Peso (kg)" placeholder="Ex: 70" width="100%"
              mask="numerodecimal2" defaultValue={ampPeso} onChange={setAmpPeso} />
          </TCol>
        </TRow>
        <div className="border-t border-(--border) my-2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Campo label="Dose por ampolas" value={fmt(noraAmpRes, 3, " mcg/kg/min")} />
        </div>
      </TPanel>
      )}

      {/* ── Balanço nitrogenado ────────────────────────────────────────────────── */}
      {aba === "balanco" && (
      <TPanel title="Balanço Nitrogenado">
        <TRow>
          <TCol>
            <TEntry name="bnPtn" label="Proteína ingerida (g/dia)" placeholder="Ex: 80" width="100%"
              mask="numerodecimal2" defaultValue={bnPtn} onChange={setBnPtn} />
          </TCol>
          <TCol>
            <TEntry name="bnUreia" label="Ureia urinária 24h (g)" placeholder="Ex: 20" width="100%"
              mask="numerodecimal2" defaultValue={bnUreia} onChange={setBnUreia} />
          </TCol>
          <TSpace />
        </TRow>
        <div className="border-t border-(--border) my-2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Campo label="Nitrogênio ingerido"  value={fmt(bn.nIngerido, 2, " g/dia")} />
          <Campo label="Nitrogênio excretado" value={fmt(bn.nExcretado, 2, " g/dia")} />
          <Campo label="Balanço nitrogenado"  value={fmt(bn.balanco, 2, " g/dia")} cor={corBalanco(bn.balanco)} />
        </div>
      </TPanel>
      )}

      {/* ── Calorias do propofol ───────────────────────────────────────────────── */}
      {aba === "propofol" && (
      <TPanel title="Calorias do Propofol">
        <TRow>
          <TCol>
            <TEntry name="propVol" label="Vazão do propofol (ml/h)" placeholder="Ex: 10" width="100%"
              mask="numerodecimal2" defaultValue={propVol} onChange={setPropVol} />
          </TCol>
          <TSpace />
        </TRow>
        <div className="border-t border-(--border) my-2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Campo label="Calorias do propofol" value={fmt(propRes, 0, " kcal/dia")} />
        </div>
      </TPanel>
      )}

      {/* ── Dieta artesanal (sistema aberto) ───────────────────────────────────── */}
      {aba === "dieta" && (
      <TPanel title="Dieta Artesanal (Sistema Aberto)">
        <TRow>
          <TCol>
            <TEntry name="saVet" label="VET desejado (kcal/dia)" placeholder="Ex: 1800" width="100%"
              mask="numerodecimal2" defaultValue={saVet} onChange={setSaVet} />
          </TCol>
          <TCol>
            <TEntry name="saPeso" label="Peso (kg)" placeholder="Ex: 70" width="100%"
              mask="numerodecimal2" defaultValue={saPeso} onChange={setSaPeso} />
          </TCol>
          <TCol>
            <TEntry name="saTrophic" label="Doses Trophic (vazio = sugerir)" placeholder="Sugerido" width="100%"
              mask="numerodecimal2" defaultValue={saTrophic} onChange={setSaTrophic} />
          </TCol>
          <TSpace />
        </TRow>
        <TRow>
          <TCol>
            <TEntry name="saCarbodex" label="Medidas de Carbodex" placeholder="Ex: 2" width="100%"
              mask="numerodecimal2" defaultValue={saCarbodex} onChange={setSaCarbodex} />
          </TCol>
          <TCol>
            <TEntry name="saAlbumix" label="Medidores de Albumix" placeholder="Ex: 1" width="100%"
              mask="numerodecimal2" defaultValue={saAlbumix} onChange={setSaAlbumix} />
          </TCol>
          <TCol>
            <TEntry name="saOleo" label="Colheres de óleo (13 ml)" placeholder="Ex: 1" width="100%"
              mask="numerodecimal2" defaultValue={saOleo} onChange={setSaOleo} />
          </TCol>
          <TSpace />
        </TRow>

        <div className="border-t border-(--border) my-2" />
        <div className="text-xs font-semibold text-(--text-muted) uppercase tracking-wide mb-2">Energia & macros</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Campo label="Doses de Trophic"  value={fmt(sa.dosesTrophic, 1)} />
          <Campo label="Energia total"     value={fmt(sa.kcalTotal, 0, " kcal/dia")} />
          <Campo label="Kcal / kg"         value={fmt(sa.kcalKg, 1)} />
          <Campo label="Proteína / kg"     value={fmt(sa.ptnKg, 2)} />
          <Campo label="Carboidrato total" value={fmt(sa.choTotal, 1, " g")} />
          <Campo label="Proteína total"    value={fmt(sa.ptnTotal, 1, " g")} />
          <Campo label="Lipídio total"     value={fmt(sa.lipTotal, 1, " g")} />
          <Campo label="Energia base"      value={fmt(sa.kcalBase, 0, " kcal")} />
        </div>

        <div className="text-xs font-semibold text-(--text-muted) uppercase tracking-wide mt-5 mb-2">Distribuição calórica</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Campo label="% Carboidrato" value={fmt(sa.percCho, 1, " %")} />
          <Campo label="% Proteína"    value={fmt(sa.percPtn, 1, " %")} />
          <Campo label="% Lipídio"     value={fmt(sa.percLip, 1, " %")} />
        </div>

        <div className="text-xs font-semibold text-(--text-muted) uppercase tracking-wide mt-5 mb-2">Água</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Campo label="Água total"     value={fmt(sa.agua, 0, " ml/dia")} />
          <Campo label="Água por dose (4x)" value={fmt(sa.aguaPorDose4, 0, " ml")} />
        </div>

        <div className="text-xs font-semibold text-(--text-muted) uppercase tracking-wide mt-5 mb-2">Embalagens estimadas (mês)</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Campo label="Latas Trophic"  value={fmt(sa.latasTrophic, 1)} />
          <Campo label="Latas Carbodex" value={fmt(sa.latasCarbodex, 1)} />
          <Campo label="Latas Albumix"  value={fmt(sa.latasAlbumix, 1)} />
          <Campo label="Frascos óleo"   value={fmt(sa.latasOleo, 1)} />
        </div>

        <div className="text-xs font-semibold text-(--text-muted) uppercase tracking-wide mt-5 mb-2">Receita por administração (÷ 4)</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Campo label="Trophic (dosadores)"  value={fmt(sa.receitaTrophic, 2)} />
          <Campo label="Carbodex (medidas)"   value={fmt(sa.receitaCarbodex, 2)} />
          <Campo label="Albumix (medidores)"  value={fmt(sa.receitaAlbumix, 2)} />
          <Campo label="Óleo (ml)"            value={fmt(sa.receitaOleo, 2)} />
        </div>
      </TPanel>
      )}

      <div className="flex items-center gap-2 text-xs text-(--text-muted) mt-2">
        <FaStethoscope /> Cálculos recalculados automaticamente ao alterar os campos.
      </div>
    </TPage>
  )
}
