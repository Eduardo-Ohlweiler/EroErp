import { useEffect, useState }                                    from "react"
import { useNavigate, useParams }                                  from "react-router-dom"
import axios                                                       from "axios"
import { api }                                                     from "../../services/api"
import type {
  ImitanciometriaResponse,
  ImitanciometriaPayload,
  CurvaJerger,
  ResultadoReflexo,
}                                                                  from "../../types/Otorrino"
import type { ErrorResponse }                                      from "../../types/ErrorResponse"
import { TPage }                                                   from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TPanel }                                                  from "../../components/tpanel"
import { TRow }                                                    from "../../components/trow"
import { TCol }                                                    from "../../components/tcol"
import { TEntry }                                                  from "../../components/tentry"
import { TText }                                                   from "../../components/ttext"
import { TDate }                                                   from "../../components/tdate"
import { TCombo }                                                  from "../../components/tcombo"
import { TDbCombo }                                                from "../../components/tdbcombo"
import { TButton }                                                 from "../../components/tbutton"
import { useMessage }                                              from "../../hooks/useMessage"
import { displayPessoa }                                           from "../../utils/pessoas"
import { gerarPdfImitanciometria }                                 from "../../utils/geradorPdf"

// ── Opções ──────────────────────────────────────────────────────────────────

const CURVA_OPTIONS = [
  { value: "A",  label: "Tipo A — normal" },
  { value: "As", label: "Tipo As — rígida (baixa complacência)" },
  { value: "Ad", label: "Tipo Ad — hipermóvel (alta complacência)" },
  { value: "B",  label: "Tipo B — plana" },
  { value: "C",  label: "Tipo C — pressão negativa" },
]

const REFLEXO_OPTIONS = [
  { value: "PRESENTE",    label: "Presente" },
  { value: "AUSENTE",     label: "Ausente" },
  { value: "NAO_TESTADO", label: "Não testado" },
]

function num(v: string): number | null {
  if (!v || v.trim() === "") return null
  const n = parseFloat(v.replace(",", "."))
  return Number.isNaN(n) ? null : n
}

function asCurva(v: string): CurvaJerger | null {
  return v ? (v as CurvaJerger) : null
}
function asReflexo(v: string): ResultadoReflexo | null {
  return v ? (v as ResultadoReflexo) : null
}

