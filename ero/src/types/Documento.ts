export type DocumentoStatus = 'RASCUNHO' | 'EMITIDO' | 'CANCELADO'

export interface Documento {
  id: number
  modeloDocumentoId: number
  modeloDocumentoNome: string
  emitenteId: number
  emitenteNome: string
  clientePessoaId: number
  clientePessoaNome: string
  estoqueId?: number
  produtoNome?: string
  dataEmissao: string
  valor?: number
  desconto: number
  acrescimo: number
  tipoDesconto: 'VALOR' | 'PERCENTUAL'
  tipoAcrescimo: 'VALOR' | 'PERCENTUAL'
  formaPagamentoId?: number
  formaPagamentoNome?: string
  valorFinal?: number
  numeroParcelas: number
  status: DocumentoStatus
  conteudoGerado?: string
  observacoes?: string
  createdAt: string
  updatedAt?: string
  createdByNome?: string
  updatedByNome?: string
}
