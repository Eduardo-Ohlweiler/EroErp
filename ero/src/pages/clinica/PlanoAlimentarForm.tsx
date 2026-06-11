import { useEffect, useState }                                    from "react"
import { useNavigate, useParams }                                  from "react-router-dom"
import axios                                                       from "axios"
import { api }                                                     from "../../services/api"
import type {
  PlanoAlimentarResponse,
  ItemPlanoAlimentarResponse,
  DiaSemana,
}                                                                  from "../../types/PlanoAlimentar"
import type { ErrorResponse }                                      from "../../types/ErrorResponse"
import type { TDataGridColumn }                                    from "../../types/TDataGridColumn"
import { TPage }                                                   from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TPanel }                                                  from "../../components/tpanel"
import { TEntry }                                                  from "../../components/tentry"
import { TCombo }                                                  from "../../components/tcombo"
import { TText }                                                   from "../../components/ttext"
import { TDate }                                                   from "../../components/tdate"
import { TButton }                                                 from "../../components/tbutton"
import { TDbCombo }                                                from "../../components/tdbcombo"
import { TWindow }                                                 from "../../components/twindow"
import { TDataGrid }                                               from "../../components/tdatagrid"
import { useMessage }                                              from "../../hooks/useMessage"
import { useQuestion }                                             from "../../hooks/useQuestion"
import { displayPessoa, displayEmitente }                         from "../../utils/pessoas"
import {
  DIAS_SEMANA,
  DIA_SEMANA_LABEL,
  DIA_SEMANA_ABREV,
  DIA_SEMANA_OPTIONS,
  formatarHorario,
  formatarDataBR,
}                                                                  from "../../utils/planoAlimentar"
import { gerarPdfPlanoAlimentar }                                  from "../../utils/geradorPdf"

// ── Item modal ─────────────────────────────────────────────────────────────────

interface ItemModal {
  open:       boolean
  editId:     number | null
  diaSemana:  DiaSemana
  horario:    string
  refeicaoId: string
  quantidade: string
  peso:       string
  observacao: string
  saving:     boolean
}

const emptyItem: ItemModal = {
  open: false, editId: null, diaSemana: "SEGUNDA",
  horario: "", refeicaoId: "", quantidade: "", peso: "", observacao: "", saving: false,
}

// ── Colunas da grid de itens ───────────────────────────────────────────────────

const colsItem: TDataGridColumn<ItemPlanoAlimentarResponse>[] = [
  { label: "Horário",    width: "85px",
    render: (r) => <span>{formatarHorario(r.horario)}</span> },
  { label: "Refeição",   field: "refeicaoNome",
    render: (r) => <span>{r.refeicaoNome ?? "—"}</span> },
  { label: "Quantidade", width: "150px",
    render: (r) => <span>{r.quantidade ?? "—"}</span> },
  { label: "Peso",       width: "80px",
    render: (r) => <span>{r.peso != null ? `${r.peso}g` : "—"}</span> },
  { label: "Observação",
    render: (r) => {
      const obs = r.observacao ?? ""
      return <span>{obs.length > 50 ? obs.substring(0, 50) + "..." : obs || ""}</span>
    }
  },
]

// ── Componente principal ───────────────────────────────────────────────────────

