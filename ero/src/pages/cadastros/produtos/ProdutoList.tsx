import { useState, useEffect }                        from "react"
import { useNavigate }                                from "react-router-dom"
import { api }                                        from "../../../services/api"
import type { ProdutoResponse }                       from "../../../types/Produto"
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

const columns: TDataGridColumn<ProdutoResponse>[] = [
  { label: "ID",      field: "id",               width: "60px",  align: "center" },
  { label: "Cód.",    field: "codigo",           width: "80px",  align: "center",
    render: (row) => <span>{row.codigo ?? "—"}</span> },
  { label: "Nome",    field: "nome" },
  { label: "Tipo",    field: "tipoProdutoNome",  width: "100px" },
  { label: "Un.",     field: "unidadeMedidaSigla", width: "70px", align: "center" },
  { label: "Subgrupo", field: "subgrupoNome",    width: "150px",
    render: (row) => <span>{row.subgrupoNome ?? "—"}</span> },
  { label: "Categoria", field: "categoriaNome", width: "130px",
    render: (row) => <span>{row.categoriaNome ?? "—"}</span> },
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

export default function ProdutoList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [filtroNome,          setFiltroNome]          = useState("")
  const [filtroTipoProdutoId, setFiltroTipoProdutoId] = useState("")
  const [filtroSubgrupoId,    setFiltroSubgrupoId]    = useState("")
  const [filtroCategoriaId,   setFiltroCategoriaId]   = useState("")
  const [filtroMarcaId,       setFiltroMarcaId]       = useState("")
  const [filtroBloqueado,     setFiltroBloqueado]     = useState("")
  const [data,                setData]                = useState<ProdutoResponse[]>([])
  const [loading,             setLoading]             = useState(false)
  const [page,                setPage]                = useState(0)
  const [totalPages,          setTotalPages]          = useState(0)
  const [totalElements,       setTotalElements]       = useState(0)
  const pageSize = 15

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  async function load(
    nome          = filtroNome,
    tipoProdutoId = filtroTipoProdutoId,
    subgrupoId    = filtroSubgrupoId,
    categoriaId   = filtroCategoriaId,
    marcaId       = filtroMarcaId,
    bloqueado     = filtroBloqueado,
    pagina        = page
  ) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pagina), size: String(pageSize), sort: "nome" })
      if (nome)          params.append("nome",          nome)
      if (tipoProdutoId) params.append("tipoProdutoId", tipoProdutoId)
      if (subgrupoId)    params.append("subgrupoId",    subgrupoId)
      if (categoriaId)   params.append("categoriaId",   categoriaId)
      if (marcaId)       params.append("marcaId",       marcaId)
      if (bloqueado)     params.append("bloqueado",     bloqueado)

      const res = await api.get(`/produtos?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar produtos")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    setFiltroNome(formData.nome ?? "")
    setFiltroTipoProdutoId(filtroTipoProdutoId)
    setFiltroSubgrupoId(filtroSubgrupoId)
    setFiltroCategoriaId(filtroCategoriaId)
    setFiltroMarcaId(filtroMarcaId)
    setFiltroBloqueado(formData.bloqueado ?? "")
    setPage(0)
    load(formData.nome, filtroTipoProdutoId, filtroSubgrupoId, filtroCategoriaId, filtroMarcaId, formData.bloqueado, 0)
  }

  function handleLimpar() {
    setFiltroNome("")
    setFiltroTipoProdutoId("")
    setFiltroSubgrupoId("")
    setFiltroCategoriaId("")
    setFiltroMarcaId("")
    setFiltroBloqueado("")
    setPage(0)
    load("", "", "", "", "", "", 0)
  }

  async function handleToggleBloqueado(row: ProdutoResponse) {
    try {
      await api.put(`/produtos/${row.id}`, {
        codigo:                row.codigo,
        codigoEan:             row.codigoEan,
        codigoGtin:            row.codigoGtin,
        nome:                  row.nome,
        descricao:             row.descricao,
        bloqueado:            !row.bloqueado,
        tipoProdutoId:         row.tipoProdutoId,
        subgrupoId:            row.subgrupoId,
        categoriaId:           row.categoriaId,
        marcaId:               row.marcaId,
        unidadeMedidaId:       row.unidadeMedidaId,
        fornecedorPessoaId:    row.fornecedorPessoaId,
        custo:                 row.custo,
        ncmId:                 row.ncmId,
        origemProdutoId:       row.origemProdutoId,
        cestId:                row.cestId,
        substituicaoTributaria:row.substituicaoTributaria
      })
      showMessage("success", row.bloqueado ? "Produto desbloqueado!" : "Produto bloqueado!")
      load()
    } catch {
      showMessage("error", "Erro ao atualizar produto")
    }
  }

  return (
    <TPage title="Produtos" breadcrumb={["Cadastros", "Produtos"]}>
      <TForm onSubmit={handleFiltrar}>
        <TRow>
          <TCol>
            <TEntry
              name        ="nome"
              label       ="Nome"
              placeholder ="Filtrar por nome..."
              width       ="50%"
              defaultValue={filtroNome}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="tipoProdutoId"
              label        ="Tipo"
              url          ="/tipos-produto"
              valueField   ="id"
              displayField ="nome"
              searchField  ="nome"
              placeholder  ="Todos..."
              width        ="300px"
              value        ={filtroTipoProdutoId}
              onChange     ={(val) => setFiltroTipoProdutoId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="categoriaId"
              label        ="Categoria"
              url          ="/categorias"
              valueField   ="id"
              displayField ="nome"
              searchField  ="nome"
              placeholder  ="Todas..."
              width        ="300px"
              value        ={filtroCategoriaId}
              onChange     ={(val) => setFiltroCategoriaId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="marcaId"
              label        ="Marca"
              url          ="/marcas"
              valueField   ="id"
              displayField ="nome"
              searchField  ="nome"
              placeholder  ="Todas..."
              width        ="300px"
              value        ={filtroMarcaId}
              onChange     ={(val) => setFiltroMarcaId(val)}
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
            <TButton label="Limpar" variant="cancel" type="button" onClick={handleLimpar} />
            <TButton label="Novo"   variant="new"    type="button" onClick={() => navigate("/produtos/novo")} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhum produto encontrado"
        onRowClick   ={(row) => navigate(`/produtos/${row.id}`)}
        actionsWidth ="160px"
        actions      ={(row) => (
          <>
            <TButton label="" variant="edit"
              onClick={(e) => { e?.stopPropagation(); navigate(`/produtos/${row.id}`) }} />
            <TButton
              label   =""
              variant ={row.bloqueado ? "unblock" : "block"}
              onClick ={(e) => {
                e?.stopPropagation()
                ask(
                  `Deseja ${row.bloqueado ? "desbloquear" : "bloquear"} o produto "${row.nome}"?`,
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
