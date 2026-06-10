import { useState, useEffect }                         from "react"
import { useNavigate }                                 from "react-router-dom"
import { api }                                         from "../../services/api"
import type { TemplateAnamnesesSummary }               from "../../types/Anamnese"
import type { TDataGridColumn }                        from "../../types/TDataGridColumn"
import { TPage }                                       from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormFooter }        from "../../components/tform"
import { TRow }                                        from "../../components/trow"
import { TCol }                                        from "../../components/tcol"
import { TEntry }                                      from "../../components/tentry"
import { TCombo }                                      from "../../components/tcombo"
import { TButton }                                     from "../../components/tbutton"
import { TDataGrid }                                   from "../../components/tdatagrid"
import { TDataGridFooter }                             from "../../components/tdatagridfooter"
import { useMessage }                                  from "../../hooks/useMessage"
import { FINALIDADE_LABEL, FINALIDADE_OPTIONS }        from "../../utils/anamnese"

const columns: TDataGridColumn<TemplateAnamnesesSummary>[] = [
  { label: "ID",          field: "id",         width: "60px",  align: "center" },
  { label: "Nome",        field: "nome" },
  { label: "Finalidade",  width: "150px",
    render: (row) => <span>{FINALIDADE_LABEL[row.finalidade]}</span> },
  { label: "Campos",      width: "80px",  align: "center",
    render: (row) => <span>{row.totalCampos}</span> },
  { label: "Ativo",       width: "80px",  align: "center",
    render: (row) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${row.ativo ? "bg-green-500" : "bg-red-400"}`}>
        {row.ativo ? "Sim" : "Não"}
      </span>
    )
  },
]

export default function TemplateAnamneseList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()

  const [filtroNome,      setFiltroNome]      = useState("")
  const [filtroFinalidade, setFiltroFinalidade] = useState("")
  const [data,            setData]            = useState<TemplateAnamnesesSummary[]>([])
  const [loading,         setLoading]         = useState(false)
  const [page,            setPage]            = useState(0)
  const [totalPages,      setTotalPages]      = useState(0)
  const [totalElements,   setTotalElements]   = useState(0)
  const pageSize = 15

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  async function load(
    nome       = filtroNome,
    finalidade = filtroFinalidade,
    pagina     = page
  ) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pagina), size: String(pageSize) })
      if (nome)       params.append("nome",       nome)
      if (finalidade) params.append("finalidade", finalidade)
      const res = await api.get(`/templates-anamnese?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar templates de anamnese")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    setFiltroNome(formData.nome ?? "")
    setFiltroFinalidade(formData.finalidade ?? "")
    setPage(0)
    load(formData.nome ?? "", formData.finalidade ?? "", 0)
  }

  function handleLimpar() {
    setFiltroNome("")
    setFiltroFinalidade("")
    setPage(0)
    load("", "", 0)
  }

  return (
    <TPage title="Templates de Anamnese" breadcrumb={["Clínica", "Templates de Anamnese"]}>
      <TForm onSubmit={handleFiltrar}>
        <TRow>
          <TCol>
            <TEntry
              name        ="nome"
              label       ="Nome"
              placeholder ="Filtrar por nome..."
              width       ="100%"
              defaultValue={filtroNome}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TCombo
              name        ="finalidade"
              label       ="Finalidade"
              width       ="100%"
              defaultValue={filtroFinalidade}
              options     ={[{ value: "", label: "Todas" }, ...FINALIDADE_OPTIONS]}
            />
          </TCol>
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton type="submit" label="Filtrar" />
            <TButton label="Limpar" variant="cancel" type="button" onClick={handleLimpar} />
            <TButton label="Novo Template" variant="new" type="button"
              onClick={() => navigate("/clinica/templates-anamnese/novo")} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhum template encontrado"
        onRowClick   ={(row) => navigate(`/clinica/templates-anamnese/${row.id}`)}
        actionsWidth ="80px"
        actions      ={(row) => (
          <TButton label="" variant="edit"
            onClick={(e) => { e?.stopPropagation(); navigate(`/clinica/templates-anamnese/${row.id}`) }} />
        )}
      />

      <TDataGridFooter
        page         ={page}
        totalPages   ={totalPages}
        totalElements={totalElements}
        pageSize     ={pageSize}
        onPageChange ={setPage}
      />
    </TPage>
  )
}
