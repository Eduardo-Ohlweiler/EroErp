// Exibição read-only dos resultados do cálculo de terapia nutricional.
// Renderizado a partir do estado React — re-renderiza a cada novo cálculo.
// Espelha ResultadoPediatricoView.tsx.

import { TPanel } from "../../components/tpanel"
import type {
  ResultadoAntropometria, ResultadoNecessidades,
  ResultadoDietaEnteral, ResultadoHidratacao,
} from "./calculo/types"

function fmt(valor: number | null, casas = 1, sufixo = ""): string {
  if (valor == null || Number.isNaN(valor)) return "—"
  return `${valor.toFixed(casas)}${sufixo}`
}

function corClassif(classif: string | null): string {
  if (!classif) return "var(--text-muted)"
  const c = classif.toLowerCase()
  if (c.includes("eutrof") || c.includes("adequad") || c.includes("normal") || c.includes("sem perda")) return "#22c55e"
  if (c.includes("desnutri") || c.includes("deplec") || c.includes("grave")) return "#ef4444"
  if (c.includes("sobrepeso") || c.includes("excesso") || c.includes("obesid") || c.includes("significativa")) return "#f59e0b"
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

// ── Antropometria ──────────────────────────────────────────────────────────────

export function ResultadoAntropometriaView({ r }: { r: ResultadoAntropometria }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Campo label="Altura estimada (Chumlea)" value={fmt(r.alturaEstimada, 1, " cm")} />
        <Campo label="Peso est. Chumlea"         value={fmt(r.pesoEstimadoChumlea, 1, " kg")} />
        <Campo label="Peso est. Jung"            value={fmt(r.pesoEstimadoJung, 1, " kg")} />
        <Campo label="Peso est. Rabito"          value={fmt(r.pesoEstimadoRabito, 1, " kg")} />
        <Campo label="IMC"                       value={fmt(r.imc, 2, " kg/m²")} />
        <Badge label="Classif. IMC (OMS)"        value={r.classifImcOms} />
        <Badge label="Classif. IMC (OPAS idoso)" value={r.classifImcOpas} />
        <Campo label="Peso ideal (IMC alvo)"     value={fmt(r.pesoIdeal, 1, " kg")} />
        <Campo label="Peso ideal (IMC 25)"       value={fmt(r.pesoIdealImc25, 1, " kg")} />
        <Campo label="Peso ajustado"             value={fmt(r.pesoAjustado, 1, " kg")} />
        <Campo label="% Perda de peso"           value={fmt(r.percPerdaPeso, 1, " %")} />
        <Badge label="Classif. perda (1 mês)"    value={r.classifPerdaPeso} />
        <Campo label="% Adequação CB"            value={fmt(r.percAdequacaoCb, 1, " %")} />
        <Badge label="Classif. CB"               value={r.classifAdequacaoCb} />
        <Badge label="Depleção panturrilha"      value={r.classifDeplecaoCp} />
      </div>
    </>
  )
}

// ── Necessidades ─────────────────────────────────────────────────────────────

export function ResultadoNecessidadesView({ r }: { r: ResultadoNecessidades }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Campo label="Energia mínima"        value={fmt(r.kcalMin, 0, " kcal/dia")} />
      <Campo label="Energia máxima"        value={fmt(r.kcalMax, 0, " kcal/dia")} />
      <Campo label="Proteína mínima"       value={fmt(r.ptnMin, 1, " g/dia")} />
      <Campo label="Proteína máxima"       value={fmt(r.ptnMax, 1, " g/dia")} />
      <Campo label="Energia personalizada" value={fmt(r.kcalTotal, 0, " kcal/dia")} />
      <Campo label="Proteína personalizada" value={fmt(r.ptnTotal, 1, " g/dia")} />
      <Campo label="Proteína HD intermitente" value={fmt(r.ptnHdIntermitente, 1, " g/dia")} />
      <Campo label="Proteína HD contínua"  value={fmt(r.ptnHdContinua, 1, " g/dia")} />
    </div>
  )
}

// ── Dieta enteral ──────────────────────────────────────────────────────────────

const PCT_LABEL: Record<number, string> = { 25: "1º dia", 50: "2º dia", 75: "3º dia", 100: "4º dia" }

