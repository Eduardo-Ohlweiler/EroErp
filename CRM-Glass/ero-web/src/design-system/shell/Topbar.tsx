import { forwardRef, useEffect, useMemo, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { blocoReduzido, cascaBarra, tituloTela } from '../../motion/tokens';
import { useAtrasoMontagem } from '../../motion/coreografia/contexto';
import { useReduzirMovimento } from '../../motion/reduzir';
import { cn } from '../../shared/util/utils';

export type TopbarProps = {
  /** título da tela atual (chip animado ao lado do contratante) */
  titulo: string;
  /** chip do contratante (ChipContratante) */
  contratante?: ReactNode;
  /** abre a busca (CommandPalette) */
  onBuscar: () => void;
  textoBusca?: string;
  /** canto direito: MenuUsuario */
  direita?: ReactNode;
};

/**
 * Barra superior: contratante, título da tela, busca (Ctrl K), relógio e menu do usuário.
 * Sem botão de tema (a aparência é do contratante), sem "Novo" e sem sino nesta fase.
 */
export function Topbar({ titulo, contratante, onBuscar, textoBusca = 'Buscar telas…', direita }: TopbarProps) {
  const [now, setNow] = useState(() => new Date());
  // Segunda parte da casca a montar (depois do menu) e a penúltima a sair (motion/tokens.ts, casca).
  const reduzir = useReduzirMovimento();
  const atraso = useAtrasoMontagem();
  const variants = useMemo(() => (reduzir ? blocoReduzido : cascaBarra(atraso)), [reduzir, atraso]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.header
      variants={variants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="glass sticky top-4 z-30 h-16 rounded-[22px] px-2.5 flex items-center gap-2"
    >
      {contratante}

      <ChevronRight className="size-4 text-subtle hidden sm:block shrink-0" aria-hidden />
      <div className="relative h-8 hidden sm:flex items-center shrink-0 min-w-[120px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={titulo}
            variants={reduzir ? blocoReduzido : tituloTela}
            initial="hidden"
            animate="show"
            exit="exit"
            className="chip h-8 px-3 rounded-full text-xs font-medium flex items-center whitespace-nowrap"
          >
            {titulo}
          </motion.span>
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={onBuscar}
        aria-keyshortcuts="Control+K"
        className="chip mx-auto h-11 w-full max-w-[440px] min-w-0 rounded-2xl flex items-center gap-2.5 px-3.5 text-sm text-subtle hover:bg-[var(--chip-hover)] hover:text-muted transition-colors"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{textoBusca}</span>
        <span className="ml-auto kbd hidden md:inline" aria-hidden>
          Ctrl K
        </span>
      </button>

      <div className="flex items-center gap-1.5 shrink-0">
        <div className="chip h-11 px-3 rounded-2xl hidden xl:flex flex-col justify-center leading-tight text-right">
          <span className="text-[13px] font-semibold tabular-nums">
            {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[10px] text-subtle">{now.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        </div>
        {direita && <span className="hidden sm:inline-flex">{direita}</span>}
      </div>
    </motion.header>
  );
}

export type ChipContratanteProps = Omit<ComponentPropsWithoutRef<'button'>, 'children'> & {
  nome: string;
  /** segunda linha (ex.: "Plataforma", "Superadmin") */
  detalhe?: string;
  /** só o superadmin troca de contratante: sem `onClick`, o chip não é clicável */
  onClick?: () => void;
};

/** Chip do contratante no começo da barra. Com `onClick` vira botão (abre o SeletorContratante). */
export const ChipContratante = forwardRef<HTMLButtonElement, ChipContratanteProps>(function ChipContratante(
  { nome, detalhe, onClick, className, ...rest },
  ref,
) {
  const sigla = nome.trim().charAt(0).toUpperCase() || '·';
  const conteudo = (
    <>
      <span aria-hidden className="size-8 rounded-xl accent-gradient grid place-items-center text-[13px] font-extrabold">
        {sigla}
      </span>
      <span className="text-left leading-tight hidden lg:block">
        <span className="block text-[13px] font-semibold max-w-[180px] truncate">{nome}</span>
        {detalhe && <span className="block text-[11px] text-subtle">{detalhe}</span>}
      </span>
    </>
  );
  const base = 'chip h-11 pl-1.5 pr-2.5 rounded-2xl flex items-center gap-2.5 shrink-0';
  if (!onClick)
    return (
      <div className={cn(base, className)} title={nome}>
        {conteudo}
        <span className="sr-only lg:hidden">{nome}</span>
      </div>
    );
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={`Contratante: ${nome}. Trocar de contratante`}
      className={cn(base, 'hover:bg-[var(--chip-hover)] transition-colors', className)}
      {...rest}
    >
      {conteudo}
      <ChevronDown className="size-4 text-subtle" aria-hidden />
    </button>
  );
});
