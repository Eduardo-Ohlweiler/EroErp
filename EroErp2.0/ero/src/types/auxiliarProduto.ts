import type { Paginacao } from './comum'

/** Os três auxiliares que são só nome. O subgrupo tem rota e forma próprias. */
export type AuxiliarSimples = 'grupos' | 'categorias' | 'marcas'

/** Espelha `AuxiliarResponseDto` — grupo, categoria ou marca. */
export interface AuxiliarResponse {
  id: string
  nome: string
  ativo: boolean
  createdAt: string
  updatedAt?: string | null
}

/** Espelha `AuxiliarSelectDto`. */
export interface AuxiliarSelect {
  id: string
  nome: string
}

/** Espelha `SubgrupoResponseDto`. */
export interface SubgrupoResponse {
  id: string
  grupoId: string
  grupoNome: string
  /** O grupo pode ter sido inativado depois: a tela sinaliza. */
  grupoAtivo: boolean
  nome: string
  ativo: boolean
  createdAt: string
  updatedAt?: string | null
}

/** Espelha `SubgrupoSelectDto` — a tela mostra "Grupo — Subgrupo". */
export interface SubgrupoSelect {
  id: string
  nome: string
  grupoId: string
  grupoNome: string
}

export interface AuxiliarFiltros extends Paginacao {
  termo?: string
  ativo?: boolean
}

export interface SubgrupoFiltros extends AuxiliarFiltros {
  grupoId?: string
}
