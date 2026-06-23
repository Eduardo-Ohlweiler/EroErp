import { TEntry }   from "../tentry"
import { TDate }    from "../tdate"
import { TDbCombo } from "../tdbcombo"
import { TButton }  from "../tbutton"
import { gerarParcelas, todayStr } from "./parcelas"
import type { ParcelaFaturamento } from "./parcelas"

const fmtMoeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

interface ParcelasEditorProps {
    /** Total esperado (usado em "Distribuir" e no alerta de diferença). */
    total:    number
    /** Lista de parcelas controlada pelo pai. */
    value:    ParcelaFaturamento[]
    onChange: (parcelas: ParcelaFaturamento[]) => void

    /** Data-base usada para gerar os vencimentos (controlada pelo pai). */
    data:         string
    onDataChange: (data: string) => void

    /** Nº de parcelas (string do campo) controlado pelo pai. */
    numParc:         string
    onNumParcChange: (n: string) => void

    /** Campo "Descrição" — opcional; quando ausente, não é renderizado. */
    descricao?:         string
    onDescricaoChange?: (d: string) => void
    descricaoLabel?:    string

    /** Mensagem de erro a exibir (ex.: validação local). Opcional. */
    onValidationError?: (msg: string) => void
}

export function ParcelasEditor({
    total,
    value,
    onChange,
    data,
    onDataChange,
    numParc,
    onNumParcChange,
    descricao,
    onDescricaoChange,
    descricaoLabel = "Descrição",
    onValidationError,
}: ParcelasEditorProps) {

    const parcelas = value

    function handleDistribuir() {
        const n = parseInt(numParc, 10)
        if (!n || n < 1 || n > 60) {
            onValidationError?.("Informe um número de parcelas entre 1 e 60")
            return
        }
        onChange(gerarParcelas(total, n, data || todayStr()))
    }

    function update(_id: string, changes: Partial<ParcelaFaturamento>) {
        onChange(parcelas.map(p => p._id === _id ? { ...p, ...changes } : p))
    }

    function togglePago(p: ParcelaFaturamento) {
        update(p._id, {
            pago:          !p.pago,
            dataPagamento: p.dataPagamento || todayStr(),
            valorPago:     p.pago ? p.valorPago : p.valor,
        })
    }

    const totalParcelas = parcelas.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0)
    const diff          = Math.round((totalParcelas - total) * 100) / 100

    return (
        <>
            {/* Configuração da conta */}
            <div className="mb-4 flex flex-wrap gap-3 items-end">
                {onDescricaoChange && (
                    <TEntry
                        name        ="descricao"
                        label       ={descricaoLabel}
                        width       ="320px"
                        defaultValue={descricao}
                        onChange    ={onDescricaoChange}
                    />
                )}
                <TDate
                    name        ="dataParcelaBase"
                    label       ="Data"
                    width       ="160px"
                    defaultValue={data}
                    onChange    ={onDataChange}
                />
                <TEntry
                    name        ="numParcelas"
                    label       ="Nº Parcelas"
                    width       ="110px"
                    defaultValue={numParc}
                    onChange    ={onNumParcChange}
                />
                <TButton
                    label  ="Distribuir"
                    variant="save"
                    type   ="button"
                    onClick={handleDistribuir}
                />
            </div>

            {/* Alerta de diferença */}
            {parcelas.length > 0 && Math.abs(diff) > 0.005 && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    Soma das parcelas ({fmtMoeda(totalParcelas)}) difere do total ({fmtMoeda(total)})
                </div>
            )}

            {/* Lista de parcelas */}
            <div className="flex flex-col gap-3 mb-2">
                {parcelas.length === 0 && (
                    <div className="text-sm text-(--text-muted) text-center py-6 rounded-lg border border-dashed border-(--border)">
                        Defina o número de parcelas e clique em <strong>Distribuir</strong>
                    </div>
                )}
                {parcelas.map(p => (
                    <div key={p._id} className="rounded-lg border border-(--border) bg-(--surface)">
                        <div className="flex flex-wrap items-end gap-3 p-3">
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-(--surface-secondary) text-xs font-bold text-(--text-secondary) mb-1 shrink-0 self-end">
                                {p.numeroParcela}
                            </div>
                            <TDate
                                key         ={`${p._id}-venc`}
                                name        ={`venc${p.numeroParcela}`}
                                label       ="Vencimento"
                                required
                                width       ="150px"
                                defaultValue={p.dataVencimento}
                                onChange    ={(val) => update(p._id, { dataVencimento: val })}
                            />
                            <TEntry
                                key         ={`${p._id}-valor`}
                                name        ={`valor${p.numeroParcela}`}
                                label       ="Valor"
                                mask        ="moeda"
                                required
                                width       ="140px"
                                defaultValue={p.valor}
                                onChange    ={(val) => update(p._id, { valor: val })}
                            />
                            <TDbCombo
                                name        ={`forma${p.numeroParcela}`}
                                label       ="Forma de Pagamento"
                                url         ="/financeiro/formas-pagamento/select"
                                valueField  ="id"
                                displayField="nome"
                                width       ="200px"
                                value       ={p.formaPagamentoId}
                                onChange    ={(val, item) => {
                                    const conta = item?.contaFinanceira as { id?: number } | undefined
                                    update(p._id, {
                                        formaPagamentoId: val,
                                        ...(conta?.id != null ? { contaFinanceiraId: String(conta.id) } : {}),
                                    })
                                }}
                            />
                            <TDbCombo
                                name        ={`conta${p.numeroParcela}`}
                                label       ="Conta Financeira"
                                url         ="/financeiro/contas/select"
                                valueField  ="id"
                                displayField="nome"
                                width       ="200px"
                                value       ={p.contaFinanceiraId}
                                onChange    ={(val) => update(p._id, { contaFinanceiraId: val })}
                            />
                            <div className="self-end mb-1">
                                <button
                                    type   ="button"
                                    onClick={() => togglePago(p)}
                                    className={`px-3 py-1.5 rounded text-sm font-semibold whitespace-nowrap transition-colors ${
                                        p.pago
                                            ? "bg-(--success) text-white"
                                            : "border border-(--border) text-(--text-secondary) hover:bg-(--surface-secondary)"
                                    }`}
                                >
                                    {p.pago ? "✓ Pago" : "Marcar Pago"}
                                </button>
                            </div>
                        </div>

                        {p.pago && (
                            <div className="flex flex-wrap gap-3 px-3 pb-3 pt-2 border-t border-(--border) bg-(--surface-secondary)">
                                <TDate
                                    key         ={`${p._id}-datapag`}
                                    name        ={`datapag${p.numeroParcela}`}
                                    label       ="Data de Pagamento"
                                    required
                                    width       ="160px"
                                    defaultValue={p.dataPagamento}
                                    onChange    ={(val) => update(p._id, { dataPagamento: val })}
                                />
                                <TEntry
                                    key         ={`${p._id}-valorpago`}
                                    name        ={`valorpago${p.numeroParcela}`}
                                    label       ="Valor Pago"
                                    mask        ="moeda"
                                    required
                                    width       ="140px"
                                    defaultValue={p.valorPago}
                                    onChange    ={(val) => update(p._id, { valorPago: val })}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </>
    )
}
