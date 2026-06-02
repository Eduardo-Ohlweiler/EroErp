import { useState, useEffect }                  from "react"
import { api }                                  from "../../../services/api"
import axios                                    from "axios"
import type { NcmResponse }                     from "../../../types/Produto"
import type { TDataGridColumn }                 from "../../../types/TDataGridColumn"
import type { ErrorResponse }                   from "../../../types/ErrorResponse"
import { TPage }                                from "../../../components/tpage"
import { TForm, TFormActionsLeft, TFormFooter } from "../../../components/tform"
import { TRow }                                 from "../../../components/trow"
import { TCol }                                 from "../../../components/tcol"
import { TEntry }                               from "../../../components/tentry"
import { TButton }                              from "../../../components/tbutton"
import { TDataGrid }                            from "../../../components/tdatagrid"
import { TDataGridFooter }                      from "../../../components/tdatagridfooter"
import { useMessage }                           from "../../../hooks/useMessage"
import { useQuestion }                          from "../../../hooks/useQuestion"

const columns: TDataGridColumn<NcmResponse>[] = [
  { label: "ID",        field: "id",       width: "60px",  align: "center" },
  { label: "Código",    field: "codigo",   width: "120px" },
  { label: "Descrição", field: "descricao" },
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

export default function NcmList() {
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [formKey,       setFormKey]       = useState(0)
  const [saving,        setSaving]        = useState(false)
  const [currentId,     setCurrentId]     = useState<number | null>(null)
  const [codigo,        setCodigo]        = useState("")
  const [descricao,     setDescricao]     = useState("")
  const [ativo,         setAtivo]         = useState(true)
  const [data,          setData]          = useState<NcmResponse[]>([])
  const [loading,       setLoading]       = useState(false)
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [filtroAtivo,   setFiltroAtivo]   = useState("")
  const pageSize = 15

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadGrid() }, [page])

  async function loadGrid(busca = filtroAtivo, pagina = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ 
        page: String(pagina), 
        size: String(pageSize), 
        sort: "codigo" 
      })
      if (busca) 
        params.append("busca", busca)
      const res = await api.get(`/ncm?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar NCMs")
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setCurrentId(null)
    setCodigo("")
    setDescricao("")
    setAtivo(true)
    setFormKey((p) => p + 1)
  }

  function handleEdit(row: NcmResponse) {
    setCurrentId(row.id)
    setCodigo(row.codigo)
    setDescricao(row.descricao)
    setAtivo(row.ativo)
    setFormKey((p) => p + 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleSubmit(formData: Record<string, string>) {
    setSaving(true)
    try {
      const payload = {
        codigo:    formData.codigo.trim(),
        descricao: formData.descricao,
        ativo
      }
      if (currentId) {
        await api.put(`/ncm/${currentId}`, payload)
        showMessage("success", "NCM atualizado com sucesso!")
      } else {
        await api.post("/ncm", payload)
        showMessage("success", "NCM cadastrado com sucesso!")
      }
      handleClear()
      loadGrid(filtroAtivo, 0)
      setPage(0)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const e = err.response?.data as ErrorResponse
        showMessage("error", e?.erro ?? "Erro ao salvar NCM")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleAtivo(row: NcmResponse) {
    try {
      await api.put(`/ncm/${row.id}`, { codigo: row.codigo, descricao: row.descricao, ativo: !row.ativo })
      showMessage("success", row.ativo ? "NCM inativado!" : "NCM ativado!")
      loadGrid()
    } catch {
      showMessage("error", "Erro ao atualizar NCM")
    }
  }

  async function handleDelete(row: NcmResponse) {
    try {
      await api.delete(`/ncm/${row.id}`)
      showMessage("success", "NCM excluído com sucesso!")
      loadGrid(filtroAtivo, 0)
      setPage(0)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const e = err.response?.data as ErrorResponse
        showMessage("error", e?.erro ?? "Não foi possível excluir. Verifique se o NCM está em uso.")
      } else {
        showMessage("error", "Erro ao excluir NCM")
      }
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    setFiltroAtivo(formData.busca ?? "")
    setPage(0)
    loadGrid(formData.busca, 0)
  }

  function handleLimparFiltro() {
    setFiltroAtivo("")
    setPage(0)
    loadGrid("", 0)
  }

  return (
    <TPage title="NCM" breadcrumb={["Administração", "Tabelas Produto", "NCM"]}>

      {/* ── Formulário cadastro / edição ── */}
      <TForm key={formKey} onSubmit={handleSubmit}>
        <TRow>
          <TCol>
            <TEntry
              name         ="codigo"
              label        ="Código NCM"
              required
              maxLength    ={8}
              defaultValue ={codigo}
              width        ="160px"
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry
              name         ="descricao"
              label        ="Descrição"
              required
              maxLength    ={150}
              defaultValue ={descricao}
              width        ="60%"
            />
          </TCol>
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Limpar" variant="cancel" type="button" onClick={handleClear} />
            <TButton label="Salvar" variant="save"   type="submit" loading={saving} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      {/* ── Filtro de busca ── */}
      <TForm onSubmit={handleFiltrar}>
        <TRow>
          <TCol>
            <TEntry name="busca" label="Buscar por código ou descrição" placeholder="Filtrar..." width="60%" />
          </TCol>
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton type="submit" label="Filtrar" />
            <TButton label="Limpar" variant="cancel" type="button" onClick={handleLimparFiltro} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhum NCM encontrado"
        actionsWidth ="160px"
        actions      ={(row) => (
          <>
            <TButton label="" variant="edit"
              onClick={(e) => { e?.stopPropagation(); handleEdit(row) }} />
            <TButton
              label   =""
              variant ={row.ativo ? "block" : "unblock"}
              onClick ={(e) => {
                e?.stopPropagation()
                ask(
                  `Deseja ${row.ativo ? "inativar" : "ativar"} o NCM "${row.codigo}"?`,
                  [
                    { label: "Cancelar", variant: "cancel",  onClick: () => {} },
                    {
                      label:   row.ativo ? "Inativar" : "Ativar",
                      variant: row.ativo ? "block"    : "unblock",
                      onClick: () => handleToggleAtivo(row)
                    }
                  ]
                )
              }}
            />
            <TButton
              label   =""
              variant ="delete"
              onClick ={(e) => {
                e?.stopPropagation()
                ask(
                  `Deseja excluir o NCM "${row.codigo}"? Esta ação não pode ser desfeita.`,
                  [
                    { label: "Cancelar", variant: "cancel", onClick: () => {} },
                    { label: "Excluir",  variant: "delete", onClick: () => handleDelete(row) }
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
