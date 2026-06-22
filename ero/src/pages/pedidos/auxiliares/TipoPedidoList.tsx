import { useState, useEffect }                         from "react"
import { useNavigate }                                 from "react-router-dom"
import { api }                                         from "../../../services/api"
import type { TipoPedidoSummary, MovimentaEstoque, GeraFinanceiro } from "../../../types/Pedido"
import type { TDataGridColumn }                        from "../../../types/TDataGridColumn"
import { TPage }                                       from "../../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../../components/tform"
import { TRow }                                        from "../../../components/trow"
import { TCol }                                        from "../../../components/tcol"
import { TEntry }                                      from "../../../components/tentry"
import { TButton }                                     from "../../../components/tbutton"
import { TDataGrid }                                   from "../../../components/tdatagrid"
import { TDataGridFooter }                             from "../../../components/tdatagridfooter"
import { useMessage }                                  from "../../../hooks/useMessage"
import { useQuestion }                                 from "../../../hooks/useQuestion"

const MOV_LABEL: Record<MovimentaEstoque, string> = {
  NENHUM:  "Não movimenta",
  ENTRADA: "Entrada",
  SAIDA:   "Saída",
}
const FIN_LABEL: Record<GeraFinanceiro, string> = {
  NENHUM:         "Não gera",
  CONTAS_RECEBER: "Contas a Receber",
  CONTAS_PAGAR:   "Contas a Pagar",
}

const columns: TDataGridColumn<TipoPedidoSummary>[] = [
  { label: "ID",                field: "id",   width: "60px",  align: "center" },
  { label: "Nome",              field: "nome" },
  { label: "Movimenta Estoque", width: "150px",
    render: (row) => <span>{MOV_LABEL[row.movimentaEstoque]}</span> },
  { label: "Gera Financeiro",   width: "170px",
    render: (row) => <span>{FIN_LABEL[row.geraFinanceiro]}</span> },
  { label: "Status",            width: "90px",  align: "center",
    render: (row) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${row.ativo ? "bg-green-500" : "bg-red-400"}`}>
        {row.ativo ? "Ativo" : "Inativo"}
      </span>
    )
  },
]

export default function TipoPedidoList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [filtroNome,    setFiltroNome]    = useState("")
  const [data,          setData]          = useState<TipoPedidoSummary[]>([])
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
      const res = await api.get(`/tipos-pedido?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar tipos de pedido")
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

  function handleExcluir(row: TipoPedidoSummary) {
    ask(`Excluir o tipo de pedido "${row.nome}"?`, [
      { label: "Cancelar", variant: "cancel",  onClick: () => {} },
      { label: "Excluir",  variant: "confirm", onClick: async () => {
        try {
          await api.delete(`/tipos-pedido/${row.id}`)
          showMessage("success", "Tipo de pedido excluído com sucesso!")
          load()
        } catch {
          showMessage("error", "Erro ao excluir tipo de pedido")
        }
      }},
    ])
  }

  return (
    <TPage title="Tipos de Pedido" breadcrumb={["Pedidos", "Auxiliar Pedidos", "Tipos de Pedido"]}>
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
            <TButton label="Novo Tipo" variant="new" type="button"
              onClick={() => navigate("/pedidos/tipos/novo")} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>

      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhum tipo de pedido encontrado"
        onRowClick   ={(row) => navigate(`/pedidos/tipos/${row.id}`)}
        actionsWidth ="100px"
        actions      ={(row) => (
          <>
            <TButton label="" variant="edit"
              onClick={(e) => { e?.stopPropagation(); navigate(`/pedidos/tipos/${row.id}`) }} />
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
