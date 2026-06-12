import type { MedidaCorporalResponse, PontoMedicao } from '../../types/AvaliacaoFisica'
import { PONTO_LABELS } from '../../types/AvaliacaoFisica'

interface MedidaInput { pontoMedicao: PontoMedicao; valorCm: number }

interface Props {
  medidas:      MedidaInput[] | MedidaCorporalResponse[]
  titulo?:      string
  sexo?:        string
  medidasBase?: MedidaInput[] | MedidaCorporalResponse[]
}

type Side = 'L' | 'R'
type LabelPoint = { ponto: PontoMedicao; x: number; y: number; side: Side }

const LABEL_POINTS: LabelPoint[] = [
  { ponto: 'PESCOCO',              x: 140, y:  98, side: 'R' },
  { ponto: 'OMBRO',                x:  74, y: 118, side: 'L' },
  { ponto: 'TORAX',                x: 140, y: 172, side: 'R' },
  { ponto: 'CINTURA',              x: 140, y: 222, side: 'R' },
  { ponto: 'ABDOMEN',              x: 140, y: 250, side: 'R' },
  { ponto: 'QUADRIL',              x: 140, y: 278, side: 'R' },
  { ponto: 'BRACO_ESQUERDO',       x:  62, y: 184, side: 'L' },
  { ponto: 'BRACO_DIREITO',        x: 218, y: 184, side: 'R' },
  { ponto: 'ANTEBRACO_ESQUERDO',   x:  56, y: 252, side: 'L' },
  { ponto: 'ANTEBRACO_DIREITO',    x: 224, y: 252, side: 'R' },
  { ponto: 'COXA_ESQUERDA',        x: 100, y: 362, side: 'L' },
  { ponto: 'COXA_DIREITA',         x: 180, y: 362, side: 'R' },
  { ponto: 'PANTURRILHA_ESQUERDA', x: 100, y: 454, side: 'L' },
  { ponto: 'PANTURRILHA_DIREITA',  x: 180, y: 454, side: 'R' },
]

function dotColor(val: number, base?: number): string {
  if (base === undefined) return '#93c5fd'
  if (val < base) return '#4ade80'
  if (val > base) return '#f87171'
  return '#94a3b8'
}

const BP = { fill: 'rgba(30,80,200,0.22)', stroke: '#60a5fa', strokeWidth: 1.5 }

// Torso: shoulders ~74–206, chest ~104–176, waist ~110–170, hips ~104–176, crotch arch at y≈316
const TORSO = `M 74,110
C 74,118 98,135 104,148
C 104,170 104,196 106,218
C 110,235 110,252 104,268
C 110,280 120,292 126,306
C 130,314 136,318 140,316
C 144,318 150,314 154,306
C 160,292 170,280 176,268
C 170,252 170,235 174,218
C 176,196 176,170 176,148
C 182,135 206,118 206,110
C 192,100 166,96 152,98
L 128,98
C 114,96 88,100 74,110 Z`

// Left arm: outer shoulder→down, inner up→shoulder. Width ~34px upper, ~22px forearm
const ARM_L = `M 74,110
C 66,118 62,134 60,154
C 58,174 58,196 60,216
C 62,234 64,252 68,270
C 70,282 72,294 76,308
C 78,314 84,318 88,314
C 92,310 92,302 90,292
C 88,282 86,268 84,254
C 82,238 82,218 84,200
C 86,182 90,164 94,154
C 96,144 100,132 100,122
C 96,114 86,110 74,110 Z`

// Right arm (mirror)
const ARM_R = `M 206,110
C 214,118 218,134 220,154
C 222,174 222,196 220,216
C 218,234 216,252 212,270
C 210,282 208,294 204,308
C 202,314 196,318 192,314
C 188,310 188,302 190,292
C 192,282 194,268 196,254
C 198,238 198,218 196,200
C 194,182 190,164 186,154
C 184,144 180,132 180,122
C 184,114 194,110 206,110 Z`

