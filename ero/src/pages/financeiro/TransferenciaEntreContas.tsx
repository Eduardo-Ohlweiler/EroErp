import { useEffect, useState } from "react"
import axios                   from "axios"
import { api }                 from "../../services/api"
import { useMessage }          from "../../hooks/useMessage"
import type { TDataGridColumn } from "../../types/TDataGridColumn"
import type { ErrorResponse }   from "../../types/ErrorResponse"

import { TPage }    from "../../components/tpage"
import { TRow }     from "../../components/trow"
import { TCol }     from "../../components/tcol"
import { TEntry }   from "../../components/tentry"
import { TDbCombo } from "../../components/tdbcombo"
import { TDate }    from "../../components/tdate"
import { TButton }  from "../../components/tbutton"
import { TPanel }   from "../../components/tpanel"
import { TDataGrid } from "../../components/tdatagrid"
import { TFormActionsLeft, TFormFooter } from "../../components/tform"
import { FaTrash, FaExchangeAlt } from "react-icons/fa"

// ── types ─────────────────────────────────────────────────────────────────────

interface Transferencia {
    id:               number
    contaOrigemId:    number
    contaOrigemNome:  string
    contaDestinoId:   number
    contaDestinoNome: string
    valor:            number
    descricao:        string | null
    data:             string
}

