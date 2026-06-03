import { useState, useEffect }                        from "react"
import { useNavigate }                                from "react-router-dom"
import { api }                                        from "../../../services/api"
import type { TransferenciaResponse }                 from "../../../types/Estoque"
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

const columns: TDataGridColumn<TransferenciaResponse>[] = [
  { label: "ID",       field: "id",                   width: "60px",  align: "center" },
  { label: "Data",     field: "createdAt",             width: "160px",
    render: (row) => <span>{new Date(row.createdAt).toLocaleString("pt-BR")}</span> },
  { label: "Produto",  field: "produtoNome" },
  { label: "Origem",   field: "emitenteOrigemNome" },
  { label: "Destino",  field: "emitenteDestinoNome" },
  { label: "Qtd.",     field: "quantidade",            width: "110px", align: "right",
    render: (row) => (
      <span>{Number(row.quantidade).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
    )
  },
  { label: "Observação", field: "observacao",
    render: (row) => <span>{row.observacao ?? "—"}</span> },
  { label: "Usuário",  field: "createdByNome",         width: "150px",
    render: (row) => <span>{row.createdByNome ?? "—"}</span> },
]

export default function TransferenciaList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()

  const [filtroEmitenteId, setFiltroEmitenteId] = useState("")
  const [filtroProdutoId,  setFiltroProdutoId]  = useState("")
  const [data,             setData]             = useState<TransferenciaResponse[]>([])
  const [loading,          setLoading]          = useState(false)
  const [page,             setPage]             = useState(0)
  const [totalPages,       setTotalPages]       = useState(0)
  const [totalElements,    setTotalElements]    = useState(0)
  const pageSize = 15

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  async function load(emitenteId = filtroEmitenteId, produtoId = filtroProdutoId, pagina = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pagina), size: String(pageSize) })
      if (emitenteId) params.append("emitenteId", emitenteId)
      if (produtoId)  params.append("produtoId",  produtoId)

      const res = await api.get(`/estoque/transferencias?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar transferências")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar() {
    setPage(0)
    load(filtroEmitenteId, filtroProdutoId, 0)
  }

  function handleLimpar() {
    setFiltroEmitenteId("")
    setFiltroProdutoId("")
    setPage(0)
    load("", "", 0)
  }

  return (
    <TPage title="Transferências de Estoque" breadcrumb={["Estoque", "Transferências"]}>
      <TForm onSubmit={handleFiltrar}>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="emitenteId"
              label        ="Emitente (origem ou destino)"
              url          ="/emitentes/select"
              valueField   ="id"
              displayField ="pessoaNome"
              searchField  ="nome"
              placeholder  ="Todos..."
              width        ="350px"
              value        ={filtroEmitenteId}
              onChange     ={(val) => setFiltroEmitenteId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="produtoId"
              label        ="Produto"
              url          ="/produtos/select"
              valueField   ="id"
              displayField ="nome"
              searchField  ="nome"
              placeholder  ="Todos..."
              width        ="350px"
              value        ={filtroProdutoId}
              onChange     ={(val) => setFiltroProdutoId(val)}
            />
          </TCol>
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton type="submit" label="Filtrar" />
            <TButton label="Limpar" variant="cancel" type="button" onClick={handleLimpar} />
            <TButton label="Nova Transferência" variant="new" type="button"
              onClick={() => navigate("/estoque/transferencias/nova")} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhuma transferência encontrada"
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
