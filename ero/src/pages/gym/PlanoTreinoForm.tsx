import { useEffect, useState }                                    from "react"
import { useNavigate, useParams }                                  from "react-router-dom"
import axios                                                       from "axios"
import { api }                                                     from "../../services/api"
import type {
  PlanoTreinoResponse,
  ItemPlanoTreinoResponse,
  DiaSemanaGym,
  TipoExecucao,
}                                                                  from "../../types/PlanoTreino"
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
import { displayPessoa, displayUsuario }                          from "../../utils/pessoas"
import {
  DIAS_SEMANA,
  DIA_SEMANA_LABEL,
  DIA_SEMANA_ABREV,
  DIA_SEMANA_OPTIONS,
  TIPO_EXECUCAO_OPTIONS,
  TIPO_EXECUCAO_LABEL,
  formatarDataBR,
  formatarPausa,
}                                                                  from "../../utils/planoTreino"
import { gerarPdfPlanoTreino }                                     from "../../utils/geradorPdf"

// ── Modal de item ──────────────────────────────────────────────────────────────

interface ItemModal {
  open:          boolean
  editId:        number | null
  diaSemana:     DiaSemanaGym
  ordem:         string
  exercicioId:   string
  series:        string
  repeticoes:    string
  tipoExecucao:  string
  pausaSegundos: string
  observacao:    string
  saving:        boolean
}

const emptyItem: ItemModal = {
  open: false, editId: null, diaSemana: "SEGUNDA",
  ordem: "", exercicioId: "", series: "", repeticoes: "",
  tipoExecucao: "NORMAL", pausaSegundos: "", observacao: "", saving: false,
}

// ── Colunas da grid de itens ───────────────────────────────────────────────────

const colsItem: TDataGridColumn<ItemPlanoTreinoResponse>[] = [
  { label: "Exercício",  field: "exercicioNome",
    render: (r) => <span>{r.exercicioNome ?? "—"}</span> },
  { label: "Séries",     width: "70px",  align: "center",
    render: (r) => <span>{r.series ?? "—"}</span> },
  { label: "Reps",       width: "80px",  align: "center",
    render: (r) => <span>{r.repeticoes ?? "—"}</span> },
  { label: "Execução",   width: "140px",
    render: (r) => <span>{r.tipoExecucao ? (TIPO_EXECUCAO_LABEL[r.tipoExecucao] ?? r.tipoExecucao) : "—"}</span> },
  { label: "Pausa",      width: "80px",  align: "center",
    render: (r) => <span>{formatarPausa(r.pausaSegundos)}</span> },
  { label: "Observação",
    render: (r) => {
      const obs = r.observacao ?? ""
      return <span>{obs.length > 50 ? obs.substring(0, 50) + "..." : obs || ""}</span>
    }
  },
]

// ── Componente principal ───────────────────────────────────────────────────────

