import { useId, useState, type ComponentPropsWithoutRef, type ComponentType, type ReactNode } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import { motion } from 'motion/react';
import { spring } from '../../motion/tokens';
import { cn } from '../../shared/util/utils';
import { useVariantesBloco } from './bloco';

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
  /** classes a mais na barra de abas (o TTabs põe `nao-imprime`) */
  classeLista?: string;
  /** a barra de abas é um bloco da montagem da tela (o TTabs liga); os painéis não */
  listaComoBloco?: boolean;
  /** atributos `data-*` na raiz (o kit põe `data-kit`) */
  dados?: Record<`data-${string}`, string | undefined>;
};

/**
 * Abas (Radix): setas, Home/End, `aria-controls` corretos.
 * A pílula da aba ativa desliza entre as abas (layoutId).
 */
export function Tabs({ abas, valor, onValorChange, valorPadrao, rotulo, children, className, classeLista, listaComoBloco, dados }: TabsProps) {
  const id = useId();
  const [interno, setInterno] = useState(valorPadrao ?? abas[0]?.valor ?? '');
  const atual = valor ?? interno;
  // Só a barra encaixa como bloco (opacidade nela mesma): os painéis têm vidro dentro e não podem esmaecer inteiros.
  const variantes = useVariantesBloco(!!listaComoBloco);
  const mudar = (v: string) => {
    if (valor === undefined) setInterno(v);
    onValorChange?.(v);
  };
  return (
    <RadixTabs.Root value={atual} onValueChange={mudar} className={className} {...dados}>
      <RadixTabs.List asChild aria-label={rotulo}>
        <motion.div variants={variantes} className={cn('chip inline-flex max-w-full overflow-x-auto p-1 rounded-full gap-0.5', classeLista)}>
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
        </motion.div>
      </RadixTabs.List>
      {children}
    </RadixTabs.Root>
  );
}

export type ConteudoAbaProps = Omit<ComponentPropsWithoutRef<typeof RadixTabs.Content>, 'value'> & {
  valor: string;
};

/** Conteúdo de uma aba. Só monta a aba visível. Aceita os atributos do painel (o kit põe `data-kit`). */
export function ConteudoAba({ valor, children, className, ...rest }: ConteudoAbaProps) {
  return (
    <RadixTabs.Content value={valor} className={cn('mt-5 rounded-[var(--radius-xl)]', className)} {...rest}>
      {children}
    </RadixTabs.Content>
  );
}
