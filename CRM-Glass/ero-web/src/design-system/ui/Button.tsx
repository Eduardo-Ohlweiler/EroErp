import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { spring } from '../../motion/tokens';
import { cn } from '../../shared/util/utils';

type Variant = 'primary' | 'glass' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const vc: Record<Variant, string> = {
  primary: 'accent-gradient accent-glow btn-shine font-semibold',
  glass: 'chip text-fg hover:bg-[var(--chip-hover)]',
  ghost: 'text-muted hover:text-fg hover:bg-[var(--chip)]',
  danger: 'bg-danger/12 text-danger border border-danger/25 hover:bg-danger/20',
};
const sc: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-xl',
  md: 'h-10 px-4 text-sm gap-2 rounded-[14px]',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-2xl',
  icon: 'size-10 rounded-[14px] justify-center',
};

export type ButtonProps = HTMLMotionProps<'button'> & { variant?: Variant; size?: Size };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'glass', size = 'md', className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      whileTap={{ scale: 0.96 }}
      transition={spring.snappy}
      className={cn(
        'inline-flex items-center font-medium whitespace-nowrap transition-colors select-none disabled:opacity-50 disabled:pointer-events-none',
        vc[variant],
        sc[size],
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
});