export default function PlanoAlimentarForm() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [formKey,      setFormKey]      = useState(0)
  const [loading,      setLoading]      = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [sendingWpp,   setSendingWpp]   = useState(false)
  const [plano,        setPlano]        = useState<PlanoAlimentarResponse | null>(null)
  const [currentId,    setCurrentId]    = useState<string | undefined>(idParam)
  const [selectedDay,  setSelectedDay]  = useState<DiaSemana>("SEGUNDA")
  const [pessoaId,     setPessoaId]     = useState("")
  const [emitenteId,   setEmitenteId]   = useState("")
  const [refeicaoOptions, setRefeicaoOptions] = useState<{ value: string; label: string }[]>([])
  const [itemModal,    setItemModal]    = useState<ItemModal>(emptyItem)

  const isEdit = !!currentId

  // ── Carregar refeições ativas para o select do modal ──────────────────────────

  useEffect(() => {
    api.get("/refeicoes/ativas")
      .then(r => {
        setRefeicaoOptions(
          (r.data as { id: number; nome: string }[]).map(rf => ({
            value: String(rf.id),
            label: rf.nome,
          }))
        )
      })
      .catch(() => {})
  }, [])

  // ── Carregar plano ao montar / trocar currentId ────────────────────────────

  useEffect(() => {
    if (!currentId) { setPlano(null); return }
    setLoading(true)
    api.get<PlanoAlimentarResponse>(`/planos-alimentares/${currentId}`)
      .then(r => loadPlano(r.data))
      .catch(() => { showMessage("error", "Erro ao carregar plano alimentar"); navigate("/clinica/planos-alimentares") })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  function loadPlano(data: PlanoAlimentarResponse) {
    setPlano(data)
    setPessoaId(String(data.pessoaId))
    setEmitenteId(data.emitenteId ? String(data.emitenteId) : "")
    setFormKey(k => k + 1)
  }

  async function reload(id: string) {
    const r = await api.get<PlanoAlimentarResponse>(`/planos-alimentares/${id}`)
    loadPlano(r.data)
  }

  function handleNovo() {
    setCurrentId(undefined)
    setPlano(null)
    setPessoaId("")
    setEmitenteId("")
    setSelectedDay("SEGUNDA")
    setFormKey(k => k + 1)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────────

  async function handleSubmit(data: Record<string, string>) {
    if (!data.nome?.trim())  { showMessage("error", "Nome é obrigatório");           return }
    if (!pessoaId)           { showMessage("error", "Paciente é obrigatório");       return }
    if (!data.dataInicio)    { showMessage("error", "Data de início é obrigatória"); return }

    setSaving(true)
    try {
      const payload = {
        nome:       data.nome.trim(),
        pessoaId:   Number(pessoaId),
        emitenteId: emitenteId ? Number(emitenteId) : null,
        dataInicio: data.dataInicio,
        dataFim:    data.dataFim || null,
        observacao: data.observacao?.trim() || null,
        ativo:      data.ativo !== "false",
      }
      if (isEdit) {
        await api.put(`/planos-alimentares/${currentId}`, payload)
        showMessage("success", "Plano atualizado com sucesso!")
        await reload(currentId!)
      } else {
        const res = await api.post<PlanoAlimentarResponse>("/planos-alimentares", payload)
        showMessage("success", "Plano criado com sucesso!")
        const novoId = String(res.data.id)
        setCurrentId(novoId)
        await reload(novoId)
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao salvar plano alimentar")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Itens do dia selecionado ───────────────────────────────────────────────────

  const itensDodia = (plano?.itens ?? [])
    .filter(i => i.diaSemana === selectedDay)
    .sort((a, b) => a.horario.localeCompare(b.horario))

  // ── Modal: abrir edição de item ────────────────────────────────────────────────

  function openEditItem(item: ItemPlanoAlimentarResponse) {
    setItemModal({
      open:       true,
      editId:     item.id,
      diaSemana:  item.diaSemana,
      horario:    formatarHorario(item.horario),
      refeicaoId: item.refeicaoId ? String(item.refeicaoId) : "",
      quantidade: item.quantidade ?? "",
      peso:       item.peso != null ? String(item.peso) : "",
      observacao: item.observacao ?? "",
      saving:     false,
    })
  }

  // ── Salvar item ────────────────────────────────────────────────────────────────

  async function handleSalvarItem() {
    if (!itemModal.horario.trim()) { showMessage("error", "Horário é obrigatório"); return }
    setItemModal(m => ({ ...m, saving: true }))
    try {
      const payload = {
        diaSemana:  itemModal.diaSemana,
        horario:    itemModal.horario,
        refeicaoId: itemModal.refeicaoId ? Number(itemModal.refeicaoId) : null,
        quantidade: itemModal.quantidade.trim() || null,
        peso:       itemModal.peso ? Number(itemModal.peso) : null,
        observacao: itemModal.observacao.trim() || null,
      }
      if (itemModal.editId) {
        await api.put(`/planos-alimentares/${currentId}/itens/${itemModal.editId}`, payload)
        showMessage("success", "Refeição atualizada!")
      } else {
        await api.post(`/planos-alimentares/${currentId}/itens`, payload)
        showMessage("success", "Refeição adicionada!")
      }
      setItemModal(emptyItem)
      await reload(currentId!)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao salvar refeição")
      }
      setItemModal(m => ({ ...m, saving: false }))
    }
  }

  // ── Remover item ───────────────────────────────────────────────────────────────

  function handleRemoverItem(item: ItemPlanoAlimentarResponse) {
    ask(`Remover a refeição das ${formatarHorario(item.horario)}?`, [
      { label: "Cancelar", variant: "cancel",  onClick: () => {} },
      { label: "Remover",  variant: "confirm", onClick: async () => {
        try {
          await api.delete(`/planos-alimentares/${currentId}/itens/${item.id}`)
          showMessage("success", "Refeição removida!")
          await reload(currentId!)
        } catch {
          showMessage("error", "Erro ao remover refeição")
        }
      }},
    ])
  }

  // ── PDF ────────────────────────────────────────────────────────────────────────

  function buildDadosPlano(p: PlanoAlimentarResponse) {
    return {
      nome:         p.nome,
      pessoaNome:   p.pessoaNome,
      emitenteNome: p.emitenteNome ?? undefined,
      dataInicio:   formatarDataBR(p.dataInicio),
      dataFim:      p.dataFim ? formatarDataBR(p.dataFim) : undefined,
      observacao:   p.observacao ?? undefined,
      itens:        p.itens.map(i => ({
        diaSemana:    i.diaSemana,
        horario:      formatarHorario(i.horario),
        refeicaoNome: i.refeicaoNome ?? "—",
        quantidade:   i.quantidade ?? undefined,
        peso:         i.peso ?? undefined,
        observacao:   i.observacao ?? undefined,
      })),
    }
  }

  function handleImprimirPdf() {
    if (!plano) return
    const base64 = gerarPdfPlanoAlimentar(buildDadosPlano(plano))
    const link   = document.createElement("a")
    link.href     = "data:application/pdf;base64," + base64
    link.download = `plano-alimentar-${plano.pessoaNome}.pdf`
    link.click()
  }

  async function handleEnviarWhatsapp() {
    if (!plano) return
    setSendingWpp(true)
    try {
      const base64   = gerarPdfPlanoAlimentar(buildDadosPlano(plano))
      const fileName = `plano-alimentar-${plano.pessoaNome}.pdf`
      const caption  = `Plano Alimentar — ${plano.nome} — ${plano.pessoaNome}`
      await api.post(`/planos-alimentares/${currentId}/enviar-pdf`, {
        base64,
        fileName,
        caption,
        pessoaId: plano.pessoaId,
      })
      showMessage("success", "PDF enviado por WhatsApp com sucesso!")
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao enviar PDF")
      } else {
        showMessage("error", "Erro ao enviar PDF")
      }
    } finally {
      setSendingWpp(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <TPage title="Carregando..." breadcrumb={["Clínica", "Planos Alimentares"]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title     ={isEdit ? `Plano Alimentar — ${plano?.nome ?? ""}` : "Novo Plano Alimentar"}
      breadcrumb={["Clínica", "Planos Alimentares", isEdit ? "Editar" : "Novo"]}
    >
      <TForm key={formKey} onSubmit={handleSubmit}>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mb-2">
          <TEntry
            name        ="nome"
            label       ="Nome (*)"
            required
            width       ="100%"
            defaultValue={plano?.nome}
          />
          <TCombo
            name        ="ativo"
            label       ="Status"
            width       ="100%"
            defaultValue={plano ? (plano.ativo ? "true" : "false") : "true"}
            options     ={[
              { value: "true",  label: "Ativo"   },
              { value: "false", label: "Inativo" },
            ]}
          />
          <TDbCombo
            name         ="pessoaId"
            label        ="Paciente (*)"
            url          ="/pessoas/select"
            valueField   ="id"
            displayField ={displayPessoa}
            searchField  ="nome"
            placeholder  ="Selecione o paciente..."
            width        ="100%"
            value        ={pessoaId}
            onChange     ={(val) => setPessoaId(val)}
          />
          <TDbCombo
            name         ="emitenteId"
            label        ="Emitente Responsável (opcional)"
            url          ="/emitentes/select"
            valueField   ="id"
            displayField ={displayEmitente}
            searchField  ="nome"
            placeholder  ="Selecione o responsável..."
            width        ="100%"
            value        ={emitenteId}
            onChange     ={(val) => setEmitenteId(val)}
          />
          <TDate
            name        ="dataInicio"
            label       ="Data Início (*)"
            width       ="160px"
            defaultValue={plano?.dataInicio}
          />
          <TDate
            name        ="dataFim"
            label       ="Data Fim (opcional)"
            width       ="160px"
            defaultValue={plano?.dataFim ?? ""}
          />
          <div className="md:col-span-2">
            <TText
              name        ="observacao"
              label       ="Observações"
              width       ="100%"
              height      ="80px"
              defaultValue={plano?.observacao ?? ""}
            />
          </div>
        </div>

        {/* ── Calendário Alimentar (somente em modo edição) ── */}
        {isEdit && (
          <TPanel title={`Calendário Alimentar${plano ? ` — ${plano.itens.length} ${plano.itens.length === 1 ? "refeição" : "refeições"}` : ""}`}>

            {/* Abas de dias da semana */}
            <div className="flex gap-1 mb-4 flex-wrap">
              {DIAS_SEMANA.map(dia => {
                const count = (plano?.itens ?? []).filter(i => i.diaSemana === dia).length
                return (
                  <button
                    key     ={dia}
                    type    ="button"
                    onClick ={() => setSelectedDay(dia)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      selectedDay === dia
                        ? "bg-(--accent) text-white border-(--accent)"
                        : "bg-white text-(--text) border-(--border) hover:bg-(--hover)"
                    }`}
                  >
                    {DIA_SEMANA_ABREV[dia]}{count > 0 ? ` (${count})` : ""}
                  </button>
                )
              })}
            </div>

            {/* Botão adicionar */}
            <div className="mb-2">
              <TButton
                label   ={`Adicionar — ${DIA_SEMANA_ABREV[selectedDay]}`}
                variant ="new"
                type    ="button"
                onClick ={() => setItemModal({ ...emptyItem, open: true, diaSemana: selectedDay })}
              />
            </div>

            {/* Grid de itens do dia */}
            <TDataGrid
              columns      ={colsItem}
              data         ={itensDodia}
              keyField     ="id"
              emptyMessage ={`Nenhuma refeição para ${DIA_SEMANA_LABEL[selectedDay]}`}
              actionsWidth ="100px"
              actions      ={(row) => (
                <>
                  <TButton label="" variant="edit"
                    onClick={(e) => { e?.stopPropagation(); openEditItem(row) }} />
                  <TButton label="" variant="delete"
                    onClick={(e) => { e?.stopPropagation(); handleRemoverItem(row) }} />
                </>
              )}
            />
          </TPanel>
        )}

        {/* ── Rodapé ── */}
        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Voltar" variant="cancel" type="button"
              onClick={() => navigate("/clinica/planos-alimentares")} />
            <TButton label="Novo" variant="new" type="button" onClick={handleNovo} />
          </TFormActionsLeft>
          <TFormActionsRight>
            {isEdit && plano && (
              <>
                <TButton label="Imprimir PDF"    variant="save"   type="button"
                  onClick={handleImprimirPdf} />
                <TButton label="Enviar WhatsApp" variant="save"   type="button"
                  loading={sendingWpp} onClick={handleEnviarWhatsapp} />
              </>
            )}
            <TButton label="Salvar" variant="save" type="submit" loading={saving} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>

      {/* ── Modal: adicionar / editar item ──────────────────────────────────────── */}
      <TWindow
        title   ={itemModal.editId ? "Editar Refeição" : "Adicionar Refeição"}
        open    ={itemModal.open}
        onClose ={() => setItemModal(emptyItem)}
        width   ="520px"
        actions ={
          <>
            <TButton label="Cancelar" variant="cancel" onClick={() => setItemModal(emptyItem)} />
            <TButton label="Salvar"   variant="save"   loading={itemModal.saving} onClick={handleSalvarItem} />
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex gap-4 flex-wrap">
            <TCombo
              name        ="item_dia"
              label       ="Dia da Semana"
              width       ="210px"
              defaultValue={itemModal.diaSemana}
              onChange    ={(val) => setItemModal(m => ({ ...m, diaSemana: val as DiaSemana }))}
              options     ={DIA_SEMANA_OPTIONS}
            />
            <TEntry
              name        ="item_horario"
              label       ="Horário"
              placeholder ="08:30"
              width       ="110px"
              mask        ="hora"
              defaultValue={itemModal.horario}
              onChange    ={(val) => setItemModal(m => ({ ...m, horario: val }))}
            />
          </div>
          <TCombo
            name        ="item_refeicao"
            label       ="Refeição"
            width       ="100%"
            defaultValue={itemModal.refeicaoId}
            onChange    ={(val) => setItemModal(m => ({ ...m, refeicaoId: val }))}
            options     ={[{ value: "", label: "— Sem refeição cadastrada —" }, ...refeicaoOptions]}
          />
          <div className="flex gap-4 flex-wrap">
            <TEntry
              name        ="item_quantidade"
              label       ="Quantidade"
              placeholder ="Ex: 1 porção, 2 colheres"
              width       ="220px"
              defaultValue={itemModal.quantidade}
              onChange    ={(val) => setItemModal(m => ({ ...m, quantidade: val }))}
            />
            <TEntry
              name        ="item_peso"
              label       ="Peso (g)"
              mask        ="numero"
              width       ="120px"
              defaultValue={itemModal.peso}
              onChange    ={(val) => setItemModal(m => ({ ...m, peso: val }))}
            />
          </div>
          <TText
            name        ="item_observacao"
            label       ="Observação"
            width       ="100%"
            height      ="80px"
            defaultValue={itemModal.observacao}
            onChange    ={(val) => setItemModal(m => ({ ...m, observacao: val }))}
          />
        </div>
      </TWindow>
    </TPage>
  )
}
