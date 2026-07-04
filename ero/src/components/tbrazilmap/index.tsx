import { useMemo, useRef, useState } from "react"
import { BRAZIL_STATES, BRAZIL_VIEWBOX, type BrazilStateGeo } from "./brazilStatesGeo"

interface TBrazilMapProps {
  /** Mapa sigla da UF → quantidade (ex.: { SP: 42, RJ: 10 }). */
  data:        Record<string, number>
  /** UF atualmente selecionada (destaca o contorno). */
  selectedUf?: string | null
  /** Callback ao clicar numa UF (toggle recomendado no pai). */
  onSelectUf?: (uf: string) => void
  /** Altura do mapa em px (default 420). */
  height?:     number
}

// escala coroplética: cinza-neutro (0) → azul TOTVS #0068b0 (máx)
const COR_ZERO = "var(--bg-hover)"        // neutro tema-aware
const FROM_RGB: [number, number, number] = [214, 232, 246] // azul bem claro
const TO_RGB:   [number, number, number] = [0, 104, 176]   // #0068b0 (--accent light)

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t)
}

function fillFor(value: number, max: number): string {
  if (!value || value <= 0 || max <= 0) return COR_ZERO
  // raiz quadrada espalha melhor valores baixos; piso para o menor não-zero ser visível
  const ratio = Math.sqrt(value / max)
  const t = 0.12 + 0.88 * Math.min(1, ratio)
  const r = lerp(FROM_RGB[0], TO_RGB[0], t)
  const g = lerp(FROM_RGB[1], TO_RGB[1], t)
  const b = lerp(FROM_RGB[2], TO_RGB[2], t)
  return `rgb(${r}, ${g}, ${b})`
}

interface HoverState {
  st: BrazilStateGeo
  qtd: number
  x: number
  y: number
}

export function TBrazilMap({ data, selectedUf = null, onSelectUf, height = 420 }: TBrazilMapProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<HoverState | null>(null)

  const max = useMemo(
    () => BRAZIL_STATES.reduce((m, s) => Math.max(m, data[s.sigla] ?? 0), 0),
    [data],
  )

  // ordem de pintura: comuns primeiro; hover e selecionado por cima (contorno visível)
  const ordered = useMemo(() => {
    const base = BRAZIL_STATES.filter(s => s.sigla !== selectedUf && s.sigla !== hover?.st.sigla)
    const top: BrazilStateGeo[] = []
    if (hover && hover.st.sigla !== selectedUf) top.push(hover.st)
    const sel = BRAZIL_STATES.find(s => s.sigla === selectedUf)
    if (sel) top.push(sel)
    return [...base, ...top]
  }, [selectedUf, hover])

  function handleMove(st: BrazilStateGeo, e: React.MouseEvent) {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    setHover({
      st,
      qtd: data[st.sigla] ?? 0,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div ref={wrapRef} className="relative w-full max-w-full select-none">
      <svg
        viewBox            ={BRAZIL_VIEWBOX}
        preserveAspectRatio="xMidYMid meet"
        role               ="img"
        aria-label         ="Mapa de atendimentos por estado do Brasil"
        style              ={{ width: "100%", height }}
      >
        {ordered.map(st => {
          const isSel   = st.sigla === selectedUf
          const isHover = st.sigla === hover?.st.sigla
          return (
            <path
              key         ={st.sigla}
              d           ={st.path}
              fill        ={fillFor(data[st.sigla] ?? 0, max)}
              stroke      ={isSel ? "var(--accent)" : "var(--bg-surface)"}
              strokeWidth ={isSel ? 2.5 : isHover ? 1.6 : 0.8}
              style       ={{
                cursor:  onSelectUf ? "pointer" : "default",
                filter:  isHover ? "brightness(1.08)" : undefined,
                outline: "none",
              }}
              onMouseEnter={(e) => handleMove(st, e)}
              onMouseMove ={(e) => handleMove(st, e)}
              onMouseLeave={() => setHover(h => (h?.st.sigla === st.sigla ? null : h))}
              onClick     ={() => onSelectUf?.(st.sigla)}
            >
              <title>{`${st.sigla} — ${st.nome} (${st.regiao}): ${data[st.sigla] ?? 0} atendimentos`}</title>
            </path>
          )
        })}
      </svg>

      {/* tooltip flutuante */}
      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-(--border) bg-(--bg-surface) px-2.5 py-1.5 text-xs shadow-lg"
          style={{
            left:      Math.min(hover.x + 12, (wrapRef.current?.clientWidth ?? 0) - 8),
            top:       hover.y + 12,
            transform: hover.x > (wrapRef.current?.clientWidth ?? 0) - 160 ? "translateX(-100%)" : undefined,
          }}
        >
          <div className="font-semibold text-(--text-primary)">
            {hover.st.sigla} — {hover.st.nome}
          </div>
          <div className="text-(--text-muted)">
            {hover.st.regiao} ·{" "}
            <span className="font-medium text-(--accent)">{hover.qtd}</span> atendimento{hover.qtd === 1 ? "" : "s"}
          </div>
        </div>
      )}

      {/* legenda de escala */}
      <div className="mt-2 flex items-center gap-2 text-xs text-(--text-muted)">
        <span>0</span>
        <span
          className="h-2 flex-1 rounded-full"
          style={{ background: `linear-gradient(to right, ${COR_ZERO}, rgb(${FROM_RGB.join(",")}), rgb(${TO_RGB.join(",")}))` }}
        />
        <span>{max || 0}</span>
      </div>
    </div>
  )
}
