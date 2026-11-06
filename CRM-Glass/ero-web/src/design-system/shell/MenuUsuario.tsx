import { useRef, useState, type ComponentType, type KeyboardEvent } from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import { AnimatePresence, motion } from 'motion/react';
import { LogOut, UserRound } from 'lucide-react';
import { spring } from '../../motion/tokens';
import { cn } from '../../shared/util/utils';
import { Avatar, Badge } from '../ui/Bits';

export type ItemMenuUsuario = {
  rotulo: string;
  icone: ComponentType<{ className?: string }>;
  onSelecionar: () => void;
  perigo?: boolean;
};

export type MenuUsuarioProps = {
  nome: string;
  email?: string;
  /** ex.: "Superadmin", "Administrador" */
  papel?: string;
  /** ex.: nome do contratante em que está */
  contexto?: string;
  onMinhaConta: () => void;
  onSair: () => void;
  /** itens extras entre "Minha conta" e "Sair" */
  itens?: ItemMenuUsuario[];
  /** lado do avatar em px (a Topbar usa 44) */
  tamanho?: number;
};

/**
 * Avatar da barra superior com menu (Minha conta, Sair).
 * Padrão menu-button: setas, Home/End, Esc devolve o foco ao avatar.
 */
export function MenuUsuario({ nome, email, papel, contexto, onMinhaConta, onSair, itens = [], tamanho = 44 }: MenuUsuarioProps) {
  const [aberto, setAberto] = useState(false);
  const lista = useRef<HTMLDivElement>(null);
  const todos: ItemMenuUsuario[] = [
    { rotulo: 'Minha conta', icone: UserRound, onSelecionar: onMinhaConta },
    ...itens,
    { rotulo: 'Sair', icone: LogOut, onSelecionar: onSair, perigo: true },
  ];

  const botoes = () => Array.from(lista.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
  const tecla = (e: KeyboardEvent<HTMLDivElement>) => {
    const bs = botoes();
    const i = bs.indexOf(document.activeElement as HTMLButtonElement);
    const ir = (n: number) => {
      e.preventDefault();
      bs[(n + bs.length) % bs.length]?.focus();
    };
    if (e.key === 'ArrowDown') ir(i + 1);
    else if (e.key === 'ArrowUp') ir(i - 1);
    else if (e.key === 'Home') ir(0);
    else if (e.key === 'End') ir(bs.length - 1);
    else if (e.key === 'Tab') {
      // padrão menu-button: Tab/Shift+Tab fecham o menu e o Radix devolve o foco ao avatar
      e.preventDefault();
      setAberto(false);
    }
  };

  return (
    <RadixPopover.Root open={aberto} onOpenChange={setAberto}>
      <RadixPopover.Trigger
        aria-haspopup="menu"
        aria-label={`Menu de ${nome}`}
        className="rounded-full shrink-0 transition-transform hover:scale-[1.04]"
      >
        <Avatar name={nome} size={tamanho} />
      </RadixPopover.Trigger>
      <AnimatePresence>
        {aberto && (
          <RadixPopover.Portal forceMount>
            <RadixPopover.Content
              forceMount
              asChild
              align="end"
              sideOffset={10}
              // o Radix marca o conteúdo como dialog; aqui o papel é do role=menu de dentro
              role="presentation"
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                botoes()[0]?.focus();
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={spring.snappy}
                style={{ transformOrigin: 'var(--radix-popover-content-transform-origin)' }}
                className="glass-solid z-[70] !rounded-2xl p-1.5 w-[268px]"
              >
                <div className="flex items-center gap-3 px-2.5 pt-2 pb-3 border-b border-line mb-1.5">
                  <Avatar name={nome} size={36} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{nome}</div>
                    {email && <div className="text-[11px] text-subtle truncate">{email}</div>}
                    {(papel || contexto) && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {papel && <Badge tone="accent">{papel}</Badge>}
                        {contexto && <Badge>{contexto}</Badge>}
                      </div>
                    )}
                  </div>
                </div>
                <div ref={lista} role="menu" aria-label={`Menu de ${nome}`} onKeyDown={tecla}>
                  {todos.map(({ rotulo, icone: Icone, onSelecionar, perigo }) => (
                    <button
                      key={rotulo}
                      type="button"
                      role="menuitem"
                      tabIndex={-1}
                      onClick={() => {
                        setAberto(false);
                        onSelecionar();
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm text-left transition-colors',
                        'hover:bg-[var(--chip)] focus-visible:bg-[var(--chip)] focus-visible:outline-offset-[-2px]',
                        perigo && 'text-danger',
                      )}
                    >
                      <span aria-hidden className={cn('size-8 rounded-lg grid place-items-center shrink-0', perigo ? 'bg-danger/12' : 'chip')}>
                        <Icone className="size-4" />
                      </span>
                      <span className="font-medium">{rotulo}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </RadixPopover.Content>
          </RadixPopover.Portal>
        )}
      </AnimatePresence>
    </RadixPopover.Root>
  );
}
