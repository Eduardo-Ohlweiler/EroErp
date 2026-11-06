import { useId, useState, type ComponentType, type ReactNode } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import { motion } from 'motion/react';
import { spring } from '../../motion/tokens';
import { cn } from '../../shared/util/utils';

export type Aba = {
  valor: string;
  rotulo: ReactNode;
  icone?: ComponentType<{ className?: string }>;
  desabilitada?: boolean;
};

export type TabsProps = {
  abas: Aba[];
  /** controlado */
  valor?: string;
  onValorChange?: (v: string) => void;
  /** não controlado */
  valorPadrao?: string;
  /** nome da lista de abas para leitores de tela (ex.: "Minha conta") */
  rotulo: string;
  /** ConteudoAba para cada aba */
  children: ReactNode;
  className?: string;
};

/**
 * Abas (Radix): setas, Home/End, `aria-controls` corretos.
 * A pílula da aba ativa desliza entre as abas (layoutId).
 */
export function Tabs({ abas, valor, onValorChange, valorPadrao, rotulo, children, className }: TabsProps) {
  const id = useId();
  const [interno, setInterno] = useState(valorPadrao ?? abas[0]?.valor ?? '');
  const atual = valor ?? interno;
  const mudar = (v: string) => {
    if (valor === undefined) setInterno(v);
    onValorChange?.(v);
  };
  return (
    <RadixTabs.Root value={atual} onValueChange={mudar} className={className}>
      <RadixTabs.List aria-label={rotulo} className="chip inline-flex max-w-full overflow-x-auto p-1 rounded-full gap-0.5">
        {abas.map((a) => {
          const ativa = a.valor === atual;
          const Icone = a.icone;
          return (
            <RadixTabs.Trigger
              key={a.valor}
              value={a.valor}
              disabled={a.desabilitada}
              className={cn(
                'relative h-9 px-4 rounded-full text-[13px] font-medium whitespace-nowrap inline-flex items-center gap-2 transition-colors',
                'disabled:opacity-50 disabled:pointer-events-none',
                ativa ? 'text-fg' : 'text-muted hover:text-fg',
              )}
            >
              {ativa && (
                <motion.span
                  layoutId={`${id}-aba`}
                  transition={spring.snappy}
                  className="absolute inset-0 rounded-full bg-[var(--seg-active)] pill-shadow"
                />
              )}
              <span className="relative inline-flex items-center gap-2">
                {Icone && <Icone className="size-4" />}
                {a.rotulo}
              </span>
            </RadixTabs.Trigger>
          );
        })}
      </RadixTabs.List>
      {children}
    </RadixTabs.Root>
  );
}

/** Conteúdo de uma aba. Só monta a aba visível. */
export function ConteudoAba({ valor, children, className }: { valor: string; children: ReactNode; className?: string }) {
  return (
    <RadixTabs.Content value={valor} className={cn('mt-5 rounded-[var(--radius-xl)]', className)}>
      {children}
    </RadixTabs.Content>
  );
}
