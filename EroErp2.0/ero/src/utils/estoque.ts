import type { MascaraNumerica } from '@/components/common/TEntry'
import type { TipoMovimentacao } from '@/types/estoque'
import { AUSENTE, formatarNumero } from '@/utils/format'

/**
 * Unidades que se contam inteiras. O banco guarda 3 casas para todas
 * (NUMERIC(15,3)); a tela só escolhe a máscara. Numa unidade contável, a
 * máscara de 3 casas faria quem digita "10" obter 0,010 — o erro provável é o
 * número pequeno, e ele passaria pela guarda do servidor.
 */
const CONTAVEIS = new Set(['UN', 'CX', 'PC'])

/** Casas da quantidade na tela, pela unidade do produto. */
export function casasDaUnidade(sigla?: string | null): number {
  return sigla && CONTAVEIS.has(sigla) ? 0 : 3
}

export function mascaraDaUnidade(sigla?: string | null): MascaraNumerica {
  return casasDaUnidade(sigla) === 0 ? 'inteiro' : 'decimal'
}

/**
 * "12 UN", "1,250 KG". Com as casas que o dado tem, até 3: um saldo
 * fracionário numa unidade contável (de um ajuste antigo) aparece como é.
 */
export function formatarQuantidade(valor?: number | null, sigla?: string | null): string {
  if (valor === null || valor === undefined) return AUSENTE
  const minimo = casasDaUnidade(sigla)
  const numero = formatarNumero(valor, 3, minimo)
  return sigla ? `${numero} ${sigla}` : numero
}

/** Com sinal explícito: "+4 UN", "−3 UN". */
export function formatarQuantidadeComSinal(valor: number, sigla?: string | null): string {
  const texto = formatarQuantidade(Math.abs(valor), sigla)
  return valor > 0 ? `+${texto}` : `−${texto}`
}

export const ROTULO_MOVIMENTACAO: Record<TipoMovimentacao, string> = {
  ENTRADA: 'Entrada',
  AJUSTE: 'Ajuste',
  TRANSFERENCIA_SAIDA: 'Transferência (saída)',
  TRANSFERENCIA_ENTRADA: 'Transferência (entrada)',
  SAIDA_CONSULTA: 'Saída por consulta',
}

/** Dia do calendário (`2026-10-17`) → instante da meia-noite LOCAL, em ISO. */
export function inicioDoDia(dia?: string): string | undefined {
  if (!dia) return undefined
  return new Date(`${dia}T00:00:00`).toISOString()
}

/** O fim exclusivo de um dia: a meia-noite local do dia seguinte. */
export function fimDoDia(dia?: string): string | undefined {
  if (!dia) return undefined
  const data = new Date(`${dia}T00:00:00`)
  data.setDate(data.getDate() + 1)
  return data.toISOString()
}
