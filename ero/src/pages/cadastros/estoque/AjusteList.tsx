import { useState, useEffect }                        from "react"
import { useNavigate }                                from "react-router-dom"
import { api }                                        from "../../../services/api"
import { displayEmitente }                             from "../../../utils/pessoas"
import type { MovimentacaoResponse }                  from "../../../types/Estoque"
import type { TDataGridColumn }                       from "../../../types/TDataGridColumn"
import { TPage }                                      from "../../../components/tpage"
import { TForm, TFormActionsLeft, TFormFooter }       from "../../../components/tform"
import { TRow }                                       from "../../../components/trow"
import { TCol }                                       from "../../../components/tcol"
import { TDbCombo }                                   from "../../../components/tdbcombo"
import { TButton }                                    from "../../../components/tbutton"
import { TDataGrid }                                  from "../../../components/tdatagrid"
import { TDataGridFooter }                            from "../../../components/tdatagridfooter"
import { useMessage }                                 from "../../../hooks/useMessage"

function formatQtd(val: number) {
  return Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
}

const columns: TDataGridColumn<MovimentacaoResponse>[] = [
  { label: "ID",        field: "id",                  width: "60px",  align: "center" },
  { label: "Data",      field: "createdAt",            width: "160px",
    render: (row) => <span>{new Date(row.createdAt).toLocaleString("pt-BR")}</span> },
  { label: "Emitente",  field: "emitenteNome" },
  { label: "Produto",   field: "produtoNome" },
  { label: "Qt. Anterior", field: "quantidadeAnterior", width: "110px", align: "right",
    render: (row) => <span>{formatQtd(row.quantidadeAnterior)}</span> },
  { label: "Qt. Nova",  field: "quantidadePosterior",  width: "110px", align: "right",
    render: (row) => <span>{formatQtd(row.quantidadePosterior)}</span> },
  { label: "Motivo",    field: "motivo",
    render: (row) => <span>{row.motivo ?? "—"}</span> },
  { label: "Usuário",   field: "createdByNome",        width: "150px",
    render: (row) => <span>{row.createdByNome ?? "—"}</span> },
]

export default function AjusteList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()

  const [filtroEmitenteId, setFiltroEmitenteId] = useState("")
  const [data,             setData]             = useState<MovimentacaoResponse[]>([])
  const [loading,          setLoading]          = useState(false)
  const [page,             setPage]             = useState(0)
  const [totalPages,       setTotalPages]       = useState(0)
  const [totalElements,    setTotalElements]    = useState(0)
  const pageSize = 15

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  async function load(emitenteId = filtroEmitenteId, pagina = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pagina), size: String(pageSize) })
      if (emitenteId) params.append("emitenteId", emitenteId)
      params.append("tipo", "AJUSTE")

      const res = await api.get(`/estoque/movimentacoes?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar ajustes")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar() {
    setPage(0)
    load(filtroEmitenteId, 0)
  }

  function handleLimpar() {
    setFiltroEmitenteId("")
    setPage(0)
    load("", 0)
  }

  return (
    <TPage title="Ajustes de Estoque" breadcrumb={["Estoque", "Ajustes"]}>
      <TForm onSubmit={handleFiltrar}>
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
              value        ={filtroEmitenteId}
              onChange     ={(val) => setFiltroEmitenteId(val)}
            />
          </TCol>
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton type="submit" label="Filtrar" />
            <TButton label="Limpar" variant="cancel" type="button" onClick={handleLimpar} />
            <TButton label="Novo Ajuste" variant="new" type="button" onClick={() => navigate("/estoque/ajustes/novo")} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhum ajuste encontrado"
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
