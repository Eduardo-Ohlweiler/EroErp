import { useState, useEffect }                  from "react"
import { api }                                  from "../../../services/api"
import { useMessage }                           from "../../../hooks/useMessage"
import type { LoginLog }                        from "../../../types/LoginLog"
import type { TDataGridColumn }                  from "../../../types/TDataGridColumn"
import { TPage }                                from "../../../components/tpage"
import { TForm, TFormActionsLeft, TFormFooter } from "../../../components/tform"
import { TRow }                                 from "../../../components/trow"
import { TCol }                                 from "../../../components/tcol"
import { TDbCombo }                             from "../../../components/tdbcombo"
import { TDate }                                from "../../../components/tdate"
import { TButton }                              from "../../../components/tbutton"
import { TDataGrid }                            from "../../../components/tdatagrid"
import { TDataGridFooter }                      from "../../../components/tdatagridfooter"
import { TSpace } from "../../../components/tspace"

const TIPO_LABEL: Record<string, string> = {
  MANUAL:    "Manual",
  EXPIRACAO: "Expiração",
}

const TIPO_COLOR: Record<string, string> = {
  MANUAL:    "bg-blue-500",
  EXPIRACAO: "bg-amber-500",
}

function fmtDataHora(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("pt-BR")
}

const columns: TDataGridColumn<LoginLog>[] = [
  { label: "Usuário",         field: "usuarioNome" },
  { label: "Cliente",         field: "clienteNome" },
  { label: "Data/Hora Login", field: "dataLogin",  width: "160px",
    render: (row) => <span>{fmtDataHora(row.dataLogin)}</span> },
  { label: "Data/Hora Logout",field: "dataLogout", width: "160px",
    render: (row) => <span>{fmtDataHora(row.dataLogout)}</span> },
  {
    label: "Tipo", field: "tipoLogout", width: "120px", align: "center",
    render: (row) => row.tipoLogout ? (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${TIPO_COLOR[row.tipoLogout]}`}>
        {TIPO_LABEL[row.tipoLogout]}
      </span>
    ) : <span>—</span>,
  },
  { label: "IP", field: "enderecoIp", width: "140px",
    render: (row) => <span>{row.enderecoIp ?? "—"}</span> },
]

export default function LoginLogList() {
  const { showMessage } = useMessage()

  const [data,          setData]          = useState<LoginLog[]>([])
  const [loading,       setLoading]       = useState(false)
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const [filtroCliente,    setFiltroCliente]    = useState("")
  const [filtroUsuario,    setFiltroUsuario]    = useState("")
  const [filtroDataInicio, setFiltroDataInicio] = useState("")
  const [filtroDataFim,    setFiltroDataFim]    = useState("")
  const [resetKey, setResetKey] = useState(0)

  const pageSize = 15

  useEffect(() => {
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  async function load(
    clienteId  = filtroCliente,
    usuarioId  = filtroUsuario,
    dataInicio = filtroDataInicio,
    dataFim    = filtroDataFim,
    pagina     = page
  ) {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(pagina),
        size: String(pageSize),
      })

      if (clienteId)  params.append("clienteId",  clienteId)
      if (usuarioId)  params.append("usuarioId",  usuarioId)
      if (dataInicio) params.append("dataInicio", dataInicio)
      if (dataFim)    params.append("dataFim",    dataFim)

      const response = await api.get(`/login-logs?${params.toString()}`)
      setData(response.data.content)
      setTotalPages(response.data.totalPages)
      setTotalElements(response.data.totalElements)
    } catch {
      showMessage("error", "Erro ao carregar logs de login")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar() {
    setPage(0)
    load(filtroCliente, filtroUsuario, filtroDataInicio, filtroDataFim, 0)
  }

  function handleLimpar() {
    setFiltroCliente("")
    setFiltroUsuario("")
    setFiltroDataInicio("")
    setFiltroDataFim("")
    setResetKey((prev) => prev + 1)
    setPage(0)
    load("", "", "", "", 0)
  }

  return (
    <TPage title="Logs de Login" breadcrumb={["Administração", "Logs", "Logs de Login"]}>
      <TForm key={resetKey} onSubmit={handleFiltrar}>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="clienteId"
              label        ="Cliente"
              url          ="/clientes/select"
              valueField   ="id"
              displayField ="nome"
              searchField  ="nome"
              placeholder  ="Todos os clientes..."
              width        ="50%"
              minWidth     ="200px"
              value        ={filtroCliente}
              onChange     ={setFiltroCliente}
            />
          </TCol>
        </TRow>

        <TRow>
          <TCol>
            <TDbCombo
              name         ="usuarioId"
              label        ="Usuário"
              url          ="/usuarios/select"
              valueField   ="id"
              displayField ="nome"
              searchField  ="nome"
              placeholder  ="Todos os usuários..."
              width        ="50%"
              minWidth     ="200px"
              value        ={filtroUsuario}
              onChange     ={setFiltroUsuario}
            />
          </TCol>
        </TRow>

        <TRow>
          <TCol>
            <TDate
              name         ="dataInicio"
              label        ="Login de"
              width        ="200px"
              defaultValue ={filtroDataInicio}
              onChange     ={setFiltroDataInicio}
            />
          </TCol>
          <TCol>
            <TDate
              name         ="dataFim"
              label        ="Login até"
              width        ="200px"
              defaultValue ={filtroDataFim}
              onChange     ={setFiltroDataFim}
            />
          </TCol>
          <TSpace />
        </TRow>

        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Filtrar" type="submit" />
            <TButton
              label   ="Limpar"
              variant ="cancel"
              type    ="button"
              onClick ={handleLimpar}
            />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        columns     ={columns}
        data        ={data}
        keyField    ="id"
        loading     ={loading}
        emptyMessage="Nenhum log de login encontrado"
      />

      <TDataGridFooter
        page          ={page}
        totalPages    ={totalPages}
        totalElements ={totalElements}
        pageSize      ={pageSize}
        onPageChange  ={setPage}
      />
    </TPage>
  )
}
