import { useEffect, useState }                                    from "react"
import { useNavigate, useParams }                                  from "react-router-dom"
import axios                                                       from "axios"
import { api }                                                     from "../../services/api"
import type { Refeicao }                                           from "../../types/PlanoAlimentar"
import type { ErrorResponse }                                      from "../../types/ErrorResponse"
import { TPage }                                                   from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TRow }                                                    from "../../components/trow"
import { TCol }                                                    from "../../components/tcol"
import { TEntry }                                                  from "../../components/tentry"
import { TCombo }                                                  from "../../components/tcombo"
import { TText }                                                   from "../../components/ttext"
import { TButton }                                                 from "../../components/tbutton"
import { useMessage }                                              from "../../hooks/useMessage"

export default function RefeicaoForm() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()

  const [formKey,   setFormKey]   = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [refeicao,  setRefeicao]  = useState<Refeicao | null>(null)
  const [currentId, setCurrentId] = useState<string | undefined>(idParam)

  const isEdit = !!currentId

  useEffect(() => {
    if (!currentId) { setRefeicao(null); return }
    setLoading(true)
    api.get<Refeicao>(`/refeicoes/${currentId}`)
      .then(r => loadRefeicao(r.data))
      .catch(() => { showMessage("error", "Erro ao carregar refeição"); navigate("/clinica/refeicoes") })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  function loadRefeicao(data: Refeicao) {
    setRefeicao(data)
    setFormKey(k => k + 1)
  }

  async function reload(id: string) {
    const r = await api.get<Refeicao>(`/refeicoes/${id}`)
    loadRefeicao(r.data)
  }

  function handleNovo() {
    setCurrentId(undefined)
    setRefeicao(null)
    setFormKey(k => k + 1)
  }

  async function handleSubmit(data: Record<string, string>) {
    if (!data.nome?.trim()) { showMessage("error", "Nome é obrigatório"); return }
    setSaving(true)
    try {
      const payload = {
        nome:      data.nome.trim(),
        descricao: data.descricao?.trim() || null,
        ativo:     data.ativo !== "false",
      }
      if (isEdit) {
        await api.put(`/refeicoes/${currentId}`, payload)
        showMessage("success", "Refeição atualizada com sucesso!")
        await reload(currentId!)
      } else {
        const res = await api.post<Refeicao>("/refeicoes", payload)
        showMessage("success", "Refeição criada com sucesso!")
        const novoId = String(res.data.id)
        setCurrentId(novoId)
        await reload(novoId)
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao salvar refeição")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <TPage title="Carregando..." breadcrumb={["Clínica", "Auxiliar Clínica", "Refeições"]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title     ={isEdit ? `Refeição — ${refeicao?.nome ?? ""}` : "Nova Refeição"}
      breadcrumb={["Clínica", "Auxiliar Clínica", "Refeições", isEdit ? "Editar" : "Nova"]}
    >
      <TForm key={formKey} onSubmit={handleSubmit}>
        <TRow>
          <TCol>
            <TEntry
              name        ="nome"
              label       ="Nome (*)"
              required
              width       ="60%"
              defaultValue={refeicao?.nome}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TText
              name        ="descricao"
              label       ="Descrição"
              width       ="100%"
              height      ="80px"
              defaultValue={refeicao?.descricao ?? ""}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TCombo
              name        ="ativo"
              label       ="Status"
              width       ="200px"
              defaultValue={refeicao ? (refeicao.ativo ? "true" : "false") : "true"}
              options     ={[
                { value: "true",  label: "Ativo"   },
                { value: "false", label: "Inativo" },
              ]}
            />
          </TCol>
        </TRow>

        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Voltar" variant="cancel" type="button"
              onClick={() => navigate("/clinica/refeicoes")} />
            <TButton label="Novo" variant="new" type="button" onClick={handleNovo} />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="Salvar" variant="save" type="submit" loading={saving} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
