import { useState, useEffect }                                    from "react"
import { useNavigate }                                            from "react-router-dom"
import { api }                                                     from "../../services/api"
import type { QuestionarioAplicadoSummary }                        from "../../types/Otorrino"
import type { TDataGridColumn }                                    from "../../types/TDataGridColumn"
import { TPage }                                                   from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TRow }                                                    from "../../components/trow"
import { TCol }                                                    from "../../components/tcol"
import { TEntry }                                                  from "../../components/tentry"
import { TCombo }                                                  from "../../components/tcombo"
import { TButton }                                                 from "../../components/tbutton"
import { TDataGrid }                                               from "../../components/tdatagrid"
import { TDataGridFooter }                                         from "../../components/tdatagridfooter"
import { useMessage }                                              from "../../hooks/useMessage"
import { useQuestion }                                             from "../../hooks/useQuestion"

function formatarData(iso: string): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

const ESCALA_OPTIONS = [
  { value: "THI",     label: "THI — Tinnitus Handicap Inventory" },
  { value: "DHI",     label: "DHI — Dizziness Handicap Inventory" },
  { value: "SNOT22",  label: "SNOT-22 — Sinonasal Outcome Test" },
  { value: "EPWORTH", label: "Epworth — Sonolência diurna" },
  { value: "NOSE",    label: "NOSE — Obstrução nasal" },
]

// badge de classificação — cor neutra de destaque (texto varia conforme o backend)
function ClassificacaoBadge({ texto }: { texto: string | null }) {
  if (!texto) return <span className="text-(--text-muted)">—</span>
  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium bg-(--accent-light) text-(--accent)">
      {texto}
    </span>
  )
}

const columns: TDataGridColumn<QuestionarioAplicadoSummary>[] = [
  { label: "Data", width: "110px",
    render: (row) => <span>{formatarData(row.dataAplicacao)}</span> },
  { label: "Paciente", field: "pessoaNome" },
  { label: "Escala", field: "questionarioNome" },
  { label: "Score", width: "90px", align: "center",
    render: (row) => <span className="font-semibold text-(--text-primary)">{row.scoreTotal ?? "—"}</span> },
  { label: "Classificação", width: "200px",
    render: (row) => <ClassificacaoBadge texto={row.classificacao} /> },
]

interface Filtros {
  nome:   string
  codigo: string
}

export default function QuestionarioAplicadoList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [filtroNome,    setFiltroNome]    = useState("")
  const [filtroCodigo,  setFiltroCodigo]  = useState("")
  const [data,          setData]          = useState<QuestionarioAplicadoSummary[]>([])
  const [loading,       setLoading]       = useState(false)
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 15

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  function currentFiltros(): Filtros {
    return { nome: filtroNome, codigo: filtroCodigo }
  }

  async function load(f: Filtros = currentFiltros(), pagina = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(pagina),
        size: String(pageSize),
      })
      if (f.nome)   params.append("nome",   f.nome)
      if (f.codigo) params.append("codigo", f.codigo)
      const res = await api.get(`/otorrino/questionarios-aplicados?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar escalas aplicadas")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    const nome   = formData.nome   ?? ""
    const codigo = formData.codigo ?? ""
    setFiltroNome(nome)
    setFiltroCodigo(codigo)
    setPage(0)
    load({ nome, codigo }, 0)
  }

  function handleLimpar() {
    setFiltroNome("")
    setFiltroCodigo("")
    setPage(0)
    load({ nome: "", codigo: "" }, 0)
  }

  function handleExcluir(row: QuestionarioAplicadoSummary) {
    ask(`Excluir a aplicação de "${row.questionarioNome}" para "${row.pessoaNome}"?`, [
      { label: "Cancelar", variant: "cancel",  onClick: () => {} },
      { label: "Excluir",  variant: "confirm", onClick: async () => {
        try {
          await api.delete(`/otorrino/questionarios-aplicados/${row.id}`)
          showMessage("success", "Aplicação excluída com sucesso!")
          load()
        } catch {
          showMessage("error", "Erro ao excluir aplicação")
        }
      }},
    ])
  }

  return (
    <TPage title="Escalas e Questionários" breadcrumb={["Otorrinolaringologia", "Escalas e Questionários"]}>
      <TForm onSubmit={handleFiltrar}>
        <TRow>
          <TCol flex={2}>
            <TEntry name="nome" label="Paciente" width="50%" minWidth="200px"
              placeholder="Filtrar por nome..." defaultValue={filtroNome} onChange={setFiltroNome} />
          </TCol>
        </TRow>
        <TRow>
          <TCol flex={2}>
            <TCombo name="codigo" label="Escala" width="50%" minWidth="200px"
              options={ESCALA_OPTIONS} placeholder="Todas as escalas"
              defaultValue={filtroCodigo} onChange={setFiltroCodigo} />
          </TCol>
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton type="submit" label="Filtrar" />
            <TButton label="Limpar" variant="cancel" type="button" onClick={handleLimpar} />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="Aplicar Escala" variant="new" type="button"
              onClick={() => navigate("/otorrino/escalas/nova")} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>

      <TDataGrid
        data        ={data}
        columns     ={columns}
        keyField    ="id"
        loading     ={loading}
        emptyMessage="Nenhuma escala aplicada encontrada"
        onRowClick  ={(row) => navigate(`/otorrino/escalas/${row.id}`)}
        actionsWidth="100px"
        actions     ={(row) => (
          <>
            <TButton label="" variant="edit"
              onClick={(e) => { e?.stopPropagation(); navigate(`/otorrino/escalas/${row.id}`) }} />
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