function fmtMoeda(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function fmtDate(iso: string | null | undefined) {
    if (!iso) return "—"
    const [y, m, d] = iso.split("-")
    return `${d}/${m}/${y}`
}

function todayIso() {
    return new Date().toISOString().slice(0, 10)
}

export default function TransferenciaEntreContas() {
    const { showMessage } = useMessage()

    const [transferencias,        setTransferencias]       = useState<Transferencia[]>([])
    const [loadingTransferencias, setLoadingTransferencias] = useState(true)

    const [contaOrigemId,  setContaOrigemId]  = useState("")
    const [contaDestinoId, setContaDestinoId] = useState("")
    const [valor,          setValor]          = useState("")
    const [descricao,      setDescricao]      = useState("")
    const [data,           setData]           = useState(todayIso())
    const [saving,         setSaving]         = useState(false)
    const [formKey,        setFormKey]        = useState(0)

    async function loadTransferencias() {
        setLoadingTransferencias(true)
        try {
            const r = await api.get<Transferencia[]>("/financeiro/transferencias")
            setTransferencias(r.data ?? [])
        } catch {
            showMessage("error", "Erro ao carregar transferências")
        } finally {
            setLoadingTransferencias(false)
        }
    }

    useEffect(() => {
        loadTransferencias()
    }, []) // eslint-disable-line

    async function handleTransferir() {
        if (!contaOrigemId) {
            showMessage("error", "Selecione a conta de origem")
            return
        }
        if (!contaDestinoId) {
            showMessage("error", "Selecione a conta de destino")
            return
        }
        if (contaOrigemId === contaDestinoId) {
            showMessage("error", "Conta de origem e destino não podem ser iguais")
            return
        }
        if (!valor || parseFloat(valor) <= 0) {
            showMessage("error", "Informe um valor válido")
            return
        }
        if (!data) {
            showMessage("error", "Informe a data da transferência")
            return
        }

        setSaving(true)
        try {
            await api.post("/financeiro/transferencias", {
                contaOrigemId:  Number(contaOrigemId),
                contaDestinoId: Number(contaDestinoId),
                valor:          parseFloat(valor),
                descricao:      descricao || null,
                data,
            })
            showMessage("success", "Transferência realizada com sucesso!")
            setContaOrigemId("")
            setContaDestinoId("")
            setValor("")
            setDescricao("")
            setData(todayIso())
            setFormKey(k => k + 1)
            await loadTransferencias()
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao realizar transferência")
            } else {
                showMessage("error", "Erro inesperado ao realizar transferência")
            }
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id: number) {
        try {
            await api.delete(`/financeiro/transferencias/${id}`)
            showMessage("success", "Transferência excluída")
            setTransferencias(prev => prev.filter(t => t.id !== id))
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao excluir transferência")
            } else {
                showMessage("error", "Erro inesperado ao excluir transferência")
            }
        }
    }

    const columns: TDataGridColumn<Transferencia>[] = [
        {
            label: "Data", field: "data", width: "110px",
            render: (row) => <span>{fmtDate(row.data)}</span>,
        },
        {
            label: "Origem", field: "contaOrigemNome",
            render: (row) => <span className="font-medium">{row.contaOrigemNome}</span>,
        },
        {
            label: "", field: "id", width: "40px", align: "center",
            render: () => <FaExchangeAlt className="w-3.5 h-3.5 text-(--text-muted)" />,
        },
        {
            label: "Destino", field: "contaDestinoNome",
            render: (row) => <span className="font-medium">{row.contaDestinoNome}</span>,
        },
        {
            label: "Descrição", field: "descricao",
            render: (row) => <span className="text-(--text-muted)">{row.descricao ?? "—"}</span>,
        },
        {
            label: "Valor", field: "valor", width: "130px", align: "right",
            render: (row) => (
                <span className="font-semibold text-(--accent)">{fmtMoeda(row.valor)}</span>
            ),
        },
        {
            label: "", field: "id", width: "60px", align: "center",
            render: (row) => (
                <button
                    type    ="button"
                    title   ="Excluir transferência"
                    onClick ={(e) => { e.stopPropagation(); handleDelete(row.id) }}
                    className="p-1.5 rounded text-(--danger) hover:bg-(--danger) hover:text-white transition-colors"
                >
                    <FaTrash className="w-3.5 h-3.5" />
                </button>
            ),
        },
    ]

    return (
        <TPage title="Transferência entre Contas" breadcrumb={["Financeiro", "Transferências"]}>

            <div className="mb-4">
                <TPanel title="Nova Transferência">
                    <div key={formKey}>
                        <TRow>
                            <TCol>
                                <TDbCombo
                                    name         ="contaOrigemId"
                                    label        ="Conta de Origem"
                                    url          ="/financeiro/contas/select"
                                    valueField   ="id"
                                    displayField ="nome"
                                    value        ={contaOrigemId}
                                    required
                                    width        ="200px"
                                    onChange     ={(val) => setContaOrigemId(val)}
                                />
                            </TCol>
                        </TRow>
                        <TRow>
                            <TCol>
                                <TDbCombo
                                    name         ="contaDestinoId"
                                    label        ="Conta de Destino"
                                    url          ="/financeiro/contas/select"
                                    valueField   ="id"
                                    displayField ="nome"
                                    value        ={contaDestinoId}
                                    required
                                    width        ="200px"
                                    onChange     ={(val) => setContaDestinoId(val)}
                                />
                            </TCol>
                        </TRow>
                        <TRow>
                            <TCol>
                                <TEntry
                                    name         ="valor"
                                    label        ="Valor"
                                    mask         ="moeda"
                                    required
                                    width        ="200px"
                                    defaultValue ={valor}
                                    onChange     ={setValor}
                                />
                            </TCol>
                        </TRow>
                        <TRow>
                            <TCol>
                                <TEntry
                                    name         ="descricao"
                                    label        ="Descrição"
                                    width        ="50%"
                                    minWidth     ="200px"
                                    defaultValue ={descricao}
                                    onChange     ={setDescricao}
                                />
                            </TCol>
                        </TRow>
                        <TRow>
                            <TCol>
                                <TDate
                                    name         ="data"
                                    label        ="Data"
                                    required
                                    width        ="200px"
                                    defaultValue ={data}
                                    onChange     ={setData}
                                />
                            </TCol>
                        </TRow>
                        <TFormFooter>
                            <TFormActionsLeft>
                                <TButton
                                    label   ="Transferir"
                                    variant ="save"
                                    type    ="button"
                                    loading ={saving}
                                    onClick ={handleTransferir}
                                />
                            </TFormActionsLeft>
                        </TFormFooter>
                    </div>
                </TPanel>
            </div>

            <TPanel title="Histórico de Transferências">
                <TDataGrid
                    columns      ={columns}
                    data         ={transferencias}
                    keyField     ="id"
                    loading      ={loadingTransferencias}
                    emptyMessage ="Nenhuma transferência registrada"
                />
            </TPanel>

        </TPage>
    )
}
