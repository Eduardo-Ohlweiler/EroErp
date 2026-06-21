import { useEffect, useState }                                    from "react"
import { useNavigate, useParams }                                  from "react-router-dom"
import axios                                                       from "axios"
import { api }                                                     from "../../services/api"
import type { FormulaEnteralPayload, FormulaEnteralResponse }      from "../../types/TerapiaNutricional"
import type { ErrorResponse }                                      from "../../types/ErrorResponse"
import { TPage }                                                   from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TRow }                                                    from "../../components/trow"
import { TCol }                                                    from "../../components/tcol"
import { TEntry }                                                  from "../../components/tentry"
import { TCombo }                                                  from "../../components/tcombo"
import { TButton }                                                 from "../../components/tbutton"
import { useMessage }                                              from "../../hooks/useMessage"
import { TSpace } from "../../components/tspace"

function num(v: string): number | null {
  if (!v || v.trim() === "") return null
  const n = parseFloat(v.replace(",", "."))
  return Number.isNaN(n) ? null : n
}

export default function FormulaEnteralForm() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()

  const [formKey, setFormKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [formula, setFormula] = useState<FormulaEnteralResponse | null>(null)

  const isEdit = !!idParam

  useEffect(() => {
    if (!idParam) return
    setLoading(true)
    api.get<FormulaEnteralResponse>(`/formulas-enterais/${idParam}`)
      .then(r => { setFormula(r.data); setFormKey(k => k + 1) })
      .catch(() => { showMessage("error", "Erro ao carregar fórmula"); navigate("/terapia-nutricional/formulas-enterais") })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam])

  async function handleSubmit(data: Record<string, string>) {
    if (!data.nome?.trim()) { showMessage("error", "Nome é obrigatório"); return }
    const dens = num(data.densidadeKcalMl)
    const prot = num(data.proteinaGL)
    if (dens == null) { showMessage("error", "Informe a densidade calórica (kcal/ml)"); return }
    if (prot == null) { showMessage("error", "Informe a proteína por litro (g/L)"); return }

    const payload: FormulaEnteralPayload = {
      nome:            data.nome.trim(),
      densidadeKcalMl: dens,
      proteinaGL:      prot,
      categoria:       data.categoria?.trim() ? data.categoria.trim() : null,
      cho:             num(data.cho),
      lip:             num(data.lip),
      fibras:          num(data.fibras),
      potassio:        num(data.potassio),
      osmolaridade:    num(data.osmolaridade),
      ativo:           data.ativo !== "false",
    }

    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/formulas-enterais/${idParam}`, payload)
        showMessage("success", "Fórmula atualizada com sucesso!")
      } else {
        await api.post<FormulaEnteralResponse>("/formulas-enterais", payload)
        showMessage("success", "Fórmula criada com sucesso!")
      }
      navigate("/terapia-nutricional/formulas-enterais")
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao salvar fórmula")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <TPage title="Carregando..." breadcrumb={["Terapia Nutricional", "Fórmulas Enterais"]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title     ={isEdit ? `Fórmula — ${formula?.nome ?? ""}` : "Nova Fórmula Enteral"}
      breadcrumb={["Terapia Nutricional", "Fórmulas Enterais", isEdit ? "Editar" : "Nova"]}
    >
      <TForm key={formKey} onSubmit={handleSubmit}>
        <TRow>
          <TCol>
            <TEntry name="nome" label="Nome" required width="50%"
              defaultValue={formula?.nome} />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry name="categoria" label="Categoria" width="50%"
              placeholder="Ex: Hipercalórica, Padrão..."
              defaultValue={formula?.categoria ?? ""} />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry name="densidadeKcalMl" label="Densidade (kcal/ml)" required
              placeholder="Ex: 1.5" width="200px"
              defaultValue={formula?.densidadeKcalMl != null ? String(formula.densidadeKcalMl) : ""} />
          </TCol>
          <TCol>
            <TEntry name="proteinaGL" label="Proteína (g/L)" required
              placeholder="Ex: 60" width="200px"
              defaultValue={formula?.proteinaGL != null ? String(formula.proteinaGL) : ""} />
          </TCol>
          <TSpace />
        </TRow>
        <TRow>
          <TCol>
            <TEntry name="cho" label="Carboidrato (g/L)" width="200px" placeholder="Ex: 170"
              defaultValue={formula?.cho != null ? String(formula.cho) : ""} />
          </TCol>
          <TCol>
            <TEntry name="lip" label="Lipídio (g/L)" width="200px" placeholder="Ex: 45"
              defaultValue={formula?.lip != null ? String(formula.lip) : ""} />
          </TCol>
          <TSpace />
        </TRow>
        <TRow>
          <TCol>
            <TEntry name="fibras" label="Fibras (g/L)" width="200px" placeholder="Ex: 15"
              defaultValue={formula?.fibras != null ? String(formula.fibras) : ""} />
          </TCol>
          <TCol>
            <TEntry name="potassio" label="Potássio (mg/L)" width="200px" placeholder="Ex: 1500"
              defaultValue={formula?.potassio != null ? String(formula.potassio) : ""} />
          </TCol>
          <TSpace />
        </TRow>
        <TRow>
          <TCol>
            <TEntry name="osmolaridade" label="Osmolaridade (mOsm/L)" width="200px" placeholder="Ex: 350"
              defaultValue={formula?.osmolaridade != null ? String(formula.osmolaridade) : ""} />
          </TCol>

        </TRow>
        <TRow>
          <TCol>
            <TCombo name="ativo" label="Status" width="200px"
              defaultValue={formula ? (formula.ativo ? "true" : "false") : "true"}
              options={[
                { value: "true",  label: "Ativo"   },
                { value: "false", label: "Inativo" },
              ]} />
          </TCol>
        </TRow>

        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Voltar" variant="cancel" type="button"
              onClick={() => navigate("/terapia-nutricional/formulas-enterais")} />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="Salvar" variant="save" type="submit" loading={saving} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
