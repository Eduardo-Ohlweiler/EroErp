import { useNavigate }                                           from "react-router-dom"
import type { Documento }                                        from "../../types/Documento"
import type { TDataGridColumn }                                  from "../../types/TDataGridColumn"
import { useMessage }                                            from "../../hooks/useMessage"
import { useEffect, useState }                                   from "react"
import { api }                                                   from "../../services/api"
import { TPage }                                                 from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormFooter }                  from "../../components/tform"
import { TRow }                                                  from "../../components/trow"
import { TCol }                                                  from "../../components/tcol"
import { TEntry }                                                from "../../components/tentry"
import { TButton }                                               from "../../components/tbutton"
import { TCombo }                                                from "../../components/tcombo"
import { TDate }                                                 from "../../components/tdate"
import { TDataGrid }                                             from "../../components/tdatagrid/index"
import { TDataGridFooter }                                       from "../../components/tdatagridfooter"
import { TSpace }                                                from "../../components/tspace"

function formatarData(iso: string): string {
    if (!iso) return "—"
    const partes = iso.split("T")[0].split("-")
    if (partes.length !== 3) return iso
    return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function formatarMoeda(valor?: number): string {
    if (valor == null) return "—"
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function badgeStatus(status: Documento["status"]) {
    const map: Record<Documento["status"], { label: string; cls: string }> = {
        RASCUNHO:  { label: "Rascunho",  cls: "bg-(--metal-300) text-(--text-primary)" },
        EMITIDO:   { label: "Emitido",   cls: "bg-(--success) text-white"              },
        CANCELADO: { label: "Cancelado", cls: "bg-(--danger) text-white"               },
    }
    const item = map[status] ?? { label: status, cls: "bg-(--metal-300) text-(--text-primary)" }
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.cls}`}>
            {item.label}
        </span>
    )
}

const columns: TDataGridColumn<Documento>[] = [
    { label: "ID",        field: "id",                  width: "5%",  align: "center" },
    { label: "Modelo",    field: "modeloDocumentoNome", width: "20%", align: "left"   },
    { label: "Cliente",   field: "clientePessoaNome",   width: "25%", align: "left"   },
    { label: "Emitente",  field: "emitenteNome",        width: "20%", align: "left"   },
    {
        label: "Data",
        width: "10%",
        align: "center",
        render: (row) => formatarData(row.dataEmissao),
    },
    {
        label: "Valor Final",
        width: "12%",
        align: "right",
        render: (row) => formatarMoeda(row.valorFinal),
    },
    {
        label: "Status",
        width: "8%",
        align: "center",
        render: (row) => badgeStatus(row.status),
    },
]

export default function DocumentoList() {

    const navigate                              = useNavigate()
    const { showMessage }                       = useMessage()

    const [data,              setData]          = useState<Documento[]>([])
    const [loading,           setLoading]       = useState(false)
    const [page,              setPage]          = useState(0)
    const [totalPages,        setTotalPages]    = useState(0)
    const [totalElements,     setTotalElements] = useState(0)
    const [filtroCliente,     setFiltroCliente] = useState("")
    const [filtroStatus,      setFiltroStatus]  = useState("")
    const [filtroDataInicio,  setFiltroDataInicio] = useState("")
    const [filtroDataFim,     setFiltroDataFim]    = useState("")
    const [resetKey,          setResetKey]      = useState(0)

    const pageSize = 15

    useEffect(() => {
        load()
    }, [page]) // eslint-disable-line

    async function load(
        clientePessoaNome = filtroCliente,
        status            = filtroStatus,
        dataEmissaoInicio = filtroDataInicio,
        dataEmissaoFim    = filtroDataFim,
        pagina            = page
    ) {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: String(pagina),
                size: String(pageSize),
                sort: "dataEmissao,desc",
            })
            if (clientePessoaNome) params.append("clientePessoaNome", clientePessoaNome)
            if (status)            params.append("status",            status)
            if (dataEmissaoInicio) params.append("dataEmissaoInicio", dataEmissaoInicio)
            if (dataEmissaoFim)    params.append("dataEmissaoFim",    dataEmissaoFim)

            const response = await api.get(`/documentos?${params.toString()}`)
            setData(response.data.content         ?? [])
            setTotalPages(response.data.totalPages     ?? 1)
            setTotalElements(response.data.totalElements ?? 0)
        } catch {
            showMessage("error", "Erro ao carregar documentos")
        } finally {
            setLoading(false)
        }
    }

    function handleFiltrar(formData: Record<string, string>) {
        const clientePessoaNome = formData.clientePessoaNome || ""
        const status            = formData.status            || ""
        const dataEmissaoInicio = filtroDataInicio           || ""
        const dataEmissaoFim    = filtroDataFim              || ""

        setFiltroCliente(clientePessoaNome)
        setFiltroStatus(status)
        setPage(0)

        load(clientePessoaNome, status, dataEmissaoInicio, dataEmissaoFim, 0)
    }

    function handleLimpar() {
        setFiltroCliente("")
        setFiltroStatus("")
        setFiltroDataInicio("")
        setFiltroDataFim("")
        setResetKey((prev) => prev + 1)
        setPage(0)
        load("", "", "", "", 0)
    }

    return (
        <TPage
            title     ="Documentos"
            breadcrumb={["Documentos", "Documentos"]}
        >
            <TForm
                key     ={resetKey}
                onSubmit={handleFiltrar}
            >
                <TRow>
                    <TCol>
                        <TEntry
                            name        ="clientePessoaNome"
                            label       ="Cliente"
                            placeholder ="Filtrar por cliente..."
                            defaultValue={filtroCliente}
                            width       ="100%"
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TCombo
                            name        ="status"
                            label       ="Status"
                            width       ="200px"
                            options     ={[
                                { value: "RASCUNHO",  label: "Rascunho"  },
                                { value: "EMITIDO",   label: "Emitido"   },
                                { value: "CANCELADO", label: "Cancelado" },
                            ]}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TDate
                            name        ="dataEmissaoInicio"
                            label       ="Data emissão de"
                            width       ="160px"
                            defaultValue={filtroDataInicio}
                            onChange    ={setFiltroDataInicio}
                        />
                    </TCol>
                    <TCol>
                        <TDate
                            name        ="dataEmissaoFim"
                            label       ="Data emissão até"
                            width       ="160px"
                            defaultValue={filtroDataFim}
                            onChange    ={setFiltroDataFim}
                        />
                    </TCol>
                    <TSpace />
                </TRow>
                <TFormFooter>
                    <TFormActionsLeft>
                        <TButton label="Filtrar" type="submit" />
                        <TButton
                            label  ="Novo"
                            variant="new"
                            type   ="button"
                            onClick={() => navigate("/documentos/novo")}
                        />
                        <TButton
                            label  ="Limpar"
                            variant="cancel"
                            type   ="button"
                            onClick={handleLimpar}
                        />
                    </TFormActionsLeft>
                </TFormFooter>

                <TDataGrid
                    columns     ={columns}
                    data        ={data}
                    keyField    ="id"
                    loading     ={loading}
                    emptyMessage="Nenhum documento encontrado"
                    onRowClick  ={(row) => navigate(`/documentos/${row.id}`)}
                    actions={(row) => (
                        <TButton
                            label  =""
                            variant="edit"
                            onClick={() => navigate(`/documentos/${row.id}`)}
                        />
                    )}
                />
                <TDataGridFooter
                    page         ={page}
                    totalPages   ={totalPages}
                    totalElements={totalElements}
                    pageSize     ={pageSize}
                    onPageChange ={setPage}
                />
            </TForm>
        </TPage>
    )
}
