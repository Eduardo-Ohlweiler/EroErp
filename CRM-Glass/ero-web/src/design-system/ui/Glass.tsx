import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { spring } from '../../motion/tokens';
import { cn } from '../../shared/util/utils';
import { useVariantesBloco, type PropsBloco } from './bloco';

type Level = 'subtle' | 'default' | 'solid';
const levelClass: Record<Level, string> = {
  subtle: 'glass-subtle',
  default: 'glass',
  solid: 'glass-solid',
};

export type GlassCardProps = HTMLMotionProps<'div'> &
  PropsBloco & {
    /** subtle: painéis grandes · default: cartões · solid: tabelas, formulários, modais */
    level?: Level;
    /** sobe levemente e acende a borda ao passar o mouse */
    hover?: boolean;
    padded?: boolean;
  };

/**
 * Cartão de vidro. É um bloco da montagem da tela (variants = VARIANTES_BLOCO, ou as recebidas).
 * A opacidade anima no próprio cartão — nunca num wrapper — para o backdrop-filter não "piscar".
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { level = 'default', hover = false, padded = true, bloco = true, variants, className, children, ...rest },
  ref,
) {
  const variantesBloco = useVariantesBloco(bloco, variants);
  return (
    <motion.div
      ref={ref}
      variants={variantesBloco}
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

export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
  className,
  bloco = true,
  variants,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** o caminho até a tela, em texto, acima do título: `['Administração', 'Contratantes']` */
  breadcrumb?: string[];
  className?: string;
} & PropsBloco) {
  const variantesBloco = useVariantesBloco(bloco, variants);
  return (
    <motion.div variants={variantesBloco} className={cn('flex flex-wrap items-end justify-between gap-4 mb-6', className)}>
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="Caminho" className="mb-1 text-xs text-muted">
            <ol className="flex flex-wrap items-center gap-x-1.5">
              {breadcrumb.map((b, i) => (
                <li key={`${i}-${b}`} className="flex items-center gap-x-1.5" aria-current={i === breadcrumb.length - 1 ? 'page' : undefined}>
                  {i > 0 && (
                    <span aria-hidden className="text-subtle">
                      ›
                    </span>
                  )}
                  {b}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-[26px] md:text-[30px] font-semibold tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

const alinhamento = { inicio: 'justify-start', fim: 'justify-end', entre: 'justify-between' } as const;

/** Barra de ações de formulário ou de lista (Cancelar / Salvar). Também é um bloco da montagem. */
export function BarraAcoes({
  children,
  alinhar = 'fim',
  className,
  bloco = true,
  variants,
  ...rest
}: { children: ReactNode; alinhar?: keyof typeof alinhamento; className?: string } & PropsBloco &
  Omit<HTMLMotionProps<'div'>, 'children' | 'className' | 'variants'>) {
  const variantesBloco = useVariantesBloco(bloco, variants);
  return (
    <motion.div
      {...rest}
      variants={variantesBloco}
      className={cn('flex flex-wrap items-center gap-2', alinhamento[alinhar], className)}
    >
      {children}
    </motion.div>
  );
}
