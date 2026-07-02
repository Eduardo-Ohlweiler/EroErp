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

// Linha da tela de listagem completa de atendimentos (GET /crm/atendimentos/lista).
export interface AtendimentoListaResponse {
  id:                 number
  numero:             string
  contatoNome:        string | null
  pessoaId:           number | null
  pessoaNome:         string | null
  andamentoId:        number | null
  andamentoNome:      string | null
  andamentoCor:       string | null
  usuarioId:          number | null
  usuarioNome:        string | null
  assunto:            string | null
  dataAbertura:       string
  dataUltimaMensagem: string | null
  dataConclusao:      string | null
  ativo:              boolean
  mensagensNaoLidas:  number
  assumidoPorId:      number | null
  assumidoPorNome:    string | null
  dataAssuncao:       string | null
}

// Body do PUT /crm/atendimentos/{id}/pessoa.
export interface VincularPessoaPayload {
  pessoaId: number
}
