import { useEffect, useState }                                    from "react"
import { useNavigate, useParams }                                  from "react-router-dom"
import axios                                                       from "axios"
import { api }                                                     from "../../services/api"
import type { TemplateAnamneseResponse, CampoAnamneseResponse }   from "../../types/Anamnese"
import type { ErrorResponse }                                      from "../../types/ErrorResponse"
import type { TDataGridColumn }                                    from "../../types/TDataGridColumn"
import { TPage }                                                   from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TRow }                                                    from "../../components/trow"
import { TCol }                                                    from "../../components/tcol"
import { TSpace }                                                  from "../../components/tspace"
import { TPanel }                                                  from "../../components/tpanel"
import { TEntry }                                                  from "../../components/tentry"
import { TCombo }                                                  from "../../components/tcombo"
import { TText }                                                   from "../../components/ttext"
import { TButton }                                                 from "../../components/tbutton"
import { TWindow }                                                 from "../../components/twindow"
import { TDataGrid }                                               from "../../components/tdatagrid"
import { useMessage }                                              from "../../hooks/useMessage"
import { useQuestion }                                             from "../../hooks/useQuestion"
import {
  FINALIDADE_OPTIONS,
  TIPO_CAMPO_OPTIONS,
  TIPO_CAMPO_LABEL,
  FINALIDADE_LABEL,
} from "../../utils/anamnese"

interface CampoModal {
  open:        boolean
  editId:      number | null
  secao:       string
  rotulo:      string
  tipo:        string
  opcoes:      string   // uma por linha
  ordem:       string
  obrigatorio: string
  ativo:       string
  saving:      boolean
}

const emptyCampo: CampoModal = {
  open: false, editId: null,
  secao: "", rotulo: "", tipo: "TEXTO", opcoes: "",
  ordem: "1", obrigatorio: "false", ativo: "true", saving: false,
}

const colsCampo: TDataGridColumn<CampoAnamneseResponse>[] = [
  { label: "Seção",       field: "secao",  render: (r) => <span>{r.secao ?? "—"}</span> },
  { label: "Rótulo",      field: "rotulo" },
  { label: "Tipo",        width: "150px",
    render: (r) => <span>{TIPO_CAMPO_LABEL[r.tipo]}</span> },
  { label: "Obrigatório", width: "100px", align: "center",
    render: (r) => <span>{r.obrigatorio ? "Sim" : "Não"}</span> },
  { label: "Ordem",       field: "ordem",  width: "70px",  align: "center" },
]

