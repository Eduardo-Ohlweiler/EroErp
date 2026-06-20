import { useEffect, useState }                                    from "react"
import { useNavigate, useParams }                                  from "react-router-dom"
import axios                                                       from "axios"
import { api }                                                     from "../../services/api"
import type { SuplementoPayload, SuplementoResponse }              from "../../types/TerapiaNutricional"
import type { ErrorResponse }                                      from "../../types/ErrorResponse"
import { TPage }                                                   from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TRow }                                                    from "../../components/trow"
import { TCol }                                                    from "../../components/tcol"
import { TEntry }                                                  from "../../components/tentry"
import { TCombo }                                                  from "../../components/tcombo"
import { TButton }                                                 from "../../components/tbutton"
import { useMessage }                                              from "../../hooks/useMessage"

function num(v: string): number | null {
  if (!v || v.trim() === "") return null
  const n = parseFloat(v.replace(",", "."))
  return Number.isNaN(n) ? null : n
}

export default function SuplementoForm() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()

  const [formKey, setFormKey]    = useState(0)
  const [loading, setLoading]    = useState(false)
  const [saving,  setSaving]     = useState(false)
  const [suple,   setSuple]      = useState<SuplementoResponse | null>(null)

  const isEdit = !!idParam

  useEffect(() => {
    if (!idParam) return
    setLoading(true)
    api.get<SuplementoResponse>(`/suplementos/${idParam}`)
      .then(r => { setSuple(r.data); setFormKey(k => k + 1) })
      .catch(() => { showMessage("error", "Erro ao carregar suplemento"); navigate("/terapia-nutricional/suplementos") })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam])

  async function handleSubmit(data: Record<string, string>) {
    if (!data.nome?.trim()) { showMessage("error", "Nome é obrigatório"); return }

    const payload: SuplementoPayload = {
      nome:     data.nome.trim(),
      qtdG:     num(data.qtdG),
      kcal:     num(data.kcal),
      ptn:      num(data.ptn),
      cho:      num(data.cho),
      acucar:   num(data.acucar),
      lip:      num(data.lip),
      sodio:    num(data.sodio),
      potassio: num(data.potassio),
      fosforo:  num(data.fosforo),
      ferro:    num(data.ferro),
      fibras:   num(data.fibras),
      osmolaridade: num(data.osmolaridade),
      ativo:    data.ativo !== "false",
    }

    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/suplementos/${idParam}`, payload)
        showMessage("success", "Suplemento atualizado com sucesso!")
      } else {
        await api.post<SuplementoResponse>("/suplementos", payload)
        showMessage("success", "Suplemento criado com sucesso!")
      }
      navigate("/terapia-nutricional/suplementos")
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao salvar suplemento")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setSaving(false)
    }
  }

  const dv = (v: number | null | undefined) => (v != null ? String(v) : "")

  if (loading) {
    return (
      <TPage title="Carregando..." breadcrumb={["Terapia Nutricional", "Suplementos"]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title     ={isEdit ? `Suplemento — ${suple?.nome ?? ""}` : "Novo Suplemento"}
      breadcrumb={["Terapia Nutricional", "Suplementos", isEdit ? "Editar" : "Novo"]}
    >
      <TForm key={formKey} onSubmit={handleSubmit}>
        <TRow>
          <TCol>
            <TEntry name="nome" label="Nome" required width="60%" defaultValue={suple?.nome} />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry name="qtdG" label="Porção (g)" placeholder="Ex: 200" width="180px"
              mask="numerodecimal2" defaultValue={dv(suple?.qtdG)} />
          </TCol>
          <TCol>
            <TEntry name="kcal" label="Calorias (kcal)" placeholder="Ex: 300" width="180px"
              mask="numerodecimal2" defaultValue={dv(suple?.kcal)} />
          </TCol>
          <TCol>
            <TEntry name="ptn" label="Proteína (g)" placeholder="Ex: 20" width="180px"
              mask="numerodecimal2" defaultValue={dv(suple?.ptn)} />
          </TCol>
          <TCol>
            <TEntry name="cho" label="Carboidrato (g)" placeholder="Ex: 40" width="180px"
              mask="numerodecimal2" defaultValue={dv(suple?.cho)} />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry name="acucar" label="Açúcar (g)" placeholder="Ex: 10" width="180px"
              mask="numerodecimal2" defaultValue={dv(suple?.acucar)} />
          </TCol>
          <TCol>
            <TEntry name="lip" label="Lipídios (g)" placeholder="Ex: 8" width="180px"
              mask="numerodecimal2" defaultValue={dv(suple?.lip)} />
          </TCol>
          <TCol>
            <TEntry name="fibras" label="Fibras (g)" placeholder="Ex: 3" width="180px"
              mask="numerodecimal2" defaultValue={dv(suple?.fibras)} />
          </TCol>
          <TCol>
            <TEntry name="sodio" label="Sódio (mg)" placeholder="Ex: 150" width="180px"
              mask="numerodecimal2" defaultValue={dv(suple?.sodio)} />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry name="potassio" label="Potássio (mg)" placeholder="Ex: 200" width="180px"
              mask="numerodecimal2" defaultValue={dv(suple?.potassio)} />
          </TCol>
          <TCol>
            <TEntry name="fosforo" label="Fósforo (mg)" placeholder="Ex: 100" width="180px"
              mask="numerodecimal2" defaultValue={dv(suple?.fosforo)} />
          </TCol>
          <TCol>
            <TEntry name="ferro" label="Ferro (mg)" placeholder="Ex: 5" width="180px"
              mask="numerodecimal2" defaultValue={dv(suple?.ferro)} />
          </TCol>
          <TCol>
            <TEntry name="osmolaridade" label="Osmolaridade (mOsm/L)" placeholder="Ex: 440" width="180px"
              mask="numerodecimal2" defaultValue={dv(suple?.osmolaridade)} />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TCombo name="ativo" label="Status" width="180px"
              defaultValue={suple ? (suple.ativo ? "true" : "false") : "true"}
              options={[
                { value: "true",  label: "Ativo"   },
                { value: "false", label: "Inativo" },
              ]} />
          </TCol>
        </TRow>

        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Voltar" variant="cancel" type="button"
              onClick={() => navigate("/terapia-nutricional/suplementos")} />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="Salvar" variant="save" type="submit" loading={saving} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
