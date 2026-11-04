import { useState, type ComponentType } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { LogOut, Sparkles } from 'lucide-react';
import { ease, spring } from '../../motion/tokens';
import { cn } from '../../lib/utils';
import { NAV, NAV_BOTTOM, isActive } from './nav';

type ItemProps = { to: string; label: string; icon: ComponentType<{ className?: string; strokeWidth?: number }>; badge?: number };

/** Menu lateral flutuante em pílula. O destaque do item ativo desliza entre os itens. */
export function Sidebar() {
  const { pathname } = useLocation();
  return (
    <motion.aside
      initial={{ x: -48, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: ease.out }}
      className="glass fixed z-40 left-4 top-4 bottom-4 w-[72px] rounded-[28px] hidden md:flex flex-col items-center py-4 gap-1.5"
    >
      <Link
        to="/"
        aria-label="Vitrum CRM — início"
        className="mb-3 size-11 rounded-2xl accent-gradient accent-glow grid place-items-center"
      >
        <Sparkles className="size-5" />
      </Link>
      <nav aria-label="Principal" className="flex flex-col items-center gap-1.5">
        {NAV.map((n) => (
          <NavItem key={n.to} {...n} active={isActive(pathname, n.to)} />
        ))}
      </nav>
      <div className="w-7 h-px bg-[var(--line)] my-2.5" />
      <nav aria-label="Sistema" className="flex flex-col items-center gap-1.5">
        {NAV_BOTTOM.map((n) => (
          <NavItem key={n.to} {...n} active={isActive(pathname, n.to)} />
        ))}
      </nav>
      <div className="mt-auto">
        <NavItem to="/login" label="Sair" icon={LogOut} active={false} />
      </div>
    </motion.aside>
  );
}

function NavItem({ to, label, icon: Icon, badge, active }: ItemProps & { active: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <NavLink
      to={to}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className={cn(
        'relative size-11 grid place-items-center rounded-2xl transition-colors duration-200',
        active ? 'text-on-accent' : 'text-muted hover:text-fg hover:bg-[var(--chip)]',
      )}
    >
      {active && (
        <motion.span layoutId="nav-active" transition={spring.snappy} className="absolute inset-0 rounded-2xl accent-gradient accent-glow" />
      )}
      <Icon className="relative size-[19px]" strokeWidth={1.9} />
      {badge ? (
        <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-danger text-white text-[9px] font-bold grid place-items-center ring-2 ring-[var(--bg)]">
          {badge}
        </span>
      ) : null}
      <AnimatePresence>
        {hover && (
          <motion.span
            initial={{ opacity: 0, x: -8, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -4, scale: 0.97, transition: { duration: 0.12 } }}
            transition={spring.snappy}
            className="tooltip absolute left-full ml-4 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap pointer-events-none"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </NavLink>
  );
}

/** Em telas pequenas o menu vira uma barra inferior. */
export function MobileNav() {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Principal" className="md:hidden glass fixed z-40 bottom-3 inset-x-3 h-16 rounded-[24px] flex items-center justify-around px-2">
      {NAV.slice(0, 5).map(({ to, label, icon: Icon }) => {
        const active = isActive(pathname, to);
        return (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={cn('relative size-11 grid place-items-center rounded-2xl', active ? 'text-on-accent' : 'text-muted')}
          >
            {active && <motion.span layoutId="nav-active-m" transition={spring.snappy} className="absolute inset-0 rounded-2xl accent-gradient" />}
            <Icon className="relative size-5" />
          </NavLink>
        );
      })}
    </nav>
  );
}
