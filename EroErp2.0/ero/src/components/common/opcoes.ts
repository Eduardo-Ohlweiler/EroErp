import type { OpcaoSelect } from './TCombo'

/**
 * Situação de cadastro, com os valores que o filtro `ativo` da API entende.
 * No filtro de lista, com `vazio="Todas"`.
 */
export const SITUACAO_OPCOES: OpcaoSelect[] = [
  { valor: 'true', rotulo: 'Ativo' },
  { valor: 'false', rotulo: 'Inativo' },
]

/**
 * Cores sugeridas: tons médios, que leem como bolinha tanto no claro quanto
 * no escuro. A cor é dado do registro (a filial), não token de tema — por isso
 * hex aqui.
 */
export const CORES_SUGERIDAS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#64748B',
]
