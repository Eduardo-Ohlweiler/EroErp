export interface Usuario {
  id:             number
  nome:           string
  email:          string
  telefone:       string
  ativo:          boolean
  clienteId:      number
  createdAt:      string
  updatedAt:      string
  createdById:    number | null
  createdByNome:  string | null
  updatedById:    number | null
  updatedByNome:  string | null 
  roles:          string[]
}