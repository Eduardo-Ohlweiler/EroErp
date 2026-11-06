import type { ComponentType, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Eye, ShieldAlert } from 'lucide-react';
import { spring } from '../../motion/tokens';
import { cn } from '../../shared/util/utils';
import { Button } from './Button';

export type AvisoContextoProps = {
  /** mostra/esconde com animação */
  visivel?: boolean;
  /** `superadmin`: "Você está dentro de X"; `previa`: selo "Prévia de X" */
  tipo?: 'superadmin' | 'previa';
  children: ReactNode;
  /** ex.: { rotulo: 'Sair do contratante', onClick } */
  acao?: { rotulo: string; onClick: () => void; carregando?: boolean };
  icone?: ComponentType<{ className?: string }>;
  /** fixo embaixo, no centro da tela (portal); sem isso, fica no fluxo onde for colocado */
  flutuante?: boolean;
  className?: string;
};

/**
 * Aviso permanente de contexto: superadmin atuando dentro de um contratante, ou prévia de aparência.
 * Fica numa região role=status: o leitor de tela anuncia quando aparece, sem interromper.
 */
export function AvisoContexto({
  visivel = true,
  tipo = 'superadmin',
  children,
  acao,
  icone,
  flutuante,
  className,
}: AvisoContextoProps) {
  const Icone = icone ?? (tipo === 'previa' ? Eye : ShieldAlert);
  const corpo = (
    <AnimatePresence>
      {visivel && (
        <motion.div
          key="aviso"
          initial={{ opacity: 0, y: flutuante ? 24 : -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: flutuante ? 16 : -6, scale: 0.98 }}
          transition={spring.soft}
          className={cn(
            'glass-solid !rounded-full flex items-center gap-3 pl-2 pr-2 py-1.5 text-sm',
            flutuante && 'pointer-events-auto',
            className,
          )}
        >
          <span
            aria-hidden
            className={cn(
              'size-8 rounded-full grid place-items-center shrink-0',
              tipo === 'previa' ? 'accent-gradient' : 'bg-warning/15 text-warning',
            )}
          >
            <Icone className="size-4" />
          </span>
          <span className="min-w-0 font-medium pr-1">{children}</span>
          {acao && (
            <Button size="sm" onClick={acao.onClick} disabled={acao.carregando} className="!rounded-full">
              {acao.rotulo}
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
  // A região viva existe antes do aviso aparecer, para o leitor de tela anunciar a entrada.
  if (!flutuante)
    return (
      <div role="status" className="flex justify-center">
        {corpo}
      </div>
    );
  return createPortal(
    <div role="status" className="fixed inset-x-0 bottom-24 md:bottom-5 z-[75] flex justify-center px-3 pointer-events-none">
      {corpo}
    </div>,
    document.body,
  );
}
