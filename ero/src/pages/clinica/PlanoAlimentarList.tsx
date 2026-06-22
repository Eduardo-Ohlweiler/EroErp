import { useState, useEffect }                         from "react"
import { useNavigate }                                 from "react-router-dom"
import { api }                                         from "../../services/api"
import type { PlanoAlimentarSummary }                  from "../../types/PlanoAlimentar"
import type { TDataGridColumn }                        from "../../types/TDataGridColumn"
import { TPage }                                       from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TRow }                                        from "../../components/trow"
import { TCol }                                        from "../../components/tcol"
import { TEntry }                                      from "../../components/tentry"
import { TDbCombo }                                    from "../../components/tdbcombo"
import { TButton }                                     from "../../components/tbutton"
import { TDataGrid }                                   from "../../components/tdatagrid"
import { TDataGridFooter }                             from "../../components/tdatagridfooter"
import { useMessage }                                  from "../../hooks/useMessage"
import { useQuestion }                                 from "../../hooks/useQuestion"
import { displayPessoa }                               from "../../utils/pessoas"
import { formatarDataBR }                              from "../../utils/planoAlimentar"

const columns: TDataGridColumn<PlanoAlimentarSummary>[] = [
  { label: "Nome",        field: "nome" },
  { label: "Paciente",    field: "pessoaNome" },
  { label: "Data Início", width: "120px",
    render: (row) => <span>{formatarDataBR(row.dataInicio)}</span> },
  { label: "Data Fim",    width: "130px",
    render: (row) => <span>{row.dataFim ? formatarDataBR(row.dataFim) : "Em andamento"}</span> },
  { label: "Status",      width: "90px",  align: "center",
    render: (row) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${row.ativo ? "bg-green-500" : "bg-red-400"}`}>
        {row.ativo ? "Ativo" : "Inativo"}
      </span>
    )
  },
]

export default function PlanoAlimentarList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [filtroNome,    setFiltroNome]    = useState("")
  const [filtroPessoaId, setFiltroPessoaId] = useState("")
  const [data,          setData]          = useState<PlanoAlimentarSummary[]>([])
  const [loading,       setLoading]       = useState(false)
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 15

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  async function load(
    nome      = filtroNome,
    pessoaId  = filtroPessoaId,
    pagina    = page
  ) {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(pagina),
        size: String(pageSize),
        sort: "dataInicio,desc",
      })
      if (nome)     params.append("nome",     nome)
      if (pessoaId) params.append("pessoaId", pessoaId)
      const res = await api.get(`/planos-alimentares?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar planos alimentares")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    setFiltroNome(formData.nome ?? "")
    setPage(0)
    load(formData.nome ?? "", filtroPessoaId, 0)
  }

  function handleLimpar() {
    setFiltroNome("")
    setFiltroPessoaId("")
    setPage(0)
    load("", "", 0)
  }

  function handleExcluir(row: PlanoAlimentarSummary) {
    ask(`Excluir o plano alimentar "${row.nome}"?`, [
      { label: "Cancelar", variant: "cancel",  onClick: () => {} },
      { label: "Excluir",  variant: "confirm", onClick: async () => {
        try {
          await api.delete(`/planos-alimentares/${row.id}`)
          showMessage("success", "Plano alimentar excluído com sucesso!")
          load()
        } catch {
          showMessage("error", "Erro ao excluir plano alimentar")
        }
      }},
    ])
  }

  return (
    <TPage title="Planos Alimentares" breadcrumb={["Clínica", "Planos Alimentares"]}>
      <TForm onSubmit={handleFiltrar}>
        <TRow>
          <TCol>
            <TEntry
              name        ="nome"
              label       ="Nome"
              placeholder ="Filtrar por nome..."
              width       ="50%"
              minWidth    ="200px"
              defaultValue={filtroNome}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="pessoaId"
              label        ="Paciente"
              url          ="/pessoas/select"
              valueField   ="id"
              displayField ={displayPessoa}
              searchField  ="nome"
              placeholder  ="Filtrar por paciente..."
              width        ="50%"
              minWidth     ="200px"
              value        ={filtroPessoaId}
              onChange     ={(val) => {
                setFiltroPessoaId(val)
                setPage(0)
                load(filtroNome, val, 0)
              }}
            />
          </TCol>
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton type="submit" label="Filtrar" />
            <TButton label="Limpar" variant="cancel" type="button" onClick={handleLimpar} />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="Novo Plano" variant="new" type="button"
              onClick={() => navigate("/clinica/planos-alimentares/novo")} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>

      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhum plano alimentar encontrado"
        onRowClick   ={(row) => navigate(`/clinica/planos-alimentares/${row.id}`)}
        actionsWidth ="100px"
        actions      ={(row) => (
          <>
            <TButton label="" variant="edit"
              onClick={(e) => { e?.stopPropagation(); navigate(`/clinica/planos-alimentares/${row.id}`) }} />
            <TButton label="" variant="delete"
              onClick={(e) => { e?.stopPropagation(); handleExcluir(row) }} />
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
    </TPage>
  )
}
