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
import { TCombo }   from "../../components/tcombo"
import { TDbCombo } from "../../components/tdbcombo"
import { TDate }    from "../../components/tdate"
import { TButton }  from "../../components/tbutton"
import { TPanel }   from "../../components/tpanel"
import { TDataGrid } from "../../components/tdatagrid"
import { FaTrash, FaUniversity } from "react-icons/fa"
import { TFormActionsLeft, TFormFooter } from "../../components/tform"

// ── types ─────────────────────────────────────────────────────────────────────

interface SaldoConta {
    nome:  string
    saldo: number
}

interface DashboardSaldo {
    saldoGeral:    number
    saldoPorConta: SaldoConta[]
}

interface Lancamento {
    id:                  number
    tipo:                "ENTRADA" | "SAIDA"
    contaFinanceiraId:   number
    contaFinanceiraNome: string
    valor:               number
    descricao:           string | null
    data:                string
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

const TIPO_OPTIONS = [
    { value: "",       label: "Selecione..."  },
    { value: "ENTRADA", label: "Entrada"      },
    { value: "SAIDA",   label: "Saída"        },
]

export default function LancamentosFinanceiros() {
    const { showMessage } = useMessage()

    const [saldoGeral,        setSaldoGeral]          = useState<number>(0)
    const [saldoPorConta,     setSaldoPorConta]       = useState<SaldoConta[]>([])
    const [loadingSaldo,      setLoadingSaldo]        = useState(true)

    const [lancamentos,        setLancamentos]        = useState<Lancamento[]>([])
    const [loadingLancamentos, setLoadingLancamentos] = useState(true)

    // ── form state ───────────────────────────────────────────────────────────
    const [tipo,              setTipo]              = useState("")
    const [contaFinanceiraId, setContaFinanceiraId] = useState("")
    const [valor,             setValor]             = useState("")
    const [descricao,         setDescricao]         = useState("")
    const [data,              setData]              = useState(todayIso())
    const [saving,            setSaving]            = useState(false)
    const [formKey,           setFormKey]           = useState(0)

    // ── loaders ──────────────────────────────────────────────────────────────

    async function loadSaldo() {
        setLoadingSaldo(true)
        try {
            const r = await api.get<DashboardSaldo>("/financeiro/dashboard")
            setSaldoGeral(r.data.saldoGeral)
            setSaldoPorConta(r.data.saldoPorConta ?? [])
        } catch {
            showMessage("error", "Erro ao carregar saldo das contas")
        } finally {
            setLoadingSaldo(false)
        }
    }

    async function loadLancamentos() {
        setLoadingLancamentos(true)
        try {
            const r = await api.get<Lancamento[]>("/financeiro/lancamentos")
            setLancamentos(r.data ?? [])
        } catch {
            showMessage("error", "Erro ao carregar lançamentos")
        } finally {
            setLoadingLancamentos(false)
        }
    }

    useEffect(() => {
        loadSaldo()
        loadLancamentos()
    }, []) // eslint-disable-line

    async function handleLancar() {
        if (!tipo) {
            showMessage("error", "Selecione o tipo do lançamento")
            return
        }
        if (!contaFinanceiraId) {
            showMessage("error", "Selecione a conta financeira")
            return
        }
        if (!valor || parseFloat(valor) <= 0) {
            showMessage("error", "Informe um valor válido")
            return
        }
        if (!data) {
            showMessage("error", "Informe a data do lançamento")
            return
        }

        setSaving(true)
        try {
            await api.post("/financeiro/lancamentos", {
                contaFinanceiraId: Number(contaFinanceiraId),
                tipo,
                valor: parseFloat(valor),
                descricao: descricao || null,
                data,
            })
            showMessage("success", "Lançamento registrado com sucesso!")
            // reset form
            setTipo("")
            setContaFinanceiraId("")
            setValor("")
            setDescricao("")
            setData(todayIso())
            setFormKey(k => k + 1)
            // refresh data
            await Promise.all([loadSaldo(), loadLancamentos()])
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao registrar lançamento")
            } else {
                showMessage("error", "Erro inesperado ao registrar lançamento")
            }
        } finally {
            setSaving(false)
        }
    }

    // ── excluir lançamento ───────────────────────────────────────────────────

