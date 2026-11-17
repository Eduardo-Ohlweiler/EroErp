import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router';
import * as RadixPopover from '@radix-ui/react-popover';
import { AnimatePresence, motion } from 'motion/react';
import { variantesDoSubmenu, type LadoDoSubmenu } from '../../motion/tokens';
import { useReduzirMovimento } from '../../motion/reduzir';
import { cn } from '../../shared/util/utils';
import { isActive, type ItemMenu } from './navegacao';

/**
 * De que lado do botão o submenu abre: à direita do trilho (computador) ou acima da barra inferior (celular).
 * O movimento é a coreografia `submenu` de motion/tokens.ts (`variantesDoSubmenu`): abre do trilho para fora com
 * mola curta e fecha mais rápido; no movimento reduzido, só opacidade.
 */
export type { LadoDoSubmenu };

export type SubmenuProps = {
  /** o pai: `label` vira o título do submenu; `filhos`, os itens */
  item: ItemMenu;
  lado: LadoDoSubmenu;
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  /** onde o foco vai ao abrir (padrão: o 1º filho); o `useEstadoDoSubmenu` cuida */
  focoAoAbrir?: FocoAoAbrir;
  /** o botão do pai, embrulhado em `<GatilhoDoSubmenu asChild>` (pode estar dentro da dica do trilho) */
  children: ReactNode;
};

/** O botão que abre o submenu (o `Trigger` do Radix: põe `aria-expanded` e `aria-controls`). Use com `asChild`. */
export const GatilhoDoSubmenu = RadixPopover.Trigger;

/** Onde o foco vai quando o submenu abre: o 1º filho (Enter, Espaço, seta para dentro) ou o último (seta para fora). */
export type FocoAoAbrir = 'primeiro' | 'ultimo';

/**
 * Teclas do botão do pai (padrão menu-button): a seta "para dentro" do submenu abre no 1º filho e a seta oposta no
 * último. Devolve onde focar, ou `null` se a tecla não abre. Função pura.
 */
export function focoPelaTecla(tecla: string, lado: LadoDoSubmenu): FocoAoAbrir | null {
  if (tecla === 'ArrowDown') return 'primeiro';
  if (tecla === 'ArrowUp') return 'ultimo';
  if (lado === 'direita' && tecla === 'ArrowRight') return 'primeiro';
  return null;
}

/**
 * Submenu flutuante de um item do menu com `filhos` (docs/07 §0, casca): `glass-solid`, camada `z-popover`, num portal
 * (fora do vidro do trilho), à direita do trilho ou acima da barra inferior. Título = rótulo do pai; filhos com ícone e
 * texto, o da rota atual com `aria-current="page"`.
 *
 * Teclado (padrão menu-button): Enter, Espaço ou as setas no botão abrem; ↑ ↓ Home End andam entre os filhos (com
 * volta); Enter abre a tela; Esc, Tab e o clique fora fecham, e o foco volta ao botão do pai.
 */
export function Submenu({ item, lado, aberto, onAbertoChange, focoAoAbrir = 'primeiro', children }: SubmenuProps) {
  const { pathname } = useLocation();
  const reduzir = useReduzirMovimento();
  const lista = useRef<HTMLDivElement>(null);
  const titulo = useId();
  const filhos = item.filhos ?? [];

  const itens = () => Array.from(lista.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
  const tecla = (e: KeyboardEvent<HTMLDivElement>) => {
    const todos = itens();
    const i = todos.indexOf(document.activeElement as HTMLElement);
    const ir = (n: number) => {
      e.preventDefault();
      todos[(n + todos.length) % todos.length]?.focus();
    };
    if (e.key === 'ArrowDown') ir(i + 1);
    else if (e.key === 'ArrowUp') ir(i - 1);
    else if (e.key === 'Home') ir(0);
    else if (e.key === 'End') ir(todos.length - 1);
    else if (e.key === 'ArrowLeft' && lado === 'direita') {
      // a seta "para fora" fecha e volta ao trilho, como a seta para dentro abriu
      e.preventDefault();
      onAbertoChange(false);
    } else if (e.key === 'Tab') {
      // Tab e Shift+Tab fecham; o Radix devolve o foco ao botão do pai
      e.preventDefault();
      onAbertoChange(false);
    }
  };

  return (
    <RadixPopover.Root open={aberto} onOpenChange={onAbertoChange}>
      {children}
      <AnimatePresence>
        {aberto && (
          <RadixPopover.Portal forceMount>
            <RadixPopover.Content
              forceMount
              asChild
              side={lado === 'direita' ? 'right' : 'top'}
              align={lado === 'direita' ? 'start' : 'center'}
              sideOffset={lado === 'direita' ? 26 : 14}
              collisionPadding={12}
              // o Radix marca o conteúdo como dialog; aqui o papel é do role=menu de dentro
              role="presentation"
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                const todos = itens();
                (focoAoAbrir === 'ultimo' ? todos[todos.length - 1] : todos[0])?.focus();
              }}
            >
              <motion.div
                data-submenu
                variants={variantesDoSubmenu(lado, reduzir)}
                initial="hidden"
                animate="show"
                exit="exit"
                style={{ transformOrigin: 'var(--radix-popover-content-transform-origin)' }}
                className="glass-solid z-popover !rounded-2xl p-1.5 w-[248px] max-w-[calc(100vw-1.5rem)]"
              >
                <div id={titulo} className="px-2.5 pt-1.5 pb-2 text-xs font-semibold text-muted">
                  {item.label}
                </div>
                <div ref={lista} role="menu" aria-labelledby={titulo} onKeyDown={tecla} className="flex flex-col gap-0.5">
                  {filhos.map((f) => {
                    const atual = isActive(pathname, f.to);
                    const Icone = f.icon;
                    return (
                      <NavLink
                        key={f.to}
                        to={f.to}
                        role="menuitem"
                        tabIndex={-1}
                        aria-current={atual ? 'page' : undefined}
                        onClick={() => onAbertoChange(false)}
                        className={cn(
                          'flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm transition-colors',
                          'hover:bg-[var(--chip)] focus-visible:bg-[var(--chip)] focus-visible:outline-offset-[-2px]',
                          atual && 'bg-[var(--chip)] font-semibold',
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn('size-8 rounded-lg grid place-items-center shrink-0', atual ? 'accent-gradient text-on-accent' : 'chip')}
                        >
                          <Icone className="size-4" />
                        </span>
                        <span className="min-w-0">{f.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </motion.div>
            </RadixPopover.Content>
          </RadixPopover.Portal>
        )}
      </AnimatePresence>
    </RadixPopover.Root>
  );
}

/**
 * Estado do submenu de um item (aberto e onde focar ao abrir) e as teclas do botão do pai. O `onKeyDown` vai no
 * botão do pai; `aberto`, `onAbertoChange` e `focoAoAbrir`, no `Submenu`.
 */
export function useEstadoDoSubmenu(lado: LadoDoSubmenu) {
  const [aberto, setAberto] = useState(false);
  const [focoAoAbrir, setFocoAoAbrir] = useState<FocoAoAbrir>('primeiro');
  const onAbertoChange = (a: boolean) => {
    // Enter, Espaço e clique abrem no 1º filho; ao fechar, o próximo abrir volta ao padrão.
    if (!a) setFocoAoAbrir('primeiro');
    setAberto(a);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const foco = focoPelaTecla(e.key, lado);
    if (!foco || aberto) return;
    e.preventDefault();
    setFocoAoAbrir(foco);
    setAberto(true);
  };
  return { aberto, onAbertoChange, focoAoAbrir, onKeyDown };
}
