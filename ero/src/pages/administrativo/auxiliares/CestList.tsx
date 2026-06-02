import { useState, useEffect }                  from "react"
import { api }                                  from "../../../services/api"
import axios                                    from "axios"
import type { CestResponse }                    from "../../../types/Produto"
import type { TDataGridColumn }                 from "../../../types/TDataGridColumn"
import type { ErrorResponse }                   from "../../../types/ErrorResponse"
import { TPage }                                from "../../../components/tpage"
import { TForm, TFormActionsLeft, TFormFooter } from "../../../components/tform"
import { TRow }                                 from "../../../components/trow"
import { TCol }                                 from "../../../components/tcol"
import { TEntry }                               from "../../../components/tentry"
import { TDbCombo }                             from "../../../components/tdbcombo"
import { TButton }                              from "../../../components/tbutton"
import { TDataGrid }                            from "../../../components/tdatagrid"
import { TDataGridFooter }                      from "../../../components/tdatagridfooter"
import { useMessage }                           from "../../../hooks/useMessage"
import { useQuestion }                          from "../../../hooks/useQuestion"

function displayNcm(item: Record<string, unknown>): string {
  return `${item.codigo} — ${item.descricao}`
}

const columns: TDataGridColumn<CestResponse>[] = [
  { label: "ID",        field: "id",       width: "60px",  align: "center" },
  { label: "Código",    field: "codigo",   width: "120px" },
  { label: "Descrição", field: "descricao" },
  { label: "NCM",       field: "ncmCodigo", width: "110px" },
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

export default function CestList() {
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [formKey,   setFormKey]   = useState(0)
  const [saving,    setSaving]    = useState(false)
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [codigo,    setCodigo]    = useState("")
  const [descricao, setDescricao] = useState("")
  const [ncmId,     setNcmId]     = useState("")
  const [ativo,     setAtivo]     = useState(true)

  const [data,          setData]          = useState<CestResponse[]>([])
  const [loading,       setLoading]       = useState(false)
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [filtroAtivo,   setFiltroAtivo]   = useState("")
  const pageSize = 15

  useEffect(() => { loadGrid() }, [page])

  async function loadGrid(busca = filtroAtivo, pagina = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pagina), size: String(pageSize), sort: "codigo" })
      if (busca) params.append("busca", busca)
      const res = await api.get(`/cest?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar CEST")
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setCurrentId(null)
    setCodigo("")
    setDescricao("")
    setNcmId("")
    setAtivo(true)
    setFormKey((p) => p + 1)
  }

  function handleEdit(row: CestResponse) {
    setCurrentId(row.id)
    setCodigo(row.codigo)
    setDescricao(row.descricao)
    setNcmId(String(row.ncmId))
    setAtivo(row.ativo)
    setFormKey((p) => p + 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleSubmit(formData: Record<string, string>) {
    if (!ncmId) {
      showMessage("error", "Selecione o NCM vinculado")
      return
    }
    setSaving(true)
    try {
      const payload = {
        codigo:    formData.codigo.trim(),
        descricao: formData.descricao,
        ncmId:     Number(ncmId),
        ativo
      }
      if (currentId) {
        await api.put(`/cest/${currentId}`, payload)
        showMessage("success", "CEST atualizado com sucesso!")
      } else {
        await api.post("/cest", payload)
        showMessage("success", "CEST cadastrado com sucesso!")
      }
      handleClear()
      loadGrid(filtroAtivo, 0)
      setPage(0)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const e = err.response?.data as ErrorResponse
        showMessage("error", e?.erro ?? "Erro ao salvar CEST")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleAtivo(row: CestResponse) {
    try {
      await api.put(`/cest/${row.id}`, {
        codigo:    row.codigo,
        descricao: row.descricao,
        ncmId:     row.ncmId,
        ativo:     !row.ativo
      })
      showMessage("success", row.ativo ? "CEST inativado!" : "CEST ativado!")
      loadGrid()
    } catch {
      showMessage("error", "Erro ao atualizar CEST")
    }
  }

  async function handleDelete(row: CestResponse) {
    try {
      await api.delete(`/cest/${row.id}`)
      showMessage("success", "CEST excluído com sucesso!")
      loadGrid(filtroAtivo, 0)
      setPage(0)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const e = err.response?.data as ErrorResponse
        showMessage("error", e?.erro ?? "Não foi possível excluir. Verifique se o CEST está em uso.")
      } else {
        showMessage("error", "Erro ao excluir CEST")
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
    <TPage title="CEST" breadcrumb={["Administração", "Tabelas Produto", "CEST"]}>

      {/* ── Formulário cadastro / edição ── */}
      <TForm key={formKey} onSubmit={handleSubmit}>
        <TRow>
          <TCol>
            <TEntry
              name         ="codigo"
              label        ="Código CEST"
              required
              maxLength    ={9}
              defaultValue ={codigo}
              width        ="160px"
            />
          </TCol>
          <TCol>
            <TEntry
              name         ="descricao"
              label        ="Descrição"
              required
              maxLength    ={150}
              defaultValue ={descricao}
              width        ="50%"
            />
          </TCol>
          <TCol>
            <TDbCombo
              name         ="ncmId"
              label        ="NCM"
              url          ="/ncm"
              valueField   ="id"
              displayField ={displayNcm}
              searchField  ="busca"
              placeholder  ="Digite para buscar..."
              required
              minLength    ={2}
              width        ="280px"
              value        ={ncmId}
              onChange     ={(val) => setNcmId(val)}
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
        emptyMessage ="Nenhum CEST encontrado"
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
                  `Deseja ${row.ativo ? "inativar" : "ativar"} o CEST "${row.codigo}"?`,
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
                  `Deseja excluir o CEST "${row.codigo}"? Esta ação não pode ser desfeita.`,
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
