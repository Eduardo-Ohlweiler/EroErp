import { useState, useEffect }                        from "react"
import { api }                                        from "../../services/api"
import type { MovimentacaoResponse, TipoMovimentacao } from "../../types/Estoque"
import type { TDataGridColumn }                       from "../../types/TDataGridColumn"
import { TPage }                                      from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormFooter }       from "../../components/tform"
import { TRow }                                       from "../../components/trow"
import { TCol }                                       from "../../components/tcol"
import { TDbCombo }                                   from "../../components/tdbcombo"
import { TButton }                                    from "../../components/tbutton"
import { TDataGrid }                                  from "../../components/tdatagrid"
import { TDataGridFooter }                            from "../../components/tdatagridfooter"
import { useMessage }                                 from "../../hooks/useMessage"

const TIPO_LABEL: Record<TipoMovimentacao, string> = {
  ENTRADA:              "Entrada",
  SAIDA:                "Saída",
  AJUSTE:               "Ajuste",
  TRANSFERENCIA_ENTRADA:"Transf. Entrada",
  TRANSFERENCIA_SAIDA:  "Transf. Saída",
}

const TIPO_COLOR: Record<TipoMovimentacao, string> = {
  ENTRADA:              "bg-(--success)",
  SAIDA:                "bg-(--danger)",
  AJUSTE:               "bg-amber-500",
  TRANSFERENCIA_ENTRADA:"bg-blue-500",
  TRANSFERENCIA_SAIDA:  "bg-purple-500",
}

function formatQtd(val: number) {
  return Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
}

const columns: TDataGridColumn<MovimentacaoResponse>[] = [
  { label: "ID",      field: "id",                   width: "60px",  align: "center" },
  { label: "Data",    field: "createdAt",             width: "160px",
    render: (row) => <span>{new Date(row.createdAt).toLocaleString("pt-BR")}</span> },
  { label: "Tipo",    field: "tipo",                  width: "150px",
    render: (row) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${TIPO_COLOR[row.tipo]}`}>
        {TIPO_LABEL[row.tipo]}
      </span>
    )
  },
  { label: "Emitente", field: "emitenteNome" },
  { label: "Produto",  field: "produtoNome" },
  { label: "Anterior", field: "quantidadeAnterior",   width: "100px", align: "right",
    render: (row) => <span>{formatQtd(row.quantidadeAnterior)}</span> },
  { label: "Qtd. Mov.",field: "quantidade",            width: "100px", align: "right",
    render: (row) => <span>{formatQtd(row.quantidade)}</span> },
  { label: "Posterior",field: "quantidadePosterior",  width: "100px", align: "right",
    render: (row) => <span>{formatQtd(row.quantidadePosterior)}</span> },
  { label: "Motivo",   field: "motivo",
    render: (row) => <span>{row.motivo ?? "—"}</span> },
  { label: "Usuário",  field: "createdByNome",         width: "140px",
    render: (row) => <span>{row.createdByNome ?? "—"}</span> },
]

export default function MovimentacaoList() {
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

      const res = await api.get(`/estoque/movimentacoes?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar movimentações")
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
    <TPage title="Movimentações de Estoque" breadcrumb={["Estoque", "Movimentações"]}>
      <TForm onSubmit={handleFiltrar}>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="emitenteId"
              label        ="Emitente"
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
        <TFormFooter>
          <TFormActionsLeft>
            <TButton type="submit" label="Filtrar" />
            <TButton label="Limpar" variant="cancel" type="button" onClick={handleLimpar} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhuma movimentação encontrada"
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
