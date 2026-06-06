import { useState, useEffect } from "react"
import { useLocation }        from "react-router-dom"
import axios                  from "axios"
import { api }                from "../../services/api"
import { useMessage }         from "../../hooks/useMessage"
import type { TDataGridColumn } from "../../types/TDataGridColumn"
import type { ErrorResponse } from "../../types/ErrorResponse"

import { TPage }              from "../../components/tpage"
import { TForm, TFormFooter, TFormActionsLeft } from "../../components/tform"
import { TRow }               from "../../components/trow"
import { TCol }               from "../../components/tcol"
import { TEntry }             from "../../components/tentry"
import { TCombo }             from "../../components/tcombo"
import { TDbCombo }           from "../../components/tdbcombo"
import { TDate }              from "../../components/tdate"
import { TButton }            from "../../components/tbutton"
import { TDataGrid }          from "../../components/tdatagrid"
import { TWindow }            from "../../components/twindow"
import { TSpace }             from "../../components/tspace"
import { displayPessoa, displayEmitente, formatarDocumento } from "../../utils/pessoas"
import { gerarPdfComprovantePagamento }                      from "../../utils/geradorPdf"

interface PagarContasItem {
    tipo:                string
    parcelaId:           number
    numeroParcela:       number | null
    contaId:             number
    descricao:           string | null
    emitenteId:          number | null
    emitenteNome:        string | null
    emitenteDocumento:   string | null
    pessoaId:            number
    pessoaNome:          string
    pessoaDocumento:     string | null
    dataVencimento:      string
    valor:               number
    formaPagamentoId:    number | null
    formaPagamentoNome:  string | null
    contaFinanceiraId:   number | null
    contaFinanceiraNome: string | null
    status:              string
    dataPagamento:       string | null
    valorPago:           number | null
}

const STATUS_OPTIONS = [
    { value: "",          label: "Todos"     },
    { value: "ABERTO",    label: "Aberto"    },
    { value: "PAGO",      label: "Pago"      },
    { value: "CANCELADO", label: "Cancelado" },
]

const TIPO_OPTIONS = [
    { value: "",        label: "Ambos"           },
    { value: "PAGAR",   label: "Contas a Pagar"  },
    { value: "RECEBER", label: "Contas a Receber" },
]

function fmtDate(iso: string | null | undefined) {
    if (!iso) return "—"
    const [y, m, d] = iso.split("-")
    return `${d}/${m}/${y}`
}

const STATUS_BADGE: Record<string, string> = {
    ABERTO:            "bg-(--warning)",
    PARCIALMENTE_PAGO: "bg-blue-500",
    PAGO:              "bg-(--success)",
    CANCELADO:         "bg-(--danger)",
}
const STATUS_LABEL: Record<string, string> = {
    ABERTO:            "Aberto",
    PARCIALMENTE_PAGO: "Parcial",
    PAGO:              "Pago",
    CANCELADO:         "Cancelado",
}

