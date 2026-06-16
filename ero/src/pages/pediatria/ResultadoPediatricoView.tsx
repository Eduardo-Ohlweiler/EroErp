// Exibição read-only dos resultados do cálculo pediátrico.
// Renderizado a partir do estado React (texto/labels) — re-renderiza a cada novo cálculo.

import { TPanel } from "../../components/tpanel"
import type { ResultadoPediatrico } from "./calculo/types"

function fmt(valor: number | null, casas = 1, sufixo = ""): string {
  if (valor == null || Number.isNaN(valor)) return "—"
  return `${valor.toFixed(casas)}${sufixo}`
}

function corClassif(classif: string | null): string {
  if (!classif) return "var(--text-muted)"
  const c = classif.toLowerCase()
  if (c.includes("adequad") || c.includes("normal")) return "#22c55e"
  if (c.includes("baix")    || c.includes("magrez")) return "#3b82f6"
  if (c.includes("acima")   || c.includes("sobrepeso") || c.includes("alta")) return "#f59e0b"
  return "var(--text-primary)"
}

function Campo({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-(--text-muted)">{label}</span>
      <div className="flex items-center h-9.5 bg-(--bg-input) border border-(--border) rounded-md px-3 text-sm text-(--text-primary) select-none">
        {value}
      </div>
    </div>
  )
}

function Badge({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-(--text-muted)">{label}</span>
      <div className="flex items-center h-9.5 bg-(--bg-input) border border-(--border) rounded-md px-3 select-none">
        <span className="text-sm font-semibold" style={{ color: corClassif(value) }}>
          {value ?? "—"}
        </span>
      </div>
    </div>
  )
}

interface Props {
  resultado: ResultadoPediatrico
}

export function ResultadoPediatricoView({ resultado: r }: Props) {
  return (
    <>
      <TPanel title="Estado Nutricional (OMS)">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Campo label="IMC"             value={fmt(r.imc, 2)} />
          <Badge label="Peso / Idade"     value={r.classifPesoIdade} />
          <Badge label="Estatura / Idade" value={r.classifEstaturaIdade} />
          <Badge label="IMC / Idade"      value={r.classifImcIdade} />
        </div>
      </TPanel>

      <TPanel title="Necessidades Nutricionais">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="VET (kcal/dia)"      value={fmt(r.vet, 0, " kcal")} />
          <Campo label="Proteína (g/dia)"    value={fmt(r.proteinaNecessidade, 1, " g")} />
        </div>
      </TPanel>

      <TPanel title="Dieta Prescrita">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Campo label="Vezes ao dia"        value={fmt(r.vezesDia, 1)} />
          <Campo label="Volume total"        value={fmt(r.volumeTotal, 0, " ml")} />
          <Campo label="Calorias totais"     value={fmt(r.caloriasTotais, 0, " kcal")} />
          <Campo label="Proteína total"      value={fmt(r.proteinaTotal, 1, " g")} />
          <Campo label="% Calórico (do VET)" value={fmt(r.percCalorico, 1, " %")} />
          <Campo label="% Proteico (da nec.)" value={fmt(r.percProteico, 1, " %")} />
        </div>
      </TPanel>
    </>
  )
}
