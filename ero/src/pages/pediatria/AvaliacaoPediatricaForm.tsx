import { useEffect, useState }                                    from "react"
import { FaCalculator }                                            from "react-icons/fa6"
import { FaFilePdf }                                               from "react-icons/fa"
import { useNavigate, useParams }                                  from "react-router-dom"
import axios                                                       from "axios"
import { api }                                                     from "../../services/api"
import type {
  AvaliacaoPediatricaPayload,
  AvaliacaoPediatricaResponse,
}                                                                  from "../../types/Pediatria"
import type { ErrorResponse }                                      from "../../types/ErrorResponse"
import { TPage }                                                   from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TPanel }                                                  from "../../components/tpanel"
import { TRow }                                                    from "../../components/trow"
import { TCol }                                                    from "../../components/tcol"
import { TEntry }                                                  from "../../components/tentry"
import { TCombo }                                                  from "../../components/tcombo"
import { TText }                                                   from "../../components/ttext"
import { TDate }                                                   from "../../components/tdate"
import { TDbCombo }                                                from "../../components/tdbcombo"
import { TButton }                                                 from "../../components/tbutton"
import { useMessage }                                              from "../../hooks/useMessage"
import { displayPessoa }                                           from "../../utils/pessoas"
import { calcularPediatria }                                       from "./calculo/calculoPediatrico"
import type { EntradaPediatrica, FormulaLacteaOption, ResultadoPediatrico, Sexo } from "./calculo/types"
import { ResultadoPediatricoView }                                 from "./ResultadoPediatricoView"
import { gerarPdfPediatria }                                       from "../../utils/geradorPdf"

const SEXO_OPTIONS = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Feminino"  },
]

const RESULTADO_VAZIO: ResultadoPediatrico = {
  imc: null, classifPesoIdade: null, classifEstaturaIdade: null, classifImcIdade: null,
  vet: null, proteinaNecessidade: null, vezesDia: null, volumeTotal: null,
  caloriasTotais: null, proteinaTotal: null, percCalorico: null, percProteico: null,
}

function num(v: string): number | null {
  if (!v || v.trim() === "") return null
  const n = parseFloat(v.replace(",", "."))
  return Number.isNaN(n) ? null : n
}

