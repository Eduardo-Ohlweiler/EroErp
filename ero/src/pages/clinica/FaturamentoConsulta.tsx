import { useState, useEffect }                          from "react"
import { useNavigate, useParams, useLocation }           from "react-router-dom"
import axios                                             from "axios"
import { api }                                           from "../../services/api"
import { useMessage }                                    from "../../hooks/useMessage"
import type { ErrorResponse }                            from "../../types/ErrorResponse"
import { TPage }                                         from "../../components/tpage"
import { TButton }                                       from "../../components/tbutton"
import { ParcelasEditor }                                from "../../components/faturamento/ParcelasEditor"
import { gerarParcelas, todayStr }                       from "../../components/faturamento/parcelas"
import type { ParcelaFaturamento }                       from "../../components/faturamento/parcelas"
import { formatarDocumento }                             from "../../utils/pessoas"
import { gerarPdfFaturamento, gerarPdfRecibo }           from "../../utils/geradorPdf"

interface ItemFaturamento {
    descricao:     string
    tipo?:         string
    quantidade:    number
    precoUnitario: number
    total:         number
}

interface FaturamentoState {
    pessoaId:          number
    pessoaNome:        string
    pessoaDocumento:   string | null
    emitenteId:        number | null
    emitenteNome:      string | null
    emitenteDocumento: string | null
    totalGeral:        number
    itens?:            ItemFaturamento[]
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

    function baixarPdf(base64: string, nomeArquivo: string) {
        const link = document.createElement("a")
        link.href = `data:application/pdf;base64,${base64}`
        link.download = nomeArquivo
        link.click()
    }

    async function enviarPdfWhatsapp(base64: string, fileName: string, caption: string) {
        try {
            await api.post(`/consultas/${id}/enviar-pdf`, { base64, fileName, caption })
        } catch {
            // falha silenciosa — PDF já foi baixado localmente
        }
    }

    async function handleSubmit() {
        if (!state) return
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
            const contaResp = await api.post("/financeiro/contas-receber", {
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

            await api.patch(`/consultas/${id}/faturar`, { contaReceberId: contaResp.data?.id ?? null })

            // ── Gera e baixa PDF de faturamento ──────────────────────────────
            const dadosFat = {
                consultaId:        id!,
                emitenteNome:      state.emitenteNome      ?? "Emitente",
                emitenteDocumento: state.emitenteDocumento ?? null,
                pessoaNome:        state.pessoaNome,
                pessoaDocumento:   state.pessoaDocumento   ?? null,
                descricao,
                data,
                parcelas,
                totalGeral:        state.totalGeral,
                itens:             state.itens,
            }
            const pdfFat     = gerarPdfFaturamento(dadosFat)
            const nomeArqFat = `faturamento-consulta-${id}.pdf`
            baixarPdf(pdfFat, nomeArqFat)
            await enviarPdfWhatsapp(pdfFat, nomeArqFat, `Faturamento — Consulta #${id}`)

            // ── Gera recibo para cada parcela já paga ─────────────────────────
            const parcPagas = parcelas.filter(p => p.pago)
            for (const p of parcPagas) {
                const pdfRec = gerarPdfRecibo({
                    consultaId:        id!,
                    numeroParcela:     p.numeroParcela,
                    emitenteNome:      state.emitenteNome      ?? "Emitente",
                    emitenteDocumento: state.emitenteDocumento ?? null,
                    pessoaNome:        state.pessoaNome,
                    pessoaDocumento:   state.pessoaDocumento   ?? null,
                    valorPago:         p.valorPago,
                    dataPagamento:     p.dataPagamento,
                    descricao,
                })
                const nomeArqRec = `recibo-consulta-${id}-parcela-${p.numeroParcela}.pdf`
                baixarPdf(pdfRec, nomeArqRec)
                await enviarPdfWhatsapp(pdfRec, nomeArqRec, `Recibo — Consulta #${id} — Parcela ${p.numeroParcela}`)
            }

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

    const fmtMoeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

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

            {/* Editor de parcelas (compartilhado) */}
            <ParcelasEditor
                total            ={state.totalGeral}
                value            ={parcelas}
                onChange         ={setParcelas}
                data             ={data}
                onDataChange     ={setData}
                numParc          ={numParc}
                onNumParcChange  ={setNumParc}
                descricao        ={descricao}
                onDescricaoChange={setDescricao}
                onValidationError={(msg) => showMessage("error", msg)}
            />

            {/* Rodapé */}
            <div className="flex justify-between items-center pt-2 mt-4 border-t border-(--border)">
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
