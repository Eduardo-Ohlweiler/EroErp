import { useState, useEffect } from "react"
import axios from "axios"
import { api } from "../../../services/api"
import { useMessage } from "../../../hooks/useMessage"
import { useQuestion } from "../../../hooks/useQuestion"
import type { ErrorResponse } from "../../../types/ErrorResponse"
import type { AndamentoResponse, AndamentoPayload } from "../../../types/Andamento"
import type { TDataGridColumn } from "../../../types/TDataGridColumn"
import { TPage } from "../../../components/tpage"
import { TRow } from "../../../components/trow"
import { TCol } from "../../../components/tcol"
import { TEntry } from "../../../components/tentry"
import { TCombo } from "../../../components/tcombo"
import { TButton } from "../../../components/tbutton"
import { TDataGrid } from "../../../components/tdatagrid"
import { TWindow } from "../../../components/twindow"

function boolLabel(value: boolean): string {
  return value ? "✓" : "—"
}

export default function AndamentoList() {
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [data,    setData]    = useState<AndamentoResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)

  const [windowOpen, setWindowOpen] = useState(false)
  const [editando,   setEditando]   = useState<AndamentoResponse | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await api.get("/crm/andamentos")
      setData(res.data ?? [])
    } catch {
      showMessage("error", "Erro ao carregar andamentos")
    } finally {
      setLoading(false)
    }
  }

  function handleNovo() {
    setEditando(null)
    setWindowOpen(true)
  }

  function handleEditar(row: AndamentoResponse) {
    setEditando(row)
    setWindowOpen(true)
  }

  async function handleSalvar(form: Record<string, string>) {
    setSaving(true)
    try {
      const payload: AndamentoPayload = {
        nome:               form.nome ?? "",
        ativo:              form.ativo === "true",
        concluiAtendimento: form.concluiAtendimento === "true",
        cancelaAtendimento: form.cancelaAtendimento === "true",
        cor:                form.cor?.trim() ? form.cor.trim() : null,
      }

      if (editando) {
        await api.put(`/crm/andamentos/${editando.id}`, payload)
        showMessage("success", "Andamento atualizado com sucesso!")
      } else {
        await api.post("/crm/andamentos", payload)
        showMessage("success", "Andamento criado com sucesso!")
      }
      setWindowOpen(false)
      await load()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao salvar andamento")
      } else {
        showMessage("error", "Erro inesperado ao salvar andamento")
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleExcluir(row: AndamentoResponse) {
    try {
      await api.delete(`/crm/andamentos/${row.id}`)
      showMessage("success", "Andamento excluído com sucesso!")
      await load()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao excluir andamento")
      } else {
        showMessage("error", "Erro inesperado ao excluir andamento")
      }
    }
  }

  const columns: TDataGridColumn<AndamentoResponse>[] = [
    { label: "Nome", field: "nome" },
    {
      label: "Ativo", width: "90px", align: "center",
      render: (row) => boolLabel(row.ativo),
    },
    {
      label: "Conclui atendimento", width: "160px", align: "center",
      render: (row) => boolLabel(row.concluiAtendimento),
    },
    {
      label: "Cancela atendimento", width: "160px", align: "center",
      render: (row) => boolLabel(row.cancelaAtendimento),
    },
    {
      label: "Tipo", width: "130px", align: "center",
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-xs font-medium
          ${row.sistema
            ? "bg-(--accent-light) text-(--accent)"
            : "bg-(--metal-200) text-(--text-secondary)"}`}>
          {row.sistema ? "Padrão" : "Personalizado"}
        </span>
      ),
    },
  ]

  return (
    <TPage title="Andamentos CRM" breadcrumb={["CRM", "Auxiliar CRM", "Andamentos"]}>
      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhum andamento cadastrado"
        actionsWidth ="120px"
        onAdd        ={handleNovo}
        actions      ={(row) =>
          row.sistema ? null : (
            <>
              <TButton
                label   =""
                variant ="edit"
                onClick ={(e) => { e?.stopPropagation(); handleEditar(row) }}
              />
              <TButton
                label   =""
                variant ="delete"
                onClick ={(e) => {
                  e?.stopPropagation()
                  ask(
                    `Deseja excluir o andamento "${row.nome}"?`,
                    [
                      { label: "Cancelar", variant: "cancel", onClick: () => {} },
                      { label: "Excluir",  variant: "delete", onClick: () => handleExcluir(row) },
                    ]
                  )
                }}
              />
            </>
          )
        }
      />

      <TWindow
        title   ={editando ? "Editar Andamento" : "Novo Andamento"}
        open    ={windowOpen}
        width   ="560px"
        onClose ={() => setWindowOpen(false)}
        actions ={
          <TButton
            label   ={editando ? "Salvar" : "Adicionar"}
            variant ="save"
            type    ="submit"
            form    ="andamento-form"
            loading ={saving}
          />
        }
      >
        <form
          id        ="andamento-form"
          key       ={editando?.id ?? "novo"}
          className ="flex flex-col gap-4"
          onSubmit  ={(e) => {
            e.preventDefault()
            const inputs = e.currentTarget.querySelectorAll<
              HTMLInputElement | HTMLSelectElement
            >("input, select")
            const data: Record<string, string> = {}
            inputs.forEach((el) => {
              if (!el.name) return
              data[el.name] = el.value
            })
            handleSalvar(data)
          }}
        >
          <TRow>
            <TCol>
              <TEntry
                name         ="nome"
                label        ="Nome"
                required
                maxLength    ={100}
                width        ="100%"
                defaultValue ={editando?.nome}
              />
            </TCol>
          </TRow>
          <TRow>
            <TCol>
              <TCombo
                name         ="ativo"
                label        ="Ativo"
                width        ="200px"
                defaultValue ={editando ? (editando.ativo ? "true" : "false") : "true"}
                options      ={[
                  { value: "true",  label: "Sim" },
                  { value: "false", label: "Não" },
                ]}
              />
            </TCol>
          </TRow>
          <TRow>
            <TCol>
              <TCombo
                name         ="concluiAtendimento"
                label        ="Conclui atendimento"
                width        ="200px"
                defaultValue ={editando ? (editando.concluiAtendimento ? "true" : "false") : "false"}
                options      ={[
                  { value: "true",  label: "Sim" },
                  { value: "false", label: "Não" },
                ]}
              />
            </TCol>
            <TCol>
              <TCombo
                name         ="cancelaAtendimento"
                label        ="Cancela atendimento"
                width        ="200px"
                defaultValue ={editando ? (editando.cancelaAtendimento ? "true" : "false") : "false"}
                options      ={[
                  { value: "true",  label: "Sim" },
                  { value: "false", label: "Não" },
                ]}
              />
            </TCol>
          </TRow>
          <TRow>
            <TCol>
              <TEntry
                name         ="cor"
                label        ="Cor"
                maxLength    ={20}
                placeholder  ="#RRGGBB"
                width        ="160px"
                defaultValue ={editando?.cor ?? ""}
              />
            </TCol>
          </TRow>
        </form>
      </TWindow>
    </TPage>
  )
}
