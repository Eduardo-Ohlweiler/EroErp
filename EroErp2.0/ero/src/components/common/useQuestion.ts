import { createContext, useContext } from 'react'

export interface Pergunta {
  mensagem: string
  /** Título da janela. Padrão "Confirmar". */
  titulo?: string
  /** Rótulo do botão que confirma. Padrão: o nome da variante ("Inativar"), ou "Confirmar". */
  confirmar?: string
  /** `inativar` e `excluir` pintam o botão de perigo. */
  variante?: 'inativar' | 'reativar' | 'excluir' | 'confirmar'
}

export type Perguntar = (pergunta: Pergunta) => Promise<boolean>

export const PerguntaContext = createContext<Perguntar | null>(null)

/**
 * `await confirmar({ mensagem, variante: 'inativar' })` → `true` ou `false`.
 * Para inativar, reativar, excluir. A janela é do `TQuestionProvider`, no `App`.
 */
export function useQuestion(): { confirmar: Perguntar } {
  const perguntar = useContext(PerguntaContext)
  if (!perguntar) throw new Error('useQuestion fora do TQuestionProvider')
  return { confirmar: perguntar }
}
