import { useState, useEffect }                          from "react"
import { useNavigate, useParams, useLocation }           from "react-router-dom"
import axios                                             from "axios"
import { api }                                           from "../../services/api"
import { useMessage }                                    from "../../hooks/useMessage"
import type { ErrorResponse }                            from "../../types/ErrorResponse"
import { TPage }                                         from "../../components/tpage"
import { TButton }                                       from "../../components/tbutton"
import { TEntry }                                        from "../../components/tentry"
import { TDate }                                         from "../../components/tdate"
import { TDbCombo }                                      from "../../components/tdbcombo"
import { formatarDocumento }                             from "../../utils/pessoas"

interface ParcelaFaturamento {
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

interface FaturamentoState {
    pessoaId:          number
    pessoaNome:        string
    pessoaDocumento:   string | null
    emitenteId:        number | null
    emitenteNome:      string | null
    emitenteDocumento: string | null
    totalGeral:        number
}

function todayStr(): string {
    return new Date().toISOString().slice(0, 10)
}

function addMonths(dateStr: string, months: number): string {
    const d = new Date(dateStr + "T12:00:00")
    d.setMonth(d.getMonth() + months)
    return d.toISOString().slice(0, 10)
}

function gerarParcelas(total: number, count: number, baseDate: string): ParcelaFaturamento[] {
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

export default function FaturamentoConsulta() {
    const { id }          = useParams<{ id: string }>()
    const navigate        = useNavigate()
    const location        = useLocation()
    const { showMessage } = useMessage()

    const state = location.state as FaturamentoState | null

    useEffect(() => {
        if (!state?.pessoaId) {
            navigate(`/clinica/consultas/${id}`, { replace: true })
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const [descricao, setDescricao] = useState(`Consulta #${id}`)
    const [data,      setData]      = useState(todayStr())
    const [numParc,   setNumParc]   = useState("1")
    const [parcelas,  setParcelas]  = useState<ParcelaFaturamento[]>(() =>
        state ? gerarParcelas(state.totalGeral, 1, todayStr()) : []
    )
    const [saving, setSaving] = useState(false)

    if (!state?.pessoaId) return null

    function handleDistribuir() {
        const n = parseInt(numParc, 10)
        if (!n || n < 1 || n > 60) {
            showMessage("error", "Informe um número de parcelas entre 1 e 60")
            return
        }
        setParcelas(gerarParcelas(state!.totalGeral, n, data || todayStr()))
    }

    function update(_id: string, changes: Partial<ParcelaFaturamento>) {
        setParcelas(prev => prev.map(p => p._id === _id ? { ...p, ...changes } : p))
    }

    function togglePago(p: ParcelaFaturamento) {
        update(p._id, {
            pago:          !p.pago,
            dataPagamento: p.dataPagamento || todayStr(),
            valorPago:     p.pago ? p.valorPago : p.valor,
        })
    }

    async function handleSubmit() {
        if (parcelas.length === 0) {
            showMessage("error", "Defina o número de parcelas e clique em Distribuir")
            return
        }
        for (const p of parcelas) {
            if (!p.dataVencimento) {
                showMessage("error", `Informe o vencimento da parcela ${p.numeroParcela}`)
                return
            }
            if (!p.valor || parseFloat(p.valor) <= 0) {
                showMessage("error", `Informe o valor da parcela ${p.numeroParcela}`)
                return
            }
            if (p.pago) {
                if (!p.formaPagamentoId || !p.contaFinanceiraId) {
                    showMessage("error", `Parcela ${p.numeroParcela}: preencha forma de pagamento e conta financeira para marcar como paga`)
                    return
                }
                if (!p.dataPagamento) {
                    showMessage("error", `Informe a data de pagamento da parcela ${p.numeroParcela}`)
                    return
                }
                if (!p.valorPago || parseFloat(p.valorPago) <= 0) {
                    showMessage("error", `Informe o valor pago da parcela ${p.numeroParcela}`)
                    return
                }
            }
        }

        setSaving(true)
        try {
            await api.post("/financeiro/contas-receber", {
                emitenteId: state.emitenteId,
                pessoaId:   state.pessoaId,
                data,
                descricao:  descricao || null,
                valorTotal: state.totalGeral,
                parcelas:   parcelas.map(p => ({
                    dataVencimento:    p.dataVencimento,
                    valor:             parseFloat(p.valor),
                    formaPagamentoId:  p.formaPagamentoId  ? Number(p.formaPagamentoId)  : null,
                    contaFinanceiraId: p.contaFinanceiraId ? Number(p.contaFinanceiraId) : null,
                    observacao:        null,
                    dataPagamento:     p.pago ? p.dataPagamento         : null,
                    valorPago:         p.pago ? parseFloat(p.valorPago) : null,
                })),
            })

            await api.patch(`/consultas/${id}/concluir`)

            showMessage("success", "Consulta concluída e conta a receber criada!")
            window.history.replaceState({}, "")
            navigate(`/clinica/consultas/${id}`)
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const d = err.response?.data as ErrorResponse
                showMessage("error", d?.erro ?? "Erro ao finalizar faturamento")
            } else {
                showMessage("error", "Erro inesperado")
            }
        } finally {
            setSaving(false)
        }
    }

    const fmtMoeda      = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    const totalParcelas = parcelas.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0)
    const diff          = Math.round((totalParcelas - state.totalGeral) * 100) / 100

    return (
        <TPage title={`Faturamento — Consulta #${id}`} breadcrumb={["Clínica", "Consultas", "Faturamento"]}>

            {/* Resumo */}
            <div className="mb-5 p-4 rounded-lg bg-(--surface-secondary) border border-(--border) flex flex-col gap-1.5 text-sm">
                <span className="text-base font-bold text-(--accent) mb-0.5">Resumo da Consulta</span>
                <span>
                    <span className="text-(--text-muted)">Paciente: </span>
                    <span className="font-medium">{state.pessoaNome}</span>
                    {state.pessoaDocumento && (
                        <span className="ml-1 text-xs opacity-60">({formatarDocumento(state.pessoaDocumento)})</span>
                    )}
                </span>
                {state.emitenteNome && (
                    <span>
                        <span className="text-(--text-muted)">Emitente: </span>
                        <span className="font-medium">{state.emitenteNome}</span>
                        {state.emitenteDocumento && (
                            <span className="ml-1 text-xs opacity-60">({formatarDocumento(state.emitenteDocumento)})</span>
                        )}
                    </span>
                )}
                <span className="mt-1 text-xl font-bold text-(--accent)">
                    <span className="text-sm font-normal text-(--text-muted)">Total: </span>
                    {fmtMoeda(state.totalGeral)}
                </span>
                <span className="text-xs text-(--text-muted) mt-0.5">
                    ⚠ Ao concluir, o estoque dos produtos consumidos será baixado automaticamente.
                </span>
            </div>

            {/* Configuração da conta */}
            <div className="mb-4 flex flex-wrap gap-3 items-end">
                <TEntry
                    name        ="descricao"
                    label       ="Descrição"
                    width       ="320px"
                    defaultValue={descricao}
                    onChange    ={setDescricao}
                />
                <TDate
                    name        ="data"
                    label       ="Data"
                    width       ="160px"
                    defaultValue={data}
                    onChange    ={setData}
                />
                <TEntry
                    name        ="numParcelas"
                    label       ="Nº Parcelas"
                    width       ="110px"
                    defaultValue={numParc}
                    onChange    ={setNumParc}
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
                    Soma das parcelas ({fmtMoeda(totalParcelas)}) difere do total da consulta ({fmtMoeda(state.totalGeral)})
                </div>
            )}

            {/* Lista de parcelas */}
            <div className="flex flex-col gap-3 mb-6">
                {parcelas.length === 0 && (
                    <div className="text-sm text-(--text-muted) text-center py-6 rounded-lg border border-dashed border-(--border)">
                        Defina o número de parcelas e clique em <strong>Distribuir</strong>
                    </div>
                )}
                {parcelas.map(p => (
                    <div key={p._id} className="rounded-lg border border-(--border) bg-(--surface) overflow-hidden">
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
                                onChange    ={(val) => update(p._id, { formaPagamentoId: val })}
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

            {/* Rodapé */}
            <div className="flex justify-between items-center pt-2 border-t border-(--border)">
                <TButton
                    label  ="Cancelar"
                    variant="cancel"
                    type   ="button"
                    onClick={() => navigate(`/clinica/consultas/${id}`)}
                />
                <TButton
                    label  ="Concluir e Faturar"
                    variant="save"
                    type   ="button"
                    loading={saving}
                    onClick={handleSubmit}
                />
            </div>
        </TPage>
    )
}
