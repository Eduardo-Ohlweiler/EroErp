import type { MedidaCorporalResponse, PontoMedicao } from '../../types/AvaliacaoFisica'
import { PONTO_LABELS } from '../../types/AvaliacaoFisica'

interface MedidaInput {
  pontoMedicao: PontoMedicao
  valorCm:      number
}

interface Props {
  medidas:   MedidaInput[] | MedidaCorporalResponse[]
  titulo?:   string
  /* quando definido, ativa modo comparativo: medidas são o estado atual e
     medidasBase é o estado anterior. Verde = melhorou, Vermelho = piorou */
  medidasBase?: MedidaInput[] | MedidaCorporalResponse[]
}

// Posições (cx, cy) dos pontos no SVG 300x580
const PONTOS_POS: Record<PontoMedicao, [number, number, 'left' | 'right']> = {
  PESCOCO:             [150, 72,  'right'],
  OMBRO:               [150, 110, 'right'],
  TORAX:               [150, 150, 'right'],
  CINTURA:             [150, 195, 'right'],
  ABDOMEN:             [150, 230, 'right'],
  QUADRIL:             [150, 265, 'left'],
  BRACO_DIREITO:       [110, 165, 'left'],
  BRACO_ESQUERDO:      [190, 165, 'right'],
  ANTEBRACO_DIREITO:   [100, 215, 'left'],
  ANTEBRACO_ESQUERDO:  [200, 215, 'right'],
  COXA_DIREITA:        [120, 330, 'left'],
  COXA_ESQUERDA:       [180, 330, 'right'],
  PANTURRILHA_DIREITA: [115, 415, 'left'],
  PANTURRILHA_ESQUERDA:[185, 415, 'right'],
}

function getColor(_ponto: PontoMedicao, atual: number, base?: number): string {
  if (!base) return '#3b82f6'
  if (atual < base) return '#22c55e'
  if (atual > base) return '#ef4444'
  return '#94a3b8'
}

export default function TBodyChart({ medidas, titulo, medidasBase }: Props) {
  const mapaAtual = new Map<PontoMedicao, number>(
    medidas.map(m => [m.pontoMedicao, Number(m.valorCm)])
  )
  const mapaBase = medidasBase
    ? new Map<PontoMedicao, number>(medidasBase.map(m => [m.pontoMedicao, Number(m.valorCm)]))
    : undefined

  return (
    <div className="flex flex-col items-center gap-2">
      {titulo && <span className="text-sm font-semibold text-gray-600">{titulo}</span>}
      <svg viewBox="0 0 300 580" width="220" height="480" className="overflow-visible">

        {/* ── Silhueta ─────────────────────────────────────────────────────── */}
        {/* Cabeça */}
        <ellipse cx="150" cy="38" rx="22" ry="26" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
        {/* Pescoço */}
        <rect x="143" y="62" width="14" height="14" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
        {/* Ombros */}
        <path d="M80 100 Q105 88 150 86 Q195 88 220 100" fill="none" stroke="#94a3b8" strokeWidth="1.5"/>
        {/* Tronco */}
        <path d="M80 100 L75 270 L125 280 L150 275 L175 280 L225 270 L220 100 Z"
              fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
        {/* Braço Direito */}
        <path d="M80 100 L65 110 L55 200 L70 205 L85 115" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
        {/* Antebraço Direito */}
        <path d="M55 200 L50 255 L65 258 L70 205" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
        {/* Mão Direita */}
        <ellipse cx="57" cy="265" rx="8" ry="12" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
        {/* Braço Esquerdo */}
        <path d="M220 100 L235 110 L245 200 L230 205 L215 115" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
        {/* Antebraço Esquerdo */}
        <path d="M245 200 L250 255 L235 258 L230 205" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
        {/* Mão Esquerda */}
        <ellipse cx="243" cy="265" rx="8" ry="12" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
        {/* Coxa Direita */}
        <path d="M115 278 L100 380 L125 385 L135 280" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
        {/* Coxa Esquerda */}
        <path d="M185 278 L200 380 L175 385 L165 280" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
        {/* Perna Direita */}
        <path d="M100 380 L97 460 L120 462 L125 385" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
        {/* Perna Esquerda */}
        <path d="M200 380 L203 460 L180 462 L175 385" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
        {/* Pé Direito */}
        <ellipse cx="109" cy="466" rx="14" ry="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
        {/* Pé Esquerdo */}
        <ellipse cx="191" cy="466" rx="14" ry="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>

        {/* ── Pontos e Labels ──────────────────────────────────────────────── */}
        {(Object.entries(PONTOS_POS) as [PontoMedicao, [number, number, 'left' | 'right']][]).map(
          ([pontoKey, [cx, cy, side]]) => {
            const valor = mapaAtual.get(pontoKey)
            if (!valor) return null
            const base  = mapaBase?.get(pontoKey)
            const color = getColor(pontoKey, valor, base)
            const lx    = side === 'left' ? cx - 10 : cx + 10
            const tx    = side === 'left' ? cx - 12 : cx + 12
            const anchor= side === 'left' ? 'end'   : 'start'
            const diff  = base ? valor - base : null

            return (
              <g key={pontoKey}>
                <circle cx={cx} cy={cy} r={5} fill={color} opacity="0.9"/>
                <line x1={cx} y1={cy} x2={lx} y2={cy} stroke={color} strokeWidth={1.2}/>
                <text x={tx} y={cy - 4} fontSize={9} fill={color} textAnchor={anchor} fontWeight="600">
                  {PONTO_LABELS[pontoKey]}
                </text>
                <text x={tx} y={cy + 7} fontSize={9} fill={color} textAnchor={anchor}>
                  {valor.toFixed(1)} cm
                  {diff !== null && diff !== 0 && (
                    ` (${diff > 0 ? '+' : ''}${diff.toFixed(1)})`
                  )}
                </text>
              </g>
            )
          }
        )}
      </svg>
    </div>
  )
}
