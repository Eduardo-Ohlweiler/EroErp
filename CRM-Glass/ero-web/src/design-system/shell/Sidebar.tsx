import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { LogOut, Sparkles } from 'lucide-react';
import { blocoReduzido, cascaMenu, micro, spring } from '../../motion/tokens';
import { useAtrasoMontagem } from '../../motion/coreografia/contexto';
import { useReduzirMovimento } from '../../motion/reduzir';
import { cn } from '../../shared/util/utils';
import { isActive, type ItemMenu } from './navegacao';

export type SidebarProps = {
  /** telas principais (já filtradas por permissão) */
  itens: ItemMenu[];
  /** grupo de baixo, separado por uma linha (ex.: Minha conta, Logs) */
  itensSistema?: ItemMenu[];
  onSair: () => void;
  /** nome do produto ou do contratante, para o link do topo */
  marca?: string;
};

/** Menu lateral flutuante em pílula. O destaque do item ativo desliza entre os itens. */
export function Sidebar({ itens, itensSistema = [], onSair, marca = 'CRM Glass' }: SidebarProps) {
  const { pathname } = useLocation();
  // Primeira parte da casca a montar e a última a sair (motion/tokens.ts, casca).
  const reduzir = useReduzirMovimento();
  const atraso = useAtrasoMontagem();
  const variants = useMemo(() => (reduzir ? blocoReduzido : cascaMenu(atraso)), [reduzir, atraso]);
  return (
    <motion.aside
      variants={variants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="glass fixed z-40 left-4 top-4 bottom-4 w-[72px] rounded-[28px] hidden md:flex flex-col items-center py-4 gap-1.5"
    >
      <Link to="/" aria-label={`${marca} — início`} className="mb-3 size-11 rounded-2xl accent-gradient accent-glow grid place-items-center">
        <Sparkles className="size-5" />
      </Link>
      <nav aria-label="Principal" className="flex flex-col items-center gap-1.5">
        {itens.map((n) => (
          <NavItem key={n.to} {...n} active={isActive(pathname, n.to)} />
        ))}
      </nav>
      {itensSistema.length > 0 && (
        <>
          <div className="w-7 h-px bg-[var(--line)] my-2.5" />
          <nav aria-label="Sistema" className="flex flex-col items-center gap-1.5">
            {itensSistema.map((n) => (
              <NavItem key={n.to} {...n} active={isActive(pathname, n.to)} />
            ))}
          </nav>
        </>
      )}
      <div className="mt-auto">
        <ComDica label="Sair">
          {(dica) => (
            <button
              type="button"
              onClick={onSair}
              aria-label="Sair"
              {...dica}
              className="relative size-11 grid place-items-center rounded-2xl transition-colors duration-200 text-muted hover:text-fg hover:bg-[var(--chip)]"
            >
              <LogOut className="relative size-[19px]" strokeWidth={1.9} />
            </button>
          )}
        </ComDica>
      </div>
    </motion.aside>
  );
}

type Dica = { onMouseEnter: () => void; onMouseLeave: () => void; onFocus: () => void; onBlur: () => void };

/** Rótulo que aparece com mola ao passar o mouse ou focar pelo teclado. */
function ComDica({ label, children }: { label: string; children: (dica: Dica) => ReactNode }) {
  const [hover, setHover] = useState(false);
  const dica: Dica = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onFocus: () => setHover(true),
    onBlur: () => setHover(false),
  };
  return (
    <div className="relative">
      {children(dica)}
      <AnimatePresence>
        {hover && (
          <motion.span
            aria-hidden
            initial={{ opacity: 0, x: -8, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -4, scale: 0.97, transition: { duration: micro.saidaRapida } }}
            transition={spring.snappy}
            className="tooltip absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap pointer-events-none"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  badge,
  active,
}: { to: string; label: string; icon: ComponentType<{ className?: string; strokeWidth?: number }>; badge?: number } & { active: boolean }) {
  return (
    <ComDica label={label}>
      {(dica) => (
        <NavLink
          to={to}
          aria-label={label}
          aria-current={active ? 'page' : undefined}
          {...dica}
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
            <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-danger text-on-strong text-[9px] font-bold grid place-items-center ring-2 ring-[var(--bg)]">
              {badge}
            </span>
          ) : null}
        </NavLink>
      )}
    </ComDica>
  );
}

/** Em telas pequenas o menu vira uma barra inferior. */
export function MobileNav({ itens }: { itens: ItemMenu[] }) {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Principal" className="md:hidden glass fixed z-40 bottom-3 inset-x-3 h-16 rounded-[24px] flex items-center justify-around px-2">
      {itens.slice(0, 5).map(({ to, label, icon: Icon }) => {
        const active = isActive(pathname, to);
        return (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
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
