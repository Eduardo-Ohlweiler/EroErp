import { useState, useEffect }                        from "react"
import { useNavigate }                                from "react-router-dom"
import { api }                                        from "../../services/api"
import type { PacoteContratadoResponse, StatusPacote } from "../../types/Pacote"
import type { TDataGridColumn }                       from "../../types/TDataGridColumn"
import { TPage }                                      from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormFooter }       from "../../components/tform"
import { TRow }                                       from "../../components/trow"
import { TCol }                                       from "../../components/tcol"
import { TEntry }                                     from "../../components/tentry"
import { TCombo }                                     from "../../components/tcombo"
import { TDbCombo }                                   from "../../components/tdbcombo"
import { TButton }                                    from "../../components/tbutton"
import { TDataGrid }                                  from "../../components/tdatagrid"
import { TDataGridFooter }                            from "../../components/tdatagridfooter"
import { TSpace }                                     from "../../components/tspace"
import { useMessage }                                 from "../../hooks/useMessage"
import { displayPessoa, formatarDocumento }           from "../../utils/pessoas"

const STATUS_LABEL: Record<StatusPacote, string> = {
  ATIVO:     "Ativo",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
}

const STATUS_COLOR: Record<StatusPacote, string> = {
  ATIVO:     "bg-blue-500",
  CONCLUIDO: "bg-green-500",
  CANCELADO: "bg-red-500",
}

function fmtMoeda(v: number) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const columns: TDataGridColumn<PacoteContratadoResponse>[] = [
  { label: "ID", field: "id", width: "60px", align: "center" },
  { label: "Paciente", field: "pessoaNome",
    render: (row) => (
      <span>
        {row.pessoaNome}
        {row.pessoaDocumento && <span className="ml-1 text-xs opacity-60">({formatarDocumento(row.pessoaDocumento)})</span>}
      </span>
    ),
  },
  { label: "Pacote", field: "nome" },
  { label: "Sessões", width: "110px", align: "center",
    render: (row) => <span>{row.sessoesUsadas}/{row.quantidadeSessoes}</span> },
  { label: "Valor", width: "130px", align: "right",
    render: (row) => <span>{fmtMoeda(row.valorTotal)}</span> },
  { label: "Status", width: "130px", align: "center",
    render: (row) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${STATUS_COLOR[row.status]}`}>
        {STATUS_LABEL[row.status]}
      </span>
    ),
  },
]

export default function PacoteList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()

  const [filtroPessoaId, setFiltroPessoaId] = useState("")
  const [filtroStatus,   setFiltroStatus]   = useState("")
  const [filtroNome,     setFiltroNome]     = useState("")
  const [data,           setData]           = useState<PacoteContratadoResponse[]>([])
  const [loading,        setLoading]        = useState(false)
  const [page,           setPage]           = useState(0)
  const [totalPages,     setTotalPages]     = useState(0)
  const [totalElements,  setTotalElements]  = useState(0)
  const pageSize = 15

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  async function load(
    pessoaId = filtroPessoaId,
    status   = filtroStatus,
    nome     = filtroNome,
    pagina   = page,
  ) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pagina), size: String(pageSize) })
      if (pessoaId) params.append("pessoaId", pessoaId)
      if (status)   params.append("status",   status)
      if (nome)     params.append("nome",     nome)

      const res = await api.get(`/pacotes?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar pacotes")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    setFiltroStatus(formData.status ?? "")
    setFiltroNome(formData.nome ?? "")
    setPage(0)
    load(filtroPessoaId, formData.status ?? "", formData.nome ?? "", 0)
  }

  function handleLimpar() {
    setFiltroPessoaId("")
    setFiltroStatus("")
    setFiltroNome("")
    setPage(0)
    load("", "", "", 0)
  }

  return (
    <TPage title="Pacotes de Sessões" breadcrumb={["Clínica", "Pacotes"]}>
      <TForm onSubmit={handleFiltrar}>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="pessoaId"
              label        ="Paciente"
              url          ="/pessoas/select"
              valueField   ="id"
              displayField ={displayPessoa}
              searchField  ="nome"
              placeholder  ="Todos..."
              width        ="100%"
              minWidth     ="200px"
              value        ={filtroPessoaId}
              onChange     ={(val) => setFiltroPessoaId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry
              name        ="nome"
              label       ="Nome do Pacote"
              placeholder ="Filtrar por nome..."
              width       ="100%"
              minWidth    ="200px"
              defaultValue={filtroNome}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TCombo
              name        ="status"
              label       ="Status"
              width       ="200px"
              defaultValue={filtroStatus}
              options     ={[
                { value: "",          label: "Todos"     },
                { value: "ATIVO",     label: "Ativo"     },
                { value: "CONCLUIDO", label: "Concluído" },
                { value: "CANCELADO", label: "Cancelado" },
              ]}
            />
          </TCol>
          <TSpace />
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton type="submit" label="Filtrar" />
            <TButton label="Limpar" variant="cancel" type="button" onClick={handleLimpar} />
            <TButton label="Contratar Pacote" variant="new" type="button"
              onClick={() => navigate("/clinica/pacotes/contratar")} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhum pacote encontrado"
        onRowClick   ={(row) => navigate(`/clinica/pacotes/${row.id}`)}
        actionsWidth ="80px"
        actions      ={(row) => (
          <TButton label="" variant="edit"
            onClick={(e) => { e?.stopPropagation(); navigate(`/clinica/pacotes/${row.id}`) }} />
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
