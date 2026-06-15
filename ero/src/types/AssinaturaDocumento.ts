export type AssinaturaStatus = 'PENDENTE' | 'ASSINADO' | 'ACEITO' | 'REJEITADO'

export interface AssinaturaDocumento {
    id: number
    documentoId: number
    token: string
    status: AssinaturaStatus
    dadosAssinatura?: string
    ipAssinante?: string
    dataAssinatura?: string
}
