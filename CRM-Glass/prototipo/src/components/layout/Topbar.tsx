import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, CalendarPlus, ChevronDown, ChevronRight, Handshake, Moon, Plus, Search, Sun, UserPlus } from 'lucide-react';
import { useStore } from '../../store';
import { useReduce, useSettings } from '../../theme/settings';
import { ease } from '../../motion/tokens';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Bits';
import { MenuItem, Popover } from '../ui/Overlays';
import { useToast } from '../ui/Toast';
import { titleFor } from './nav';
import { USUARIO } from '../../data/mock';

export function Topbar() {
  const { pathname } = useLocation();
  const title = titleFor(pathname);
  const nav = useNavigate();
  const { setPaletteOpen, setNewDealOpen } = useStore();
  const toast = useToast();
  const [now, setNow] = useState(() => new Date());
  const [menu, setMenu] = useState(false);
  const newRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.header
      initial={{ y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: ease.out, delay: 0.05 }}
      className="glass sticky top-4 z-30 h-16 rounded-[22px] px-2.5 flex items-center gap-2"
    >
      <button className="chip h-11 pl-1.5 pr-2.5 rounded-2xl flex items-center gap-2.5 hover:bg-[var(--chip-hover)] transition-colors shrink-0">
        <span className="size-8 rounded-xl accent-gradient grid place-items-center text-[13px] font-extrabold">V</span>
        <span className="text-left leading-tight hidden lg:block">
          <span className="block text-[13px] font-semibold">Vitrum CRM</span>
          <span className="block text-[11px] text-subtle">Matriz · Porto Alegre</span>
        </span>
        <ChevronDown className="size-4 text-subtle" />
      </button>

      <ChevronRight className="size-4 text-subtle hidden sm:block shrink-0" />
      <div className="relative h-8 hidden sm:flex items-center shrink-0 min-w-[120px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={title}
            initial={{ y: 16, opacity: 0, filter: 'blur(4px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: -16, opacity: 0, filter: 'blur(4px)' }}
            transition={{ duration: 0.35, ease: ease.out }}
            className="chip h-8 px-3 rounded-full text-xs font-medium flex items-center whitespace-nowrap"
          >
            {title}
          </motion.span>
        </AnimatePresence>
      </div>

      <button
        onClick={() => setPaletteOpen(true)}
        className="chip mx-auto h-11 w-full max-w-[440px] min-w-0 rounded-2xl flex items-center gap-2.5 px-3.5 text-sm text-subtle hover:bg-[var(--chip-hover)] hover:text-muted transition-colors"
      >
        <Search className="size-4 shrink-0" />
        <span className="truncate">Buscar clientes, negócios, páginas…</span>
        <span className="ml-auto kbd hidden md:inline">Ctrl K</span>
      </button>

      <div className="flex items-center gap-1.5 shrink-0">
        <ThemeToggle />
        <Button ref={newRef} variant="primary" onClick={() => setMenu((m) => !m)} className="h-11" aria-haspopup="menu" aria-expanded={menu}>
          <Plus className="size-4" />
          <span className="hidden lg:inline">Novo</span>
        </Button>
        <div className="chip h-11 px-3 rounded-2xl hidden xl:flex flex-col justify-center leading-tight text-right">
          <span className="text-[13px] font-semibold tabular-nums">
            {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[10px] text-subtle">{now.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        </div>
        <button
          className="chip size-11 rounded-2xl grid place-items-center relative hover:bg-[var(--chip-hover)] transition-colors"
          aria-label="Notificações"
          onClick={() => toast({ title: '3 notificações novas', description: 'Ana Ribeiro abriu sua proposta há 12 min.', tone: 'accent' })}
        >
          <Bell className="size-[18px]" />
          <span className="absolute top-2.5 right-3 size-2 rounded-full bg-danger">
            <span className="absolute inset-0 rounded-full bg-danger animate-ping" />
          </span>
        </button>
        <span className="hidden sm:inline-flex">
          <Avatar name={USUARIO.nome} size={44} />
        </span>
      </div>

      <Popover anchor={newRef} open={menu} onClose={() => setMenu(false)}>
        <MenuItem
          icon={Handshake}
          label="Novo negócio"
          hint="Adicionar ao funil de vendas"
          onClick={() => {
            setMenu(false);
            setNewDealOpen(true);
          }}
        />
        <MenuItem
          icon={UserPlus}
          label="Novo cliente"
          hint="Pessoa ou empresa"
          onClick={() => {
            setMenu(false);
            nav('/clientes');
            toast({ title: 'Cadastro de cliente', description: 'No protótipo, o formulário fica para a próxima etapa.', tone: 'info' });
          }}
        />
        <MenuItem
          icon={CalendarPlus}
          label="Novo compromisso"
          hint="Reunião, ligação ou visita"
          onClick={() => {
            setMenu(false);
            nav('/agenda');
          }}
        />
      </Popover>
    </motion.header>
  );
}

/** Troca de tema com revelação circular a partir do botão (View Transitions API). */
export function ThemeToggle() {
  const { settings, set } = useSettings();
  const reduce = useReduce();
  const dark = settings.theme === 'dark';

  function toggle(e: MouseEvent) {
    const next = dark ? 'light' : 'dark';
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    if (!doc.startViewTransition || reduce) {
      set({ theme: next });
      return;
    }
    const x = e.clientX;
    const y = e.clientY;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const t = doc.startViewTransition(() => {
      flushSync(() => set({ theme: next }));
      document.documentElement.dataset.theme = next;
    });
    t.ready.then(() =>
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 700, easing: 'cubic-bezier(.16,1,.3,1)', pseudoElement: '::view-transition-new(root)' },
      ),
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      className="chip size-11 rounded-2xl grid place-items-center overflow-hidden hover:bg-[var(--chip-hover)] transition-colors"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={settings.theme}
          initial={{ y: 18, rotate: -90, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          exit={{ y: -18, rotate: 90, opacity: 0 }}
          transition={{ duration: 0.3, ease: ease.out }}
        >
          {dark ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
