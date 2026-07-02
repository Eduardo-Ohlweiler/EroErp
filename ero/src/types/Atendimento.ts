// Atendimento do CRM (card do kanban).
export interface AtendimentoResponse {
  id:                 number
  numero:             string
  contatoNome:        string | null
  pessoaId:           number | null
  pessoaNome:         string | null
  andamentoId:        number
  usuarioId:          number | null
  usuarioNome:        string | null
  assunto:            string | null
  dataUltimaMensagem: string | null
  dataAbertura:       string
  mensagensNaoLidas:  number
}

// Body do POST /crm/atendimentos/{id}/assumir.
export interface AssumirPayload {
  motivo: string
}

// Body do PUT /crm/atendimentos/{id}/andamento.
export interface MoverAndamentoPayload {
  andamentoId: number
}
