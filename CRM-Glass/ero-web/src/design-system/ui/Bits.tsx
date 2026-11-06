import { forwardRef, useId, type ComponentType, type InputHTMLAttributes, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { spring } from '../../motion/tokens';
import { cn, hash } from '../../shared/util/utils';
import { CampoForm } from './CampoForm';

/* ---------------- Etiqueta ---------------- */
export type Tone = 'neutral' | 'accent' | 'success' | 'danger' | 'warning' | 'info';
const toneClass: Record<Tone, string> = {
  neutral: 'bg-[var(--chip)] text-muted border-line',
  accent: 'bg-accent/15 text-accent-text border-accent/25',
  success: 'bg-success/12 text-success border-success/25',
  danger: 'bg-danger/12 text-danger border-danger/25',
  warning: 'bg-warning/12 text-warning border-warning/25',
  info: 'bg-info/12 text-info border-info/25',
};
export function Badge({
  tone = 'neutral',
  dot,
  children,
  className,
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full border text-[11px] font-semibold whitespace-nowrap',
        toneClass[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function Delta({ value, suffix = '%', onAccent }: { value: number; suffix?: string; onAccent?: boolean }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] font-semibold tabular-nums',
        onAccent ? 'bg-[color-mix(in_srgb,var(--on-accent)_20%,transparent)] text-on-accent' : up ? 'bg-success/12 text-success' : 'bg-danger/12 text-danger',
      )}
    >
      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {up ? '+' : ''}
      {value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
      {suffix}
    </span>
  );
}

/* ---------------- Avatar ---------------- */
const grads = [
  'linear-gradient(135deg, var(--accent), var(--accent-2))',
  'linear-gradient(135deg, var(--info), var(--accent))',
  'linear-gradient(135deg, var(--success), var(--info))',
  'linear-gradient(135deg, var(--warning), var(--danger))',
  'linear-gradient(135deg, var(--accent-3), var(--accent))',
  'linear-gradient(135deg, var(--accent-2), var(--success))',
];
export function Avatar({ name, size = 32, ring, className }: { name: string; size?: number; ring?: boolean; className?: string }) {
  const initials = name
    .split(' ')
    .filter((p) => p.length > 2 || /^[A-Z]/.test(p))
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return (
    <span
      title={name}
      className={cn(
        'inline-grid place-items-center rounded-full font-semibold text-on-strong shrink-0 select-none',
        ring && 'ring-2 ring-[var(--bg)]',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.36), background: grads[hash(name) % grads.length] }}
    >
      {initials}
    </span>
  );
}
export function AvatarStack({ names, size = 26, max = 4 }: { names: string[]; size?: number; max?: number }) {
  const rest = names.length - max;
  return (
    <div className="flex items-center">
      {names.slice(0, max).map((n, i) => (
        <span key={n} style={{ marginLeft: i ? -size * 0.3 : 0 }}>
          <Avatar name={n} size={size} ring />
        </span>
      ))}
      {rest > 0 && (
        <span
          className="chip rounded-full grid place-items-center text-[10px] font-semibold text-muted"
          style={{ width: size, height: size, marginLeft: -size * 0.3 }}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}

/* ---------------- Controle segmentado (pílula que desliza) ---------------- */
export type SegOption<T extends string> = { value: T; label: ReactNode; ariaLabel?: string };
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const id = useId();
  return (
    <div role="tablist" className={cn('chip inline-flex p-1 rounded-full gap-0.5', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={o.ariaLabel}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative rounded-full font-medium transition-colors whitespace-nowrap inline-flex items-center gap-1.5',
              size === 'sm' ? 'h-7 px-2.5 text-[11px]' : 'h-8 px-3.5 text-xs',
              active ? 'text-fg' : 'text-muted hover:text-fg',
            )}
          >
            {active && (
              <motion.span
                layoutId={id}
                transition={spring.snappy}
                className="absolute inset-0 rounded-full bg-[var(--seg-active)] pill-shadow"
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Interruptor ---------------- */
export function Toggle({
  checked,
  onChange,
  label,
  ariaLabel,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
  /** obrigatório quando não há `label` visível */
  ariaLabel?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3 text-sm disabled:opacity-50 disabled:pointer-events-none"
    >
      <span
        className={cn(
          'relative w-11 h-6 rounded-full p-0.5 flex transition-colors duration-300',
          checked ? 'accent-gradient justify-end' : 'bg-[var(--chip-hover)] justify-start',
        )}
      >
        <motion.span layout transition={spring.snappy} className="size-5 rounded-full slider-knob" />
      </span>
      {label && <span>{label}</span>}
    </button>
  );
}

/* ---------------- Campos ---------------- */
type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: ComponentType<{ className?: string }>;
  invalid?: boolean;
  right?: ReactNode;
};
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { icon: Icon, invalid, right, className, ...rest },
  ref,
) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-subtle pointer-events-none" />}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn('input', Icon && 'pl-10', !!right && 'pr-11', className)}
        {...rest}
      />
      {right && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{right}</div>}
    </div>
  );
});

/** Nome do protótipo. Mesmo visual; agora o rótulo, a dica e o erro ficam ligados ao controle (CampoForm). */
export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <CampoForm rotulo={label} erro={error} dica={hint} bloco={false}>
      {children}
    </CampoForm>
  );
}

/* ---------------- Barra de progresso ---------------- */
export function Progress({ value, color, delay = 0.2, className }: { value: number; color?: string; delay?: number; className?: string }) {
  return (
    <div className={cn('h-1.5 rounded-full bg-[var(--track)] overflow-hidden', className)}>
      <motion.div
        className={cn('h-full rounded-full origin-left', !color && 'accent-gradient')}
        style={color ? { background: color } : undefined}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: Math.min(1, Math.max(0, value / 100)) }}
        transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
