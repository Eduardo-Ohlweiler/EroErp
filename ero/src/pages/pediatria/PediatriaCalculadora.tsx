import { useEffect, useState }                                    from "react"
import { FaCalculator }                                            from "react-icons/fa6"
import { FaFilePdf }                                               from "react-icons/fa"
import { api }                                                     from "../../services/api"
import { TPage }                                                   from "../../components/tpage"
import { TForm, TFormFooter, TFormActionsRight }                   from "../../components/tform"
import { TPanel }                                                  from "../../components/tpanel"
import { TRow }                                                    from "../../components/trow"
import { TCol }                                                    from "../../components/tcol"
import { TEntry }                                                  from "../../components/tentry"
import { TCombo }                                                  from "../../components/tcombo"
import { TButton }                                                 from "../../components/tbutton"
import { useMessage }                                              from "../../hooks/useMessage"
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

export default function PediatriaCalculadora() {
  const { showMessage } = useMessage()

  const [sexoVal,   setSexoVal]   = useState<Sexo>("M")
  const [idadeVal,  setIdadeVal]  = useState("")
  const [pesoVal,   setPesoVal]   = useState("")
  const [estVal,    setEstVal]    = useState("")
  const [formulaId, setFormulaId] = useState("")
  const [volumeVal, setVolumeVal] = useState("")
  const [freqVal,   setFreqVal]   = useState("")

  const [formulas,  setFormulas]  = useState<FormulaLacteaOption[]>([])
  const [resultado, setResultado] = useState<ResultadoPediatrico>(RESULTADO_VAZIO)

  useEffect(() => {
    api.get<FormulaLacteaOption[]>("/formulas-lacteas/select")
      .then(r => setFormulas(r.data ?? []))
      .catch(() => showMessage("error", "Erro ao carregar fórmulas lácteas"))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function montarEntrada(): { entrada: EntradaPediatrica; formula?: FormulaLacteaOption } {
    const formula = formulas.find(f => String(f.id) === formulaId)
    const entrada: EntradaPediatrica = {
      sexo:             sexoVal,
      idadeMeses:       num(idadeVal),
      pesoKg:           num(pesoVal),
      estaturaCm:       num(estVal),
      kcalPor100ml:     formula?.kcalPor100ml     ?? null,
      proteinaPor100ml: formula?.proteinaPor100ml ?? null,
      volumeMl:         num(volumeVal),
      frequenciaHoras:  num(freqVal),
    }
    return { entrada, formula }
  }

  function handleCalcular(): ResultadoPediatrico {
    const { entrada } = montarEntrada()
    const r = calcularPediatria(entrada)
    setResultado(r)
    return r
  }

  function handleGerarRelatorio() {
    const { entrada, formula } = montarEntrada()
    if (!entrada.pesoKg || entrada.idadeMeses == null) {
      showMessage("error", "Informe ao menos idade e peso para gerar o relatório")
      return
    }
    const r = handleCalcular()
    const hoje = new Date().toISOString().slice(0, 10)
    const b64 = gerarPdfPediatria({
      dataEmissao:          hoje,
      pacienteNome:         null,
      usuarioNome:          null,
      sexo:                 entrada.sexo,
      idadeMeses:           entrada.idadeMeses,
      pesoKg:               entrada.pesoKg,
      estaturaCm:           entrada.estaturaCm,
      imc:                  r.imc,
      classifPesoIdade:     r.classifPesoIdade,
      classifEstaturaIdade: r.classifEstaturaIdade,
      classifImcIdade:      r.classifImcIdade,
      vet:                  r.vet,
      proteinaNecessidade:  r.proteinaNecessidade,
      formulaNome:          formula?.nome ?? null,
      volumeMl:             entrada.volumeMl ?? null,
      frequenciaHoras:      entrada.frequenciaHoras ?? null,
      vezesDia:             r.vezesDia,
      volumeTotal:          r.volumeTotal,
      caloriasTotais:       r.caloriasTotais,
      proteinaTotal:        r.proteinaTotal,
      percCalorico:         r.percCalorico,
      percProteico:         r.percProteico,
    })
    const link    = document.createElement("a")
    link.href     = `data:application/pdf;base64,${b64}`
    link.download = `relatorio_pediatrico_${hoje}.pdf`
    link.click()
  }

  const formulaOptions = formulas.map(f => ({
    value: String(f.id),
    label: `${f.nome} (${f.kcalPor100ml} kcal · ${f.proteinaPor100ml} g prot / 100ml)`,
  }))

  return (
    <TPage title="Calculadora Pediátrica" breadcrumb={["Pediatria", "Calculadora"]}>
      <TForm onSubmit={() => handleCalcular()}>

        <TPanel title="Dados da Criança">
          <TRow>
            <TCol>
              <TCombo
                name        ="sexo"
                label       ="Sexo"
                width       ="100%"
                options     ={SEXO_OPTIONS}
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
            <TButton
              label  ="Calcular"
              type   ="submit"
              icon   ={<FaCalculator />}
            />
          </div>
        </TPanel>

        <ResultadoPediatricoView resultado={resultado} />

        <TFormFooter>
          <TFormActionsRight>
            <TButton
              label   ="Gerar Relatório"
              variant ="secondary"
              type    ="button"
              icon    ={<FaFilePdf />}
              onClick ={handleGerarRelatorio}
            />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
