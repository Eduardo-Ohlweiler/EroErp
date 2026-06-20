import { useEffect, useState }                                    from "react"
import { useNavigate, useParams }                                  from "react-router-dom"
import axios                                                       from "axios"
import { api }                                                     from "../../services/api"
import type {
  AvaliacaoNutricionalPayload,
  AvaliacaoNutricionalResponse,
}                                                                  from "../../types/TerapiaNutricional"
import type { ErrorResponse }                                      from "../../types/ErrorResponse"
import { TPage }                                                   from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TPanel }                                                  from "../../components/tpanel"
import { TRow }                                                    from "../../components/trow"
import { TCol }                                                    from "../../components/tcol"
import { TText }                                                   from "../../components/ttext"
import { TDate }                                                   from "../../components/tdate"
import { TDbCombo }                                                from "../../components/tdbcombo"
import { TButton }                                                 from "../../components/tbutton"
import { useMessage }                                              from "../../hooks/useMessage"
import { displayPessoa }                                           from "../../utils/pessoas"
import { useCalculoNutricional, num }                              from "./useCalculoNutricional"
import { PaineisNutricionais }                                     from "./PaineisNutricionais"
import type { Sexo }                                               from "./calculo/types"

function hoje(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function str(v: number | null): string {
  return v != null ? String(v) : ""
}

export default function AvaliacaoNutricionalForm() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const calc            = useCalculoNutricional()

  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [formKey,   setFormKey]   = useState(0)
  const [avaliacao, setAvaliacao] = useState<AvaliacaoNutricionalResponse | null>(null)

  const [pessoaId,  setPessoaId]  = useState("")
  const [usuarioId, setUsuarioId] = useState("")
  const [dataVal,   setDataVal]   = useState(hoje())

  useEffect(() => {
    if (idParam) carregarAvaliacao(idParam)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam])

  async function carregarAvaliacao(id: string) {
    setLoading(true)
    try {
      const res = await api.get<AvaliacaoNutricionalResponse>(`/avaliacoes-nutricionais/${id}`)
      const a   = res.data
      setAvaliacao(a)
      setPessoaId(String(a.pessoaId))
      setUsuarioId(a.usuarioId != null ? String(a.usuarioId) : "")
      setDataVal(a.dataAvaliacao)

      // Preenche os campos de entrada dos 4 painéis.
      calc.setSexoVal(a.sexo ?? "M")
      calc.setRacaVal(a.raca ?? "BRANCO")
      calc.setIdadeVal(str(a.idade))
      calc.setCbVal(str(a.cb))
      calc.setCpVal(str(a.cp))
      calc.setCaVal(str(a.ca))
      calc.setAjVal(str(a.aj))
      calc.setPesoVal(str(a.pesoAtual))
      calc.setPesoUVal(str(a.pesoUsual))
      calc.setAlturaVal(str(a.altura))
      calc.setFaseVal(a.fase ?? "AGUDA")
      calc.setKcalKgVal(str(a.kcalKgAlvo))
      calc.setPtnKgVal(str(a.ptnKgAlvo))
      calc.setFormulaId(a.formulaEnteralId != null ? String(a.formulaEnteralId) : "")
      calc.setModoVal(a.modoDieta ?? "CONTINUO")
      calc.setVolumeVal(str(a.volumeDieta))
      calc.setTempoVal(str(a.tempoDieta))
      calc.setVolDietaVal(str(a.hidratacaoVolumeDieta))

      // Recalcula ao abrir para popular os resultados exibidos.
      // (Defer para o próximo tick garante que os setters acima já aplicaram.)
      setFormKey(k => k + 1)
    } catch {
      showMessage("error", "Erro ao carregar avaliação nutricional")
    } finally {
      setLoading(false)
    }
  }

  // Após preencher as entradas (formKey muda) e quando as fórmulas chegam, recalcula
  // com base no estado já atualizado — repopula os resultados exibidos em edição.
  useEffect(() => {
    if (avaliacao) calc.calcularTudo()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formKey, calc.formulas.length])

  async function handleSubmit(formData: Record<string, string>) {
    if (!pessoaId)              { showMessage("error", "Selecione o paciente"); return }
    if (!formData.dataAvaliacao) { showMessage("error", "Informe a data da avaliação"); return }

    const { rAntro, rNec, rDieta, rHidrat, formula } = calc.calcularTudo()

    const payload: AvaliacaoNutricionalPayload = {
      pessoaId:                 parseInt(pessoaId),
      usuarioId:                usuarioId ? parseInt(usuarioId) : null,
      dataAvaliacao:            formData.dataAvaliacao,
      // entradas
      sexo:                     calc.sexoVal,
      raca:                     calc.racaVal,
      idade:                    num(calc.idadeVal),
      cb:                       num(calc.cbVal),
      cp:                       num(calc.cpVal),
      ca:                       num(calc.caVal),
      aj:                       num(calc.ajVal),
      pesoAtual:                num(calc.pesoVal),
      pesoUsual:                num(calc.pesoUVal),
      altura:                   num(calc.alturaVal),
      // antropometria
      alturaEstimada:           rAntro.alturaEstimada,
      pesoEstimadoChumlea:      rAntro.pesoEstimadoChumlea,
      pesoEstimadoJung:         rAntro.pesoEstimadoJung,
      pesoEstimadoRabito:       rAntro.pesoEstimadoRabito,
      imc:                      rAntro.imc,
      classifImcOms:            rAntro.classifImcOms,
      classifImcOpas:           rAntro.classifImcOpas,
      pesoIdeal:                rAntro.pesoIdeal,
      pesoIdealImc25:           rAntro.pesoIdealImc25,
      pesoAjustado:             rAntro.pesoAjustado,
      percPerdaPeso:            rAntro.percPerdaPeso,
      classifPerdaPeso:         rAntro.classifPerdaPeso,
      percAdequacaoCb:          rAntro.percAdequacaoCb,
      classifAdequacaoCb:       rAntro.classifAdequacaoCb,
      classifDeplecaoCp:        rAntro.classifDeplecaoCp,
      // necessidades
      fase:                     calc.faseVal,
      kcalKgAlvo:               num(calc.kcalKgVal),
      ptnKgAlvo:                num(calc.ptnKgVal),
      kcalMin:                  rNec.kcalMin,
      kcalMax:                  rNec.kcalMax,
      ptnMin:                   rNec.ptnMin,
      ptnMax:                   rNec.ptnMax,
      kcalTotal:                rNec.kcalTotal,
      ptnTotal:                 rNec.ptnTotal,
      ptnHdIntermitente:        rNec.ptnHdIntermitente,
      ptnHdContinua:            rNec.ptnHdContinua,
      // dieta enteral
      formulaEnteralId:         formula ? formula.id : null,
      formulaNome:              formula ? formula.nome : null,
      formulaDensidadeKcalMl:   formula ? formula.densidadeKcalMl : null,
      formulaProteinaGL:        formula ? formula.proteinaGL : null,
      modoDieta:                calc.modoVal,
      volumeDieta:              num(calc.volumeVal),
      tempoDieta:               num(calc.tempoVal),
      dietaVt:                  rDieta.vt,
      dietaKcal:                rDieta.kcal,
      dietaPtn:                 rDieta.ptn,
      dietaKcalKg:              rDieta.kcalKg,
      dietaPtnKg:               rDieta.ptnKg,
      dietaPercVct:             rDieta.percVct,
      dietaPercPtn:             rDieta.percPtn,
      dietaVolumePleno:         rDieta.volumePleno,
      // hidratação
      hidratacaoVolumeDieta:    num(calc.volDietaVal),
      hidratacaoNecMin:         rHidrat.necMin,
      hidratacaoNecIdeal:       rHidrat.necIdeal,
      hidratacaoAguaDieta:      rHidrat.aguaDieta,
      hidratacaoAguaExtraMin:   rHidrat.aguaExtraMin,
      hidratacaoAguaExtraIdeal: rHidrat.aguaExtraIdeal,
      observacao:               formData.observacao?.trim() || null,
    }

    setSaving(true)
    try {
      if (idParam) {
        await api.put(`/avaliacoes-nutricionais/${idParam}`, payload)
        showMessage("success", "Avaliação atualizada com sucesso!")
        carregarAvaliacao(idParam)
      } else {
        const res = await api.post<AvaliacaoNutricionalResponse>("/avaliacoes-nutricionais", payload)
        showMessage("success", "Avaliação criada com sucesso!")
        navigate(`/terapia-nutricional/avaliacoes/${res.data.id}`, { replace: true })
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as ErrorResponse
        showMessage("error", data.erro ?? "Erro ao salvar avaliação")
      } else {
        showMessage("error", "Erro ao salvar avaliação")
      }
    } finally {
      setSaving(false)
    }
  }

  async function handlePessoaChange(v: string, item?: Record<string, unknown>) {
    setPessoaId(v)
    if (item) {
      const sexoItem = item.sexo
      if (sexoItem === "M" || sexoItem === "F") calc.setSexoVal(sexoItem as Sexo)
    }
  }

  if (loading) {
    return (
      <TPage title="Avaliação Nutricional" breadcrumb={["Terapia Nutricional", "Avaliações", "Carregando..."]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title     ={idParam ? "Editar Avaliação Nutricional" : "Nova Avaliação Nutricional"}
      breadcrumb={["Terapia Nutricional", "Avaliações", idParam ? "Editar" : "Nova"]}
    >
      <TForm key={formKey} onSubmit={handleSubmit}>

        <TPanel title="Dados Básicos">
          <TRow>
            <TCol flex={2}>
              <TDbCombo
                name        ="pessoaId"
                label       ="Paciente"
                url         ="/pessoas/select"
                valueField  ="id"
                displayField={displayPessoa}
                searchField ="nome"
                required
                value       ={pessoaId}
                onChange    ={handlePessoaChange}
                placeholder ="Buscar paciente..."
              />
            </TCol>
            <TCol flex={2}>
              <TDbCombo
                name        ="usuarioId"
                label       ="Profissional"
                url         ="/usuarios/select-personal"
                valueField  ="id"
                displayField="nome"
                searchField ="nome"
                value       ={usuarioId}
                onChange    ={(v) => setUsuarioId(v)}
                placeholder ="Selecionar profissional..."
              />
            </TCol>
            <TCol flex={1}>
              <TDate
                name        ="dataAvaliacao"
                label       ="Data da Avaliação"
                required
                defaultValue={dataVal}
                onChange    ={setDataVal}
              />
            </TCol>
          </TRow>
        </TPanel>

        <PaineisNutricionais calc={calc} />

        <TPanel title="Observações">
          <TRow>
            <TCol>
              <TText
                name        ="observacao"
                label       ="Observações"
                width       ="100%"
                height      ="80px"
                placeholder ="Observações adicionais sobre a avaliação..."
                defaultValue={avaliacao?.observacao ?? ""}
              />
            </TCol>
          </TRow>
        </TPanel>

        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Voltar" variant="cancel" type="button"
              onClick={() => navigate("/terapia-nutricional/avaliacoes")} />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="Salvar" variant="save" type="submit" loading={saving} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
