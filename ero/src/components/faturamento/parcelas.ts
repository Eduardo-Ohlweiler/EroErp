// Tipo e helpers de parcelas compartilhados entre FaturamentoConsulta e ContratarPacote.
// Mantidos fora do arquivo do componente para não quebrar o Fast Refresh (react-refresh).

export interface ParcelaFaturamento {
    _id:               string
    numeroParcela:     number
    dataVencimento:    string
    valor:             string
    formaPagamentoId:  string
    contaFinanceiraId: string
    pago:              boolean
    dataPagamento:     string
    valorPago:         string
}

export function todayStr(): string {
    return new Date().toISOString().slice(0, 10)
}

export function addMonths(dateStr: string, months: number): string {
    const d = new Date(dateStr + "T12:00:00")
    d.setMonth(d.getMonth() + months)
    return d.toISOString().slice(0, 10)
}

export function gerarParcelas(total: number, count: number, baseDate: string): ParcelaFaturamento[] {
    if (count < 1) return []
    const cents     = Math.round(total * 100)
    const baseValue = Math.floor(cents / count)
    const remainder = cents - baseValue * count
    return Array.from({ length: count }, (_, i) => {
        const v = (baseValue + (i === count - 1 ? remainder : 0)) / 100
        return {
            _id:               crypto.randomUUID(),
            numeroParcela:     i + 1,
            dataVencimento:    addMonths(baseDate, i + 1),
            valor:             v.toFixed(2),
            formaPagamentoId:  "",
            contaFinanceiraId: "",
            pago:              false,
            dataPagamento:     todayStr(),
            valorPago:         v.toFixed(2),
        }
    })
}
