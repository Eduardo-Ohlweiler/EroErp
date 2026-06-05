import { useState, useEffect }                        from "react"
import { api }                                        from "../../../services/api"
import type { TipoProdutoResponse }                   from "../../../types/Produto"
import type { TDataGridColumn }                       from "../../../types/TDataGridColumn"
import { TPage }                                      from "../../../components/tpage"
import { TDataGrid }                                  from "../../../components/tdatagrid"
import { TDataGridFooter }                            from "../../../components/tdatagridfooter"
import { useMessage }                                 from "../../../hooks/useMessage"

const CLASSIFICACAO_LABEL: Record<string, string> = {
  PRODUTO: "Produto",
  SERVICO: "Serviço",
}

function ClassificacaoBadge({ row, onChange }: { row: TipoProdutoResponse; onChange: (id: number, val: string) => void }) {
  return (
    <select
      value     ={row.classificacao ?? "PRODUTO"}
      onChange  ={(e) => onChange(row.id, e.target.value)}
      className ="border border-(--border) rounded px-2 py-0.5 text-xs bg-(--bg-input)
                  text-(--text-primary) focus:outline-none focus:ring-1 focus:ring-(--accent)"
    >
      <option value="PRODUTO">Produto</option>
      <option value="SERVICO">Serviço</option>
    </select>
  )
}

export default function TipoProdutoList() {
  const { showMessage }                         = useMessage()
  const [data,          setData]                = useState<TipoProdutoResponse[]>([])
  const [loading,       setLoading]             = useState(false)
  const [page,          setPage]                = useState(0)
  const [totalPages,    setTotalPages]          = useState(0)
  const [totalElements, setTotalElements]       = useState(0)
  const pageSize = 15

  useEffect(() => { load() }, [page])

  async function load(pagina = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pagina), size: String(pageSize), sort: "nome" })
      const res = await api.get(`/tipos-produto?${params.toString()}`)
      const items = Array.isArray(res.data) ? res.data : res.data.content ?? []
      setData(items)
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? items.length)
    } catch {
      showMessage("error", "Erro ao carregar tipos de produto")
    } finally {
      setLoading(false)
    }
  }

  async function handleClassificacaoChange(id: number, classificacao: string) {
    try {
      await api.patch(`/tipos-produto/${id}/classificacao`, { classificacao })
      setData(prev => prev.map(r => r.id === id ? { ...r, classificacao } : r))
      showMessage("success", `Tipo atualizado para ${CLASSIFICACAO_LABEL[classificacao]}`)
    } catch {
      showMessage("error", "Erro ao atualizar classificação")
    }
  }

  const columns: TDataGridColumn<TipoProdutoResponse>[] = [
    { label: "ID",   field: "id",   width: "60px", align: "center" },
    { label: "Nome", field: "nome" },
    {
      label: "Classificação", width: "140px", align: "center",
      render: (row) => (
        <ClassificacaoBadge row={row} onChange={handleClassificacaoChange} />
      )
    },
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

  return (
    <TPage title="Tipos de Produto" breadcrumb={["Administração", "Tabelas Produto", "Tipos de Produto"]}>
      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhum tipo de produto encontrado"
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
