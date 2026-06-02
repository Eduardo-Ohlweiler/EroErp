import { useState, useEffect }                        from "react"
import { api }                                        from "../../../services/api"
import type { UnidadeMedidaResponse }                 from "../../../types/Produto"
import type { TDataGridColumn }                       from "../../../types/TDataGridColumn"
import { TPage }                                      from "../../../components/tpage"
import { TDataGrid }                                  from "../../../components/tdatagrid"
import { TDataGridFooter }                            from "../../../components/tdatagridfooter"
import { useMessage }                                 from "../../../hooks/useMessage"

const columns: TDataGridColumn<UnidadeMedidaResponse>[] = [
  { label: "ID",       field: "id",       width: "60px",  align: "center" },
  { label: "Sigla",    field: "sigla",    width: "100px" },
  { label: "Descrição",field: "descricao" },
  {
    label: "Status", width: "100px", align: "center",
    render: (row) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white
        ${row.ativo ? "bg-(--success)" : "bg-(--danger)"}`}>
        {row.ativo ? "Ativo" : "Inativo"}
      </span>
    )
  }
]

export default function UnidadeMedidaList() {
  const { showMessage }                         = useMessage()
  const [data,          setData]                = useState<UnidadeMedidaResponse[]>([])
  const [loading,       setLoading]             = useState(false)
  const [page,          setPage]                = useState(0)
  const [totalPages,    setTotalPages]          = useState(0)
  const [totalElements, setTotalElements]       = useState(0)
  const pageSize = 15

  useEffect(() => { load() }, [page])

  async function load(pagina = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pagina), size: String(pageSize) })
      const res = await api.get(`/unidades-medida?${params.toString()}`)
      const items = Array.isArray(res.data) ? res.data : res.data.content ?? []
      setData(items)
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? items.length)
    } catch {
      showMessage("error", "Erro ao carregar unidades de medida")
    } finally {
      setLoading(false)
    }
  }

  return (
    <TPage title="Unidades de Medida" breadcrumb={["Administração", "Tabelas Produto", "Unidades de Medida"]}>
      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhuma unidade de medida encontrada"
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
