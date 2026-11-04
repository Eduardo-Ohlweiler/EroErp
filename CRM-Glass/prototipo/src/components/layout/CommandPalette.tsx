import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { CornerDownLeft, Moon, Plus, Search, Sun } from 'lucide-react';
import { useStore } from '../../store';
import { useSettings } from '../../theme/settings';
import { CLIENTES } from '../../data/mock';
import { spring } from '../../motion/tokens';
import { cn, norm } from '../../lib/utils';
import { Avatar } from '../ui/Bits';
import { NAV, NAV_BOTTOM } from './nav';

type Cmd = { group: string; label: string; hint?: string; icon?: ComponentType<{ className?: string }>; avatar?: string; run: () => void };

/** Busca global (Ctrl/⌘ + K): páginas, clientes e ações rápidas. */
export function CommandPalette() {
  const { paletteOpen: open, setPaletteOpen: setOpen, setNewDealOpen } = useStore();
  const { settings, set } = useSettings();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setQ('');
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const all = useMemo<Cmd[]>(
    () => [
      ...[...NAV, ...NAV_BOTTOM].map((n) => ({ group: 'Páginas', label: n.label, icon: n.icon, run: () => nav(n.to) })),
      ...CLIENTES.map((c) => ({ group: 'Clientes', label: c.nome, hint: `${c.contato} · ${c.cidade}`, avatar: c.nome, run: () => nav(`/clientes/${c.id}`) })),
      { group: 'Ações', label: 'Novo negócio', icon: Plus, run: () => setNewDealOpen(true) },
      {
        group: 'Ações',
        label: settings.theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro',
        icon: settings.theme === 'dark' ? Sun : Moon,
        run: () => set({ theme: settings.theme === 'dark' ? 'light' : 'dark' }),
      },
    ],
    [nav, setNewDealOpen, settings.theme, set],
  );

  const list = all.filter((c) => norm(`${c.label} ${c.hint ?? ''}`).includes(norm(q))).slice(0, 10);
  const run = (c?: Cmd) => {
    if (!c) return;
    setOpen(false);
    c.run();
  };

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIdx((i) => Math.min(list.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      run(list[idx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  let lastGroup = '';
  return createPortal(
    <AnimatePresence>
      {open && (
        <div key="cmdk" className="fixed inset-0 z-[90] flex justify-center items-start pt-[14vh] px-4">
          <motion.div
            className="absolute inset-0 modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Busca global"
            initial={{ opacity: 0, y: -16, scale: 0.96, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
            exit={{ opacity: 0, y: -10, scale: 0.97, transition: { duration: 0.15 } }}
            transition={spring.soft}
            className="glass-solid relative w-full max-w-[600px] rounded-[26px] overflow-hidden"
          >
            <div className="flex items-center gap-3 px-5 h-16 border-b border-line">
              <Search className="size-5 text-subtle" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setIdx(0);
                }}
                onKeyDown={onKey}
                placeholder="O que você procura?"
                className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-subtle"
                aria-label="Buscar"
              />
              <span className="kbd">Esc</span>
            </div>
            <div className="max-h-[56vh] overflow-y-auto p-2">
              {list.length === 0 && <div className="py-10 text-center text-sm text-muted">Nada encontrado para “{q}”.</div>}
              {list.map((c, i) => {
                const header = c.group !== lastGroup;
                lastGroup = c.group;
                const Icon = c.icon;
                return (
                  <div key={`${c.group}-${c.label}`}>
                    {header && <div className="px-3 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">{c.group}</div>}
                    <button
                      onMouseEnter={() => setIdx(i)}
                      onClick={() => run(c)}
                      className={cn('relative w-full flex items-center gap-3 px-3 h-12 rounded-xl text-left text-sm', i === idx ? 'text-fg' : 'text-muted')}
                    >
                      {i === idx && (
                        <motion.span layoutId="cmdk-active" transition={spring.snappy} className="absolute inset-0 rounded-xl bg-[var(--chip-hover)]" />
                      )}
                      <span className="relative shrink-0">
                        {c.avatar ? (
                          <Avatar name={c.avatar} size={30} />
                        ) : (
                          <span className="size-[30px] rounded-lg chip grid place-items-center">{Icon && <Icon className="size-4" />}</span>
                        )}
                      </span>
                      <span className="relative flex-1 min-w-0">
                        <span className="block font-medium truncate">{c.label}</span>
                        {c.hint && <span className="block text-[11px] text-subtle truncate">{c.hint}</span>}
                      </span>
                      {i === idx && <CornerDownLeft className="relative size-4 text-subtle" />}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 px-5 h-11 border-t border-line text-[11px] text-subtle">
              <span>
                <span className="kbd">↑</span> <span className="kbd">↓</span> navegar
              </span>
              <span>
                <span className="kbd">Enter</span> abrir
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
