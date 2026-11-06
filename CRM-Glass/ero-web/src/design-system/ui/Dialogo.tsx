import { useRef, useState, type ReactNode, type RefObject } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { spring } from '../../motion/tokens';
import { cn } from '../../shared/util/utils';
import { Button } from './Button';

export type DialogoProps = {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  titulo: ReactNode;
  descricao?: ReactNode;
  children?: ReactNode;
  /** botões embaixo, alinhados à direita */
  rodape?: ReactNode;
  /** largura máxima em px */
  largura?: number;
  /** impede fechar por Esc ou clique fora (ex.: enquanto salva) */
  bloquearFechar?: boolean;
  /** elemento que recebe o foco ao abrir (padrão: o primeiro focável) */
  focoInicial?: RefObject<HTMLElement | null>;
  className?: string;
};

/**
 * Diálogo modal (Radix): foco preso dentro, Esc fecha, foco volta ao botão que abriu,
 * `aria-modal`, título e descrição ligados. Renderizado em portal.
 * O fundo escurece sem desfoque: o próprio diálogo é a camada de vidro (máx. 2 camadas por região).
 */
export function Dialogo({
  aberto,
  onAbertoChange,
  titulo,
  descricao,
  children,
  rodape,
  largura = 520,
  bloquearFechar,
  focoInicial,
  className,
}: DialogoProps) {
  /** quem tinha o foco ao abrir (o diálogo é controlado de fora, sem Radix Trigger): recebe o foco de volta ao fechar */
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
            <div className="fixed inset-0 z-[80] grid place-items-center p-4 pointer-events-none">
              <RadixDialog.Content
                asChild
                forceMount
                aria-modal="true"
                onOpenAutoFocus={(e) => {
                  anterior.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
                  if (focoInicial?.current) {
                    e.preventDefault();
                    focoInicial.current.focus();
                  }
                }}
                onCloseAutoFocus={(e) => {
                  if (anterior.current?.isConnected) {
                    e.preventDefault();
                    anterior.current.focus();
                  }
                }}
                {...(descricao ? {} : { 'aria-describedby': undefined })}
              >
                <motion.div
                  initial={{ opacity: 0, y: 24, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.97 }}
                  transition={spring.soft}
                  className={cn('glass-solid pointer-events-auto relative w-full rounded-[28px] max-h-[90vh] overflow-y-auto p-6', className)}
                  style={{ maxWidth: largura }}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
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
                  {children}
                  {rodape && <div className="flex flex-wrap justify-end gap-2 mt-6">{rodape}</div>}
                </motion.div>
              </RadixDialog.Content>
            </div>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}

export type ConfirmDialogProps = {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  titulo: ReactNode;
  descricao?: ReactNode;
  /** texto do botão de confirmar (padrão "Confirmar") */
  confirmar?: string;
  cancelar?: string;
  /** ação destrutiva: botão vermelho e foco inicial em Cancelar */
  perigo?: boolean;
  /** pode devolver Promise: o diálogo mostra "aguarde" e fecha quando ela termina; se rejeitar, fica aberto */
  onConfirmar: () => void | Promise<unknown>;
  children?: ReactNode;
};

/** Confirmação de uma ação (Encerrar todas as outras sessões, Redefinir 2FA, Inativar...). */
export function ConfirmDialog({
  aberto,
  onAbertoChange,
  titulo,
  descricao,
  confirmar = 'Confirmar',
  cancelar = 'Cancelar',
  perigo,
  onConfirmar,
  children,
}: ConfirmDialogProps) {
  const [ocupado, setOcupado] = useState(false);
  const cancelarRef = useRef<HTMLButtonElement>(null);

  const executar = async () => {
    setOcupado(true);
    try {
      await onConfirmar();
      onAbertoChange(false);
    } catch {
      /* quem chamou mostra o erro (toast/alerta); o diálogo continua aberto */
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Dialogo
      aberto={aberto}
      onAbertoChange={onAbertoChange}
      titulo={
        <span className="flex items-center gap-2.5">
          {perigo && (
            <span aria-hidden className="size-8 rounded-xl bg-danger/12 text-danger grid place-items-center shrink-0">
              <AlertTriangle className="size-4" />
            </span>
          )}
          {titulo}
        </span>
      }
      descricao={descricao}
      largura={440}
      bloquearFechar={ocupado}
      focoInicial={perigo ? cancelarRef : undefined}
      rodape={
        <>
          <Button ref={cancelarRef} onClick={() => onAbertoChange(false)} disabled={ocupado}>
            {cancelar}
          </Button>
          <Button variant={perigo ? 'danger' : 'primary'} onClick={executar} disabled={ocupado} aria-busy={ocupado}>
            {ocupado ? 'Aguarde…' : confirmar}
          </Button>
        </>
      }
    >
      {children}
    </Dialogo>
  );
}
