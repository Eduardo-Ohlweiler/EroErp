import type { Paginacao } from './comum'

/** Espelha `ServicoFilialResponseDto`. */
export interface ServicoFilialResponse {
  filialId: string
  filialNome: string
  /** #RRGGBB */
  filialCor: string
  /** A filial pode ter sido inativada depois: a linha fica, e a tela sinaliza. */
  filialAtiva: boolean
  /** `null` é não informado — não é zero. */
  valor: number | null
}

/** Espelha `ServicoResponseDto`. */
export interface ServicoResponse {
  id: string
  /** Sequencial dentro do tenant, gerado pelo sistema. */
  codigo: number
  nome: string
  observacao: string | null
  ativo: boolean
  /** Em ordem de nome da filial. */
  filiais: ServicoFilialResponse[]
  createdAt: string
  updatedAt: string | null
}

/** Espelha `ServicoSelectDto` — sem valores. */
export interface ServicoSelect {
  id: string
  codigo: number
  nome: string
}

/** Espelha `ServicoFilialItemDto`. */
export interface ServicoFilialItem {
  filialId: string
  valor: number | null
}

/** Espelha `ServicoCreateDto` e `ServicoUpdateDto` — os mesmos campos. */
export interface ServicoRequest {
  nome: string
  observacao?: string
  /** O estado completo: a filial que não vier sai. */
  filiais: ServicoFilialItem[]
}

export interface ServicoFiltros extends Paginacao {
  /** Nome, ou o código quando é número. */
  termo?: string
  filialId?: string
  ativo?: boolean
}
