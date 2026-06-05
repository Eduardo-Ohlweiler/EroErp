import { useEffect, useState }      from "react"
import { useNavigate }               from "react-router-dom"
import { api }                       from "../../../services/api"
import { useMessage }                from "../../../hooks/useMessage"
import { useQuestion }               from "../../../hooks/useQuestion"
import type { ContaPagarResponse }   from "../../../types/ContaPagar"
import type { TDataGridColumn }      from "../../../types/TDataGridColumn"
import { TPage }                     from "../../../components/tpage"
import { TForm, TFormFooter, TFormActionsLeft, TFormActionsRight } from "../../../components/tform"
import { TRow }                      from "../../../components/trow"
import { TCol }                      from "../../../components/tcol"
import { TCombo }                    from "../../../components/tcombo"
import { TDate }                     from "../../../components/tdate"
import { TDbCombo }                  from "../../../components/tdbcombo"
import { TButton }                   from "../../../components/tbutton"
import { TDataGrid }                 from "../../../components/tdatagrid"
import { TDataGridFooter }           from "../../../components/tdatagridfooter"
import { TSpace }                     from "../../../components/tspace"
import { displayPessoa, displayEmitente, formatarDocumento } from "../../../utils/pessoas"

const STATUS_OPTIONS = [
    { value: "",                 label: "Todos"             },
    { value: "ABERTO",           label: "Aberto"            },
    { value: "PARCIALMENTE_PAGO", label: "Parcialmente Pago" },
    { value: "PAGO",             label: "Pago"              },
    { value: "CANCELADO",        label: "Cancelado"         },
]

function fmtDate(iso: string | null | undefined) {
    if (!iso) return "—"
    const [y, m, d] = iso.split("-")
    return `${d}/${m}/${y}`
}