    async function handleDelete(id: number) {
        try {
            await api.delete(`/financeiro/lancamentos/${id}`)
            showMessage("success", "Lançamento excluído")
            setLancamentos(prev => prev.filter(l => l.id !== id))
            loadSaldo()
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao excluir lançamento")
            } else {
                showMessage("error", "Erro inesperado ao excluir lançamento")
            }
        }
    }

    // ── columns ──────────────────────────────────────────────────────────────

    const columns: TDataGridColumn<Lancamento>[] = [
        {
            label: "Data", field: "data", width: "110px",
            render: (row) => <span>{fmtDate(row.data)}</span>,
        },
        {
            label: "Tipo", field: "tipo", width: "100px", align: "center",
            render: (row) => (
                <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${
                        row.tipo === "ENTRADA" ? "bg-(--success)" : "bg-(--danger)"
                    }`}
                >
                    {row.tipo === "ENTRADA" ? "Entrada" : "Saída"}
                </span>
            ),
        },
        {
            label: "Conta", field: "contaFinanceiraNome",
            render: (row) => <span>{row.contaFinanceiraNome}</span>,
        },
        {
            label: "Descrição", field: "descricao",
            render: (row) => <span className="text-(--text-muted)">{row.descricao ?? "—"}</span>,
        },
        {
            label: "Valor", field: "valor", width: "130px", align: "right",
            render: (row) => (
                <span className={`font-semibold ${row.tipo === "ENTRADA" ? "text-(--success)" : "text-(--danger)"}`}>
                    {row.tipo === "ENTRADA" ? "+" : "−"} {fmtMoeda(row.valor)}
                </span>
            ),
        },
        {
            label: "", field: "id", width: "60px", align: "center",
            render: (row) => (
                <button
                    type    ="button"
                    title   ="Excluir lançamento"
                    onClick ={(e) => { e.stopPropagation(); handleDelete(row.id) }}
                    className="p-1.5 rounded text-(--danger) hover:bg-(--danger) hover:text-white transition-colors"
                >
                    <FaTrash className="w-3.5 h-3.5" />
                </button>
            ),
        },
    ]

    const saldoPositivo = saldoGeral >= 0

    return (
        <TPage title="Lançamentos Financeiros" breadcrumb={["Financeiro", "Lançamentos"]}>

            {/* ── Saldo Geral + Saldo por Conta ────────────────────────────── */}
            <div className="mb-5">
                {/* Saldo Geral destaque */}
                <div className="flex items-center gap-4 p-4 bg-(--bg-surface) border border-(--border) rounded-xl mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${saldoPositivo ? "bg-(--success)" : "bg-(--danger)"}`}>
                        <FaUniversity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-xs text-(--text-muted) uppercase tracking-wide font-medium">Saldo Geral</p>
                        {loadingSaldo ? (
                            <span className="w-5 h-5 border-2 border-(--accent) border-t-transparent rounded-full animate-spin inline-block" />
                        ) : (
                            <p className={`text-2xl font-bold ${saldoPositivo ? "text-(--success)" : "text-(--danger)"}`}>
                                {fmtMoeda(saldoGeral)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Saldo por conta */}
                {!loadingSaldo && saldoPorConta.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {saldoPorConta.map((c, i) => {
                            const pos = c.saldo >= 0
                            return (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-3 bg-(--bg-surface) border border-(--border) rounded-lg"
                                >
                                    <span className="text-sm text-(--text-primary) font-medium truncate mr-2">
                                        {c.nome}
                                    </span>
                                    <span className={`text-sm font-semibold whitespace-nowrap ${pos ? "text-(--success)" : "text-(--danger)"}`}>
                                        {fmtMoeda(c.saldo)}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── Formulário de novo lançamento ─────────────────────────────── */}
            <div className="mb-4">
                <TPanel title="Novo Lançamento">
                    <div key={formKey}>
                    <TRow>
                        <TCol>
                            <TCombo
                                name         ="tipo"
                                label        ="Tipo"
                                width        ="260px"
                                required
                                defaultValue ={tipo}
                                options      ={TIPO_OPTIONS}
                                onChange     ={setTipo}
                            />
                        </TCol>
                    </TRow>
                    <TRow>
                        <TCol>
                            <TDbCombo
                                name         ="contaFinanceiraId"
                                label        ="Conta Financeira"
                                url          ="/financeiro/contas/select"
                                valueField   ="id"
                                displayField ="nome"
                                value        ={contaFinanceiraId}
                                required
                                width        ="260px"
                                onChange     ={(val) => setContaFinanceiraId(val)}
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
                                width        ="150px"
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
                                width        ="60%"
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
                                width        ="160px"
                                defaultValue ={data}
                                onChange     ={setData}
                            />
                        </TCol>
                    </TRow>
                    <TFormFooter>
                        <TFormActionsLeft>
                            <TButton
                                label   ="Lançar"
                                variant ="save"
                                type    ="button"
                                loading ={saving}
                                onClick ={handleLancar}
                            />
                        </TFormActionsLeft>
                    </TFormFooter>
                    </div>
                </TPanel>
            </div>

            {/* ── Lista de lançamentos ──────────────────────────────────────── */}
            <TPanel title="Lançamentos">
                <TDataGrid
                    columns      ={columns}
                    data         ={lancamentos}
                    keyField     ="id"
                    loading      ={loadingLancamentos}
                    emptyMessage ="Nenhum lançamento encontrado"
                />
            </TPanel>

        </TPage>
    )
}
