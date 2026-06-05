export interface TipoProdutoResponse {
  id:             number
  nome:           string
  ativo:          boolean
  classificacao:  string
}

export interface UnidadeMedidaResponse {
  id:       number
  sigla:    string
  descricao: string
  ativo:    boolean
}

export interface NcmResponse {
  id:        number
  codigo:    string
  descricao: string
  ativo:     boolean
}

export interface OrigemProdutoResponse {
  id:       number
  codigo:   string
  descricao: string
}

export interface CestResponse {
  id:           number
  codigo:       string
  descricao:    string
  ncmId:        number
  ncmCodigo:    string
  ncmDescricao: string
  ativo:        boolean
}

export interface GrupoResponse {
  id:        number
  clienteId: number
  nome:      string
  ativo:     boolean
  createdAt: string
  updatedAt: string | null
}

export interface SubgrupoResponse {
  id:        number
  clienteId: number
  grupoId:   number
  grupoNome: string
  nome:      string
  ativo:     boolean
  createdAt: string
  updatedAt: string | null
}

export interface CategoriaResponse {
  id:        number
  clienteId: number
  nome:      string
  ativo:     boolean
  createdAt: string
  updatedAt: string | null
}

export interface MarcaResponse {
  id:        number
  clienteId: number
  nome:      string
  ativo:     boolean
  createdAt: string
  updatedAt: string | null
}

export interface ProdutoResponse {
  id:                     number
  clienteId:              number
  codigo:                 number | null
  codigoEan:              string | null
  codigoGtin:             string | null
  nome:                   string
  descricao:              string | null
  bloqueado:              boolean

  tipoProdutoId:          number
  tipoProdutoNome:        string

  subgrupoId:             number | null
  subgrupoNome:           string | null
  grupoNome:             string | null
  categoriaId:            number | null
  categoriaNome:          string | null

  marcaId:                number | null
  marcaNome:              string | null

  unidadeMedidaId:        number
  unidadeMedidaSigla:     string

  fornecedorPessoaId:     number | null
  fornecedorNome:         string | null

  custo:                  number | null

  ncmId:                  number | null
  ncmCodigo:              string | null

  origemProdutoId:        number | null
  origemProdutoCodigo:    string | null

  cestId:                 number | null
  cestCodigo:             string | null

  substituicaoTributaria: boolean

  createdAt:              string
  updatedAt:              string | null
}
