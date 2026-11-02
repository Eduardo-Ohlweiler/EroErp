import type { ReactNode } from 'react'
import { CLASSE_LARGURA, DentroDaLinha, type Largura } from './larguras'

/**
 * Uma linha do formulário. No celular empilha; a partir de `sm` os campos
 * ficam lado a lado e a linha quebra sozinha quando as colunas não cabem no
 * mínimo delas.
 *
 * Um campo por `TRow` — lado a lado só nos grupos do doc 14 §1.
 */
export function TRow({ children }: { children: ReactNode }) {
  return (
    <DentroDaLinha.Provider value>
      <div data-trow className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start">
        {children}
      </div>
    </DentroDaLinha.Provider>
  )
}

interface TColProps {
  /**
   * Sem `width`, a coluna divide a linha em partes iguais com as irmãs — como
   * no antigo, CNH · Categoria · Validade ficam um em cada terço. `auto`
   * encolhe até o campo; `rotulo` é a coluna de labels do estilo PHP (§5).
   */
  width?: 'auto' | 'rotulo' | Largura
  align?: 'left' | 'right'
  children: ReactNode
}

const CLASSE_COLUNA = {
  divide: 'sm:min-w-0 sm:flex-1 sm:basis-64',
  auto: 'sm:flex-none',
  rotulo: 'sm:w-48 sm:flex-none',
}

/**
 * Coluna de uma `TRow`. É ela que dá a proporção a `metade` e `longo`: o
 * campo dentro mede-se pela coluna, não pela tela — o `width="50%"` do antigo.
 */
export function TCol({ width, align = 'left', children }: TColProps) {
  const largura =
    width === undefined
      ? CLASSE_COLUNA.divide
      : width === 'auto' || width === 'rotulo'
        ? CLASSE_COLUNA[width]
        : `w-full sm:flex-none ${CLASSE_LARGURA[width]}`
  return (
    <div
      className={`flex min-w-0 flex-col ${largura}
        ${align === 'right' ? 'sm:items-end sm:text-right' : ''}`}
    >
      {children}
    </div>
  )
}

interface TRotuloProps {
  htmlFor: string
  required?: boolean
  children: ReactNode
}

/**
 * Só o rótulo, para a coluna de labels do estilo PHP (doc 14 §5). Desce o
 * bastante para alinhar com o texto do campo ao lado.
 */
export function TRotulo({ htmlFor, required, children }: TRotuloProps) {
  return (
    <label htmlFor={htmlFor} className="text-body text-txt-secondary sm:pt-2">
      {children}
      {required && <Obrigatorio />}
    </label>
  )
}

/** O `*` do campo obrigatório, igual em todo rótulo. */
export function Obrigatorio() {
  return (
    <span aria-hidden className="ml-0.5 text-danger">
      *
    </span>
  )
}