// Left leg: outer hip→foot, inner foot→crotch. Center ~x=108
const LEG_L = `M 98,272
C 94,288 92,308 92,330
C 92,352 94,374 96,394
C 98,408 100,422 102,438
C 104,452 104,466 104,480
C 102,494 98,506 92,514
C 86,520 78,518 74,514
C 70,510 70,504 74,500
C 78,496 86,494 94,494
C 102,494 110,492 114,490
C 118,486 120,476 118,466
C 116,452 114,436 114,418
C 114,398 114,376 116,356
C 118,336 120,318 124,310
C 116,298 108,284 98,272 Z`

// Right leg (mirror)
const LEG_R = `M 182,272
C 186,288 188,308 188,330
C 188,352 186,374 184,394
C 182,408 180,422 178,438
C 176,452 176,466 176,480
C 178,494 182,506 188,514
C 194,520 202,518 206,514
C 210,510 210,504 206,500
C 202,496 194,494 186,494
C 178,494 170,492 166,490
C 162,486 160,476 162,466
C 164,452 166,436 166,418
C 166,398 166,376 164,356
C 162,336 160,318 156,310
C 164,298 172,284 182,272 Z`

export default function TBodyChart({ medidas, titulo, medidasBase }: Props) {
  const mapa = new Map<PontoMedicao, number>(
    medidas.map(m => [m.pontoMedicao, Number(m.valorCm)])
  )
  const mapaBase = medidasBase
    ? new Map<PontoMedicao, number>(medidasBase.map(m => [m.pontoMedicao, Number(m.valorCm)]))
    : undefined

  return (
    <div className="flex flex-col items-center gap-1 w-full">
      {titulo && (
        <span className="text-xs font-semibold text-blue-300">{titulo}</span>
      )}
      <div className="w-full" style={{ maxWidth: 360 }}>
        <svg
          viewBox="-50 0 380 540"
          style={{ width: '100%', height: 'auto', overflow: 'visible' }}
        >
          <defs>
            <radialGradient id="bg" cx="50%" cy="35%" r="60%">
              <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#1e40af" stopOpacity="0.04" />
            </radialGradient>
          </defs>

          {/* Background glow */}
          <ellipse cx={140} cy={280} rx={100} ry={230} fill="url(#bg)" />

          {/* Silhueta */}
          <ellipse cx={140} cy={44} rx={26} ry={30} {...BP} />
          <path d="M 128,72 L 152,72 L 154,98 L 126,98 Z" {...BP} />
          <path d={TORSO} {...BP} />
          <path d={ARM_L} {...BP} />
          <path d={ARM_R} {...BP} />
          <path d={LEG_L} {...BP} />
          <path d={LEG_R} {...BP} />

          {/* Labels */}
          {LABEL_POINTS.map(({ ponto, x, y, side }) => {
            const val  = mapa.get(ponto)
            const base = mapaBase?.get(ponto)

            if (!val) {
              return <circle key={ponto} cx={x} cy={y} r={3} fill="#475569" opacity={0.5} />
            }

            const clr     = dotColor(val, base)
            const len     = 24
            const x2      = side === 'R' ? x + len  : x - len
            const tX      = side === 'R' ? x2 + 4   : x2 - 4
            const anchor  = side === 'R' ? 'start'   : 'end'
            const diffStr = (base != null && val !== base) ? ` → ${val.toFixed(1)}` : null

            return (
              <g key={ponto}>
                <circle cx={x} cy={y} r={4} fill={clr} />
                <line x1={x} y1={y} x2={x2} y2={y} stroke={clr} strokeWidth={1.2} opacity={0.8} />
                <text x={tX} y={y - 4} fontSize={13} fontWeight="700" fill={clr} textAnchor={anchor} fontFamily="system-ui,sans-serif">
                  {PONTO_LABELS[ponto]}
                </text>
                <text x={tX} y={y + 11} fontSize={12} fill={clr} textAnchor={anchor} opacity={0.9} fontFamily="system-ui,sans-serif">
                  {base != null && diffStr ? `${base.toFixed(1)}${diffStr}cm` : `${val.toFixed(1)}cm`}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
