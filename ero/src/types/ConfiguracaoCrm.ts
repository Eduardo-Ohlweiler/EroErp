// Lembrete de pendência configurado no CRM.
export interface LembretePendencia {
  id:         number
  tempoHoras: number
  mensagem:   string
  ordem:      number | null
}

// Configuração do CRM (singleton por cliente).
// apiKey e token NÃO são retornados pela API por segurança —
// os flags possuiApiKey/possuiToken indicam se já há um valor salvo.
export interface ConfiguracaoCrmResponse {
  id:              number
  provedor:        string
  apiUrl:          string
  instanceName:    string
  numero:          string
  ativo:           boolean
  possuiApiKey:    boolean
  possuiToken:     boolean
  ativarPendencias: boolean
  lembretes:       LembretePendencia[]
}

// Body do PUT /crm/configuracao.
// apiKey/token vazios = preservar o valor já salvo no backend.
export interface ConfiguracaoCrmPayload {
  provedor:        string
  apiUrl:          string
  apiKey:          string
  instanceName:    string
  token:           string
  numero:          string
  ativo:           boolean
  ativarPendencias: boolean
  lembretes:       {
    id:         number | null
    tempoHoras: number
    mensagem:   string
    ordem:      number | null
  }[]
}

// GET /crm/configuracao/status
export interface CrmStatusResponse {
  status:    string
  conectado: boolean
}

// POST /crm/configuracao/qrcode
export interface CrmQrCodeResponse {
  base64:      string
  pairingCode: string | null
  status:      string
}
