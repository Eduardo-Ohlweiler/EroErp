import { useAuth } from './useAuth'
import type { Tela } from '@/types/permissao'

/**
 * true quando o usuário lê a tela mas não grava nela. A tela então esconde o
 * que grava (Salvar, Novo, Inativar, acrescentar e remover linhas) e trava os
 * campos — envolver o corpo do formulário num `<fieldset disabled>` desliga de
 * uma vez todo input e botão nativo dentro dele.
 *
 * Conveniência visual, como toda checagem no front: quem recusa a escrita é o
 * `@PreAuthorize` do backend.
 */
export function useSomenteLeitura(tela: Tela): boolean {
  const { podeLer, podeEscrever } = useAuth()
  return podeLer(tela) && !podeEscrever(tela)
}
