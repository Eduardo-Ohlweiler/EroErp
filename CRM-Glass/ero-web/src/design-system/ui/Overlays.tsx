import { useEffect, useLayoutEffect, useState, type ComponentType, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { spring } from '../../motion/tokens';
import { cn } from '../../shared/util/utils';

/*
 * Modal e Drawer do protótipo saíram: não prendiam o foco e o Modal desfocava o próprio vidro.
 * Use Dialogo / ConfirmDialog (Dialogo.tsx) e Gaveta (Gaveta.tsx), feitos sobre o Radix Dialog.
 */
function useEsc(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
}

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Fechar"
      className="chip size-9 rounded-xl grid place-items-center text-muted hover:text-fg hover:bg-[var(--chip-hover)] transition-colors"
    >
      <X className="size-4" />
    </button>
  );
}

/* ---------------- Menu suspenso ancorado ---------------- */
export function Popover({
  anchor,
  open,
  onClose,
  children,
  width = 260,
}: {
  anchor: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useLayoutEffect(() => {
    if (!open || !anchor.current) return;
    const r = anchor.current.getBoundingClientRect();
    setPos({ top: r.bottom + 10, left: Math.max(12, r.right - width) });
  }, [open, anchor, width]);
  useEsc(open, onClose);
  useEffect(() => {
    if (!open) return;
    const h = (e: PointerEvent) => {
      const t = e.target as Element;
      if (anchor.current?.contains(t) || t.closest('[data-popover]')) return;
      onClose();
    };
    window.addEventListener('pointerdown', h);
    return () => window.removeEventListener('pointerdown', h);
  }, [open, onClose, anchor]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          data-popover
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.12 } }}
          transition={spring.snappy}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width, transformOrigin: 'top right' }}
          className="glass-solid z-[70] rounded-2xl p-1.5"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function MenuItem({
  icon: Icon,
  label,
  hint,
  onClick,
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn('w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm text-left hover:bg-[var(--chip)] transition-colors', className)}
    >
      <span className="size-8 rounded-lg chip grid place-items-center shrink-0">
        <Icon className="size-4" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-[11px] text-subtle truncate">{hint}</span>}
      </span>
    </button>
  );
}
