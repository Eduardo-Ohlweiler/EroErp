import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, Sparkles } from 'lucide-react';
import { spring } from '../../motion/tokens';
import { cn } from '../../shared/util/utils';

type Tone = 'success' | 'info' | 'danger' | 'accent';
/** Botão dentro do toast (ex.: "Recarregar" num conflito 409). */
export type AcaoToast = { rotulo: string; onClick: () => void };
type ToastItem = { id: number; title: string; description?: string; tone: Tone; acao?: AcaoToast };
export type ToastInput = {
  title: string;
  description?: string;
  tone?: Tone;
  acao?: AcaoToast;
  /** tempo na tela, em ms (padrão 3800; com ação, 8000) */
  duracao?: number;
};
type Push = (t: ToastInput) => void;

const ToastCtx = createContext<Push>(() => {});

const icons = { success: CheckCircle2, info: Info, danger: AlertTriangle, accent: Sparkles };
const iconClass: Record<Tone, string> = {
  success: 'bg-success/15 text-success',
  info: 'bg-info/15 text-info',
  danger: 'bg-danger/15 text-danger',
  accent: 'accent-gradient',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const fechar = useCallback((id: number) => setItems((s) => s.filter((i) => i.id !== id)), []);
  const push = useCallback<Push>(
    ({ tone = 'info', duracao, ...t }) => {
      const id = Date.now() + Math.random();
      setItems((s) => [...s.slice(-3), { ...t, tone, id }]);
      setTimeout(() => fechar(id), duracao ?? (t.acao ? 8000 : 3800));
    },
    [fechar],
  );

  return (
    <ToastCtx.Provider value={push}>
      {children}
      {createPortal(
        <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-32px))] pointer-events-none">
          <AnimatePresence initial={false}>
            {items.map((i) => {
              const Icon = icons[i.tone];
              return (
                <motion.div
                  key={i.id}
                  layout
                  initial={{ opacity: 0, y: 24, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 80, transition: { duration: 0.2 } }}
                  transition={spring.bouncy}
                  role={i.tone === 'danger' ? 'alert' : 'status'}
                  className="glass-solid pointer-events-auto rounded-2xl p-3.5 flex gap-3 items-start"
                >
                  <span className={cn('size-9 rounded-xl grid place-items-center shrink-0', iconClass[i.tone])}>
                    <Icon className="size-[18px]" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <div className="text-sm font-semibold">{i.title}</div>
                    {i.description && <div className="text-xs text-muted mt-0.5">{i.description}</div>}
                    {i.acao && (
                      <button
                        type="button"
                        onClick={() => {
                          fechar(i.id);
                          i.acao?.onClick();
                        }}
                        className="mt-2 h-8 px-3 rounded-xl chip text-xs font-semibold hover:bg-[var(--chip-hover)] transition-colors"
                      >
                        {i.acao.rotulo}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
