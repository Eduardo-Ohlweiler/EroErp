import { useState, useEffect }                        from "react"
import { useNavigate }                                from "react-router-dom"
import { api }                                        from "../../services/api"
import type { PedidoResponse, StatusPedido, TipoPedidoSummary } from "../../types/Pedido"
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
import { TDate }                                      from "../../components/tdate"
import { useMessage }                                 from "../../hooks/useMessage"
import { TSpace }                                     from "../../components/tspace"
import { displayEmitente, formatarDocumento }         from "../../utils/pessoas"

const STATUS_LABEL: Record<StatusPedido, string> = {
  ABERTO:            "Aberto",
  CONCLUIDO:         "Concluído",
  CANCELADO:         "Cancelado",
  DEVOLVIDO:         "Devolvido",
  DEVOLVIDO_PARCIAL: "Parc. devolvido",
}

const STATUS_COLOR: Record<StatusPedido, string> = {
  ABERTO:            "bg-blue-500",
  CONCLUIDO:         "bg-green-500",
  CANCELADO:         "bg-red-500",
  DEVOLVIDO:         "bg-orange-500",
  DEVOLVIDO_PARCIAL: "bg-amber-500",
}

function formatData(iso: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`
}

const columns: TDataGridColumn<PedidoResponse>[] = [
  { label: "ID",          field: "id",          width: "60px",  align: "center" },
  { label: "Data Pedido",  width: "120px",
    render: (row) => <span>{formatData(row.dataPedido)}</span> },
  { label: "Entrega",     width: "120px",
    render: (row) => <span>{formatData(row.dataEntrega)}</span> },
  { label: "Pessoa", field: "pessoaNome",
    render: (row) => <span>{row.pessoaNome}{row.pessoaDocumento && <span className="ml-1 text-xs opacity-60">({formatarDocumento(row.pessoaDocumento)})</span>}</span> },
  { label: "Emitente", field: "emitenteNome",
    render: (row) => <span>{row.emitenteNome}{row.emitenteDocumento && <span className="ml-1 text-xs opacity-60">({formatarDocumento(row.emitenteDocumento)})</span>}</span> },
  { label: "Tipo de Pedido", field: "tipoPedidoNome", width: "150px" },
  { label: "Produtos",  width: "80px", align: "center",
    render: (row) => <span>{row.produtos?.length ?? 0}</span> },
  { label: "Status",    width: "120px", align: "center",
    render: (row) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${STATUS_COLOR[row.status]}`}>
        {STATUS_LABEL[row.status]}
      </span>
    )
  },
  { label: "Faturamento", width: "120px", align: "center",
    render: (row) => row.status === "CONCLUIDO"
      ? (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${row.faturado ? "bg-green-600" : "bg-amber-500"}`}>
          {row.faturado ? "Faturado" : "Pendente"}
        </span>
      )
      : <span className="text-(--text-muted)">—</span>
  },
]

export default function VendaPdvList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()

  const [filtroNomePessoa, setFiltroNomePessoa] = useState("")
  const [filtroEmitenteId, setFiltroEmitenteId] = useState("")
  const [filtroTipoPedido, setFiltroTipoPedido] = useState("")
  const [filtroStatus,     setFiltroStatus]     = useState("")
  const [filtroFaturado,   setFiltroFaturado]   = useState("")
  const [filtroInicio,     setFiltroInicio]     = useState("")
  const [filtroFim,        setFiltroFim]        = useState("")
  const [tiposPedido,      setTiposPedido]      = useState<TipoPedidoSummary[]>([])
  const [data,             setData]             = useState<PedidoResponse[]>([])
  const [loading,          setLoading]          = useState(false)
  const [page,             setPage]             = useState(0)
  const [totalPages,       setTotalPages]       = useState(0)
  const [totalElements,    setTotalElements]    = useState(0)
  const pageSize = 15

  useEffect(() => {
    api.get<TipoPedidoSummary[]>("/tipos-pedido/ativos")
      .then(r => setTiposPedido(r.data))
      .catch(() => {})
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  async function load(
    nomePessoa = filtroNomePessoa,
    emitenteId = filtroEmitenteId,
    tipoPedido = filtroTipoPedido,
    status     = filtroStatus,
    inicio     = filtroInicio,
    fim        = filtroFim,
    pagina     = page,
    faturado   = filtroFaturado
  ) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pagina), size: String(pageSize) })
      if (nomePessoa) params.append("nomePessoa",   nomePessoa)
      if (emitenteId) params.append("emitenteId",   emitenteId)
      if (tipoPedido) params.append("tipoPedidoId", tipoPedido)
      if (status)     params.append("status",       status)
      if (faturado)   params.append("faturado",     faturado)
      if (inicio)     params.append("inicio",       `${inicio}T00:00:00`)
      if (fim)        params.append("fim",          `${fim}T23:59:59`)

      const res = await api.get(`/pedidos?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar pedidos")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    setFiltroNomePessoa(formData.nomePessoa ?? "")
    setFiltroTipoPedido(formData.tipoPedidoId ?? "")
    setFiltroStatus(formData.status ?? "")
    setFiltroFaturado(formData.faturado ?? "")
    setFiltroInicio(formData.inicio ?? "")
    setFiltroFim(formData.fim ?? "")
    setPage(0)
    load(
      formData.nomePessoa,
      filtroEmitenteId,
      formData.tipoPedidoId,
      formData.status,
      formData.inicio,
      formData.fim,
      0,
      formData.faturado
    )
  }

  function handleLimpar() {
    setFiltroNomePessoa("")
    setFiltroEmitenteId("")
    setFiltroTipoPedido("")
    setFiltroStatus("")
    setFiltroFaturado("")
    setFiltroInicio("")
    setFiltroFim("")
    setPage(0)
    load("", "", "", "", "", "", 0, "")
  }

  return (
    <TPage title="Venda PDV" breadcrumb={["Pedidos", "Venda PDV"]}>
      <TForm onSubmit={handleFiltrar}>
        <TRow>
          <TCol>
            <TEntry
              name        ="nomePessoa"
              label       ="Pessoa"
              placeholder ="Filtrar por nome..."
              width       ="50%"
              minWidth    ="200px"
              defaultValue={filtroNomePessoa}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="emitenteId"
              label        ="Emitente"
              url          ="/emitentes/select"
              valueField   ="id"
              displayField ={displayEmitente}
              searchField  ="nome"
              placeholder  ="Todos..."
              width        ="50%"
              minWidth     ="200px"
              value        ={filtroEmitenteId}
              onChange     ={(val) => setFiltroEmitenteId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TCombo
              name        ="tipoPedidoId"
              label       ="Tipo de Pedido"
              width       ="200px"
              defaultValue={filtroTipoPedido}
              options     ={[
                { value: "", label: "Todos" },
                ...tiposPedido.map(t => ({ value: String(t.id), label: t.nome })),
              ]}
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
                { value: "",                  label: "Todos"                  },
                { value: "ABERTO",            label: "Aberto"                 },
                { value: "CONCLUIDO",         label: "Concluído"              },
                { value: "CANCELADO",         label: "Cancelado"              },
                { value: "DEVOLVIDO",         label: "Devolvido"              },
                { value: "DEVOLVIDO_PARCIAL", label: "Parcialmente devolvido" },
              ]}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TCombo
              name        ="faturado"
              label       ="Faturamento"
              width       ="200px"
              defaultValue={filtroFaturado}
              options     ={[
                { value: "",      label: "Todos"    },
                { value: "true",  label: "Faturado" },
                { value: "false", label: "Pendente" },
              ]}
            />
          </TCol>
          <TSpace />
        </TRow>
        <TRow>
          <TCol>
            <TDate
              name        ="inicio"
              label       ="Data de (início)"
              width       ="200px"
              defaultValue={filtroInicio}
            />
          </TCol>
          <TCol>
            <TDate
              name        ="fim"
              label       ="Data até (fim)"
              width       ="200px"
              defaultValue={filtroFim}
            />
          </TCol>
          <TSpace />
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton type="submit" label="Filtrar" />
            <TButton label="Limpar" variant="cancel" type="button" onClick={handleLimpar} />
            <TButton label="Novo Pedido" variant="new" type="button"
              onClick={() => navigate("/pedidos/novo")} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhum pedido encontrado"
        onRowClick   ={(row) => navigate(`/pedidos/${row.id}`)}
        actionsWidth ="80px"
        actions      ={(row) => (
          <TButton label="" variant="edit"
            onClick={(e) => { e?.stopPropagation(); navigate(`/pedidos/${row.id}`) }} />
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
