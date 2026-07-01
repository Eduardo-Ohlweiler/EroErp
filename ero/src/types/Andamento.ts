// Andamento do CRM.
// Registros com sistema=true são padrão (não podem ser editados/excluídos no backend).
// PENDENTE não é retornado pela API.
export interface AndamentoResponse {
  id:                 number
  nome:               string
  ativo:              boolean
  concluiAtendimento: boolean
  cancelaAtendimento: boolean
  sistema:            boolean
  chave:              string | null
  cor:                string | null
}

// Body do POST /crm/andamentos e PUT /crm/andamentos/{id}.
export interface AndamentoPayload {
  nome:               string
  ativo:              boolean
  concluiAtendimento: boolean
  cancelaAtendimento: boolean
  cor:                string | null
}
