import { useNavigate }                                           from "react-router-dom"
import type { ModeloDocumento }                                  from "../../../types/ModeloDocumento"
import type { TDataGridColumn }                                  from "../../../types/TDataGridColumn"
import { useQuestion }                                           from "../../../hooks/useQuestion"
import { useMessage }                                            from "../../../hooks/useMessage"
import { useEffect, useState }                                   from "react"
import { api }                                                   from "../../../services/api"
import { TPage }                                                 from "../../../components/tpage"
import { TForm, TFormActionsLeft, TFormFooter }                  from "../../../components/tform"
import { TRow }                                                  from "../../../components/trow"
import { TCol }                                                  from "../../../components/tcol"
import { TEntry }                                                from "../../../components/tentry"
import { TButton }                                               from "../../../components/tbutton"
import { TCombo }                                                from "../../../components/tcombo"
import { TDataGrid }                                             from "../../../components/tdatagrid/index"
import { TDataGridFooter }                                       from "../../../components/tdatagridfooter"

const columns: TDataGridColumn<ModeloDocumento>[] = [
    { label: "ID",        field: "id",        width: "5%",  align: "center" },
    { label: "Nome",      field: "nome",       width: "35%", align: "left"   },
    {
        label: "Descrição",
        width: "40%",
        align: "left",
        render: (row) => row.descricao ?? "—",
    },
    {
        label: "Status",
        field: "ativo",
        width: "20%",
        align: "center",
        render: (row) => (
            <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium text-white
                    ${row.ativo ? "bg-(--success)" : "bg-(--danger)"}`}
            >
                {row.ativo ? "Ativo" : "Inativo"}
            </span>
        ),
    },
]

export default function ModeloDocumentoList() {

    const navigate                              = useNavigate()
    const { ask }                               = useQuestion()
    const { showMessage }                       = useMessage()

    const [data,         setData]               = useState<ModeloDocumento[]>([])
    const [loading,      setLoading]            = useState(false)
    const [page,         setPage]               = useState(0)
    const [totalPages,   setTotalPages]         = useState(0)
    const [totalElements, setTotalElements]     = useState(0)
    const [filtroNome,   setFiltroNome]         = useState("")
    const [filtroAtivo,  setFiltroAtivo]        = useState("")
    const [resetKey,     setResetKey]           = useState(0)

    const pageSize = 15

    useEffect(() => {
        load()
    }, [page]) // eslint-disable-line

    async function load(
        nome   = filtroNome,
        ativo  = filtroAtivo,
        pagina = page
    ) {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: String(pagina),
                size: String(pageSize),
                sort: "nome",
            })
            if (nome)  params.append("nome",  nome)
            if (ativo) params.append("ativo", ativo)

            const response = await api.get(`/modelos-documento?${params.toString()}`)
            setData(response.data.content      ?? [])
            setTotalPages(response.data.totalPages   ?? 1)
            setTotalElements(response.data.totalElements ?? 0)
        } catch {
            showMessage("error", "Erro ao carregar modelos de documento")
        } finally {
            setLoading(false)
        }
    }

    function handleFiltrar(formData: Record<string, string>) {
        const nome  = formData.nome  || ""
        const ativo = formData.ativo || ""

        setFiltroNome(nome)
        setFiltroAtivo(ativo)
        setPage(0)

        load(nome, ativo, 0)
    }

    function handleLimpar() {
        setFiltroNome("")
        setFiltroAtivo("")
        setResetKey((prev) => prev + 1)
        setPage(0)
        load("", "", 0)
    }

    async function handleToggleAtivo(id: number, ativoAtual: boolean) {
        try {
            await api.patch(`/modelos-documento/${id}`, { ativo: !ativoAtual })
            showMessage(
                "success",
                ativoAtual ? "Modelo desativado com sucesso" : "Modelo ativado com sucesso"
            )
            load()
        } catch {
            showMessage("error", "Erro ao atualizar status do modelo")
        }
    }

    return (
        <TPage
            title      ="Modelos de Documentos"
            breadcrumb ={["Documentos", "Modelos de Documentos"]}
        >
            <TForm
                key     ={resetKey}
                onSubmit={handleFiltrar}
            >
                <TRow>
                    <TCol>
                        <TEntry
                            name        ="nome"
                            label       ="Nome"
                            placeholder ="Filtrar por nome..."
                            defaultValue={filtroNome}
                            width       ="100%"
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TCombo
                            name        ="ativo"
                            label       ="Status"
                            width       ="200px"
                            options     ={[
                                { value: "true",  label: "Ativo"   },
                                { value: "false", label: "Inativo" },
                            ]}
                        />
                    </TCol>
                </TRow>
                <TFormFooter>
                    <TFormActionsLeft>
                        <TButton label="Filtrar" type="submit" />
                        <TButton
                            label  ="Novo"
                            variant="new"
                            type   ="button"
                            onClick={() => navigate("/documentos/modelos/novo")}
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
                    emptyMessage="Nenhum modelo de documento encontrado"
                    onRowClick  ={(row) => navigate(`/documentos/modelos/${row.id}`)}
                    actions={(row) => (
                        <>
                            <TButton
                                label  =""
                                variant="edit"
                                onClick={() => navigate(`/documentos/modelos/${row.id}`)}
                            />
                            <TButton
                                label  =""
                                variant={row.ativo ? "block" : "unblock"}
                                onClick={(e) => {
                                    e?.stopPropagation()
                                    ask(
                                        `Deseja ${row.ativo ? "desativar" : "ativar"} o modelo "${row.nome}"?`,
                                        [
                                            { label: "Cancelar", variant: "cancel",  onClick: () => {} },
                                            {
                                                label:   row.ativo ? "Desativar" : "Ativar",
                                                variant: row.ativo ? "block"     : "unblock",
                                                onClick: () => handleToggleAtivo(row.id, row.ativo),
                                            },
                                        ]
                                    )
                                }}
                            />
                        </>
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
