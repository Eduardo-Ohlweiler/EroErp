import { useState, useEffect }                                    from "react"
import { useNavigate }                                            from "react-router-dom"
import { api }                                                     from "../../services/api"
import type { FormulaLacteaResponse }                              from "../../types/Pediatria"
import type { TDataGridColumn }                                    from "../../types/TDataGridColumn"
import { TPage }                                                   from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TRow }                                                    from "../../components/trow"
import { TCol }                                                    from "../../components/tcol"
import { TEntry }                                                  from "../../components/tentry"
import { TButton }                                                 from "../../components/tbutton"
import { TDataGrid }                                               from "../../components/tdatagrid"
import { TDataGridFooter }                                         from "../../components/tdatagridfooter"
import { useMessage }                                              from "../../hooks/useMessage"
import { useQuestion }                                             from "../../hooks/useQuestion"

const columns: TDataGridColumn<FormulaLacteaResponse>[] = [
  { label: "Nome",
    render: (row) => (
      <span className="flex items-center gap-2">
        {row.nome}
        {row.global && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-(--accent-light) text-(--accent)">
            Sistema
          </span>
        )}
      </span>
    ) },
  { label: "Kcal / 100ml", width: "130px", align: "center",
    render: (row) => <span>{Number(row.kcalPor100ml).toFixed(1)}</span> },
  { label: "Proteína / 100ml", width: "150px", align: "center",
    render: (row) => <span>{Number(row.proteinaPor100ml).toFixed(1)} g</span> },
  { label: "Status", width: "90px", align: "center",
    render: (row) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${row.ativo ? "bg-green-500" : "bg-red-400"}`}>
        {row.ativo ? "Ativo" : "Inativo"}
      </span>
    ) },
]

export default function FormulaLacteaList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [filtroNome,    setFiltroNome]    = useState("")
  const [data,          setData]          = useState<FormulaLacteaResponse[]>([])
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
      const res = await api.get(`/formulas-lacteas?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar fórmulas lácteas")
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

  function handleExcluir(row: FormulaLacteaResponse) {
    ask(`Excluir a fórmula "${row.nome}"?`, [
      { label: "Cancelar", variant: "cancel",  onClick: () => {} },
      { label: "Excluir",  variant: "confirm", onClick: async () => {
        try {
          await api.delete(`/formulas-lacteas/${row.id}`)
          showMessage("success", "Fórmula excluída com sucesso!")
          load()
        } catch {
          showMessage("error", "Erro ao excluir fórmula")
        }
      }},
    ])
  }

  return (
    <TPage title="Fórmulas Lácteas" breadcrumb={["Pediatria", "Fórmulas Lácteas"]}>
      <TForm onSubmit={handleFiltrar}>
        <TRow>
          <TCol>
            <TEntry
              name        ="nome"
              label       ="Nome"
              placeholder ="Filtrar por nome..."
              width       ="50%"
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
            <TButton label="Nova Fórmula" variant="new" type="button"
              onClick={() => navigate("/pediatria/formulas-lacteas/novo")} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>

      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhuma fórmula encontrada"
        onRowClick   ={(row) => { if (!row.global) navigate(`/pediatria/formulas-lacteas/${row.id}`) }}
        actionsWidth ="100px"
        actions      ={(row) => (
          row.global
            ? <span className="text-xs text-(--text-muted)">Somente leitura</span>
            : (
              <>
                <TButton label="" variant="edit"
                  onClick={(e) => { e?.stopPropagation(); navigate(`/pediatria/formulas-lacteas/${row.id}`) }} />
                <TButton label="" variant="delete"
                  onClick={(e) => { e?.stopPropagation(); handleExcluir(row) }} />
              </>
            )
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
