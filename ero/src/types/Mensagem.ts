export type DirecaoMensagem = "ENVIADA" | "RECEBIDA"

export type TipoMensagem = "TEXTO" | "IMAGEM" | "AUDIO" | "VIDEO" | "DOCUMENTO"

// Status de entrega de uma mensagem ENVIADA (checks do WhatsApp).
export type StatusMensagem = "ENVIADA" | "ENTREGUE" | "LIDA" | "ERRO"

// Mensagem de um atendimento do CRM.
export interface MensagemResponse {
  id:            number
  atendimentoId: number
  direcao:       DirecaoMensagem
  tipo:          TipoMensagem
  conteudo:      string | null
  midiaMimetype: string | null
  midiaNome:     string | null
  usuarioId:     number | null
  usuarioNome:   string | null
  status:        StatusMensagem | null
  dataMensagem:  string
}

// Body do POST /crm/atendimentos/{id}/mensagens.
// TEXTO usa `conteudo`; IMAGEM/AUDIO/VIDEO/DOCUMENTO usam `base64` + `mimetype`.
export interface EnviarMensagemPayload {
  tipo:      TipoMensagem
  conteudo?: string
  base64?:   string
  mimetype?: string
  fileName?: string
}
