import { useRef, useState, useSyncExternalStore, type ComponentType, type KeyboardEvent } from 'react';
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
  /** sem ele, o item "Minha conta" não aparece (enquanto a tela não existe) */
  onMinhaConta?: () => void;
  onSair: () => void;
  /** itens extras entre "Minha conta" e "Sair" */
  itens?: ItemMenuUsuario[];
  /**
   * Lado do avatar em px. Sem ele, acompanha a Topbar: 36 abaixo de 640 px (cabe em 320 px junto com o
   * contratante e a busca) e 44 a partir daí.
   */
  tamanho?: number;
};

/** Mesmo corte do `sm:` do Tailwind (40rem). */
const LARGO = '(min-width: 40rem)';
const assinarLargura = (avisar: () => void) => {
  const mq = window.matchMedia(LARGO);
  mq.addEventListener('change', avisar);
  return () => mq.removeEventListener('change', avisar);
};
const telaLarga = () => window.matchMedia(LARGO).matches;

/** Avatar da barra: 36 px no celular, 44 px do `sm` para cima (lido na hora, sem pular no primeiro quadro). */
function useTamanhoBarra() {
  return useSyncExternalStore(assinarLargura, telaLarga, () => true) ? 44 : 36;
}

/**
 * Avatar da barra superior com menu (Minha conta, Sair).
 * Padrão menu-button: setas, Home/End, Esc devolve o foco ao avatar.
 */
export function MenuUsuario({ nome, email, papel, contexto, onMinhaConta, onSair, itens = [], tamanho }: MenuUsuarioProps) {
  const [aberto, setAberto] = useState(false);
  const tamanhoBarra = useTamanhoBarra();
  const lado = tamanho ?? tamanhoBarra;
  const lista = useRef<HTMLDivElement>(null);
  const todos: ItemMenuUsuario[] = [
    ...(onMinhaConta ? [{ rotulo: 'Minha conta', icone: UserRound, onSelecionar: onMinhaConta }] : []),
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
        <Avatar name={nome} size={lado} />
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
                className="glass-flutuante z-popover !rounded-2xl p-1.5 w-[268px]"
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
