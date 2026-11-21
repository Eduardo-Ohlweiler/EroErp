import { Fragment, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { LogOut, Sparkles } from 'lucide-react';
import { blocoReduzido, cascaMenu, micro, spring } from '../../motion/tokens';
import { useAtrasoMontagem } from '../../motion/coreografia/contexto';
import { useReduzirMovimento } from '../../motion/reduzir';
import { cn } from '../../shared/util/utils';
import { isActive, itemAtivo, secoesDaBarraInferior, type ItemMenu, type SecaoMenu } from './navegacao';
import { GatilhoDoSubmenu, Submenu, useEstadoDoSubmenu } from './Submenu';

export type SidebarProps = {
  /**
   * As seções do menu, de cima para baixo (já filtradas por permissão): cada uma vira um `<nav aria-label={rotulo}>`,
   * separada da anterior por uma linha. Seção sem item não aparece. Item com `filhos` abre o submenu flutuante.
   */
  secoes: SecaoMenu[];
  onSair: () => void;
  /** nome do produto ou do contratante, para o link do topo */
  marca?: string;
};

/**
 * Menu lateral flutuante em pílula (trilho de ícones). O destaque do item ativo desliza entre os itens.
 * Fica em `glass` (segue a Aparência): o conteúdo começa depois dele (`md:pl-[104px]` na Casca) e nada rola por baixo.
 */
export function Sidebar({ secoes, onSair, marca = 'CRM Glass' }: SidebarProps) {
  const { pathname } = useLocation();
  // Primeira parte da casca a montar e a última a sair (motion/tokens.ts, casca).
  const reduzir = useReduzirMovimento();
  const atraso = useAtrasoMontagem();
  const variants = useMemo(() => (reduzir ? blocoReduzido : cascaMenu(atraso)), [reduzir, atraso]);
  const visiveis = secoes.filter((s) => s.itens.length > 0);
  return (
    <motion.aside
      variants={variants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="glass fixed z-menu left-4 top-4 bottom-4 w-[72px] rounded-[28px] hidden md:flex flex-col items-center py-4 gap-1.5"
    >
      <Link to="/" aria-label={`${marca} — início`} className="mb-3 size-11 rounded-2xl accent-gradient accent-glow grid place-items-center">
        <Sparkles className="size-5" />
      </Link>
      {visiveis.map((s, i) => (
        <Fragment key={s.rotulo}>
          {i > 0 && <div aria-hidden className="w-7 h-px bg-[var(--line)] my-2.5" />}
          <nav aria-label={s.rotulo} className="flex flex-col items-center gap-1.5">
            {s.itens.map((n) =>
              n.filhos?.length ? (
                <NavItemComFilhos key={n.to} item={n} active={itemAtivo(pathname, n)} />
              ) : (
                <NavItem key={n.to} {...n} active={isActive(pathname, n.to)} />
              ),
            )}
          </nav>
        </Fragment>
      ))}
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

/** Rótulo que aparece com mola ao passar o mouse ou focar pelo teclado. `oculta`: some (o submenu do item está aberto). */
function ComDica({ label, oculta, children }: { label: string; oculta?: boolean; children: (dica: Dica) => ReactNode }) {
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
        {hover && !oculta && (
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

type Icone = ComponentType<{ className?: string; strokeWidth?: number }>;

/** O miolo do botão do trilho: o destaque que desliza (item ativo), o ícone e o contador. */
function MioloDoTrilho({ icon: Icon, badge, active }: { icon: Icone; badge?: number; active: boolean }) {
  return (
    <>
      {active && <motion.span layoutId="nav-active" transition={spring.snappy} className="absolute inset-0 rounded-2xl accent-gradient accent-glow" />}
      <Icon className="relative size-[19px]" strokeWidth={1.9} />
      {badge ? (
        <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-danger text-on-strong text-[9px] font-bold grid place-items-center ring-2 ring-[var(--bg)]">
          {badge}
        </span>
      ) : null}
    </>
  );
}

const classeDoTrilho = (active: boolean) =>
  cn(
    'relative size-11 grid place-items-center rounded-2xl transition-colors duration-200',
    active ? 'text-on-accent' : 'text-muted hover:text-fg hover:bg-[var(--chip)]',
  );

function NavItem({ to, label, icon, badge, active }: ItemMenu & { active: boolean }) {
  return (
    <ComDica label={label}>
      {(dica) => (
        <NavLink to={to} aria-label={label} aria-current={active ? 'page' : undefined} {...dica} className={classeDoTrilho(active)}>
          <MioloDoTrilho icon={icon} badge={badge} active={active} />
        </NavLink>
      )}
    </ComDica>
  );
}

/** Item do trilho com filhos: um botão que abre o submenu à direita. A dica some enquanto o submenu está aberto. */
function NavItemComFilhos({ item, active }: { item: ItemMenu; active: boolean }) {
  const { onKeyDown, ...submenu } = useEstadoDoSubmenu('direita');
  return (
    <Submenu item={item} lado="direita" {...submenu}>
      <ComDica label={item.label} oculta={submenu.aberto}>
        {(dica) => (
          <GatilhoDoSubmenu asChild>
            <button
              type="button"
              aria-haspopup="menu"
              aria-label={item.label}
              data-ativo={active || undefined}
              {...dica}
              onKeyDown={onKeyDown}
              className={cn(classeDoTrilho(active), submenu.aberto && !active && 'text-fg bg-[var(--chip)]')}
            >
              <MioloDoTrilho icon={item.icon} badge={item.badge} active={active} />
            </button>
          </GatilhoDoSubmenu>
        )}
      </ComDica>
    </Submenu>
  );
}

export type MobileNavProps = {
  /**
   * as mesmas seções do menu lateral; na barra entram na ordem, separadas por uma linha, até `MAXIMO_NA_BARRA_INFERIOR`.
   * Passou disso, o último lugar vira "Mais", que abre o submenu com o resto (`secoesDaBarraInferior`).
   */
  secoes: SecaoMenu[];
};

/**
 * Em telas pequenas o menu vira uma barra inferior (as seções na ordem; item com filhos abre o submenu acima da barra).
 * O conteúdo rola por baixo dela: é camada flutuante (`glass-flutuante`, opacidade e desfoque de piso).
 */
export function MobileNav({ secoes }: MobileNavProps) {
  const { pathname } = useLocation();
  const visiveis = secoesDaBarraInferior(secoes);
  return (
    <div className="md:hidden glass-flutuante fixed z-menu bottom-3 inset-x-3 h-16 rounded-[24px] flex items-center px-2">
      {/* Cada seção cresce na proporção dos seus ícones: o espaço entre os ícones fica igual em todas. */}
      {visiveis.map((s, i) => (
        <Fragment key={s.rotulo}>
          {i > 0 && <span aria-hidden className="w-px h-7 bg-[var(--line)]" />}
          <nav aria-label={s.rotulo} className="flex items-center justify-around" style={{ flexGrow: s.itens.length }}>
            {s.itens.map((n) =>
              n.filhos?.length ? (
                <ItemBarraComFilhos key={n.to} item={n} active={itemAtivo(pathname, n)} />
              ) : (
                <ItemBarra key={n.to} {...n} active={isActive(pathname, n.to)} />
              ),
            )}
          </nav>
        </Fragment>
      ))}
    </div>
  );
}

const classeDaBarra = (active: boolean) => cn('relative size-11 grid place-items-center rounded-2xl', active ? 'text-on-accent' : 'text-muted');

function MioloDaBarra({ icon: Icon, active }: { icon: Icone; active: boolean }) {
  return (
    <>
      {active && <motion.span layoutId="nav-active-m" transition={spring.snappy} className="absolute inset-0 rounded-2xl accent-gradient" />}
      <Icon className="relative size-5" />
    </>
  );
}

function ItemBarra({ to, label, icon, active }: ItemMenu & { active: boolean }) {
  return (
    <NavLink to={to} aria-label={label} aria-current={active ? 'page' : undefined} className={classeDaBarra(active)}>
      <MioloDaBarra icon={icon} active={active} />
    </NavLink>
  );
}

/** Item da barra inferior com filhos: abre o submenu acima da barra. */
function ItemBarraComFilhos({ item, active }: { item: ItemMenu; active: boolean }) {
  const { onKeyDown, ...submenu } = useEstadoDoSubmenu('acima');
  return (
    <Submenu item={item} lado="acima" {...submenu}>
      <GatilhoDoSubmenu asChild>
        <button
          type="button"
          aria-haspopup="menu"
          aria-label={item.label}
          data-ativo={active || undefined}
          onKeyDown={onKeyDown}
          className={cn(classeDaBarra(active), submenu.aberto && !active && 'text-fg bg-[var(--chip)]')}
        >
          <MioloDaBarra icon={item.icon} active={active} />
        </button>
      </GatilhoDoSubmenu>
    </Submenu>
  );
}
