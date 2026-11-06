import { useRef, type ReactNode } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { spring } from '../../motion/tokens';
import { cn } from '../../shared/util/utils';

export type GavetaProps = {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  titulo: ReactNode;
  descricao?: ReactNode;
  children?: ReactNode;
  /** botões fixos embaixo (Cancelar / Salvar) */
  rodape?: ReactNode;
  /** largura máxima em px */
  largura?: number;
  /** impede fechar por Esc ou clique fora (ex.: enquanto salva) */
  bloquearFechar?: boolean;
  className?: string;
};

/**
 * Gaveta lateral (painel de detalhe ou filtros), sobre o Radix Dialog: foco preso, Esc fecha,
 * `aria-modal`, título ligado e foco de volta a quem abriu. Entra deslizando da direita,
 * sem `filter` no vidro; o fundo escurece sem desfoque (máx. 2 camadas de backdrop-filter).
 */
export function Gaveta({ aberto, onAbertoChange, titulo, descricao, children, rodape, largura = 440, bloquearFechar, className }: GavetaProps) {
  const anterior = useRef<HTMLElement | null>(null);
  return (
    <RadixDialog.Root open={aberto} onOpenChange={(v) => (!v && bloquearFechar ? undefined : onAbertoChange(v))}>
      <AnimatePresence>
        {aberto && (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay asChild forceMount>
              <motion.div
                className="dialog-overlay fixed inset-0 z-[80]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={spring.soft}
              />
            </RadixDialog.Overlay>
            <RadixDialog.Content
              asChild
              forceMount
              aria-modal="true"
              onOpenAutoFocus={() => {
                anterior.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
              }}
              onCloseAutoFocus={(e) => {
                if (anterior.current?.isConnected) {
                  e.preventDefault();
                  anterior.current.focus();
                }
              }}
              {...(descricao ? {} : { 'aria-describedby': undefined })}
            >
              <motion.aside
                initial={{ x: '105%' }}
                animate={{ x: 0 }}
                exit={{ x: '105%' }}
                transition={spring.soft}
                className={cn(
                  'glass-solid fixed z-[80] right-3 top-3 bottom-3 rounded-[28px] flex flex-col',
                  'w-[min(var(--gaveta-largura),calc(100vw-24px))]',
                  className,
                )}
                style={{ ['--gaveta-largura' as string]: `${largura}px` }}
              >
                <div className="flex items-start justify-between gap-4 p-6 pb-4">
                  <div className="min-w-0">
                    <RadixDialog.Title className="text-lg font-semibold tracking-tight">{titulo}</RadixDialog.Title>
                    {descricao && <RadixDialog.Description className="text-sm text-muted mt-1">{descricao}</RadixDialog.Description>}
                  </div>
                  {!bloquearFechar && (
                    <RadixDialog.Close
                      aria-label="Fechar"
                      className="chip size-9 shrink-0 rounded-xl grid place-items-center text-muted hover:text-fg hover:bg-[var(--chip-hover)] transition-colors"
                    >
                      <X className="size-4" />
                    </RadixDialog.Close>
                  )}
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">{children}</div>
                {rodape && <div className="flex flex-wrap justify-end gap-2 px-6 py-4 border-t border-line">{rodape}</div>}
              </motion.aside>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
