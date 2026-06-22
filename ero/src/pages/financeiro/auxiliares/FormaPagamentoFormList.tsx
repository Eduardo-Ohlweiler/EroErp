import { useEffect, useState }            from "react"
import { useMessage }                      from "../../../hooks/useMessage"
import { useQuestion }                     from "../../../hooks/useQuestion"
import type { TDataGridColumn }            from "../../../types/TDataGridColumn"
import type { FormaPagamento }             from "../../../types/FormaPagamento"
import { api }                             from "../../../services/api"
import axios                               from "axios"
import type { ErrorResponse }             from "../../../types/ErrorResponse"
import { TPage }                           from "../../../components/tpage"
import { TForm, TFormActionsLeft, TFormFooter } from "../../../components/tform"
import { TRow }                            from "../../../components/trow"
import { TCol }                            from "../../../components/tcol"
import { TEntry }                          from "../../../components/tentry"
import { TCombo }                          from "../../../components/tcombo"
import { TButton }                         from "../../../components/tbutton"
import { TDataGrid }                       from "../../../components/tdatagrid"
import { TDataGridFooter }                 from "../../../components/tdatagridfooter"
import { TDbCombo }                        from "../../../components/tdbcombo"

const columns: TDataGridColumn<FormaPagamento>[] = [
    { label: "ID",               field: "id",   width: "60px",  align: "center" },
    { label: "Nome",             field: "nome" },
    {
        label: "Tipo de Cobrança",
        field: "tipoCobranca",
        width: "200px",
        render: (row) => <span>{row.tipoCobranca.nome}</span>,
    },
    {
        label: "Conta Financeira",
        field: "contaFinanceira",
        width: "200px",
        render: (row) => <span>{row.contaFinanceira.nome}</span>,
    },
    {
        label: "Status",
        field: "ativo",
        width: "100px",
        align: "center",
        render: (row) => (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${row.ativo ? "bg-(--success)" : "bg-(--danger)"}`}>
                {row.ativo ? "Ativo" : "Inativo"}
            </span>
        ),
    },
]

export default function FormaPagamentoFormList() {
    const { showMessage }                             = useMessage()
    const { ask }                                     = useQuestion()
    const [formKey,             setFormKey]           = useState(0)
    const [saving,              setSaving]            = useState(false)
    const [currentId,           setCurrentId]         = useState<number | null>(null)
    const [nome,                setNome]              = useState("")
    const [tipoCobrancaId,      setTipoCobrancaId]    = useState("")
    const [contaFinanceiraId,   setContaFinanceiraId] = useState("")
    const [ativo,               setAtivo]             = useState("true")
    const [data,                setData]              = useState<FormaPagamento[]>([])
    const [loading,             setLoading]           = useState(false)
    const [page,                setPage]              = useState(0)
    const [totalPages,          setTotalPages]        = useState(0)
    const [totalElements,       setTotalElements]     = useState(0)
    const pageSize = 15

    useEffect(() => {
        loadGrid()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page])

    async function loadGrid(pagina = page) {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: String(pagina),
                size: String(pageSize),
                sort: "nome",
            })
            const response = await api.get(`/financeiro/formas-pagamento?${params.toString()}`)
            setData(response.data.content)
            setTotalPages(response.data.totalPages)
            setTotalElements(response.data.totalElements)
        } catch {
            showMessage("error", "Erro ao carregar registros")
        } finally {
            setLoading(false)
        }
    }

    function handleClear() {
        setCurrentId(null)
        setNome("")
        setTipoCobrancaId("")
        setContaFinanceiraId("")
        setAtivo("true")
        setFormKey((prev) => prev + 1)
    }

    function handleEdit(row: FormaPagamento) {
        setCurrentId(row.id)
        setNome(row.nome)
        setTipoCobrancaId(String(row.tipoCobranca.id))
        setContaFinanceiraId(String(row.contaFinanceira.id))
        setAtivo(row.ativo ? "true" : "false")
        setFormKey((prev) => prev + 1)
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    async function handleSubmit(formData: Record<string, string>) {
        setSaving(true)
        try {
            const payload = {
                nome:             formData.nome,
                tipoCobrancaId:   Number(tipoCobrancaId),
                contaFinanceiraId: Number(contaFinanceiraId),
                ativo:            formData.ativo === "true",
            }

            if (currentId) {
                await api.patch(`/financeiro/formas-pagamento/${currentId}`, payload)
                showMessage("success", "Registro atualizado com sucesso!")
            } else {
                await api.post("/financeiro/formas-pagamento", payload)
                showMessage("success", "Registro cadastrado com sucesso!")
            }
            handleClear()
            loadGrid(0)
            setPage(0)
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao salvar registro")
            } else {
                showMessage("error", "Erro inesperado ao salvar registro")
            }
        } finally {
            setSaving(false)
        }
    }

    async function handleToggleAtivo(id: number, ativoAtual: boolean) {
        try {
            await api.patch(`/financeiro/formas-pagamento/${id}`, { ativo: !ativoAtual })
            showMessage("success", ativoAtual ? "Registro bloqueado!" : "Registro ativado!")
            loadGrid()
        } catch {
            showMessage("error", "Erro ao atualizar registro")
        }
    }

    return (
        <TPage title="Formas de Pagamento" breadcrumb={["Financeiro", "Auxiliares", "Formas de Pagamento"]}>
            <TForm key={formKey} onSubmit={handleSubmit}>
                <TRow>
                    <TCol>
                        <TEntry
                            name         ="nome"
                            label        ="Nome"
                            required
                            maxLength    ={150}
                            defaultValue ={nome}
                            width        ="50%"
                            minWidth     ="200px"
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TDbCombo
                            name         ="tipoCobrancaId"
                            label        ="Tipo de Cobrança"
                            url          ="/financeiro/tipos-cobranca/select"
                            valueField   ="id"
                            displayField ="nome"
                            value        ={tipoCobrancaId}
                            required
                            width        ="200px"
                            minWidth     ="200px"
                            onChange     ={(val) => setTipoCobrancaId(val)}
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
                            width        ="200px"
                            onChange     ={(val) => setContaFinanceiraId(val)}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TCombo
                            name         ="ativo"
                            label        ="Status"
                            width        ="200px"
                            defaultValue ={ativo}
                            options      ={[
                                { value: "true",  label: "Ativo"   },
                                { value: "false", label: "Inativo" },
                            ]}
                        />
                    </TCol>
                </TRow>

                <TFormFooter>
                    <TFormActionsLeft>
                        <TButton label="Limpar" variant="cancel" type="button" onClick={handleClear} />
                        <TButton label="Salvar" variant="save"   type="submit" loading={saving} />
                    </TFormActionsLeft>
                </TFormFooter>
            </TForm>

            <TDataGrid
                columns      ={columns}
                data         ={data}
                keyField     ="id"
                loading      ={loading}
                emptyMessage ="Nenhum registro encontrado"
                actionsWidth ="160px"
                actions      ={(row) => (
                    <>
                        <TButton
                            label   =""
                            variant ="edit"
                            onClick ={(e) => {
                                e?.stopPropagation()
                                handleEdit(row)
                            }}
                        />
                        <TButton
                            label   ={row.ativo ? "" : ""}
                            variant ={row.ativo ? "block" : "unblock"}
                            onClick ={(e) => {
                                e?.stopPropagation()
                                ask(
                                    `Deseja ${row.ativo ? "bloquear" : "ativar"} a forma "${row.nome}"?`,
                                    [
                                        { label: "Cancelar", variant: "cancel",  onClick: () => {} },
                                        {
                                            label:   row.ativo ? "Bloquear" : "Ativar",
                                            variant: row.ativo ? "block"    : "unblock",
                                            onClick: () => handleToggleAtivo(row.id, row.ativo),
                                        },
                                    ],
                                )
                            }}
                        />
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
