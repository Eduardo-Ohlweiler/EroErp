import { useEffect, useState }                                    from "react"
import { useNavigate, useParams }                                  from "react-router-dom"
import axios                                                       from "axios"
import { api }                                                     from "../../services/api"
import type { FormulaLacteaPayload, FormulaLacteaResponse }        from "../../types/Pediatria"
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

export default function FormulaLacteaForm() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()

  const [formKey, setFormKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [formula, setFormula] = useState<FormulaLacteaResponse | null>(null)

  const isEdit = !!idParam

  useEffect(() => {
    if (!idParam) return
    setLoading(true)
    api.get<FormulaLacteaResponse>(`/formulas-lacteas/${idParam}`)
      .then(r => { setFormula(r.data); setFormKey(k => k + 1) })
      .catch(() => { showMessage("error", "Erro ao carregar fórmula"); navigate("/pediatria/formulas-lacteas") })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam])

  async function handleSubmit(data: Record<string, string>) {
    if (!data.nome?.trim()) { showMessage("error", "Nome é obrigatório"); return }
    const kcal = num(data.kcalPor100ml)
    const prot = num(data.proteinaPor100ml)
    if (kcal == null) { showMessage("error", "Informe as calorias por 100ml"); return }
    if (prot == null) { showMessage("error", "Informe a proteína por 100ml"); return }

    const payload: FormulaLacteaPayload = {
      nome:             data.nome.trim(),
      kcalPor100ml:     kcal,
      proteinaPor100ml: prot,
      ativo:            data.ativo !== "false",
    }

    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/formulas-lacteas/${idParam}`, payload)
        showMessage("success", "Fórmula atualizada com sucesso!")
      } else {
        await api.post<FormulaLacteaResponse>("/formulas-lacteas", payload)
        showMessage("success", "Fórmula criada com sucesso!")
      }
      navigate("/pediatria/formulas-lacteas")
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
      <TPage title="Carregando..." breadcrumb={["Pediatria", "Fórmulas Lácteas"]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title     ={isEdit ? `Fórmula — ${formula?.nome ?? ""}` : "Nova Fórmula Láctea"}
      breadcrumb={["Pediatria", "Fórmulas Lácteas", isEdit ? "Editar" : "Nova"]}
    >
      <TForm key={formKey} onSubmit={handleSubmit}>
        <TRow>
          <TCol>
            <TEntry
              name        ="nome"
              label       ="Nome"
              required
              width       ="50%"
              minWidth    ="200px"
              defaultValue={formula?.nome}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry
              name        ="kcalPor100ml"
              label       ="Kcal / 100ml"
              required
              placeholder ="Ex: 67"
              width       ="200px"
              defaultValue={formula?.kcalPor100ml != null ? String(formula.kcalPor100ml) : ""}
            />
          </TCol>
          <TCol>
            <TEntry
              name        ="proteinaPor100ml"
              label       ="Proteína / 100ml (g)"
              required
              placeholder ="Ex: 1.4"
              width       ="200px"
              defaultValue={formula?.proteinaPor100ml != null ? String(formula.proteinaPor100ml) : ""}
            />
          </TCol>
          <TSpace />
        </TRow>
        <TRow>
          <TCol>
            <TCombo
              name        ="ativo"
              label       ="Status"
              width       ="200px"
              defaultValue={formula ? (formula.ativo ? "true" : "false") : "true"}
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
              onClick={() => navigate("/pediatria/formulas-lacteas")} />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="Salvar" variant="save" type="submit" loading={saving} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