function hoje(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// ── Componente ─────────────────────────────────────────────────────────────────

export default function ImitanciometriaForm() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()

  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [exame,   setExame]   = useState<ImitanciometriaResponse | null>(null)

  const [pessoaId, setPessoaId] = useState("")
  const [dataVal,  setDataVal]  = useState(hoje())

  // selects controlados (não vão no formData do TForm)
  const [curvaOd,         setCurvaOd]         = useState("")
  const [curvaOe,         setCurvaOe]         = useState("")
  const [reflexoIpsiOd,   setReflexoIpsiOd]   = useState("")
  const [reflexoContraOd, setReflexoContraOd] = useState("")
  const [reflexoIpsiOe,   setReflexoIpsiOe]   = useState("")
  const [reflexoContraOe, setReflexoContraOe] = useState("")

  useEffect(() => {
    if (idParam) carregar(idParam)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam])

  async function carregar(id: string) {
    setLoading(true)
    try {
      const res = await api.get<ImitanciometriaResponse>(`/otorrino/imitanciometrias/${id}`)
      const e   = res.data
      setExame(e)
      setPessoaId(String(e.pessoaId))
      setDataVal(e.dataExame)
      setCurvaOd(e.curvaOd ?? "")
      setCurvaOe(e.curvaOe ?? "")
      setReflexoIpsiOd(e.reflexoIpsiOd ?? "")
      setReflexoContraOd(e.reflexoContraOd ?? "")
      setReflexoIpsiOe(e.reflexoIpsiOe ?? "")
      setReflexoContraOe(e.reflexoContraOe ?? "")
      setFormKey(k => k + 1)
    } catch {
      showMessage("error", "Erro ao carregar imitanciometria")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(formData: Record<string, string>) {
    if (!pessoaId)           { showMessage("error", "Selecione o paciente"); return }
    if (!formData.dataExame) { showMessage("error", "Informe a data do exame"); return }

    const payload: ImitanciometriaPayload = {
      pessoaId:          parseInt(pessoaId),
      consultaId:        null,
      dataExame:         formData.dataExame,
      curvaOd:           asCurva(curvaOd),
      curvaOe:           asCurva(curvaOe),
      picoPressaoOdDapa: num(formData.picoPressaoOdDapa ?? ""),
      picoPressaoOeDapa: num(formData.picoPressaoOeDapa ?? ""),
      complacenciaOdMl:  num(formData.complacenciaOdMl ?? ""),
      complacenciaOeMl:  num(formData.complacenciaOeMl ?? ""),
      volumeCanalOdMl:   num(formData.volumeCanalOdMl ?? ""),
      volumeCanalOeMl:   num(formData.volumeCanalOeMl ?? ""),
      reflexoIpsiOd:     asReflexo(reflexoIpsiOd),
      reflexoContraOd:   asReflexo(reflexoContraOd),
      reflexoIpsiOe:     asReflexo(reflexoIpsiOe),
      reflexoContraOe:   asReflexo(reflexoContraOe),
      observacao:        formData.observacao?.trim() || null,
    }

    setSaving(true)
    try {
      if (idParam) {
        await api.put(`/otorrino/imitanciometrias/${idParam}`, payload)
        showMessage("success", "Imitanciometria atualizada com sucesso!")
      } else {
        const res = await api.post<ImitanciometriaResponse>("/otorrino/imitanciometrias", payload)
        showMessage("success", "Imitanciometria criada com sucesso!")
        navigate(`/otorrino/imitanciometrias/${res.data.id}`, { replace: true })
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as ErrorResponse
        showMessage("error", data.erro ?? "Erro ao salvar imitanciometria")
      } else {
        showMessage("error", "Erro ao salvar imitanciometria")
      }
    } finally {
      setSaving(false)
    }
  }

  function handleGerarPdf() {
    if (!exame) return
    const b64 = gerarPdfImitanciometria({
      dataEmissao:       hoje(),
      pacienteNome:      exame.pessoaNome,
      usuarioNome:       exame.usuarioNome ?? null,
      dataExame:         exame.dataExame,
      curvaOd:           exame.curvaOd,
      curvaOe:           exame.curvaOe,
      picoPressaoOdDapa: exame.picoPressaoOdDapa,
      picoPressaoOeDapa: exame.picoPressaoOeDapa,
      complacenciaOdMl:  exame.complacenciaOdMl,
      complacenciaOeMl:  exame.complacenciaOeMl,
      volumeCanalOdMl:   exame.volumeCanalOdMl,
      volumeCanalOeMl:   exame.volumeCanalOeMl,
      reflexoIpsiOd:     exame.reflexoIpsiOd,
      reflexoContraOd:   exame.reflexoContraOd,
      reflexoIpsiOe:     exame.reflexoIpsiOe,
      reflexoContraOe:   exame.reflexoContraOe,
      observacao:        exame.observacao ?? null,
    })
    const link    = document.createElement("a")
    link.href     = `data:application/pdf;base64,${b64}`
    link.download = `imitanciometria_${exame.pessoaNome.replace(/\s+/g, "_")}_${exame.dataExame}.pdf`
    link.click()
  }

  if (loading) {
    return (
      <TPage title="Imitanciometria" breadcrumb={["Otorrinolaringologia", "Imitanciometrias", "Carregando..."]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title     ={idParam ? "Editar Imitanciometria" : "Nova Imitanciometria"}
      breadcrumb={["Otorrinolaringologia", "Imitanciometrias", idParam ? "Editar" : "Nova"]}
    >
      <TForm key={formKey} onSubmit={handleSubmit}>

        <TPanel title="Dados do Exame">
          <TRow>
            <TCol flex={3}>
              <TDbCombo
                name        ="pessoaId"
                label       ="Paciente"
                url         ="/pessoas/select"
                valueField  ="id"
                displayField={displayPessoa}
                searchField ="nome"
                required
                value       ={pessoaId}
                onChange    ={(v) => setPessoaId(v)}
                placeholder ="Buscar paciente..."
                width="50%"
              />
            </TCol>
          </TRow>
          <TRow>
            <TCol flex={1}>
              <TDate
                name        ="dataExame"
                label       ="Data do Exame"
                required
                defaultValue={dataVal}
                onChange    ={setDataVal}
              />
            </TCol>
          </TRow>
        </TPanel>

        {/* ── Orelha Direita ── */}
        <TPanel title="Orelha Direita (OD)">
          <TRow>
            <TCol>
              <TCombo name="curvaOdSel" label="Curva (Jerger)" width="100%"
                options={CURVA_OPTIONS} placeholder="Selecione a curva..."
                defaultValue={curvaOd} onChange={setCurvaOd} />
            </TCol>
            <TCol>
              <TEntry name="picoPressaoOdDapa" label="Pico de pressão (daPa)" width="100%"
                mask="numerosinal" placeholder="Ex: -50"
                defaultValue={exame?.picoPressaoOdDapa != null ? String(exame.picoPressaoOdDapa) : ""} />
            </TCol>
            <TCol>
              <TEntry name="complacenciaOdMl" label="Complacência (ml)" width="100%"
                mask="numerodecimal2" placeholder="Ex: 0,80"
                defaultValue={exame?.complacenciaOdMl != null ? String(exame.complacenciaOdMl) : ""} />
            </TCol>
            <TCol>
              <TEntry name="volumeCanalOdMl" label="Volume do canal (ml)" width="100%"
                mask="numerodecimal2" placeholder="Ex: 1,20"
                defaultValue={exame?.volumeCanalOdMl != null ? String(exame.volumeCanalOdMl) : ""} />
            </TCol>
          </TRow>
          <TRow>
            <TCol>
              <TCombo name="reflexoIpsiOdSel" label="Reflexo ipsilateral" width="100%"
                options={REFLEXO_OPTIONS} placeholder="Selecione..."
                defaultValue={reflexoIpsiOd} onChange={setReflexoIpsiOd} />
            </TCol>
            <TCol>
              <TCombo name="reflexoContraOdSel" label="Reflexo contralateral" width="100%"
                options={REFLEXO_OPTIONS} placeholder="Selecione..."
                defaultValue={reflexoContraOd} onChange={setReflexoContraOd} />
            </TCol>
          </TRow>
        </TPanel>

        {/* ── Orelha Esquerda ── */}
        <TPanel title="Orelha Esquerda (OE)">
          <TRow>
            <TCol>
              <TCombo name="curvaOeSel" label="Curva (Jerger)" width="100%"
                options={CURVA_OPTIONS} placeholder="Selecione a curva..."
                defaultValue={curvaOe} onChange={setCurvaOe} />
            </TCol>
            <TCol>
              <TEntry name="picoPressaoOeDapa" label="Pico de pressão (daPa)" width="100%"
                mask="numerosinal" placeholder="Ex: -50"
                defaultValue={exame?.picoPressaoOeDapa != null ? String(exame.picoPressaoOeDapa) : ""} />
            </TCol>
            <TCol>
              <TEntry name="complacenciaOeMl" label="Complacência (ml)" width="100%"
                mask="numerodecimal2" placeholder="Ex: 0,80"
                defaultValue={exame?.complacenciaOeMl != null ? String(exame.complacenciaOeMl) : ""} />
            </TCol>
            <TCol>
              <TEntry name="volumeCanalOeMl" label="Volume do canal (ml)" width="100%"
                mask="numerodecimal2" placeholder="Ex: 1,20"
                defaultValue={exame?.volumeCanalOeMl != null ? String(exame.volumeCanalOeMl) : ""} />
            </TCol>
          </TRow>
          <TRow>
            <TCol>
              <TCombo name="reflexoIpsiOeSel" label="Reflexo ipsilateral" width="100%"
                options={REFLEXO_OPTIONS} placeholder="Selecione..."
                defaultValue={reflexoIpsiOe} onChange={setReflexoIpsiOe} />
            </TCol>
            <TCol>
              <TCombo name="reflexoContraOeSel" label="Reflexo contralateral" width="100%"
                options={REFLEXO_OPTIONS} placeholder="Selecione..."
                defaultValue={reflexoContraOe} onChange={setReflexoContraOe} />
            </TCol>
          </TRow>
        </TPanel>

        <TPanel title="Observações">
          <TRow>
            <TCol>
              <TText name="observacao" label="Observações" width="100%" height="80px"
                placeholder="Observações adicionais sobre o exame..."
                defaultValue={exame?.observacao ?? ""} />
            </TCol>
          </TRow>
        </TPanel>

        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Voltar" variant="cancel" type="button"
              onClick={() => navigate("/otorrino/imitanciometrias")} />
            {exame && (
              <TButton label="Gerar PDF" variant="secondary" type="button"
                onClick={handleGerarPdf} />
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
