import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import type { AudiometriaLimiar } from "../../../types/Otorrino"

// ── Constantes do gráfico ─────────────────────────────────────────────────────

const FREQUENCIAS = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000]
const Y_TICKS     = [-10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]

const COR_OD = "#ef4444" // vermelho — orelha direita
const COR_OE = "#3b82f6" // azul     — orelha esquerda

const AXIS_COLOR = "#94a3b8"
const GRID_COLOR = "#cbd5e1"

const TOOLTIP_STYLE: React.CSSProperties = {
  background:   "rgba(30, 41, 59, 0.95)",
  border:       "1px solid rgba(148, 163, 184, 0.4)",
  borderRadius: 8,
  color:        "#f8fafc",
  fontSize:     12,
}
const TOOLTIP_LABEL_STYLE: React.CSSProperties = { color: "#cbd5e1", marginBottom: 4 }
const TOOLTIP_ITEM_STYLE:  React.CSSProperties = { color: "#f8fafc" }

// ── Linha pivotada (uma por frequência) ────────────────────────────────────────

interface PontoAudiograma {
  freq: number
  vaOd: number | null
  voOd: number | null
  vaOe: number | null
  voOe: number | null
}

function pivotar(limiares: AudiometriaLimiar[]): PontoAudiograma[] {
  return FREQUENCIAS.map((freq) => {
    const ponto: PontoAudiograma = { freq, vaOd: null, voOd: null, vaOe: null, voOe: null }
    for (const l of limiares) {
      if (l.frequencia !== freq || l.semResposta || l.limiarDb == null) continue
      if (l.orelha === "OD" && l.via === "AEREA") ponto.vaOd = l.limiarDb
      if (l.orelha === "OD" && l.via === "OSSEA") ponto.voOd = l.limiarDb
      if (l.orelha === "OE" && l.via === "AEREA") ponto.vaOe = l.limiarDb
      if (l.orelha === "OE" && l.via === "OSSEA") ponto.voOe = l.limiarDb
    }
    return ponto
  })
}

// ── Símbolos ASHA (dots SVG customizados) ──────────────────────────────────────

interface DotProps {
  cx?:    number
  cy?:    number
  value?: number | null
}

// VA OD — círculo "O" vermelho
function DotVaOd({ cx, cy, value }: DotProps) {
  if (cx == null || cy == null || value == null) return <g />
  return <circle cx={cx} cy={cy} r={5} fill="none" stroke={COR_OD} strokeWidth={2} />
}

// VA OE — "X" azul
function DotVaOe({ cx, cy, value }: DotProps) {
  if (cx == null || cy == null || value == null) return <g />
  const s = 5
  return (
    <g stroke={COR_OE} strokeWidth={2}>
      <line x1={cx - s} y1={cy - s} x2={cx + s} y2={cy + s} />
      <line x1={cx - s} y1={cy + s} x2={cx + s} y2={cy - s} />
    </g>
  )
}

// VO OD — "<" vermelho (abre para a direita)
function DotVoOd({ cx, cy, value }: DotProps) {
  if (cx == null || cy == null || value == null) return <g />
  const s = 5
  return (
    <polyline
      points={`${cx + s},${cy - s} ${cx - s},${cy} ${cx + s},${cy + s}`}
      fill="none" stroke={COR_OD} strokeWidth={2} strokeLinejoin="round"
    />
  )
}

// VO OE — ">" azul (abre para a esquerda)
function DotVoOe({ cx, cy, value }: DotProps) {
  if (cx == null || cy == null || value == null) return <g />
  const s = 5
  return (
    <polyline
      points={`${cx - s},${cy - s} ${cx + s},${cy} ${cx - s},${cy + s}`}
      fill="none" stroke={COR_OE} strokeWidth={2} strokeLinejoin="round"
    />
  )
}

// ── Componente ─────────────────────────────────────────────────────────────────

interface AudiogramaProps {
  limiares: AudiometriaLimiar[]
  height?:  number
  /** "OD" ou "OE" plota apenas aquela orelha; omitido plota ambas. */
  orelha?:  "OD" | "OE"
}

export function Audiograma({ limiares, height = 340, orelha }: AudiogramaProps) {
  const data = pivotar(limiares)

  const mostraOd = orelha == null || orelha === "OD"
  const mostraOe = orelha == null || orelha === "OE"

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
        <XAxis
          dataKey ="freq"
          type    ="category"
          tick    ={{ fontSize: 11, fill: AXIS_COLOR }}
          stroke  ={AXIS_COLOR}
          tickFormatter={(v) => String(v)}
          label   ={{ value: "Frequência (Hz)", position: "insideBottom", offset: -4, fill: AXIS_COLOR, fontSize: 11 }}
        />
        <YAxis
          domain  ={[-10, 120]}
          reversed
          ticks   ={Y_TICKS}
          tick    ={{ fontSize: 11, fill: AXIS_COLOR }}
          stroke  ={AXIS_COLOR}
          label   ={{ value: "Limiar (dB)", angle: -90, position: "insideLeft", fill: AXIS_COLOR, fontSize: 11 }}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle  ={TOOLTIP_LABEL_STYLE}
          itemStyle   ={TOOLTIP_ITEM_STYLE}
          labelFormatter={(v) => `${v} Hz`}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter   ={(value: any) => `${value} dB`}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />

        {mostraOd && (
          <Line
            name        ="VA OD"
            dataKey     ="vaOd"
            stroke      ={COR_OD}
            strokeWidth ={2}
            connectNulls={false}
            isAnimationActive={false}
            dot         ={(p) => <DotVaOd key={`vaod-${p.index}`} {...p} />}
            activeDot   ={false}
          />
        )}
        {mostraOe && (
          <Line
            name        ="VA OE"
            dataKey     ="vaOe"
            stroke      ={COR_OE}
            strokeWidth ={2}
            connectNulls={false}
            isAnimationActive={false}
            dot         ={(p) => <DotVaOe key={`vaoe-${p.index}`} {...p} />}
            activeDot   ={false}
          />
        )}
        {mostraOd && (
          <Line
            name        ="VO OD"
            dataKey     ="voOd"
            stroke      ={COR_OD}
            strokeWidth ={2}
            strokeDasharray="5 4"
            connectNulls={false}
            isAnimationActive={false}
            dot         ={(p) => <DotVoOd key={`vood-${p.index}`} {...p} />}
            activeDot   ={false}
          />
        )}
        {mostraOe && (
          <Line
            name        ="VO OE"
            dataKey     ="voOe"
            stroke      ={COR_OE}
            strokeWidth ={2}
            strokeDasharray="5 4"
            connectNulls={false}
            isAnimationActive={false}
            dot         ={(p) => <DotVoOe key={`vooe-${p.index}`} {...p} />}
            activeDot   ={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
