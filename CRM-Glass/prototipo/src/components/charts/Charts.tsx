import { useId, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useReduce } from '../../theme/settings';
import { ease } from '../../motion/tokens';
import { CountUp } from '../../motion/CountUp';
import { cn, useSize } from '../../lib/utils';

/* ---------------- utilitários ---------------- */
export function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const m = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => n <= s) ?? 10;
  return m * p;
}

export function smoothPath(pts: [number, number][]) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.18;
    const c1x = p1[0] + (p2[0] - p0[0]) * t;
    const c1y = p1[1] + (p2[1] - p0[1]) * t;
    const c2x = p2[0] - (p3[0] - p1[0]) * t;
    const c2y = p2[1] - (p3[1] - p1[1]) * t;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

const uidOf = (id: string) => id.replace(/[^a-zA-Z0-9]/g, '');

/* ---------------- Linha com brilho ---------------- */
export type Series = { name: string; color: string; values: number[]; area?: boolean; dashed?: boolean };

export function LineChart({
  series,
  labels,
  height = 240,
  format = (v: number) => String(Math.round(v)),
  ticks = 4,
}: {
  series: Series[];
  labels: string[];
  height?: number;
  format?: (v: number) => string;
  ticks?: number;
}) {
  const [ref, { w }] = useSize<HTMLDivElement>();
  const reduce = useReduce();
  const uid = uidOf(useId());
  const [hover, setHover] = useState<number | null>(null);

  const pad = { l: 46, r: 14, t: 14, b: 28 };
  const max = niceMax(Math.max(...series.flatMap((s) => s.values)) * 1.05);
  const iw = Math.max(1, w - pad.l - pad.r);
  const ih = height - pad.t - pad.b;
  const n = labels.length;
  const x = (i: number) => pad.l + (n <= 1 ? 0 : (i * iw) / (n - 1));
  const y = (v: number) => pad.t + ih - (v / max) * ih;

  const paths = series.map((s) => {
    const pts = s.values.map((v, i) => [x(i), y(v)] as [number, number]);
    const d = smoothPath(pts);
    return { d, area: `${d} L${x(n - 1)},${pad.t + ih} L${x(0)},${pad.t + ih} Z`, last: pts[pts.length - 1] };
  });
  const draw = reduce ? { duration: 0 } : { duration: 1.5, ease: ease.out, delay: 0.2 };

  function onMove(e: React.MouseEvent<SVGRectElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  }

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {w > 0 && (
        <svg width={w} height={height} className="block overflow-visible">
          <defs>
            {series.map((s, si) => (
              <linearGradient key={si} id={`${uid}-a${si}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: s.color, stopOpacity: 0.34 }} />
                <stop offset="100%" style={{ stopColor: s.color, stopOpacity: 0 }} />
              </linearGradient>
            ))}
            <filter id={`${uid}-glow`} x="-10%" y="-40%" width="120%" height="180%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>

          {Array.from({ length: ticks + 1 }, (_, k) => {
            const v = (max * k) / ticks;
            const yy = y(v);
            return (
              <g key={k}>
                <line
                  x1={pad.l}
                  x2={w - pad.r}
                  y1={yy}
                  y2={yy}
                  style={{ stroke: 'var(--line)' }}
                  strokeDasharray={k === 0 ? undefined : '3 6'}
                />
                <text x={pad.l - 12} y={yy} dy="0.32em" textAnchor="end" style={{ fill: 'var(--fg-subtle)', fontSize: 11 }}>
                  {format(v)}
                </text>
              </g>
            );
          })}
          {labels.map((l, i) => (
            <text
              key={i}
              x={x(i)}
              y={height - 6}
              textAnchor="middle"
              style={{ fill: hover === i ? 'var(--fg)' : 'var(--fg-subtle)', fontSize: 11, transition: 'fill .2s' }}
            >
              {l}
            </text>
          ))}

          {series.map((s, si) => (
            <g key={s.name}>
              {s.area && (
                <motion.path
                  d={paths[si].area}
                  style={{ fill: `url(#${uid}-a${si})` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: reduce ? 0 : 0.7 }}
                />
              )}
              {s.dashed ? (
                <motion.path
                  d={paths[si].d}
                  fill="none"
                  style={{ stroke: s.color }}
                  strokeWidth={1.75}
                  strokeDasharray="5 7"
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.9 }}
                  transition={{ duration: 0.8, delay: reduce ? 0 : 0.5 }}
                />
              ) : (
                <>
                  <motion.path
                    d={paths[si].d}
                    fill="none"
                    style={{ stroke: s.color }}
                    strokeWidth={7}
                    strokeLinecap="round"
                    opacity={0.45}
                    filter={`url(#${uid}-glow)`}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={draw}
                  />
                  <motion.path
                    d={paths[si].d}
                    fill="none"
                    style={{ stroke: s.color }}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={draw}
                  />
                  <motion.g
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: reduce ? 0 : 1.5, type: 'spring', stiffness: 400, damping: 18 }}
                    style={{ transformOrigin: `${paths[si].last[0]}px ${paths[si].last[1]}px` }}
                  >
                    {!reduce && (
                      <motion.circle
                        cx={paths[si].last[0]}
                        cy={paths[si].last[1]}
                        style={{ fill: s.color }}
                        initial={{ r: 4, opacity: 0.5 }}
                        animate={{ r: 14, opacity: 0 }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                      />
                    )}
                    <circle
                      cx={paths[si].last[0]}
                      cy={paths[si].last[1]}
                      r={4.5}
                      style={{ fill: 'var(--bg)', stroke: s.color }}
                      strokeWidth={2.5}
                    />
                  </motion.g>
                </>
              )}
            </g>
          ))}

          {hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} style={{ stroke: 'var(--glass-border-hover)' }} />
              {series.map((s) => (
                <circle
                  key={s.name}
                  cx={x(hover)}
                  cy={y(s.values[hover])}
                  r={4.5}
                  style={{ fill: 'var(--bg)', stroke: s.color }}
                  strokeWidth={2.5}
                />
              ))}
            </g>
          )}
          <rect
            x={pad.l}
            y={pad.t}
            width={iw}
            height={ih}
            fill="transparent"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          />
        </svg>
      )}
      {hover !== null && w > 0 && (
        <div
          className="tooltip absolute pointer-events-none px-3 py-2 rounded-xl text-xs min-w-[150px]"
          style={{ left: Math.min(Math.max(x(hover), 90), w - 90), top: -6, transform: 'translateX(-50%)' }}
        >
          <div className="opacity-60 mb-1">{labels[hover]}</div>
          {series.map((s) => (
            <div key={s.name} className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: s.color }} />
              <span className="opacity-75">{s.name}</span>
              <span className="ml-auto font-semibold tabular-nums">{format(s.values[hover])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Barras em pílula de vidro ---------------- */
export function BarPills({
  data,
  highlight,
  height = 210,
  format = (v: number) => String(v),
}: {
  data: { label: string; value: number }[];
  highlight?: number;
  height?: number;
  format?: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const reduce = useReduce();
  const uid = useId();
  const max = Math.max(...data.map((d) => d.value)) * 1.12;
  const active = hover ?? highlight ?? data.length - 1;
  return (
    <div className="flex items-end justify-between gap-2.5 sm:gap-3.5" style={{ height }} onMouseLeave={() => setHover(null)}>
      {data.map((d, i) => {
        const on = i === active;
        return (
          <div key={d.label} className="flex-1 h-full flex flex-col items-center gap-2" onMouseEnter={() => setHover(i)}>
            <div className="relative w-full max-w-[44px] flex-1 flex items-end">
              <motion.div
                className={cn('w-full rounded-full relative origin-bottom', on ? 'accent-gradient-v accent-glow' : 'bar-glass')}
                style={{ height: `${(d.value / max) * 100}%`, transition: 'background .3s' }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={reduce ? { duration: 0 } : { delay: 0.25 + i * 0.07, duration: 0.9, ease: ease.out }}
              >
                {on && (
                  <div className="absolute inset-x-0 -top-9 flex justify-center pointer-events-none">
                    <motion.span
                      layoutId={`${uid}-chip`}
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="tooltip px-2 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap tabular-nums"
                    >
                      {format(d.value)}
                    </motion.span>
                  </div>
                )}
              </motion.div>
            </div>
            <span className={cn('text-[11px] transition-colors', on ? 'text-fg font-semibold' : 'text-subtle')}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Rosca ---------------- */
export function Donut({
  data,
  size = 176,
  thickness = 18,
  center,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  center?: ReactNode;
}) {
  const reduce = useReduce();
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  const total = data.reduce((a, d) => a + d.value, 0);
  let acc = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: 'var(--track)' }} strokeWidth={thickness} />
        {data.map((d, i) => {
          const seg = (d.value / total) * C;
          const len = Math.max(0.1, seg - thickness - 4);
          const off = acc + (thickness + 4) / 2;
          acc += seg;
          return (
            <motion.circle
              key={d.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              style={{ stroke: d.color }}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDashoffset={-off}
              initial={{ strokeDasharray: `0 ${C}` }}
              animate={{ strokeDasharray: `${len} ${C}` }}
              transition={reduce ? { duration: 0 } : { duration: 1.1, delay: 0.25 + i * 0.12, ease: ease.out }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{center}</div>
    </div>
  );
}

/* ---------------- Medidor ---------------- */
export function Gauge({ value, size = 230, stroke = 16, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const reduce = useReduce();
  const uid = uidOf(useId());
  const r = (size - stroke) / 2;
  const cy = size / 2;
  const d = `M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`;
  const t = reduce ? { duration: 0 } : { duration: 1.6, delay: 0.3, ease: ease.out };
  return (
    <div className="relative mx-auto" style={{ width: size, height: size / 2 + stroke }}>
      <svg width={size} height={size / 2 + stroke} className="overflow-visible">
        <defs>
          <linearGradient id={`${uid}-g`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" style={{ stopColor: 'var(--accent-2)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--accent)' }} />
          </linearGradient>
          <filter id={`${uid}-f`} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <path d={d} fill="none" style={{ stroke: 'var(--track)' }} strokeWidth={stroke} strokeLinecap="round" />
        <motion.path
          d={d}
          fill="none"
          stroke={`url(#${uid}-g)`}
          strokeWidth={stroke}
          strokeLinecap="round"
          opacity={0.6}
          filter={`url(#${uid}-f)`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: value / 100 }}
          transition={t}
        />
        <motion.path
          d={d}
          fill="none"
          stroke={`url(#${uid}-g)`}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: value / 100 }}
          transition={t}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-1 text-center">
        <CountUp value={value} format={(v) => `${Math.round(v)}%`} duration={1.6} delay={0.3} className="text-[38px] font-semibold tracking-tight leading-none" />
        {label && <div className="text-xs text-muted mt-1">{label}</div>}
      </div>
    </div>
  );
}

/* ---------------- Minilinha ---------------- */
export function Sparkline({ values, color = 'var(--accent)', height = 34 }: { values: number[]; color?: string; height?: number }) {
  const [ref, { w }] = useSize<HTMLDivElement>();
  const reduce = useReduce();
  const uid = uidOf(useId());
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map(
    (v, i) => [(i / (values.length - 1)) * w, 3 + (1 - (v - min) / (max - min || 1)) * (height - 6)] as [number, number],
  );
  const d = smoothPath(pts);
  return (
    <div ref={ref} style={{ height }}>
      {w > 0 && (
        <svg width={w} height={height} className="block overflow-visible">
          <defs>
            <linearGradient id={`${uid}-s`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.28 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <motion.path
            d={`${d} L${w},${height} L0,${height} Z`}
            style={{ fill: `url(#${uid}-s)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduce ? 0 : 0.9, duration: 0.8 }}
          />
          <motion.path
            d={d}
            fill="none"
            style={{ stroke: color }}
            strokeWidth={2}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={reduce ? { duration: 0 } : { duration: 1.2, delay: 0.35, ease: ease.out }}
          />
        </svg>
      )}
    </div>
  );
}
