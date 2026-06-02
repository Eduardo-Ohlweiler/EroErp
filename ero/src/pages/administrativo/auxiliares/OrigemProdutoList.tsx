import { useState, useEffect }          from "react"
import { api }                          from "../../../services/api"
import type { OrigemProdutoResponse }   from "../../../types/Produto"
import type { TDataGridColumn }         from "../../../types/TDataGridColumn"
import { TPage }                        from "../../../components/tpage"
import { TDataGrid }                    from "../../../components/tdatagrid"
import { TDataGridFooter }              from "../../../components/tdatagridfooter"
import { useMessage }                   from "../../../hooks/useMessage"

const columns: TDataGridColumn<OrigemProdutoResponse>[] = [
  { label: "ID",       field: "id",       width: "60px",  align: "center" },
  { label: "Código",   field: "codigo",   width: "80px",  align: "center" },
  { label: "Descrição",field: "descricao" },
]

export default function OrigemProdutoList() {
  const { showMessage }                         = useMessage()
  const [data,          setData]                = useState<OrigemProdutoResponse[]>([])
  const [loading,       setLoading]             = useState(false)
  const [page,          setPage]                = useState(0)
  const [totalPages,    setTotalPages]          = useState(0)
  const [totalElements, setTotalElements]       = useState(0)
  const pageSize = 15

  useEffect(() => { load() }, [page])

  async function load() {
    setLoading(true)
    try {
      const res = await api.get("/origens-produto")
      const items = Array.isArray(res.data) ? res.data : res.data.content ?? []
      setData(items)
      setTotalPages(1)
      setTotalElements(items.length)
    } catch {
      showMessage("error", "Erro ao carregar origens de produto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <TPage title="Origens de Produto" breadcrumb={["Administração", "Tabelas Produto", "Origens de Produto"]}>
      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhuma origem encontrada"
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
