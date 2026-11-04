import { useEffect, useLayoutEffect, useState, type ComponentType, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { spring } from '../../motion/tokens';
import { cn } from '../../lib/utils';

function useEsc(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
}

/* ---------------- Modal: entra com mola, desfoque e leve escala ---------------- */
export function Modal({
  open,
  onClose,
  children,
  width = 560,
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  label: string;
}) {
  useEsc(open, onClose);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div key="modal" className="fixed inset-0 z-[80] grid place-items-center p-4">
          <motion.div
            className="absolute inset-0 modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ opacity: 0, y: 28, scale: 0.94, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
            exit={{ opacity: 0, y: 14, scale: 0.97, filter: 'blur(6px)', transition: { duration: 0.18 } }}
            transition={spring.soft}
            className="glass-solid relative w-full rounded-[28px] max-h-[90vh] overflow-y-auto"
            style={{ maxWidth: width }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
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

/* ---------------- Gaveta lateral ---------------- */
export function Drawer({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  useEsc(open, onClose);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div key="drawer" className="fixed inset-0 z-[80]">
          <motion.div
            className="absolute inset-0 modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ x: '105%' }}
            animate={{ x: 0 }}
            exit={{ x: '105%', transition: { duration: 0.25, ease: [0.65, 0, 0.35, 1] } }}
            transition={spring.soft}
            className="glass-solid absolute right-3 top-3 bottom-3 w-[min(440px,calc(100vw-24px))] rounded-[28px] overflow-y-auto"
          >
            {children}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
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
