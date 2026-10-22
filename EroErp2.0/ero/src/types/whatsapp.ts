/** Espelha `ModoWhatsapp`: de quem é o número do tenant. Só o superadmin escolhe. */
export type ModoWhatsapp = 'TENANT' | 'POR_FILIAL'

/** Espelha `StatusConexao` — o último estado visto na Evolution. */
export type StatusConexao = 'DESCONECTADO' | 'AGUARDANDO_QR' | 'CONECTADO'

export const MODO_ROTULO: Record<ModoWhatsapp, string> = {
  TENANT: 'Um número para o tenant inteiro',
  POR_FILIAL: 'Um número por filial',
}

export const STATUS_CONEXAO_ROTULO: Record<StatusConexao, string> = {
  DESCONECTADO: 'Desconectado',
  AGUARDANDO_QR: 'Aguardando leitura do QR',
  CONECTADO: 'Conectado',
}

export const STATUS_CONEXAO_TOM = {
  DESCONECTADO: 'neutro',
  AGUARDANDO_QR: 'alerta',
  CONECTADO: 'sucesso',
} as const satisfies Record<StatusConexao, string>

/**
 * Espelha `ConexaoResponseDto` e, para o superadmin, `ConexaoAdminResponseDto`
 * — os três últimos campos só vêm para ele. Nenhum dos dois traz a apikey.
 *
 * Linha sem `id` é a que ainda não foi conectada.
 */
export interface ConexaoWhatsapp {
  id?: string
  /** Ausente na linha do tenant inteiro. */
  filialId?: string
  filialNome?: string
  filialCor?: string
  status: StatusConexao
  statusEm?: string
  /** Só dígitos, com DDI. */
  numero?: string
  ativo: boolean
  instancia?: string
  /** A sobrescrita do servidor; ausente = o global. */
  url?: string
  possuiApiKey?: boolean
}

/** Espelha `WhatsappPainelDto`. `foraDoModo` e `webhookConfigurado` só vêm ao superadmin. */
export interface PainelWhatsapp {
  modo: ModoWhatsapp
  servidorConfigurado: boolean
  conexoes: ConexaoWhatsapp[]
  foraDoModo?: ConexaoWhatsapp[]
  webhookConfigurado?: boolean
}

/** Espelha `QrCodeDto`. Sem `base64`, a conexão já estava conectada. */
export interface QrCodeWhatsapp {
  conexao: ConexaoWhatsapp
  base64?: string
  pairingCode?: string
}

/** Espelha `ServidorResponseDto`. */
export interface ServidorWhatsapp {
  configurado: boolean
  url?: string
  possuiApiKey: boolean
  ativo?: boolean
  updatedAt?: string
}

/** Apikey vazia mantém a gravada. */
export interface ServidorWhatsappRequest {
  url: string
  apiKey?: string
  ativo: boolean
}

/** Url vazia volta ao servidor global; apikey vazia mantém a gravada. */
export interface ConexaoWhatsappRequest {
  url?: string
  apiKey?: string
  removerApiKey: boolean
  ativo: boolean
}
