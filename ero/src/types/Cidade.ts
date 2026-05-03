import type { Estado } from "./Estado"

export interface Cidade {
  id:          number
  nome:        string
  codigoIbge:  number
  ativo:       boolean
  estado:      Estado
}