export default function PagarContas() {
    const { showMessage } = useMessage()
    const location        = useLocation()

    const [data,    setData]    = useState<PagarContasItem[]>([])
    const [loading, setLoading] = useState(false)
    const [paying,  setPaying]  = useState(false)

    const [filtroTipo,        setFiltroTipo]        = useState("")
    const [filtroEmitenteId,  setFiltroEmitenteId]  = useState("")
    const [filtroPessoaId,    setFiltroPessoaId]    = useState("")
    const [filtroStatus,      setFiltroStatus]      = useState("")
    const [filtroDataVencDe,  setFiltroDataVencDe]  = useState("")
    const [filtroDataVencAte, setFiltroDataVencAte] = useState("")

    const [selectedItem,  setSelectedItem]  = useState<PagarContasItem | null>(null)
    const [payWindowOpen, setPayWindowOpen] = useState(false)

    const [pgDataPagamento,    setPgDataPagamento]    = useState("")
    const [pgValorPago,        setPgValorPago]        = useState("")
    const [pgContaFinanceiraId, setPgContaFinanceiraId] = useState("")
    const [pgFormaPagamentoId,  setPgFormaPagamentoId]  = useState("")

    async function load(formData: Record<string, string>) {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filtroTipo)               params.set("tipo",        filtroTipo)
            if (filtroEmitenteId)         params.set("emitenteId",  filtroEmitenteId)
            if (filtroPessoaId)           params.set("pessoaId",    filtroPessoaId)
            if (formData.status)          params.set("status",      formData.status)
            if (filtroDataVencDe)         params.set("dataVencDe",  filtroDataVencDe)
            if (filtroDataVencAte)        params.set("dataVencAte", filtroDataVencAte)
            const res = await api.get(`/financeiro/pagar-contas?${params.toString()}`)
            setData(res.data)
        } catch {
            showMessage("error", "Erro ao carregar contas")
        } finally {
            setLoading(false)
        }
    }

    function handleLimpar() {
        setFiltroTipo("")
        setFiltroEmitenteId("")
        setFiltroPessoaId("")
        setFiltroStatus("")
        setFiltroDataVencDe("")
        setFiltroDataVencAte("")
        setData([])
    }

    function handleSelectItem(item: PagarContasItem) {
        if (item.status === "PAGO" || item.status === "CANCELADO") return
        setSelectedItem(item)
        setPgDataPagamento(new Date().toISOString().slice(0, 10))
        setPgValorPago(String(item.valor))
        setPgContaFinanceiraId(item.contaFinanceiraId ? String(item.contaFinanceiraId) : "")
        setPgFormaPagamentoId(item.formaPagamentoId ? String(item.formaPagamentoId) : "")
        setPayWindowOpen(true)
    }

    useEffect(() => {
        const s = location.state as { preItem?: PagarContasItem } | null
        if (s?.preItem) {
            setData([s.preItem])
            window.history.replaceState({}, "")
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function buildDadosComprovante(item: PagarContasItem): Parameters<typeof gerarPdfComprovantePagamento>[0] {
        return {
            tipo:               item.tipo as "PAGAR" | "RECEBER",
            numeroParcela:      item.numeroParcela,
            emitenteNome:       item.emitenteNome,
            emitenteDocumento:  item.emitenteDocumento,
            pessoaNome:         item.pessoaNome,
            pessoaDocumento:    item.pessoaDocumento,
            descricao:          item.descricao,
            dataVencimento:     item.dataVencimento,
            valorOriginal:      item.valor,
            dataPagamento:      item.dataPagamento,
            valorPago:          item.valorPago,
            formaPagamentoNome: item.formaPagamentoNome,
            contaFinanceiraNome: item.contaFinanceiraNome,
        }
    }

    function nomeArquivo(item: PagarContasItem) {
        const tipo  = item.tipo === "RECEBER" ? "recebimento" : "pagamento"
        const parc  = item.numeroParcela ? `-parcela-${item.numeroParcela}` : ""
        return `comprovante-${tipo}-${item.parcelaId}${parc}.pdf`
    }

    function handleVisualizarPdf(item: PagarContasItem, e: React.MouseEvent) {
        e.stopPropagation()
        const base64 = gerarPdfComprovantePagamento(buildDadosComprovante(item))
        const link   = document.createElement("a")
        link.href    = `data:application/pdf;base64,${base64}`
        link.download = nomeArquivo(item)
        link.click()
    }

    async function handleEnviarWhatsapp(item: PagarContasItem, e: React.MouseEvent) {
        e.stopPropagation()
        try {
            const base64  = gerarPdfComprovantePagamento(buildDadosComprovante(item))
            const arquivo = nomeArquivo(item)
            const caption = item.tipo === "RECEBER"
                ? `Comprovante de recebimento — ${item.descricao ?? arquivo}`
                : `Comprovante de pagamento — ${item.descricao ?? arquivo}`
            await api.post("/financeiro/pagar-contas/enviar-pdf", {
                pessoaId: item.pessoaId,
                base64,
                fileName: arquivo,
                caption,
            })
            showMessage("success", "PDF enviado via WhatsApp!")
        } catch {
            showMessage("error", "Falha ao enviar PDF via WhatsApp")
        }
    }

    async function handlePagar() {
        if (!selectedItem || !pgDataPagamento || !pgValorPago || !pgContaFinanceiraId || !pgFormaPagamentoId) {
            showMessage("error", "Preencha todos os campos obrigatórios")
            return
        }
        setPaying(true)
        try {
            const endpoint = selectedItem.tipo === "PAGAR"
                ? `/financeiro/contas-pagar/parcelas/${selectedItem.parcelaId}/pagar`
                : `/financeiro/contas-receber/parcelas/${selectedItem.parcelaId}/pagar`

            await api.patch(endpoint, {
                dataPagamento:     pgDataPagamento,
                valorPago:         parseFloat(pgValorPago),
                contaFinanceiraId: Number(pgContaFinanceiraId),
                formaPagamentoId:  Number(pgFormaPagamentoId),
            })

            showMessage("success", `${selectedItem.tipo === "PAGAR" ? "Pagamento" : "Recebimento"} registrado com sucesso!`)
            setPayWindowOpen(false)
            setSelectedItem(null)
            setData(prev => prev.map(item =>
                item.parcelaId === selectedItem.parcelaId && item.tipo === selectedItem.tipo
                    ? {
                        ...item,
                        status:             "PAGO",
                        dataPagamento:      pgDataPagamento,
                        valorPago:          parseFloat(pgValorPago),
                        formaPagamentoNome: item.formaPagamentoId === Number(pgFormaPagamentoId)
                                                ? item.formaPagamentoNome
                                                : item.formaPagamentoNome,
                        contaFinanceiraNome: item.contaFinanceiraId === Number(pgContaFinanceiraId)
                                                ? item.contaFinanceiraNome
                                                : item.contaFinanceiraNome,
                    }
                    : item
            ))
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao registrar pagamento")
            } else {
                showMessage("error", "Erro inesperado")
            }
        } finally {
            setPaying(false)
        }
    }

    const columns: TDataGridColumn<PagarContasItem>[] = [
        { label: "Nº", field: "numeroParcela", width: "50px", align: "center",
          render: (row) => <span>{row.numeroParcela ?? "—"}</span> },
        {
            label: "Tipo", field: "tipo", width: "110px", align: "center",
            render: (row) => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${row.tipo === "PAGAR" ? "bg-(--danger)" : "bg-(--success)"}`}>
                    {row.tipo === "PAGAR" ? "A Pagar" : "A Receber"}
                </span>
            ),
        },
        { label: "Vencimento", field: "dataVencimento", width: "110px",
          render: (row) => <span>{fmtDate(row.dataVencimento)}</span> },
        { label: "Pessoa", field: "pessoaNome",
          render: (row) => <span>{row.pessoaNome}{row.pessoaDocumento && <span className="ml-1 text-xs opacity-60">({formatarDocumento(row.pessoaDocumento)})</span>}</span> },
        { label: "Emitente", field: "emitenteNome", width: "180px",
          render: (row) => <span>{row.emitenteNome ?? "—"}{row.emitenteDocumento && <span className="ml-1 text-xs opacity-60">({formatarDocumento(row.emitenteDocumento)})</span>}</span> },
        { label: "Descrição", field: "descricao",
          render: (row) => <span>{row.descricao ?? "—"}</span> },
        { label: "Valor", field: "valor", width: "120px", align: "right",
          render: (row) => <span>{Number(row.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span> },
        {
            label: "Status", field: "status", width: "120px", align: "center",
            render: (row) => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${STATUS_BADGE[row.status] ?? ""}`}>
                    {STATUS_LABEL[row.status] ?? row.status}
                </span>
            ),
        },
        {
            label: "", field: "parcelaId", width: "110px", align: "center",
            render: (row) => row.status !== "PAGO" ? null : (
                <div className="flex gap-1 justify-center" onClick={e => e.stopPropagation()}>
                    <button
                        title="Baixar comprovante PDF"
                        onClick={(e) => handleVisualizarPdf(row, e)}
                        className="px-2 py-1 rounded text-xs font-medium bg-(--surface-secondary) border border-(--border) text-(--text-primary) hover:bg-(--accent) hover:text-white transition-colors"
                    >
                        📄 Ver
                    </button>
                    <button
                        title="Enviar comprovante via WhatsApp"
                        onClick={(e) => handleEnviarWhatsapp(row, e)}
                        className="px-2 py-1 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                        📱 Enviar
                    </button>
                </div>
            ),
        },
    ]

    return (
        <TPage title="Pagar / Receber Contas" breadcrumb={["Financeiro", "Pagar Contas"]}>
            <TForm onSubmit={load}>
                <TRow>
                    <TCol>
                        <TCombo
                            name         ="tipo"
                            label        ="Tipo"
                            width        ="200px"
                            defaultValue ={filtroTipo}
                            options      ={TIPO_OPTIONS}
                            onChange     ={setFiltroTipo}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TDbCombo
                            name         ="emitenteId"
                            label        ="Emitente"
                            url          ="/emitentes/select"
                            valueField   ="id"
                            displayField ={displayEmitente}
                            value        ={filtroEmitenteId}
                            width        ="50%"
                            onChange     ={(val) => setFiltroEmitenteId(val)}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TDbCombo
                            name         ="pessoaId"
                            label        ="Pessoa"
                            url          ="/pessoas/select"
                            valueField   ="id"
                            displayField ={displayPessoa}
                            value        ={filtroPessoaId}
                            width        ="50%"
                            onChange     ={(val) => setFiltroPessoaId(val)}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TCombo
                            name         ="status"
                            label        ="Status"
                            width        ="180px"
                            defaultValue ={filtroStatus}
                            options      ={STATUS_OPTIONS}
                            onChange     ={setFiltroStatus}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TDate
                            name         ="dataVencDe"
                            label        ="Vencimento de"
                            width        ="160px"
                            defaultValue ={filtroDataVencDe}
                            onChange     ={setFiltroDataVencDe}
                        />
                    </TCol>
                    <TCol>
                        <TDate
                            name         ="dataVencAte"
                            label        ="Vencimento até"
                            width        ="160px"
                            defaultValue ={filtroDataVencAte}
                            onChange     ={setFiltroDataVencAte}
                        />
                    </TCol>
                    <TSpace />
                </TRow>
                <TFormFooter>
                    <TFormActionsLeft>
                        <TButton label="Limpar"  variant="cancel" type="button" onClick={handleLimpar} />
                        <TButton label="Filtrar" variant="save"   type="submit" />
                    </TFormActionsLeft>
                </TFormFooter>
            </TForm>

            <TDataGrid
                columns      ={columns}
                data         ={data}
                keyField     ="parcelaId"
                loading      ={loading}
                emptyMessage ="Utilize os filtros acima para buscar contas"
                onRowClick   ={(row) => handleSelectItem(row)}
            />

            <TWindow
                title   ="Registrar Pagamento"
                open    ={payWindowOpen}
                width   ="520px"
                onClose ={() => setPayWindowOpen(false)}
                actions ={
                    <TButton
                        label   ="Confirmar Pagamento"
                        variant ="save"
                        onClick ={handlePagar}
                        loading ={paying}
                    />
                }
            >
                {selectedItem && (
                    <div className="flex flex-col gap-4">
                        <div className="p-3 rounded-lg bg-(--surface-secondary) text-sm flex flex-col gap-1">
                            <span><strong>Tipo:</strong> {selectedItem.tipo === "PAGAR" ? "Conta a Pagar" : "Conta a Receber"}</span>
                            <span><strong>Pessoa:</strong> {selectedItem.pessoaNome}</span>
                            {selectedItem.emitenteNome && <span><strong>Emitente:</strong> {selectedItem.emitenteNome}</span>}
                            {selectedItem.descricao    && <span><strong>Descrição:</strong> {selectedItem.descricao}</span>}
                            <span><strong>Vencimento:</strong> {fmtDate(selectedItem.dataVencimento)}</span>
                            <span><strong>Valor:</strong> {Number(selectedItem.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                        </div>
                        <TRow>
                            <TCol>
                                <TDate
                                    name         ="pgDataPagamento"
                                    label        ="Data de Pagamento"
                                    required
                                    width        ="160px"
                                    defaultValue ={pgDataPagamento}
                                    onChange     ={setPgDataPagamento}
                                />
                            </TCol>
                            <TCol>
                                <TEntry
                                    name         ="pgValorPago"
                                    label        ="Valor Pago"
                                    mask         ="moeda"
                                    required
                                    width        ="160px"
                                    defaultValue ={pgValorPago}
                                    onChange     ={setPgValorPago}
                                />
                            </TCol>
                        </TRow>
                        <TRow>
                            <TCol>
                                <TDbCombo
                                    name         ="pgFormaPagamentoId"
                                    label        ="Forma de Pagamento"
                                    url          ="/financeiro/formas-pagamento/select"
                                    valueField   ="id"
                                    displayField ="nome"
                                    value        ={pgFormaPagamentoId}
                                    required
                                    width        ="260px"
                                    onChange     ={(val) => setPgFormaPagamentoId(val)}
                                />
                            </TCol>
                        </TRow>
                        <TRow>
                            <TCol>
                                <TDbCombo
                                    name         ="pgContaFinanceiraId"
                                    label        ="Conta Financeira"
                                    url          ="/financeiro/contas/select"
                                    valueField   ="id"
                                    displayField ="nome"
                                    value        ={pgContaFinanceiraId}
                                    required
                                    width        ="260px"
                                    onChange     ={(val) => setPgContaFinanceiraId(val)}
                                />
                            </TCol>
                        </TRow>
                    </div>
                )}
            </TWindow>
        </TPage>
    )
}
