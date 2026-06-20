import { FaFilePdf }                             from "react-icons/fa"
import { TPage }                                 from "../../components/tpage"
import { TForm, TFormFooter, TFormActionsRight } from "../../components/tform"
import { TButton }                               from "../../components/tbutton"
import { useMessage }                            from "../../hooks/useMessage"
import { useCalculoNutricional }                 from "./useCalculoNutricional"
import { PaineisNutricionais }                   from "./PaineisNutricionais"
import { gerarPdfNutricional }                   from "../../utils/geradorPdf"

export default function CalculadoraNutricional() {
  const { showMessage } = useMessage()
  const calc            = useCalculoNutricional()

  function handleGerarRelatorio() {
    const { rAntro, rNec, rDieta, rHidrat, formula, pesoBase, entAntro } = calc.calcularTudo()
    if (pesoBase == null) {
      showMessage("error", "Informe ao menos o peso atual (ou dados para estimativa) para gerar o relatório")
      return
    }
    const hoje = new Date().toISOString().slice(0, 10)
    const b64 = gerarPdfNutricional({
      dataEmissao:        hoje,
      pacienteNome:       null,
      usuarioNome:        null,
      sexo:               entAntro.sexo,
      idade:              entAntro.idade,
      pesoAtual:          entAntro.pesoAtual ?? rAntro.pesoEstimadoChumlea,
      altura:             entAntro.altura ?? rAntro.alturaEstimada,
      imc:                rAntro.imc,
      classifImcOms:      rAntro.classifImcOms,
      classifImcOpas:     rAntro.classifImcOpas,
      pesoIdeal:          rAntro.pesoIdeal,
      pesoAjustado:       rAntro.pesoAjustado,
      percPerdaPeso:      rAntro.percPerdaPeso,
      classifPerdaPeso:   rAntro.classifPerdaPeso,
      percAdequacaoCb:    rAntro.percAdequacaoCb,
      classifAdequacaoCb: rAntro.classifAdequacaoCb,
      classifDeplecaoCp:  rAntro.classifDeplecaoCp,
      kcalMin:            rNec.kcalMin,
      kcalMax:            rNec.kcalMax,
      ptnMin:             rNec.ptnMin,
      ptnMax:             rNec.ptnMax,
      kcalTotal:          rNec.kcalTotal,
      ptnTotal:           rNec.ptnTotal,
      formulaNome:        formula?.nome ?? null,
      modoDieta:          calc.modoVal,
      vt:                 rDieta.vt,
      kcalDieta:          rDieta.kcal,
      ptnDieta:           rDieta.ptn,
      percVct:            rDieta.percVct,
      percPtn:            rDieta.percPtn,
      volumePleno:        rDieta.volumePleno,
      ptnPleno:           rDieta.ptnPleno,
      ptnSuplementar:     rDieta.ptnSuplementar,
      progressao:         rDieta.progressao,
      moduloProteico:     rDieta.moduloProteico,
      necHidricaMin:      rHidrat.necMin,
      necHidricaIdeal:    rHidrat.necIdeal,
      aguaDieta:          rHidrat.aguaDieta,
      aguaExtraIdeal:     rHidrat.aguaExtraIdeal,
    })
    const link    = document.createElement("a")
    link.href     = `data:application/pdf;base64,${b64}`
    link.download = `relatorio_nutricional_${hoje}.pdf`
    link.click()
  }

  return (
    <TPage title="Calculadora Nutricional" breadcrumb={["Terapia Nutricional", "Calculadora"]}>
      <TForm onSubmit={() => calc.calcularTudo()}>

        <PaineisNutricionais calc={calc} />

        <TFormFooter>
          <TFormActionsRight>
            <TButton label="Gerar Relatório" variant="secondary" type="button"
              icon={<FaFilePdf />} onClick={handleGerarRelatorio} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
