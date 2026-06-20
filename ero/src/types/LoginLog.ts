export interface LoginLog {
  id:           number
  clienteId:    number
  clienteNome:  string
  usuarioId:    number
  usuarioNome:  string
  dataLogin:    string
  dataLogout:   string | null
  tipoLogout:   "MANUAL" | "EXPIRACAO" | null
  enderecoIp:   string | null
}
