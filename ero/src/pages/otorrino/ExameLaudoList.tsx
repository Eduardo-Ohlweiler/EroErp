import { useState, useEffect }                                    from "react"
import { useNavigate }                                            from "react-router-dom"
import { api }                                                     from "../../services/api"
import type { ExameLaudoSummary }                                 from "../../types/Otorrino"
import type { TDataGridColumn }                                    from "../../types/TDataGridColumn"
import { TPage }                                                   from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TRow }                                                    from "../../components/trow"
import { TCol }                                                    from "../../components/tcol"
import { TEntry }                                                  from "../../components/tentry"
import { TCombo }                                                  from "../../components/tcombo"
import { TDate }                                                   from "../../components/tdate"
import { TButton }                                                 from "../../components/tbutton"
import { TDataGrid }                                               from "../../components/tdatagrid"
import { TDataGridFooter }                                         from "../../components/tdatagridfooter"
import { useMessage }                                              from "../../hooks/useMessage"
import { useQuestion }                                             from "../../hooks/useQuestion"
import { TSpace } from "../../components/tspace"
import { TIPO_EXAME_LABEL } from "./exameLaudo.constants"

function formatarData(iso: string): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

const TIPO_OPTIONS = [
  { value: "",                   label: "Todos os tipos" },
  { value: "NASOFIBROSCOPIA",    label: "Nasofibroscopia" },
  { value: "LARINGOSCOPIA",      label: "Laringoscopia" },
  { value: "VIDEOLARINGOSCOPIA", label: "Videolaringoscopia" },
  { value: "RINOSCOPIA",         label: "Rinoscopia" },
  { value: "OUTRO",              label: "Outro" },
]

const columns: TDataGridColumn<ExameLaudoSummary>[] = [
  { label: "Data", width: "110px",
    render: (row) => <span>{formatarData(row.dataExame)}</span> },
  { label: "Paciente", field: "pessoaNome" },
  { label: "Tipo", width: "200px",
    render: (row) => <span>{TIPO_EXAME_LABEL[row.tipoExame] ?? row.tipoExame}</span> },
]

interface Filtros {
  nome:   string
  tipo:   string
  inicio: string
  fim:    string
}

export default function ExameLaudoList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [filtroNome,    setFiltroNome]    = useState("")
  const [filtroTipo,    setFiltroTipo]    = useState("")
  const [filtroInicio,  setFiltroInicio]  = useState("")
  const [filtroFim,     setFiltroFim]     = useState("")
  const [data,          setData]          = useState<ExameLaudoSummary[]>([])
  const [loading,       setLoading]       = useState(false)
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 15

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  function currentFiltros(): Filtros {
    return { nome: filtroNome, tipo: filtroTipo, inicio: filtroInicio, fim: filtroFim }
  }

  async function load(f: Filtros = currentFiltros(), pagina = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(pagina),
        size: String(pageSize),
      })
      if (f.nome)   params.append("nome",       f.nome)
      if (f.tipo)   params.append("tipoExame",  f.tipo)
      if (f.inicio) params.append("dataInicio", f.inicio)
      if (f.fim)    params.append("dataFim",     f.fim)
      const res = await api.get(`/otorrino/exames-laudo?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar laudos")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    const nome   = formData.nome       ?? ""
    const tipo   = formData.tipoExame  ?? ""
    const inicio = formData.dataInicio ?? ""
    const fim    = formData.dataFim    ?? ""
    setFiltroNome(nome)
    setFiltroTipo(tipo)
    setFiltroInicio(inicio)
    setFiltroFim(fim)
    setPage(0)
    load({ nome, tipo, inicio, fim }, 0)
  }

  function handleLimpar() {
    setFiltroNome("")
    setFiltroTipo("")
    setFiltroInicio("")
    setFiltroFim("")
    setPage(0)
    load({ nome: "", tipo: "", inicio: "", fim: "" }, 0)
  }

  function handleExcluir(row: ExameLaudoSummary) {
    ask(`Excluir o laudo de "${row.pessoaNome}" em ${formatarData(row.dataExame)}?`, [
      { label: "Cancelar", variant: "cancel",  onClick: () => {} },
      { label: "Excluir",  variant: "confirm", onClick: async () => {
        try {
          await api.delete(`/otorrino/exames-laudo/${row.id}`)
          showMessage("success", "Laudo excluído com sucesso!")
          load()
        } catch {
          showMessage("error", "Erro ao excluir laudo")
        }
      }},
    ])
  }

  return (
    <TPage title="Laudos Descritivos" breadcrumb={["Otorrinolaringologia", "Laudos"]}>
      <TForm onSubmit={handleFiltrar}>
        <TRow>
          <TCol flex={2}>
            <TEntry name="nome" label="Paciente" width="100%"
              placeholder="Filtrar por nome..." defaultValue={filtroNome} onChange={setFiltroNome} />
          </TCol>
        </TRow>
        <TRow>
          <TCol flex={1}>
            <TCombo name="tipoExame" label="Tipo de Exame" width="100%"
              options={TIPO_OPTIONS} defaultValue={filtroTipo} onChange={setFiltroTipo} />
          </TCol>
        </TRow>
        <TRow>
          <TCol flex={1}>
            <TDate name="dataInicio" label="Data Inicial" defaultValue={filtroInicio} />
          </TCol>
          <TCol flex={1}>
            <TDate name="dataFim" label="Data Final" defaultValue={filtroFim} />
          </TCol>
          <TSpace />
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton type="submit" label="Filtrar" />
            <TButton label="Limpar" variant="cancel" type="button" onClick={handleLimpar} />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="Novo Laudo" variant="new" type="button"
              onClick={() => navigate("/otorrino/laudos/novo")} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>

      <TDataGrid
        data        ={data}
        columns     ={columns}
        keyField    ="id"
        loading     ={loading}
        emptyMessage="Nenhum laudo encontrado"
        onRowClick  ={(row) => navigate(`/otorrino/laudos/${row.id}`)}
        actionsWidth="100px"
        actions     ={(row) => (
          <>
            <TButton label="" variant="edit"
              onClick={(e) => { e?.stopPropagation(); navigate(`/otorrino/laudos/${row.id}`) }} />
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