function hoje(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// diferença em meses entre nascimento e referência
function calcularIdadeMeses(dataNascimento: string, dataRef: string): number | null {
  if (!dataNascimento || !dataRef) return null
  const nasc = new Date(dataNascimento + "T00:00:00")
  const ref  = new Date(dataRef + "T00:00:00")
  if (Number.isNaN(nasc.getTime()) || Number.isNaN(ref.getTime())) return null
  let meses = (ref.getFullYear() - nasc.getFullYear()) * 12 + (ref.getMonth() - nasc.getMonth())
  if (ref.getDate() < nasc.getDate()) meses -= 1
  return meses < 0 ? null : meses
}

export default function AvaliacaoPediatricaForm() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()

  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [formKey,   setFormKey]   = useState(0)
  const [avaliacao, setAvaliacao] = useState<AvaliacaoPediatricaResponse | null>(null)

  const [pessoaId,  setPessoaId]  = useState("")
  const [usuarioId, setUsuarioId] = useState("")
  const [dataVal,   setDataVal]   = useState(hoje())
  const [sexoVal,   setSexoVal]   = useState<Sexo>("M")
  const [idadeVal,  setIdadeVal]  = useState("")
  const [pesoVal,   setPesoVal]   = useState("")
  const [estVal,    setEstVal]    = useState("")
  const [formulaId, setFormulaId] = useState("")
  const [volumeVal, setVolumeVal] = useState("")
  const [freqVal,   setFreqVal]   = useState("")
  const [dataNascimentoPaciente, setDataNascimentoPaciente] = useState("")

  const [formulas,  setFormulas]  = useState<FormulaLacteaOption[]>([])
  const [resultado, setResultado] = useState<ResultadoPediatrico>(RESULTADO_VAZIO)

  useEffect(() => {
    api.get<FormulaLacteaOption[]>("/formulas-lacteas/select")
      .then(r => setFormulas(r.data ?? []))
      .catch(() => showMessage("error", "Erro ao carregar fórmulas lácteas"))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (idParam) carregarAvaliacao(idParam)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam])

  async function carregarAvaliacao(id: string) {
    setLoading(true)
    try {
      const res = await api.get<AvaliacaoPediatricaResponse>(`/avaliacoes-pediatricas/${id}`)
      const a   = res.data
      setAvaliacao(a)
      setPessoaId(String(a.pessoaId))
      setUsuarioId(a.usuarioId != null ? String(a.usuarioId) : "")
      setDataVal(a.dataAvaliacao)
      setSexoVal(a.sexo ?? "M")
      setIdadeVal(a.idadeMeses   != null ? String(a.idadeMeses)   : "")
      setPesoVal(a.peso       != null ? String(a.peso)       : "")
      setEstVal(a.estatura    != null ? String(a.estatura)   : "")
      setFormulaId(a.formulaLacteaId != null ? String(a.formulaLacteaId) : "")
      setVolumeVal(a.volumeMl        != null ? String(a.volumeMl)        : "")
      setFreqVal(a.frequenciaHoras   != null ? String(a.frequenciaHoras) : "")
      setResultado({
        imc: a.imc, classifPesoIdade: a.classifPesoIdade,
        classifEstaturaIdade: a.classifEstaturaIdade, classifImcIdade: a.classifImcIdade,
        vet: a.vet, proteinaNecessidade: a.proteinaNecessidade, vezesDia: a.vezesDia,
        volumeTotal: a.volumeTotal, caloriasTotais: a.caloriasTotais, proteinaTotal: a.proteinaTotal,
        percCalorico: a.percCalorico, percProteico: a.percProteico,
      })
      setFormKey(k => k + 1)
    } catch {
      showMessage("error", "Erro ao carregar avaliação pediátrica")
    } finally {
      setLoading(false)
    }
  }

  function montarEntrada(): EntradaPediatrica {
    const formula = formulas.find(f => String(f.id) === formulaId)
    return {
      sexo:             sexoVal,
      idadeMeses:       num(idadeVal),
      pesoKg:           num(pesoVal),
      estaturaCm:       num(estVal),
      kcalPor100ml:     formula?.kcalPor100ml     ?? null,
      proteinaPor100ml: formula?.proteinaPor100ml ?? null,
      volumeMl:         num(volumeVal),
      frequenciaHoras:  num(freqVal),
    }
  }

  function handleCalcular() {
    setResultado(calcularPediatria(montarEntrada()))
  }

  function handleGerarRelatorio() {
    if (!avaliacao) return
    const formula = formulas.find(f => String(f.id) === formulaId)
    const r       = calcularPediatria(montarEntrada())
    setResultado(r)
    const b64 = gerarPdfPediatria({
      dataEmissao:          dataVal,
      pacienteNome:         avaliacao.pessoaNome,
      usuarioNome:          null,
      sexo:                 sexoVal,
      idadeMeses:           num(idadeVal),
      pesoKg:               num(pesoVal),
      estaturaCm:           num(estVal),
      imc:                  r.imc,
      classifPesoIdade:     r.classifPesoIdade,
      classifEstaturaIdade: r.classifEstaturaIdade,
      classifImcIdade:      r.classifImcIdade,
      vet:                  r.vet,
      proteinaNecessidade:  r.proteinaNecessidade,
      formulaNome:          formula?.nome ?? null,
      volumeMl:             num(volumeVal),
      frequenciaHoras:      num(freqVal),
      vezesDia:             r.vezesDia,
      volumeTotal:          r.volumeTotal,
      caloriasTotais:       r.caloriasTotais,
      proteinaTotal:        r.proteinaTotal,
      percCalorico:         r.percCalorico,
      percProteico:         r.percProteico,
      observacoes:          avaliacao.observacao ?? null,
    })
    const link    = document.createElement("a")
    link.href     = `data:application/pdf;base64,${b64}`
    link.download = `relatorio_pediatrico_${avaliacao.pessoaNome.replace(/\s+/g, "_")}_${dataVal}.pdf`
    link.click()
  }

  async function handlePessoaChange(v: string, item?: Record<string, unknown>) {
    setPessoaId(v)
    // Pré-preenche sexo se o item trouxer (editável).
    if (item) {
      const sexoItem = item.sexo
      if (sexoItem === "M" || sexoItem === "F") setSexoVal(sexoItem)
    }
    if (!v) return
    // Busca a data de nascimento do paciente para calcular idade automaticamente.
    try {
      const res  = await api.get<{ dataNascimento?: string | null }>(`/pessoas/select/${v}`)
      const nasc = res.data?.dataNascimento
      if (typeof nasc === "string" && nasc) {
        setDataNascimentoPaciente(nasc)
        const meses = calcularIdadeMeses(nasc, dataVal)
        if (meses != null) setIdadeVal(String(meses))
        // Remonta os inputs para refletir os valores preenchidos automaticamente.
        setFormKey(k => k + 1)
      } else {
        setDataNascimentoPaciente("")
      }
    } catch {
      // Falha silenciosa — preenchimento de idade fica manual.
    }
  }

  function handleDataChange(v: string) {
    setDataVal(v)
    if (dataNascimentoPaciente) {
      const meses = calcularIdadeMeses(dataNascimentoPaciente, v)
      if (meses != null) setIdadeVal(String(meses))
      // Remonta os inputs para refletir os valores recalculados.
      setFormKey(k => k + 1)
    }
  }

  async function handleSubmit(formData: Record<string, string>) {
    if (!pessoaId)            { showMessage("error", "Selecione o paciente"); return }
    if (!formData.dataAvaliacao) { showMessage("error", "Informe a data da avaliação"); return }
    if (!sexoVal)             { showMessage("error", "Selecione o sexo"); return }

    const formula = formulas.find(f => String(f.id) === formulaId)
    const r       = calcularPediatria(montarEntrada())
    setResultado(r)

    const payload: AvaliacaoPediatricaPayload = {
      pessoaId:                 parseInt(pessoaId),
      usuarioId:                usuarioId ? parseInt(usuarioId) : null,
      dataAvaliacao:            formData.dataAvaliacao,
      sexo:                     sexoVal,
      idadeMeses:               num(idadeVal),
      peso:                     num(pesoVal),
      estatura:                 num(estVal),
      formulaLacteaId:          formula ? formula.id : null,
      formulaNome:              formula ? formula.nome : null,
      formulaKcalPor100ml:      formula ? formula.kcalPor100ml : null,
      formulaProteinaPor100ml:  formula ? formula.proteinaPor100ml : null,
      volumeMl:                 num(volumeVal),
      frequenciaHoras:          num(freqVal),
      imc:                      r.imc,
      classifPesoIdade:         r.classifPesoIdade,
      classifEstaturaIdade:     r.classifEstaturaIdade,
      classifImcIdade:          r.classifImcIdade,
      vet:                      r.vet,
      proteinaNecessidade:      r.proteinaNecessidade,
      vezesDia:                 r.vezesDia,
      volumeTotal:              r.volumeTotal,
      caloriasTotais:           r.caloriasTotais,
      proteinaTotal:            r.proteinaTotal,
      percCalorico:             r.percCalorico,
      percProteico:             r.percProteico,
      observacao:               formData.observacao?.trim() || null,
    }

    setSaving(true)
    try {
      if (idParam) {
        await api.put(`/avaliacoes-pediatricas/${idParam}`, payload)
        showMessage("success", "Avaliação atualizada com sucesso!")
        carregarAvaliacao(idParam)
      } else {
        const res = await api.post<AvaliacaoPediatricaResponse>("/avaliacoes-pediatricas", payload)
        showMessage("success", "Avaliação criada com sucesso!")
        navigate(`/pediatria/avaliacoes/${res.data.id}`, { replace: true })
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

  const formulaOptions = formulas.map(f => ({
    value: String(f.id),
    label: `${f.nome} (${f.kcalPor100ml} kcal · ${f.proteinaPor100ml} g prot / 100ml)`,
  }))

  if (loading) {
    return (
      <TPage title="Avaliação Pediátrica" breadcrumb={["Pediatria", "Avaliações", "Carregando..."]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title     ={idParam ? "Editar Avaliação Pediátrica" : "Nova Avaliação Pediátrica"}
      breadcrumb={["Pediatria", "Avaliações", idParam ? "Editar" : "Nova"]}
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
                onChange    ={handleDataChange}
              />
            </TCol>
          </TRow>
          <TRow>
            <TCol>
              <TCombo
                name        ="sexo"
                label       ="Sexo"
                width       ="100%"
                options     ={SEXO_OPTIONS}
                required
                defaultValue={sexoVal}
                onChange    ={(v) => setSexoVal(v as Sexo)}
              />
            </TCol>
            <TCol>
              <TEntry
                name        ="idadeMeses"
                label       ="Idade (meses)"
                placeholder ="Ex: 8"
                width       ="100%"
                mask        ="numero"
                defaultValue={idadeVal}
                onChange    ={setIdadeVal}
              />
            </TCol>
            <TCol>
              <TEntry
                name        ="peso"
                label       ="Peso (kg)"
                placeholder ="Ex: 7,50"
                width       ="100%"
                mask        ="numerodecimal2"
                defaultValue={pesoVal}
                onChange    ={setPesoVal}
              />
            </TCol>
            <TCol>
              <TEntry
                name        ="estatura"
                label       ="Estatura (cm)"
                placeholder ="Ex: 70,00"
                width       ="100%"
                mask        ="numerodecimal2"
                defaultValue={estVal}
                onChange    ={setEstVal}
              />
            </TCol>
          </TRow>
        </TPanel>

        <TPanel title="Dieta Prescrita">
          <TRow>
            <TCol flex={2}>
              <TCombo
                name        ="formulaLacteaId"
                label       ="Fórmula Láctea"
                width       ="100%"
                placeholder ="Selecione a fórmula..."
                options     ={formulaOptions}
                defaultValue={formulaId}
                onChange    ={setFormulaId}
              />
            </TCol>
            <TCol>
              <TEntry
                name        ="volumeMl"
                label       ="Volume por mamada (ml)"
                placeholder ="Ex: 120"
                width       ="100%"
                mask        ="numero"
                defaultValue={volumeVal}
                onChange    ={setVolumeVal}
              />
            </TCol>
            <TCol>
              <TEntry
                name        ="frequenciaHoras"
                label       ="Frequência (horas)"
                placeholder ="Ex: 3"
                width       ="100%"
                mask        ="numero"
                defaultValue={freqVal}
                onChange    ={setFreqVal}
              />
            </TCol>
          </TRow>
          <div className="flex justify-end">
            <TButton label="Calcular" variant="secondary" type="button"
              icon={<FaCalculator />} onClick={handleCalcular} />
          </div>
        </TPanel>

        <ResultadoPediatricoView resultado={resultado} />

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
              onClick={() => navigate("/pediatria/avaliacoes")} />
            {avaliacao && (
              <TButton label="Gerar Relatório" variant="secondary" type="button"
                icon={<FaFilePdf />} onClick={handleGerarRelatorio} />
            )}
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="Salvar" variant="save" type="submit" loading={saving} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
