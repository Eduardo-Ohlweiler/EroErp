import { useEffect, useState }                                    from "react"
import { useNavigate, useParams }                                  from "react-router-dom"
import axios                                                       from "axios"
import { api }                                                     from "../../services/api"
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

interface Exercicio {
  id:        number
  nome:      string
  descricao: string | null
  ativo:     boolean
}

export default function ExercicioForm() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()

  const [formKey,   setFormKey]   = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [exercicio, setExercicio] = useState<Exercicio | null>(null)
  const [currentId, setCurrentId] = useState<string | undefined>(idParam)

  const isEdit = !!currentId

  useEffect(() => {
    if (!currentId) { setExercicio(null); return }
    setLoading(true)
    api.get<Exercicio>(`/exercicios/${currentId}`)
      .then(r => loadExercicio(r.data))
      .catch(() => { showMessage("error", "Erro ao carregar exercício"); navigate("/gym/exercicios") })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  function loadExercicio(data: Exercicio) {
    setExercicio(data)
    setFormKey(k => k + 1)
  }

  async function reload(id: string) {
    const r = await api.get<Exercicio>(`/exercicios/${id}`)
    loadExercicio(r.data)
  }

  function handleNovo() {
    setCurrentId(undefined)
    setExercicio(null)
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
        await api.put(`/exercicios/${currentId}`, payload)
        showMessage("success", "Exercício atualizado com sucesso!")
        await reload(currentId!)
      } else {
        const res = await api.post<Exercicio>("/exercicios", payload)
        showMessage("success", "Exercício criado com sucesso!")
        const novoId = String(res.data.id)
        setCurrentId(novoId)
        await reload(novoId)
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao salvar exercício")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <TPage title="Carregando..." breadcrumb={["Gym", "Auxiliar Gym", "Exercícios"]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title     ={isEdit ? `Exercício — ${exercicio?.nome ?? ""}` : "Novo Exercício"}
      breadcrumb={["Gym", "Auxiliar Gym", "Exercícios", isEdit ? "Editar" : "Novo"]}
    >
      <TForm key={formKey} onSubmit={handleSubmit}>
        <TRow>
          <TCol>
            <TEntry
              name        ="nome"
              label       ="Nome (*)"
              required
              width       ="50%"
              minWidth    ="200px"
              defaultValue={exercicio?.nome}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TText
              name        ="descricao"
              label       ="Descrição"
              width       ="50%"
              minWidth    ="200px"
              height      ="80px"
              defaultValue={exercicio?.descricao ?? ""}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TCombo
              name        ="ativo"
              label       ="Status"
              width       ="200px"
              defaultValue={exercicio ? (exercicio.ativo ? "true" : "false") : "true"}
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
              onClick={() => navigate("/gym/exercicios")} />
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
