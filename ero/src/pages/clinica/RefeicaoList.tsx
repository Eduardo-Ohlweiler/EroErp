import { useState, useEffect }                         from "react"
import { useNavigate }                                 from "react-router-dom"
import { api }                                         from "../../services/api"
import type { RefeicaoSummary }                        from "../../types/PlanoAlimentar"
import type { TDataGridColumn }                        from "../../types/TDataGridColumn"
import { TPage }                                       from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TRow }                                        from "../../components/trow"
import { TCol }                                        from "../../components/tcol"
import { TEntry }                                      from "../../components/tentry"
import { TButton }                                     from "../../components/tbutton"
import { TDataGrid }                                   from "../../components/tdatagrid"
import { TDataGridFooter }                             from "../../components/tdatagridfooter"
import { useMessage }                                  from "../../hooks/useMessage"
import { useQuestion }                                 from "../../hooks/useQuestion"

const columns: TDataGridColumn<RefeicaoSummary>[] = [
  { label: "ID",        field: "id",   width: "60px",  align: "center" },
  { label: "Nome",      field: "nome" },
  { label: "Descrição", width: "320px",
    render: (row) => {
      const desc = row.descricao ?? ""
      return <span>{desc.length > 60 ? desc.substring(0, 60) + "..." : desc || "—"}</span>
    }
  },
  { label: "Status",    width: "90px",  align: "center",
    render: (row) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${row.ativo ? "bg-green-500" : "bg-red-400"}`}>
        {row.ativo ? "Ativo" : "Inativo"}
      </span>
    )
  },
]

export default function RefeicaoList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [filtroNome,    setFiltroNome]    = useState("")
  const [data,          setData]          = useState<RefeicaoSummary[]>([])
  const [loading,       setLoading]       = useState(false)
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 15

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  async function load(nome = filtroNome, pagina = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pagina), size: String(pageSize), sort: "nome" })
      if (nome) params.append("nome", nome)
      const res = await api.get(`/refeicoes?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar refeições")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    setFiltroNome(formData.nome ?? "")
    setPage(0)
    load(formData.nome ?? "", 0)
  }

  function handleLimpar() {
    setFiltroNome("")
    setPage(0)
    load("", 0)
  }

  function handleExcluir(row: RefeicaoSummary) {
    ask(`Excluir a refeição "${row.nome}"?`, [
      { label: "Cancelar", variant: "cancel",  onClick: () => {} },
      { label: "Excluir",  variant: "confirm", onClick: async () => {
        try {
          await api.delete(`/refeicoes/${row.id}`)
          showMessage("success", "Refeição excluída com sucesso!")
          load()
        } catch {
          showMessage("error", "Erro ao excluir refeição")
        }
      }},
    ])
  }

  return (
    <TPage title="Refeições" breadcrumb={["Clínica", "Auxiliar Clínica", "Refeições"]}>
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
        <TFormFooter>
          <TFormActionsLeft>
            <TButton type="submit" label="Filtrar" />
            <TButton label="Limpar" variant="cancel" type="button" onClick={handleLimpar} />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="Nova Refeição" variant="new" type="button"
              onClick={() => navigate("/clinica/refeicoes/nova")} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>

      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhuma refeição encontrada"
        onRowClick   ={(row) => navigate(`/clinica/refeicoes/${row.id}`)}
        actionsWidth ="100px"
        actions      ={(row) => (
          <>
            <TButton label="" variant="edit"
              onClick={(e) => { e?.stopPropagation(); navigate(`/clinica/refeicoes/${row.id}`) }} />
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
