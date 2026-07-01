import { useState, useEffect } from "react"
import axios from "axios"
import { api } from "../../../services/api"
import { useMessage } from "../../../hooks/useMessage"
import type { ErrorResponse } from "../../../types/ErrorResponse"
import type { AndamentoResponse } from "../../../types/Andamento"
import type {
  FluxoKanbanColunaResponse,
  FluxoKanbanColunaPayload,
} from "../../../types/FluxoKanban"
import { TPage } from "../../../components/tpage"
import { TForm, TFormFooter, TFormActionsRight } from "../../../components/tform"
import { TRow } from "../../../components/trow"
import { TCol } from "../../../components/tcol"
import { TCombo } from "../../../components/tcombo"
import { TPanel } from "../../../components/tpanel"
import { TButton } from "../../../components/tbutton"

type ColunaLocal = {
  andamentoId:   number
  andamentoNome: string
  cor:           string | null
  sistema:       boolean
}

export default function FluxoKanbanForm() {
  const { showMessage } = useMessage()

  const [disponiveis, setDisponiveis] = useState<AndamentoResponse[]>([])
  const [colunas,     setColunas]     = useState<ColunaLocal[]>([])
  const [selecionado, setSelecionado] = useState("")
  const [comboKey,    setComboKey]    = useState(0)
  const [loading,     setLoading]     = useState(false)
  const [saving,      setSaving]      = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [andRes, fluxoRes] = await Promise.all([
        api.get("/crm/andamentos"),
        api.get("/crm/fluxo-kanban"),
      ])
      const andamentos = (andRes.data ?? []) as AndamentoResponse[]
      const fluxo      = (fluxoRes.data ?? []) as FluxoKanbanColunaResponse[]

      setDisponiveis(andamentos)
      setColunas(
        fluxo.map((c) => ({
          andamentoId:   c.andamentoId,
          andamentoNome: c.andamentoNome,
          cor:           c.cor,
          sistema:       c.sistema,
        }))
      )
      setSelecionado("")
      setComboKey((prev) => prev + 1)
    } catch {
      showMessage("error", "Erro ao carregar fluxo Kanban")
    } finally {
      setLoading(false)
    }
  }

  const naoIncluidos = disponiveis.filter(
    (a) => !colunas.some((c) => c.andamentoId === a.id)
  )

  function handleAdicionar() {
    if (!selecionado) {
      showMessage("warning", "Selecione um andamento para adicionar")
      return
    }
    const andamento = disponiveis.find((a) => String(a.id) === selecionado)
    if (!andamento) return

    setColunas((prev) => [
      ...prev,
      {
        andamentoId:   andamento.id,
        andamentoNome: andamento.nome,
        cor:           andamento.cor,
        sistema:       andamento.sistema,
      },
    ])
    setSelecionado("")
    setComboKey((prev) => prev + 1)
  }

  function handleSubir(index: number) {
    if (index <= 0) return
    setColunas((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  function handleDescer(index: number) {
    setColunas((prev) => {
      if (index >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
      return next
    })
  }

  function handleRemover(andamentoId: number) {
    setColunas((prev) => prev.filter((c) => c.andamentoId !== andamentoId))
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      const payload: FluxoKanbanColunaPayload[] = colunas.map((c, i) => ({
        andamentoId: c.andamentoId,
        ordem:       i,
      }))
      await api.put("/crm/fluxo-kanban", payload)
      showMessage("success", "Fluxo Kanban salvo com sucesso!")
      await load()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao salvar fluxo Kanban")
      } else {
        showMessage("error", "Erro inesperado ao salvar fluxo Kanban")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <TPage title="Carregando..." breadcrumb={["CRM", "Auxiliar CRM", "Fluxo Kanban"]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage title="Fluxo Kanban" breadcrumb={["CRM", "Auxiliar CRM", "Fluxo Kanban"]}>
      <TForm onSubmit={handleSubmit}>
        <TPanel title="Andamentos do fluxo">
          <TRow align="end">
            <TCol>
              <TCombo
                key          ={comboKey}
                name         ="andamentoSelecionado"
                label        ="Adicionar andamento"
                width        ="300px"
                defaultValue ={selecionado}
                onChange     ={setSelecionado}
                placeholder  ={naoIncluidos.length ? "Selecione..." : "Nenhum andamento disponível"}
                options      ={naoIncluidos.map((a) => ({
                  value: String(a.id),
                  label: a.nome,
                }))}
              />
            </TCol>
            <TButton
              label    ="Adicionar"
              variant  ="new"
              type     ="button"
              disabled ={!selecionado}
              onClick  ={handleAdicionar}
            />
          </TRow>

          <div className="flex flex-col gap-2 mt-2">
            {colunas.length === 0 ? (
              <p className="text-sm text-(--text-muted) py-4 text-center">
                Nenhum andamento no fluxo. Adicione andamentos acima.
              </p>
            ) : (
              colunas.map((c, index) => (
                <div
                  key       ={c.andamentoId}
                  className ="flex items-center gap-3 px-3 py-2 rounded-md border border-(--border) bg-(--bg-surface)"
                >
                  <span className="text-xs font-mono text-(--text-muted) w-6 text-center shrink-0">
                    {index + 1}
                  </span>
                  <span
                    className ="w-3 h-3 rounded-full shrink-0 border border-(--border)"
                    style     ={{ backgroundColor: c.cor ?? "transparent" }}
                  />
                  <span className="flex-1 min-w-0 truncate text-sm text-(--text-primary)">
                    {c.andamentoNome}
                    {c.sistema && (
                      <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-(--accent-light) text-(--accent)">
                        Padrão
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <TButton
                      label    ="↑"
                      variant  ="secondary"
                      type     ="button"
                      disabled ={index === 0}
                      onClick  ={() => handleSubir(index)}
                    />
                    <TButton
                      label    ="↓"
                      variant  ="secondary"
                      type     ="button"
                      disabled ={index === colunas.length - 1}
                      onClick  ={() => handleDescer(index)}
                    />
                    <TButton
                      label   =""
                      variant ="delete"
                      type    ="button"
                      onClick ={() => handleRemover(c.andamentoId)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </TPanel>

        <TFormFooter>
          <TFormActionsRight>
            <TButton label="Salvar" variant="save" type="submit" loading={saving} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
