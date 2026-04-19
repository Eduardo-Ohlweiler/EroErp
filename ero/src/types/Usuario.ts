export interface Usuario {
    id:         number
    nome:       string
    email:      string
    telefone:   string
    ativo:      boolean
    clienteId:  number
    roles:      string[]
    createdAt:  string
    updatedAt:  string
}