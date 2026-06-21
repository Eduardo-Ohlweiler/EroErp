import { useState, useEffect }                                    from "react"
import { useNavigate }                                            from "react-router-dom"
import { api }                                                     from "../../services/api"
import type { AudiometriaSummary, GrauPerda }                      from "../../types/Otorrino"
import type { TDataGridColumn }                                    from "../../types/TDataGridColumn"
import { TPage }                                                   from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TRow }                                                    from "../../components/trow"
import { TCol }                                                    from "../../components/tcol"
import { TEntry }                                                  from "../../components/tentry"
import { TDate }                                                   from "../../components/tdate"
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

const GRAU_LABEL: Record<GrauPerda, string> = {
  NORMAL:    "Normal",
  LEVE:      "Leve",
  MODERADA:  "Moderada",
  SEVERA:    "Severa",
  PROFUNDA:  "Profunda",
}

function corGrau(grau: GrauPerda | null): string {
  switch (grau) {
    case "NORMAL":   return "#22c55e"
    case "LEVE":     return "#3b82f6"
    case "MODERADA": return "#f59e0b"
    case "SEVERA":   return "#f97316"
    case "PROFUNDA": return "#ef4444"
    default:         return "#94a3b8"
  }
}

function GrauBadge({ grau }: { grau: GrauPerda | null }) {
  return (
    <span className="font-medium" style={{ color: corGrau(grau) }}>
      {grau ? GRAU_LABEL[grau] : "—"}
    </span>
  )
}

const columns: TDataGridColumn<AudiometriaSummary>[] = [
  { label: "Data", width: "110px",
    render: (row) => <span>{formatarData(row.dataExame)}</span> },
  { label: "Paciente", field: "pessoaNome" },
  { label: "Grau OD", width: "140px",
    render: (row) => <GrauBadge grau={row.grauOd} /> },
  { label: "Grau OE", width: "140px",
    render: (row) => <GrauBadge grau={row.grauOe} /> },
]

interface Filtros {
  nome:   string
  inicio: string
  fim:    string
}

export default function AudiometriaList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [filtroNome,    setFiltroNome]    = useState("")
  const [filtroInicio,  setFiltroInicio]  = useState("")
  const [filtroFim,     setFiltroFim]     = useState("")
  const [data,          setData]          = useState<AudiometriaSummary[]>([])
  const [loading,       setLoading]       = useState(false)
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 15

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  function currentFiltros(): Filtros {
    return { nome: filtroNome, inicio: filtroInicio, fim: filtroFim }
  }

  async function load(f: Filtros = currentFiltros(), pagina = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(pagina),
        size: String(pageSize),
      })
      if (f.nome)   params.append("nome",       f.nome)
      if (f.inicio) params.append("dataInicio", f.inicio)
      if (f.fim)    params.append("dataFim",     f.fim)
      const res = await api.get(`/otorrino/audiometrias?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar audiometrias")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    const nome   = formData.nome       ?? ""
    const inicio = formData.dataInicio ?? ""
    const fim    = formData.dataFim    ?? ""
    setFiltroNome(nome)
    setFiltroInicio(inicio)
    setFiltroFim(fim)
    setPage(0)
    load({ nome, inicio, fim }, 0)
  }

  function handleLimpar() {
    setFiltroNome("")
    setFiltroInicio("")
    setFiltroFim("")
    setPage(0)
    load({ nome: "", inicio: "", fim: "" }, 0)
  }

  function handleExcluir(row: AudiometriaSummary) {
    ask(`Excluir a audiometria de "${row.pessoaNome}" em ${formatarData(row.dataExame)}?`, [
      { label: "Cancelar", variant: "cancel",  onClick: () => {} },
      { label: "Excluir",  variant: "confirm", onClick: async () => {
        try {
          await api.delete(`/otorrino/audiometrias/${row.id}`)
          showMessage("success", "Audiometria excluída com sucesso!")
          load()
        } catch {
          showMessage("error", "Erro ao excluir audiometria")
        }
      }},
    ])
  }

  return (
    <TPage title="Audiometrias" breadcrumb={["Otorrinolaringologia", "Audiometrias"]}>
      <TForm onSubmit={handleFiltrar}>
        <TRow>
          <TCol flex={2}>
            <TEntry name="nome" label="Paciente" width="100%"
              placeholder="Filtrar por nome..." defaultValue={filtroNome} onChange={setFiltroNome} />
          </TCol>
          <TCol flex={1}>
            <TDate name="dataInicio" label="Data Inicial" defaultValue={filtroInicio} />
          </TCol>
          <TCol flex={1}>
            <TDate name="dataFim" label="Data Final" defaultValue={filtroFim} />
          </TCol>
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton type="submit" label="Filtrar" />
            <TButton label="Limpar" variant="cancel" type="button" onClick={handleLimpar} />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="Nova Audiometria" variant="new" type="button"
              onClick={() => navigate("/otorrino/audiometrias/nova")} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>

      <TDataGrid
        data        ={data}
        columns     ={columns}
        keyField    ="id"
        loading     ={loading}
        emptyMessage="Nenhuma audiometria encontrada"
        onRowClick  ={(row) => navigate(`/otorrino/audiometrias/${row.id}`)}
        actionsWidth="100px"
        actions     ={(row) => (
          <>
            <TButton label="" variant="edit"
              onClick={(e) => { e?.stopPropagation(); navigate(`/otorrino/audiometrias/${row.id}`) }} />
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