const columns: TDataGridColumn<ContaPagarResponse>[] = [
    { label: "Data", field: "data", width: "110px",
      render: (row) => <span>{fmtDate(row.data)}</span> },
    { label: "Emitente", field: "emitenteNome", width: "200px",
      render: (row) => <span>{row.emitenteNome ?? "—"}{row.emitenteDocumento && <span className="ml-1 text-xs opacity-60">({formatarDocumento(row.emitenteDocumento)})</span>}</span> },
    { label: "Pessoa", field: "pessoaNome",
      render: (row) => <span>{row.pessoaNome}{row.pessoaDocumento && <span className="ml-1 text-xs opacity-60">({formatarDocumento(row.pessoaDocumento)})</span>}</span> },
    { label: "Descrição", field: "descricao",
      render: (row) => <span>{row.descricao ?? "—"}</span> },
    { label: "Valor Total", field: "valorTotal", width: "130px", align: "right",
      render: (row) => <span>{Number(row.valorTotal).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span> },
    {
        label: "Status", field: "status", width: "160px", align: "center",
        render: (row) => {
            const map: Record<string, string> = {
                ABERTO: "bg-(--warning)",
                PARCIALMENTE_PAGO: "bg-blue-500",
                PAGO: "bg-(--success)",
                CANCELADO: "bg-(--danger)",
            }
            const labels: Record<string, string> = {
                ABERTO: "Aberto",
                PARCIALMENTE_PAGO: "Parcial",
                PAGO: "Pago",
                CANCELADO: "Cancelado",
            }
            return (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${map[row.status] ?? ""}`}>
                    {labels[row.status] ?? row.status}
                </span>
            )
        },
    },
]

export default function ContaPagarList() {
    const navigate        = useNavigate()
    const { showMessage } = useMessage()
    const { ask }         = useQuestion()

    const [data,          setData]          = useState<ContaPagarResponse[]>([])
    const [loading,       setLoading]       = useState(false)
    const [page,          setPage]          = useState(0)
    const [totalPages,    setTotalPages]    = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const pageSize = 15

    const [filtroEmitenteId, setFiltroEmitenteId] = useState("")
    const [filtroPessoaId,   setFiltroPessoaId]   = useState("")
    const [filtroStatus,     setFiltroStatus]     = useState("")
    const [filtroDataInicio, setFiltroDataInicio] = useState("")
    const [filtroDataFim,    setFiltroDataFim]    = useState("")

    const [filtroAtivo, setFiltroAtivo] = useState<Record<string, string>>({})

    useEffect(() => {
        load(filtroAtivo, page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page])

    async function load(filtros: Record<string, string>, pagina = 0) {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(pagina), size: String(pageSize), sort: "data,desc" })
            if (filtros.emitenteId) params.set("emitenteId", filtros.emitenteId)
            if (filtros.pessoaId)   params.set("pessoaId",   filtros.pessoaId)
            if (filtros.status)     params.set("status",     filtros.status)
            if (filtros.dataInicio) params.set("dataInicio", filtros.dataInicio)
            if (filtros.dataFim)    params.set("dataFim",    filtros.dataFim)
            const res = await api.get(`/financeiro/contas-pagar?${params.toString()}`)
            setData(res.data.content)
            setTotalPages(res.data.totalPages)
            setTotalElements(res.data.totalElements)
        } catch {
            showMessage("error", "Erro ao carregar contas a pagar")
        } finally {
            setLoading(false)
        }
    }

    function handleFiltrar(formData: Record<string, string>) {
        const filtros = {
            emitenteId: filtroEmitenteId,
            pessoaId:   filtroPessoaId,
            status:     formData.status ?? "",
            dataInicio: formData.dataInicio ?? "",
            dataFim:    formData.dataFim    ?? "",
        }
        setFiltroAtivo(filtros)
        setPage(0)
        load(filtros, 0)
    }

    function handleLimpar() {
        setFiltroEmitenteId("")
        setFiltroPessoaId("")
        setFiltroStatus("")
        setFiltroDataInicio("")
        setFiltroDataFim("")
        setFiltroAtivo({})
        setPage(0)
        load({}, 0)
    }

    function handleDelete(row: ContaPagarResponse) {
        ask(`Excluir a conta "${row.descricao ?? `#${row.id}`}"? Esta ação não pode ser desfeita.`, [
            { label: "Cancelar", variant: "cancel", onClick: () => {} },
            { label: "Excluir",  variant: "delete",  onClick: async () => {
                try {
                    await api.delete(`/financeiro/contas-pagar/${row.id}`)
                    showMessage("success", "Conta excluída!")
                    load(filtroAtivo, page)
                } catch {
                    showMessage("error", "Erro ao excluir conta")
                }
            }},
        ])
    }

    return (
        <TPage title="Contas a Pagar" breadcrumb={["Financeiro", "Contas a Pagar"]}>
            <TForm onSubmit={handleFiltrar}>
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
                            onChange     ={(val) => setFiltroStatus(val)}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TDate
                            name         ="dataInicio"
                            label        ="Data de"
                            width        ="160px"
                            defaultValue ={filtroDataInicio}
                            onChange     ={setFiltroDataInicio}
                        />
                    </TCol>
                    <TCol>
                        <TDate
                            name         ="dataFim"
                            label        ="Data até"
                            width        ="160px"
                            defaultValue ={filtroDataFim}
                            onChange     ={setFiltroDataFim}
                        />
                    </TCol>
                    <TSpace />
                </TRow>
                <TFormFooter>
                    <TFormActionsLeft>
                        <TButton label="Limpar" variant="cancel" type="button" onClick={handleLimpar} />
                        <TButton label="Filtrar" variant="save"  type="submit" />
                    </TFormActionsLeft>
                    <TFormActionsRight>
                        <TButton label="Nova Conta" variant="new" type="button" onClick={() => navigate("/financeiro/contas-pagar/novo")} />
                    </TFormActionsRight>
                </TFormFooter>
            </TForm>

            <TDataGrid
                columns      ={columns}
                data         ={data}
                keyField     ="id"
                loading      ={loading}
                emptyMessage ="Nenhuma conta a pagar encontrada"
                onRowClick   ={(row) => navigate(`/financeiro/contas-pagar/${row.id}`)}
                actionsWidth ="120px"
                actions      ={(row) => (
                    <>
                        <TButton label="" variant="edit"
                            onClick={(e) => { e?.stopPropagation(); navigate(`/financeiro/contas-pagar/${row.id}`) }} />
                        <TButton label="" variant="delete"
                            onClick={(e) => { e?.stopPropagation(); handleDelete(row) }} />
                    </>
                )}
            />

            <TDataGridFooter
                page          ={page}
                totalPages    ={totalPages}
                totalElements ={totalElements}
                pageSize      ={pageSize}
                onPageChange  ={setPage}
            />
        </TPage>
    )
}
