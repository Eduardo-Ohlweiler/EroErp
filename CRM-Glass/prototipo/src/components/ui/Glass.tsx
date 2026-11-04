import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { item, spring } from '../../motion/tokens';
import { cn } from '../../lib/utils';

type Level = 'subtle' | 'default' | 'solid';
const levelClass: Record<Level, string> = {
  subtle: 'glass-subtle',
  default: 'glass',
  solid: 'glass-solid',
};

export type GlassCardProps = HTMLMotionProps<'div'> & {
  /** subtle: painéis grandes · default: cartões · solid: tabelas, formulários, modais */
  level?: Level;
  /** sobe levemente e acende a borda ao passar o mouse */
  hover?: boolean;
  padded?: boolean;
};

/**
 * Cartão de vidro. Já participa da cascata de entrada da tela (variants = item).
 * A opacidade anima no próprio cartão — nunca num wrapper — para o backdrop-filter não "piscar".
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { level = 'default', hover = false, padded = true, className, children, ...rest },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      variants={item}
      whileHover={hover ? { y: -4 } : undefined}
      transition={spring.soft}
      className={cn(levelClass[level], hover && 'glass-hover', padded && 'p-5', className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
});

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-4', className)}>
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <motion.div variants={item} className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-[26px] md:text-[30px] font-semibold tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