export function ResultadoDietaView({ r }: { r: ResultadoDietaEnteral }) {
  const temProgressao = r.progressao.length > 0
  const temModulo     = r.moduloProteico.length > 0 && r.ptnSuplementar != null && r.ptnSuplementar > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Campo label="Volume total (dia)"     value={fmt(r.vt, 0, " ml")} />
        <Campo label="Calorias"               value={fmt(r.kcal, 0, " kcal")} />
        <Campo label="Proteína"               value={fmt(r.ptn, 1, " g")} />
        <Campo label="Volume pleno"           value={fmt(r.volumePleno, 0, " ml")} />
        <Campo label="Proteína no vol. pleno" value={fmt(r.ptnPleno, 1, " g")} />
        <Campo label="Proteína suplementar"   value={fmt(r.ptnSuplementar, 1, " g")} />
        <Campo label="Kcal / kg"              value={fmt(r.kcalKg, 1)} />
        <Campo label="Proteína / kg"          value={fmt(r.ptnKg, 2)} />
        <Campo label="% VCT (da meta)"        value={fmt(r.percVct, 1, " %")} />
        <Campo label="% PTN (da meta)"        value={fmt(r.percPtn, 1, " %")} />
      </div>

      {temProgressao && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-(--text-muted)">
            Modelo de progressão — volume por dia na densidade da fórmula
          </span>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-(--border) rounded-md overflow-hidden">
              <thead className="bg-(--bg-input) text-(--text-muted)">
                <tr>
                  <th className="text-left  font-medium px-3 py-2">Dia</th>
                  <th className="text-center font-medium px-3 py-2">% da meta</th>
                  <th className="text-center font-medium px-3 py-2">Calorias do dia</th>
                  <th className="text-center font-medium px-3 py-2">Volume</th>
                </tr>
              </thead>
              <tbody>
                {r.progressao.map(p => (
                  <tr key={p.dia} className="border-t border-(--border) text-(--text-primary)">
                    <td className="px-3 py-2">{PCT_LABEL[p.pct] ?? `Dia ${p.dia}`}</td>
                    <td className="px-3 py-2 text-center">{p.pct}%</td>
                    <td className="px-3 py-2 text-center">{fmt(p.kcalDia, 0, " kcal")}</td>
                    <td className="px-3 py-2 text-center">{fmt(p.volume, 1, " ml")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {temModulo && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-(--text-muted)">
            Módulo proteico sugerido — para cobrir {fmt(r.ptnSuplementar, 1, " g")} de proteína faltante
          </span>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-(--border) rounded-md overflow-hidden">
              <thead className="bg-(--bg-input) text-(--text-muted)">
                <tr>
                  <th className="text-left  font-medium px-3 py-2">Módulo</th>
                  <th className="text-center font-medium px-3 py-2">Quantidade/dia</th>
                  <th className="text-center font-medium px-3 py-2">Calorias adicionais</th>
                </tr>
              </thead>
              <tbody>
                {r.moduloProteico.map(m => (
                  <tr key={m.nome} className="border-t border-(--border) text-(--text-primary)">
                    <td className="px-3 py-2">{m.nome}</td>
                    <td className="px-3 py-2 text-center">{fmt(m.gramas, 1, " g")}</td>
                    <td className="px-3 py-2 text-center">{fmt(m.kcalAdicionada, 0, " kcal")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Hidratação ─────────────────────────────────────────────────────────────────

export function ResultadoHidratacaoView({ r }: { r: ResultadoHidratacao }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Campo label="Necessidade mínima"   value={fmt(r.necMin, 0, " ml/dia")} />
      <Campo label="Necessidade ideal"    value={fmt(r.necIdeal, 0, " ml/dia")} />
      <Campo label="% Água da fórmula"    value={fmt(r.percAgua, 0, " %")} />
      <Campo label="Água na dieta"        value={fmt(r.aguaDieta, 0, " ml/dia")} />
      <Campo label="Água extra (mínima)"  value={fmt(r.aguaExtraMin, 0, " ml/dia")} />
      <Campo label="Água extra (ideal)"   value={fmt(r.aguaExtraIdeal, 0, " ml/dia")} />
      <Campo label="Distribuir 4x"        value={fmt(r.dist4x, 0, " ml")} />
      <Campo label="Distribuir 5x"        value={fmt(r.dist5x, 0, " ml")} />
      <Campo label="Distribuir 6x"        value={fmt(r.dist6x, 0, " ml")} />
      <Campo label="Distribuir 8x"        value={fmt(r.dist8x, 0, " ml")} />
    </div>
  )
}

// Wrapper opcional usado caso se queira renderizar tudo de uma vez.
interface Props {
  antropometria: ResultadoAntropometria
  necessidades:  ResultadoNecessidades
  dieta:         ResultadoDietaEnteral
  hidratacao:    ResultadoHidratacao
}

export function ResultadoNutricionalView({ antropometria, necessidades, dieta, hidratacao }: Props) {
  return (
    <>
      <TPanel title="Resultados — Antropometria">
        <ResultadoAntropometriaView r={antropometria} />
      </TPanel>
      <TPanel title="Resultados — Necessidades Nutricionais">
        <ResultadoNecessidadesView r={necessidades} />
      </TPanel>
      <TPanel title="Resultados — Dieta Enteral">
        <ResultadoDietaView r={dieta} />
      </TPanel>
      <TPanel title="Resultados — Hidratação">
        <ResultadoHidratacaoView r={hidratacao} />
      </TPanel>
    </>
  )
}
