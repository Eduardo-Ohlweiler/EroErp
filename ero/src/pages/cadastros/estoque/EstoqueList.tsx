import { useState, useEffect }                        from "react"
import { useNavigate }                                from "react-router-dom"
import { api }                                        from "../../../services/api"
import { displayEmitente }                             from "../../../utils/pessoas"
import type { EstoqueResponse }                       from "../../../types/Estoque"
import type { TDataGridColumn }                       from "../../../types/TDataGridColumn"
import { TPage }                                      from "../../../components/tpage"
import { TForm, TFormActionsLeft, TFormFooter }       from "../../../components/tform"
import { TRow }                                       from "../../../components/trow"
import { TCol }                                       from "../../../components/tcol"
import { TEntry }                                     from "../../../components/tentry"
import { TCombo }                                     from "../../../components/tcombo"
import { TDbCombo }                                   from "../../../components/tdbcombo"
import { TButton }                                    from "../../../components/tbutton"
import { TDataGrid }                                  from "../../../components/tdatagrid"
import { TDataGridFooter }                            from "../../../components/tdatagridfooter"
import { useMessage }                                 from "../../../hooks/useMessage"
import { useQuestion }                                from "../../../hooks/useQuestion"

const columns: TDataGridColumn<EstoqueResponse>[] = [
  { label: "ID",         field: "id",                width: "60px",  align: "center" },
  { label: "Emitente",   field: "emitenteNome" },
  { label: "Produto",    field: "produtoNome" },
  { label: "Cód.",       field: "produtoCodigo",     width: "70px",  align: "center",
    render: (row) => <span>{row.produtoCodigo ?? "—"}</span> },
  { label: "Un.",        field: "unidadeMedidaSigla", width: "60px", align: "center" },
  { label: "Quantidade", field: "quantidade",         width: "110px", align: "right",
    render: (row) => <span>{Number(row.quantidade).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span> },
  { label: "Preço Venda", field: "precoVenda",        width: "120px", align: "right",
    render: (row) => (
      <span>{row.precoVenda != null
        ? Number(row.precoVenda).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
        : "—"}</span>
    )
  },
  {
    label: "Status", width: "110px", align: "center",
    render: (row) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white
        ${!row.bloqueado ? "bg-(--success)" : "bg-(--danger)"}`}>
        {!row.bloqueado ? "Ativo" : "Bloqueado"}
      </span>
    )
  }
]

export default function EstoqueList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [filtroEmitenteId, setFiltroEmitenteId] = useState("")
  const [filtroProdutoNome, setFiltroProdutoNome] = useState("")
  const [filtroBloqueado,  setFiltroBloqueado]  = useState("")
  const [data,             setData]             = useState<EstoqueResponse[]>([])
  const [loading,          setLoading]          = useState(false)
  const [page,             setPage]             = useState(0)
  const [totalPages,       setTotalPages]       = useState(0)
  const [totalElements,    setTotalElements]    = useState(0)
  const pageSize = 15

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  async function load(
    emitenteId  = filtroEmitenteId,
    produtoNome = filtroProdutoNome,
    bloqueado   = filtroBloqueado,
    pagina      = page
  ) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pagina), size: String(pageSize), sort: "produto.nome" })
      if (emitenteId)  params.append("emitenteId",  emitenteId)
      if (produtoNome) params.append("produtoNome", produtoNome)
      if (bloqueado)   params.append("bloqueado",   bloqueado)

      const res = await api.get(`/estoque?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar estoque")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    setFiltroProdutoNome(formData.produtoNome ?? "")
    setFiltroBloqueado(formData.bloqueado ?? "")
    setPage(0)
    load(filtroEmitenteId, formData.produtoNome, formData.bloqueado, 0)
  }

  function handleLimpar() {
    setFiltroEmitenteId("")
    setFiltroProdutoNome("")
    setFiltroBloqueado("")
    setPage(0)
    load("", "", "", 0)
  }

  async function handleToggleBloqueado(row: EstoqueResponse) {
    try {
      await api.put(`/estoque/${row.id}`, { bloqueado: !row.bloqueado })
      showMessage("success", row.bloqueado ? "Estoque desbloqueado!" : "Estoque bloqueado!")
      load()
    } catch {
      showMessage("error", "Erro ao atualizar estoque")
    }
  }

  return (
    <TPage title="Estoque" breadcrumb={["Estoque", "Saldo"]}>
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
              width        ="350px"
              value        ={filtroEmitenteId}
              onChange     ={(val) => setFiltroEmitenteId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry
              name        ="produtoNome"
              label       ="Produto"
              placeholder ="Filtrar por nome..."
              width       ="50%"
              defaultValue={filtroProdutoNome}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TCombo
              name        ="bloqueado"
              label       ="Status"
              width       ="160px"
              defaultValue={filtroBloqueado}
              options     ={[
                { value: "",      label: "Todos"     },
                { value: "false", label: "Ativo"     },
                { value: "true",  label: "Bloqueado" },
              ]}
            />
          </TCol>
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton type="submit" label="Filtrar" />
            <TButton label="Limpar"  variant="cancel" type="button" onClick={handleLimpar} />
            <TButton label="Novo"    variant="new"    type="button" onClick={() => navigate("/estoque/novo")} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhum registro de estoque encontrado"
        onRowClick   ={(row) => navigate(`/estoque/${row.id}`)}
        actionsWidth ="160px"
        actions      ={(row) => (
          <>
            <TButton label="" variant="edit"
              onClick={(e) => { e?.stopPropagation(); navigate(`/estoque/${row.id}`) }} />
            <TButton
              label   =""
              variant ={row.bloqueado ? "unblock" : "block"}
              onClick ={(e) => {
                e?.stopPropagation()
                ask(
                  `Deseja ${row.bloqueado ? "desbloquear" : "bloquear"} o estoque do produto "${row.produtoNome}"?`,
                  [
                    { label: "Cancelar", variant: "cancel",  onClick: () => {} },
                    {
                      label:   row.bloqueado ? "Desbloquear" : "Bloquear",
                      variant: row.bloqueado ? "unblock"     : "block",
                      onClick: () => handleToggleBloqueado(row)
                    }
                  ]
                )
              }}
            />
          </>
        )}
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
