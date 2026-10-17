import type { Paginacao } from './comum'

/** Espelha `UnidadeMedidaSelectDto` — catálogo global. */
export interface UnidadeMedidaSelect {
  id: string
  sigla: string
  descricao: string
}

/** Espelha `ProdutoResponseDto`. Campo nulo vem ausente do JSON. */
export interface ProdutoResponse {
  id: string
  /** Sequencial dentro do tenant, gerado pelo sistema. */
  codigo: number
  nome: string
  descricao?: string | null
  ean?: string | null
  unidadeMedidaId: string
  unidadeSigla: string
  unidadeDescricao: string
  grupoId?: string | null
  grupoNome?: string | null
  subgrupoId?: string | null
  subgrupoNome?: string | null
  categoriaId?: string | null
  categoriaNome?: string | null
  marcaId?: string | null
  marcaNome?: string | null
  fornecedorId?: string | null
  fornecedorNome?: string | null
  /** Ausente é não informado — não é zero. */
  custo?: number | null
  ativo: boolean
  createdAt: string
  updatedAt?: string | null
}

/** Espelha `ProdutoSelectDto` — sem custo. */
export interface ProdutoSelect {
  id: string
  codigo: number
  nome: string
  unidadeSigla: string
}

/** Espelha `ProdutoRequestDto`. */
export interface ProdutoRequest {
  nome: string
  descricao?: string
  ean?: string
  unidadeMedidaId: string
  subgrupoId?: string
  categoriaId?: string
  marcaId?: string
  fornecedorId?: string
  custo: number | null
}

export interface ProdutoFiltros extends Paginacao {
  /** Nome; quando é número, também o código e o EAN exatos. */
  termo?: string
  grupoId?: string
  subgrupoId?: string
  categoriaId?: string
  marcaId?: string
  ativo?: boolean
}