export default function TemplateAnamneseForm() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [formKey,   setFormKey]   = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [cloning,   setCloning]   = useState(false)
  const [template,  setTemplate]  = useState<TemplateAnamneseResponse | null>(null)
  const [currentId, setCurrentId] = useState<string | undefined>(idParam)

  const [campoModal, setCampoModal] = useState<CampoModal>(emptyCampo)

  const isEdit = !!currentId

  useEffect(() => {
    if (!currentId) { setTemplate(null); return }
    setLoading(true)
    api.get<TemplateAnamneseResponse>(`/templates-anamnese/${currentId}`)
      .then(r => loadTemplate(r.data))
      .catch(() => { showMessage("error", "Erro ao carregar template"); navigate("/clinica/templates-anamnese") })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  function loadTemplate(data: TemplateAnamneseResponse) {
    setTemplate(data)
    setFormKey(k => k + 1)
  }

  async function reload(id: string) {
    const r = await api.get<TemplateAnamneseResponse>(`/templates-anamnese/${id}`)
    loadTemplate(r.data)
  }

  function handleNovo() {
    setCurrentId(undefined)
    setTemplate(null)
    setFormKey(k => k + 1)
  }

  async function handleSubmit(data: Record<string, string>) {
    if (!data.nome?.trim())      { showMessage("error", "Nome é obrigatório");       return }
    if (!data.finalidade?.trim()){ showMessage("error", "Finalidade é obrigatória"); return }
    setSaving(true)
    try {
      const payload = {
        nome:       data.nome.trim(),
        finalidade: data.finalidade,
        descricao:  data.descricao?.trim() || null,
        ativo:      data.ativo !== "false",
      }
      if (isEdit) {
        await api.put(`/templates-anamnese/${currentId}`, payload)
        showMessage("success", "Template atualizado com sucesso!")
        await reload(currentId!)
      } else {
        const res = await api.post<TemplateAnamneseResponse>("/templates-anamnese", payload)
        showMessage("success", "Template criado com sucesso!")
        const novoId = String(res.data.id)
        setCurrentId(novoId)
        await reload(novoId)
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao salvar template")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleClonar() {
    setCloning(true)
    try {
      const res = await api.post<TemplateAnamneseResponse>(`/templates-anamnese/${currentId}/clonar`)
      showMessage("success", "Template clonado com sucesso!")
      navigate(`/clinica/templates-anamnese/${res.data.id}`)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao clonar template")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setCloning(false)
    }
  }

  // ── Campo modal ────────────────────────────────────────────────────────────

  function openNovoCampo() {
    const ordem = template?.campos?.length ? String(template.campos.length + 1) : "1"
    setCampoModal({ ...emptyCampo, open: true, ordem })
  }

  function openEditCampo(c: CampoAnamneseResponse) {
    let opcoesStr = ""
    if (c.opcoes) {
      try { opcoesStr = JSON.parse(c.opcoes).join("\n") } catch { opcoesStr = c.opcoes }
    }
    setCampoModal({
      open:        true,
      editId:      c.id,
      secao:       c.secao ?? "",
      rotulo:      c.rotulo,
      tipo:        c.tipo,
      opcoes:      opcoesStr,
      ordem:       String(c.ordem),
      obrigatorio: c.obrigatorio ? "true" : "false",
      ativo:       c.ativo       ? "true" : "false",
      saving:      false,
    })
  }

  async function handleSalvarCampo() {
    if (!campoModal.rotulo.trim()) { showMessage("error", "Rótulo é obrigatório"); return }
    setCampoModal(m => ({ ...m, saving: true }))
    try {
      let opcoesJson: string | null = null
      if (campoModal.tipo === "OPCOES" || campoModal.tipo === "MULTIPLAS_OPCOES") {
        const lista = campoModal.opcoes.split("\n").map(s => s.trim()).filter(Boolean)
        opcoesJson = lista.length ? JSON.stringify(lista) : null
      }
      const payload = {
        secao:       campoModal.secao.trim() || null,
        rotulo:      campoModal.rotulo.trim(),
        tipo:        campoModal.tipo,
        opcoes:      opcoesJson,
        ordem:       Number(campoModal.ordem) || 1,
        obrigatorio: campoModal.obrigatorio === "true",
        ativo:       campoModal.ativo === "true",
      }
      if (campoModal.editId) {
        await api.put(`/templates-anamnese/${currentId}/campos/${campoModal.editId}`, payload)
        showMessage("success", "Campo atualizado!")
      } else {
        await api.post(`/templates-anamnese/${currentId}/campos`, payload)
        showMessage("success", "Campo adicionado!")
      }
      setCampoModal(emptyCampo)
      await reload(currentId!)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao salvar campo")
      }
      setCampoModal(m => ({ ...m, saving: false }))
    }
  }

  async function handleRemoverCampo(c: CampoAnamneseResponse) {
    ask(`Remover o campo "${c.rotulo}"?`, [
      { label: "Cancelar", variant: "cancel",  onClick: () => {} },
      { label: "Remover",  variant: "confirm", onClick: async () => {
        try {
          await api.delete(`/templates-anamnese/${currentId}/campos/${c.id}`)
          showMessage("success", "Campo removido!")
          await reload(currentId!)
        } catch {
          showMessage("error", "Erro ao remover campo")
        }
      }},
    ])
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <TPage title="Carregando..." breadcrumb={["Clínica", "Templates de Anamnese"]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  const campos = template?.campos ?? []

  return (
    <TPage
      title     ={isEdit ? `Template — ${template?.nome ?? ""}` : "Novo Template de Anamnese"}
      breadcrumb={["Clínica", "Templates de Anamnese", isEdit ? "Editar" : "Novo"]}
    >
      {isEdit && template && (
        <div className="mb-3 px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-sm text-blue-800">
          Finalidade: <strong>{FINALIDADE_LABEL[template.finalidade]}</strong>
          {!template.ativo && (
            <span className="ml-3 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
              Inativo
            </span>
          )}
        </div>
      )}

      <TForm key={formKey} onSubmit={handleSubmit}>
        <TRow>
          <TCol>
            <TEntry
              name        ="nome"
              label       ="Nome (*)"
              required
              width       ="50%"
              minWidth    ="200px"
              defaultValue={template?.nome}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TCombo
              name        ="finalidade"
              label       ="Finalidade (*)"
              width       ="200px"
              defaultValue={template?.finalidade ?? ""}
              options     ={[{ value: "", label: "Selecione..." }, ...FINALIDADE_OPTIONS]}
            />
          </TCol>
          <TCol>
            <TCombo
              name        ="ativo"
              label       ="Status"
              width       ="200px"
              defaultValue={template ? (template.ativo ? "true" : "false") : "true"}
              options     ={[
                { value: "true",  label: "Ativo"   },
                { value: "false", label: "Inativo" },
              ]}
            />
          </TCol>
          <TSpace />
        </TRow>
        <TRow>
          <TCol>
            <TText
              name        ="descricao"
              label       ="Descrição"
              width       ="50%"
              minWidth    ="200px"
              height      ="80px"
              defaultValue={template?.descricao ?? ""}
            />
          </TCol>
        </TRow>

        {/* ── Campos do formulário ── */}
        {isEdit && (
          <TPanel title={`Campos do Formulário${campos.length ? ` (${campos.length})` : ""}`}>
            <div className="mb-2">
              <TButton label="Adicionar Campo" variant="new" type="button" onClick={openNovoCampo} />
            </div>
            <TDataGrid
              columns      ={colsCampo}
              data         ={[...campos].sort((a, b) => a.ordem - b.ordem)}
              keyField     ="id"
              emptyMessage ="Nenhum campo adicionado"
              actionsWidth ="100px"
              actions      ={(row) => (
                <>
                  <TButton label="" variant="edit"
                    onClick={(e) => { e?.stopPropagation(); openEditCampo(row) }} />
                  <TButton label="" variant="delete"
                    onClick={(e) => { e?.stopPropagation(); handleRemoverCampo(row) }} />
                </>
              )}
            />
          </TPanel>
        )}

        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Voltar" variant="cancel" type="button"
              onClick={() => navigate("/clinica/templates-anamnese")} />
            <TButton label="Novo" variant="new" type="button" onClick={handleNovo} />
          </TFormActionsLeft>
          <TFormActionsRight>
            {isEdit && (
              <TButton label="Clonar" variant="new" type="button" loading={cloning} onClick={handleClonar} />
            )}
            <TButton label="Salvar" variant="save" type="submit" loading={saving} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>

      {/* ── Modal: adicionar/editar campo ─────────────────────────────────── */}
      <TWindow
        title   ={campoModal.editId ? "Editar Campo" : "Adicionar Campo"}
        open    ={campoModal.open}
        onClose ={() => setCampoModal(emptyCampo)}
        width   ="540px"
        actions ={
          <>
            <TButton label="Cancelar" variant="cancel" onClick={() => setCampoModal(emptyCampo)} />
            <TButton label="Salvar"   variant="save"   loading={campoModal.saving} onClick={handleSalvarCampo} />
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex gap-4 flex-wrap">
            <TEntry
              name        ="campo_secao"
              label       ="Seção"
              placeholder ="Ex: Histórico de Saúde"
              width       ="240px"
              defaultValue={campoModal.secao}
              onChange    ={(val) => setCampoModal(m => ({ ...m, secao: val }))}
            />
            <TEntry
              name        ="campo_ordem"
              label       ="Ordem"
              mask        ="numero"
              width       ="100px"
              defaultValue={campoModal.ordem}
              onChange    ={(val) => setCampoModal(m => ({ ...m, ordem: val }))}
            />
          </div>
          <TEntry
            name        ="campo_rotulo"
            label       ="Rótulo (*)"
            placeholder ="Ex: Possui alergia a medicamentos?"
            width       ="100%"
            defaultValue={campoModal.rotulo}
            onChange    ={(val) => setCampoModal(m => ({ ...m, rotulo: val }))}
          />
          <div className="flex gap-4 flex-wrap">
            <TCombo
              name        ="campo_tipo"
              label       ="Tipo de Campo"
              width       ="220px"
              defaultValue={campoModal.tipo}
              onChange    ={(val) => setCampoModal(m => ({ ...m, tipo: val, opcoes: "" }))}
              options     ={TIPO_CAMPO_OPTIONS}
            />
            <TCombo
              name        ="campo_obrigatorio"
              label       ="Obrigatório"
              width       ="150px"
              defaultValue={campoModal.obrigatorio}
              onChange    ={(val) => setCampoModal(m => ({ ...m, obrigatorio: val }))}
              options     ={[
                { value: "false", label: "Não" },
                { value: "true",  label: "Sim" },
              ]}
            />
            <TCombo
              name        ="campo_ativo"
              label       ="Ativo"
              width       ="130px"
              defaultValue={campoModal.ativo}
              onChange    ={(val) => setCampoModal(m => ({ ...m, ativo: val }))}
              options     ={[
                { value: "true",  label: "Sim" },
                { value: "false", label: "Não" },
              ]}
            />
          </div>
          {(campoModal.tipo === "OPCOES" || campoModal.tipo === "MULTIPLAS_OPCOES") && (
            <TText
              name        ="campo_opcoes"
              label       ="Opções (uma por linha)"
              placeholder ={"Sim\nNão\nNão sei"}
              width       ="100%"
              height      ="100px"
              defaultValue={campoModal.opcoes}
              onChange    ={(val) => setCampoModal(m => ({ ...m, opcoes: val }))}
            />
          )}
        </div>
      </TWindow>
    </TPage>
  )
}
