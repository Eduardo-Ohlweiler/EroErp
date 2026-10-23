/** Espelha o `Page<T>` do Spring Data. */
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export interface Paginacao {
  page?: number
  size?: number
}

export interface SelectOption {
  id: string
  nome: string
}

/** Espelha o `ErroResponseDto` do backend. */
export interface ErroResponse {
  erro: string
  codigo: number
  timestamp: string
  path: string
  /**
   * Marca para a máquina decidir, quando a frase não basta. Ausente em quase
   * todo erro; hoje só `SESSAO_RENOVADA_EM_OUTRA_ABA`, no `/auth/refresh`.
   * Decida sempre por ela, nunca pela frase.
   */
  motivo?: string
}
