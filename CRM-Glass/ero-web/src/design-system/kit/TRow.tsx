import type { ReactNode } from 'react';
import { cn } from '../../shared/util/utils';
import { CLASSE_LARGURA, DentroDaLinha, type Largura } from './larguras';

/**
 * Uma linha do formulário (docs/07 §3.1). No celular empilha; a partir de `sm` os campos ficam lado a lado e a
 * linha quebra sozinha quando as colunas não cabem no mínimo delas. Um campo por `TRow` — lado a lado só nos
 * grupos da §1. É dentro dela que a largura padrão de cada campo vale.
 */
export function TRow({ children }: { children: ReactNode }) {
  return (
    <DentroDaLinha.Provider value>
      <div data-kit="TRow" className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start">
        {children}
      </div>
    </DentroDaLinha.Provider>
  );
}

export type TColProps = {
  /**
   * Sem `width`, a coluna divide a linha em partes iguais com as irmãs (CNH · Categoria · Validade, um em cada
   * terço). `auto` encolhe até o campo; `rotulo` (192 px) é a coluna de labels do §5; um token da escala fixa a coluna.
   */
  width?: 'auto' | 'rotulo' | Largura;
  align?: 'left' | 'right';
  children: ReactNode;
};

const CLASSE_COLUNA = {
  divide: 'sm:min-w-0 sm:flex-1 sm:basis-64',
  auto: 'sm:flex-none',
  rotulo: 'sm:w-48 sm:flex-none',
};

/** Coluna de uma `TRow`. É ela que dá a proporção a `metade` e `longo`: o campo mede-se pela coluna, não pela tela. */
export function TCol({ width, align = 'left', children }: TColProps) {
  const largura =
    width === undefined
      ? CLASSE_COLUNA.divide
      : width === 'auto' || width === 'rotulo'
        ? CLASSE_COLUNA[width]
        : `w-full sm:flex-none ${CLASSE_LARGURA[width]}`;
  return (
    <div data-kit="TCol" data-largura={width} className={cn('flex min-w-0 flex-col', largura, align === 'right' && 'sm:items-end sm:text-right')}>
      {children}
    </div>
  );
}

/** O `*` do campo obrigatório, igual em todo rótulo. */
export function Obrigatorio() {
  return (
    <span aria-hidden className="ml-0.5 text-danger">
      *
    </span>
  );
}

/** Só o rótulo, para a coluna de labels do §5 (o campo ao lado vai com `rotuloOculto` e o mesmo `id`). */
export function TRotulo({ htmlFor, required, children }: { htmlFor: string; required?: boolean; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm text-muted sm:pt-3">
      {children}
      {required && <Obrigatorio />}
    </label>
  );
}