export default function PlanoTreinoForm() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [formKey,     setFormKey]     = useState(0)
  const [loading,     setLoading]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [sendingWpp,  setSendingWpp]  = useState(false)
  const [cloning,     setCloning]     = useState(false)
  const [plano,       setPlano]       = useState<PlanoTreinoResponse | null>(null)
  const [currentId,   setCurrentId]   = useState<string | undefined>(idParam)
  const [selectedDay, setSelectedDay] = useState<DiaSemanaGym>("SEGUNDA")
  const [pessoaId,    setPessoaId]    = useState("")
  const [usuarioId,   setUsuarioId]   = useState("")
  const [exercicioOptions, setExercicioOptions] = useState<{ value: string; label: string }[]>([])
  const [itemModal,   setItemModal]   = useState<ItemModal>(emptyItem)

  const isEdit = !!currentId

  // ── Carregar exercícios ativos para o select do modal ─────────────────────────

  useEffect(() => {
    api.get("/exercicios/ativos")
      .then(r => {
        setExercicioOptions(
          (r.data as { id: number; nome: string }[]).map(e => ({
            value: String(e.id),
            label: e.nome,
          }))
        )
      })
      .catch(() => {})
  }, [])

  // ── Carregar plano ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!currentId) { setPlano(null); return }
    setLoading(true)
    api.get<PlanoTreinoResponse>(`/planos-treino/${currentId}`)
      .then(r => loadPlano(r.data))
      .catch(() => { showMessage("error", "Erro ao carregar plano de treino"); navigate("/gym/planos-treino") })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  function loadPlano(data: PlanoTreinoResponse) {
    setPlano(data)
    setPessoaId(String(data.pessoaId))
    setUsuarioId(data.usuarioId ? String(data.usuarioId) : "")
    setFormKey(k => k + 1)
  }

  async function reload(id: string) {
    const r = await api.get<PlanoTreinoResponse>(`/planos-treino/${id}`)
    loadPlano(r.data)
  }

  function handleNovo() {
    setCurrentId(undefined)
    setPlano(null)
    setPessoaId("")
    setUsuarioId("")
    setSelectedDay("SEGUNDA")
    setFormKey(k => k + 1)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────────

  async function handleSubmit(data: Record<string, string>) {
    if (!data.nome?.trim())  { showMessage("error", "Nome é obrigatório");           return }
    if (!pessoaId)           { showMessage("error", "Aluno é obrigatório");          return }
    if (!data.dataInicio)    { showMessage("error", "Data de início é obrigatória"); return }

    setSaving(true)
    try {
      const payload = {
        nome:       data.nome.trim(),
        pessoaId:   Number(pessoaId),
        usuarioId: usuarioId ? Number(usuarioId) : null,
        dataInicio: data.dataInicio,
        dataFim:    data.dataFim || null,
        observacao: data.observacao?.trim() || null,
        ativo:      data.ativo !== "false",
      }
      if (isEdit) {
        await api.put(`/planos-treino/${currentId}`, payload)
        showMessage("success", "Plano atualizado com sucesso!")
        await reload(currentId!)
      } else {
        const res = await api.post<PlanoTreinoResponse>("/planos-treino", payload)
        showMessage("success", "Plano criado com sucesso!")
        const novoId = String(res.data.id)
        setCurrentId(novoId)
        await reload(novoId)
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao salvar plano de treino")
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
    .sort((a, b) => a.ordem - b.ordem)

  // ── Modal: abrir edição de item ────────────────────────────────────────────────

  function openEditItem(item: ItemPlanoTreinoResponse) {
    setItemModal({
      open:          true,
      editId:        item.id,
      diaSemana:     item.diaSemana,
      ordem:         String(item.ordem),
      exercicioId:   item.exercicioId ? String(item.exercicioId) : "",
      series:        item.series != null ? String(item.series) : "",
      repeticoes:    item.repeticoes ?? "",
      tipoExecucao:  item.tipoExecucao ?? "NORMAL",
      pausaSegundos: item.pausaSegundos != null ? String(item.pausaSegundos) : "",
      observacao:    item.observacao ?? "",
      saving:        false,
    })
  }

  // ── Salvar item ────────────────────────────────────────────────────────────────

  async function handleSalvarItem() {
    setItemModal(m => ({ ...m, saving: true }))
    try {
      const payload = {
        diaSemana:     itemModal.diaSemana,
        ordem:         itemModal.ordem ? Number(itemModal.ordem) : null,
        exercicioId:   itemModal.exercicioId ? Number(itemModal.exercicioId) : null,
        series:        itemModal.series ? Number(itemModal.series) : null,
        repeticoes:    itemModal.repeticoes.trim() || null,
        tipoExecucao:  itemModal.tipoExecucao || null,
        pausaSegundos: itemModal.pausaSegundos ? Number(itemModal.pausaSegundos) : null,
        observacao:    itemModal.observacao.trim() || null,
      }
      if (itemModal.editId) {
        await api.put(`/planos-treino/${currentId}/itens/${itemModal.editId}`, payload)
        showMessage("success", "Exercício atualizado!")
      } else {
        await api.post(`/planos-treino/${currentId}/itens`, payload)
        showMessage("success", "Exercício adicionado!")
      }
      setItemModal(emptyItem)
      await reload(currentId!)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao salvar exercício")
      }
      setItemModal(m => ({ ...m, saving: false }))
    }
  }

  // ── Remover item ───────────────────────────────────────────────────────────────

  function handleRemoverItem(item: ItemPlanoTreinoResponse) {
    ask(`Remover o exercício "${item.exercicioNome ?? "sem nome"}"?`, [
      { label: "Cancelar", variant: "cancel",  onClick: () => {} },
      { label: "Remover",  variant: "confirm", onClick: async () => {
        try {
          await api.delete(`/planos-treino/${currentId}/itens/${item.id}`)
          showMessage("success", "Exercício removido!")
          await reload(currentId!)
        } catch {
          showMessage("error", "Erro ao remover exercício")
        }
      }},
    ])
  }

  // ── PDF ────────────────────────────────────────────────────────────────────────

  function buildDadosPlano(p: PlanoTreinoResponse) {
    return {
      nome:         p.nome,
      pessoaNome:   p.pessoaNome,
      emitenteNome: p.usuarioNome ?? undefined,
      dataInicio:   formatarDataBR(p.dataInicio),
      dataFim:      p.dataFim ? formatarDataBR(p.dataFim) : undefined,
      observacao:   p.observacao ?? undefined,
      itens:        p.itens.map(i => ({
        diaSemana:     i.diaSemana,
        ordem:         i.ordem,
        exercicioNome: i.exercicioNome ?? "—",
        series:        i.series,
        repeticoes:    i.repeticoes,
        tipoExecucao:  i.tipoExecucao,
        pausaSegundos: i.pausaSegundos,
        observacao:    i.observacao ?? undefined,
      })),
    }
  }

  function handleImprimirPdf() {
    if (!plano) return
    const base64 = gerarPdfPlanoTreino(buildDadosPlano(plano))
    const link   = document.createElement("a")
    link.href     = "data:application/pdf;base64," + base64
    link.download = `plano-treino-${plano.pessoaNome}.pdf`
    link.click()
  }

  async function handleEnviarWhatsapp() {
    if (!plano) return
    setSendingWpp(true)
    try {
      const base64   = gerarPdfPlanoTreino(buildDadosPlano(plano))
      const fileName = `plano-treino-${plano.pessoaNome}.pdf`
      const caption  = `Plano de Treino — ${plano.nome} — ${plano.pessoaNome}`
      await api.post(`/planos-treino/${currentId}/enviar-pdf`, {
        pdfBase64: base64,
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

  async function handleClonar() {
    setCloning(true)
    try {
      const res = await api.post<PlanoTreinoResponse>(`/planos-treino/${currentId}/clonar`)
      showMessage("success", "Plano de treino clonado com sucesso!")
      navigate(`/gym/planos-treino/${res.data.id}`)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao clonar plano de treino")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setCloning(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <TPage title="Carregando..." breadcrumb={["Gym", "Planos de Treino"]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title     ={isEdit ? `Plano de Treino — ${plano?.nome ?? ""}` : "Novo Plano de Treino"}
      breadcrumb={["Gym", "Planos de Treino", isEdit ? "Editar" : "Novo"]}
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
            label        ="Aluno (*)"
            url          ="/pessoas/select"
            valueField   ="id"
            displayField ={displayPessoa}
            searchField  ="nome"
            placeholder  ="Selecione o aluno..."
            width        ="100%"
            value        ={pessoaId}
            onChange     ={(val) => setPessoaId(val)}
          />
          <TDbCombo
            name         ="usuarioId"
            label        ="Personal / Responsável (opcional)"
            url          ="/usuarios/select-personal"
            valueField   ="id"
            displayField ={displayUsuario}
            searchField  ="nome"
            placeholder  ="Selecione o responsável..."
            width        ="100%"
            value        ={usuarioId}
            onChange     ={(val) => setUsuarioId(val)}
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

        {/* ── Grade de Treino (somente em modo edição) ── */}
        {isEdit && (
          <TPanel title={`Grade de Treino${plano ? ` — ${plano.itens.length} ${plano.itens.length === 1 ? "exercício" : "exercícios"}` : ""}`}>

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
              emptyMessage ={`Nenhum exercício para ${DIA_SEMANA_LABEL[selectedDay]}`}
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
              onClick={() => navigate("/gym/planos-treino")} />
            <TButton label="Novo" variant="new" type="button" onClick={handleNovo} />
          </TFormActionsLeft>
          <TFormActionsRight>
            {isEdit && (
              <TButton label="Clonar" variant="new" type="button" loading={cloning} onClick={handleClonar} />
            )}
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
        title   ={itemModal.editId ? "Editar Exercício" : "Adicionar Exercício"}
        open    ={itemModal.open}
        onClose ={() => setItemModal(emptyItem)}
        width   ="560px"
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
              onChange    ={(val) => setItemModal(m => ({ ...m, diaSemana: val as DiaSemanaGym }))}
              options     ={DIA_SEMANA_OPTIONS}
            />
          </div>
          <TCombo
            name        ="item_exercicio"
            label       ="Exercício"
            width       ="100%"
            defaultValue={itemModal.exercicioId}
            onChange    ={(val) => setItemModal(m => ({ ...m, exercicioId: val }))}
            options     ={[{ value: "", label: "— Sem exercício cadastrado —" }, ...exercicioOptions]}
          />
          <div className="flex gap-4 flex-wrap">
            <TEntry
              name        ="item_series"
              label       ="Séries"
              mask        ="numero"
              width       ="100px"
              defaultValue={itemModal.series}
              onChange    ={(val) => setItemModal(m => ({ ...m, series: val }))}
            />
            <TEntry
              name        ="item_repeticoes"
              label       ="Repetições"
              placeholder ="Ex: 12, 10-12, até falhar"
              width       ="200px"
              defaultValue={itemModal.repeticoes}
              onChange    ={(val) => setItemModal(m => ({ ...m, repeticoes: val }))}
            />
            <TEntry
              name        ="item_pausa"
              label       ="Pausa (segundos)"
              mask        ="numero"
              width       ="130px"
              defaultValue={itemModal.pausaSegundos}
              onChange    ={(val) => setItemModal(m => ({ ...m, pausaSegundos: val }))}
            />
          </div>
          <TCombo
            name        ="item_tipo_execucao"
            label       ="Tipo de Execução"
            width       ="100%"
            defaultValue={itemModal.tipoExecucao}
            onChange    ={(val) => setItemModal(m => ({ ...m, tipoExecucao: val as TipoExecucao }))}
            options     ={TIPO_EXECUCAO_OPTIONS}
          />
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
