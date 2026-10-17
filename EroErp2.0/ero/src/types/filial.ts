import type { Paginacao } from './comum'
import type { TipoPessoa } from './pessoa'

/** Espelha o enum `TipoFilial` do backend. */
export type TipoFilial = 'MATRIZ' | 'FILIAL'

export const TIPO_FILIAL_LABEL: Record<TipoFilial, string> = {
  MATRIZ: 'Matriz',
  FILIAL: 'Filial',
}

export const OPCOES_TIPO_FILIAL = (Object.keys(TIPO_FILIAL_LABEL) as TipoFilial[]).map((t) => ({
  valor: t,
  rotulo: TIPO_FILIAL_LABEL[t],
}))

/** Espelha `FilialResponseDto`. CNPJ, inscrições e endereço moram na pessoa. */
export interface FilialResponse {
  id: string
  pessoaId: string
  pessoaNome: string
  nomeFantasia: string | null
  tipoPessoa: TipoPessoa
  /** CPF ou CNPJ, só dígitos. */
  documento: string | null
  tipo: TipoFilial
  matrizId: string | null
  matrizNome: string | null
  /** #RRGGBB */
  cor: string
  ativo: boolean
  createdAt: string
  updatedAt: string | null
}

/** Espelha `FilialSelectDto`. */
export interface FilialSelect {
  id: string
  nome: string
  documento: string | null
  tipo: TipoFilial
  cor: string
}

/** Espelha `FilialCreateDto` e `FilialUpdateDto` — os mesmos campos. */
export interface FilialRequest {
  pessoaId: string
  tipo: TipoFilial
  matrizId?: string
  cor: string
}

export interface FilialFiltros extends Paginacao {
  nome?: string
  documento?: string
  tipo?: TipoFilial
  ativo?: boolean
}
