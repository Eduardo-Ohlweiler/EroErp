import type { ContaFinanceira } from "./ContaFinanceira"
import type { TipoCobranca }    from "./TipoCobranca"

export interface FormaPagamento {
    id:              number
    nome:            string
    tipoCobranca:    TipoCobranca
    contaFinanceira: ContaFinanceira
    ativo:           boolean
    createdAt:       Date
    updatedAt:       Date
}
