export interface ModeloDocumento {
  id: number
  nome: string
  descricao?: string
  conteudo: string
  ativo: boolean
  createdAt: string
  updatedAt?: string
  createdByNome?: string
  updatedByNome?: string
}

export interface ModeloDocumentoSelect {
  id: number
  nome: string
}
