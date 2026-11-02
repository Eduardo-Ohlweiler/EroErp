import type { OpcaoSelect } from './TCombo'

/**
 * Situação de cadastro, com os valores que o filtro `ativo` da API entende.
 * No filtro de lista, com `vazio="Todas"`.
 */
export const SITUACAO_OPCOES: OpcaoSelect[] = [
  { valor: 'true', rotulo: 'Ativo' },
  { valor: 'false', rotulo: 'Inativo' },
]
