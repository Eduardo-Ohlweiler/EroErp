import { useState, useEffect }                        from "react"
import { api }                                        from "../../../../services/api"
import axios                                          from "axios"
import type { SubgrupoResponse }                      from "../../../../types/Produto"
import type { TDataGridColumn }                       from "../../../../types/TDataGridColumn"
import type { ErrorResponse }                         from "../../../../types/ErrorResponse"
import { TPage }                                      from "../../../../components/tpage"
import { TForm, TFormActionsLeft, TFormFooter }       from "../../../../components/tform"
import { TRow }                                       from "../../../../components/trow"
import { TCol }                                       from "../../../../components/tcol"
import { TEntry }                                     from "../../../../components/tentry"
import { TCombo }                                     from "../../../../components/tcombo"
import { TDbCombo }                                   from "../../../../components/tdbcombo"
import { TButton }                                    from "../../../../components/tbutton"
import { TDataGrid }                                  from "../../../../components/tdatagrid"
import { TDataGridFooter }                            from "../../../../components/tdatagridfooter"
import { useMessage }                                 from "../../../../hooks/useMessage"
import { useQuestion }                                from "../../../../hooks/useQuestion"

const columns: TDataGridColumn<SubgrupoResponse>[] = [
  { label: "ID",       field: "id",       width: "60px", align: "center" },
  { label: "Grupo",    field: "grupoNome", width: "200px" },
  { label: "Nome",     field: "nome" },
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

export default function SubgrupoFormList() {
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [formKey,   setFormKey]   = useState(0)
  const [saving,    setSaving]    = useState(false)
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [grupoId,   setGrupoId]   = useState("")
  const [nome,      setNome]      = useState("")
  const [ativo,     setAtivo]     = useState("true")

  const [data,          setData]          = useState<SubgrupoResponse[]>([])
  const [loading,       setLoading]       = useState(false)
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 15

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadGrid() }, [page])

  async function loadGrid(pagina = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pagina), size: String(pageSize), sort: "nome" })
      const res = await api.get(`/subgrupos?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar subgrupos")
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setCurrentId(null)
    setGrupoId("")
    setNome("")
    setAtivo("true")
    setFormKey((p) => p + 1)
  }

  function handleEdit(row: SubgrupoResponse) {
    setCurrentId(row.id)
    setGrupoId(String(row.grupoId))
    setNome(row.nome)
    setAtivo(row.ativo ? "true" : "false")
    setFormKey((p) => p + 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleSubmit(formData: Record<string, string>) {
    if (!formData.grupoId) {
      showMessage("error", "Selecione o grupo")
      return
    }
    setSaving(true)
    try {
      if (currentId) {
        await api.put(`/subgrupos/${currentId}`, {
          grupoId: Number(formData.grupoId),
          nome:    formData.nome,
          ativo:   formData.ativo === "true"
        })
        showMessage("success", "Subgrupo atualizado com sucesso!")
      } else {
        await api.post("/subgrupos", {
          grupoId: Number(formData.grupoId),
          nome:    formData.nome
        })
        showMessage("success", "Subgrupo cadastrado com sucesso!")
      }
      handleClear()
      loadGrid(0)
      setPage(0)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const e = err.response?.data as ErrorResponse
        showMessage("error", e?.erro ?? "Erro ao salvar subgrupo")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleAtivo(row: SubgrupoResponse) {
    try {
      await api.put(`/subgrupos/${row.id}`, { grupoId: row.grupoId, nome: row.nome, ativo: !row.ativo })
      showMessage("success", row.ativo ? "Subgrupo inativado!" : "Subgrupo ativado!")
      loadGrid()
    } catch {
      showMessage("error", "Erro ao atualizar subgrupo")
    }
  }

  return (
    <TPage title="Subgrupos de Produto" breadcrumb={["Cadastros", "Auxiliar Produto", "Subgrupos"]}>
      <TForm key={formKey} onSubmit={handleSubmit}>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="grupoId"
              label        ="Grupo"
              url          ="/grupos"
              valueField   ="id"
              displayField ="nome"
              searchField  ="nome"
              placeholder  ="Selecione o grupo..."
              required
              width        ="50%"
              value        ={grupoId}
              onChange     ={(val) => setGrupoId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry
              name         ="nome"
              label        ="Nome"
              required
              maxLength    ={100}
              defaultValue ={nome}
              width        ="50%"
            />
          </TCol>
        </TRow>

        {currentId && (
          <TRow>
            <TCol>
              <TCombo
                name         ="ativo"
                label        ="Status"
                width        ="200px"
                defaultValue ={ativo}
                onChange     ={setAtivo}
                options      ={[
                  { value: "true",  label: "Ativo"   },
                  { value: "false", label: "Inativo" },
                ]}
              />
            </TCol>
          </TRow>
        )}

        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Limpar" variant="cancel" type="button" onClick={handleClear} />
            <TButton label="Salvar" variant="save"   type="submit" loading={saving} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhum subgrupo encontrado"
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
                  `Deseja ${row.ativo ? "inativar" : "ativar"} o subgrupo "${row.nome}"?`,
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
