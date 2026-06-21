import { useEffect, useState }                                    from "react"
import { useNavigate, useParams }                                  from "react-router-dom"
import axios                                                       from "axios"
import { api }                                                     from "../../services/api"
import type {
  ExameLaudoResponse,
  ExameLaudoPayload,
  TipoExameLaudo,
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
import { gerarPdfLaudoOtorrino }                                   from "../../utils/geradorPdf"
import { TIPO_EXAME_LABEL }                                        from "./exameLaudo.constants"

const TIPO_OPTIONS = [
  { value: "NASOFIBROSCOPIA",    label: "Nasofibroscopia" },
  { value: "LARINGOSCOPIA",      label: "Laringoscopia" },
  { value: "VIDEOLARINGOSCOPIA", label: "Videolaringoscopia" },
  { value: "RINOSCOPIA",         label: "Rinoscopia" },
  { value: "OUTRO",              label: "Outro" },
]

function hoje(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function ExameLaudoForm() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()

  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [laudo,   setLaudo]   = useState<ExameLaudoResponse | null>(null)

  const [pessoaId, setPessoaId] = useState("")
  const [dataVal,  setDataVal]  = useState(hoje())
  const [tipo,     setTipo]     = useState<string>("NASOFIBROSCOPIA")

  useEffect(() => {
    if (idParam) carregar(idParam)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam])

  async function carregar(id: string) {
    setLoading(true)
    try {
      const res = await api.get<ExameLaudoResponse>(`/otorrino/exames-laudo/${id}`)
      const e   = res.data
      setLaudo(e)
      setPessoaId(String(e.pessoaId))
      setDataVal(e.dataExame)
      setTipo(e.tipoExame)
      setFormKey(k => k + 1)
    } catch {
      showMessage("error", "Erro ao carregar laudo")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(formData: Record<string, string>) {
    if (!pessoaId)           { showMessage("error", "Selecione o paciente"); return }
    if (!formData.dataExame) { showMessage("error", "Informe a data do exame"); return }
    if (!tipo)               { showMessage("error", "Selecione o tipo de exame"); return }

    const payload: ExameLaudoPayload = {
      pessoaId:   parseInt(pessoaId),
      consultaId: laudo?.consultaId ?? null,
      dataExame:  formData.dataExame,
      tipoExame:  tipo as TipoExameLaudo,
      laudo:      formData.laudo?.trim()     || null,
      conclusao:  formData.conclusao?.trim() || null,
      cid:        formData.cid?.trim()       || null,
    }

    setSaving(true)
    try {
      if (idParam) {
        const res = await api.put<ExameLaudoResponse>(`/otorrino/exames-laudo/${idParam}`, payload)
        setLaudo(res.data)
        showMessage("success", "Laudo atualizado com sucesso!")
      } else {
        const res = await api.post<ExameLaudoResponse>("/otorrino/exames-laudo", payload)
        showMessage("success", "Laudo criado com sucesso!")
        navigate(`/otorrino/laudos/${res.data.id}`, { replace: true })
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as ErrorResponse
        showMessage("error", data.erro ?? "Erro ao salvar laudo")
      } else {
        showMessage("error", "Erro ao salvar laudo")
      }
    } finally {
      setSaving(false)
    }
  }

  function handleGerarPdf() {
    if (!laudo) return
    const tipoLabel = TIPO_EXAME_LABEL[laudo.tipoExame] ?? laudo.tipoExame
    const b64 = gerarPdfLaudoOtorrino({
      dataEmissao:  hoje(),
      pacienteNome: laudo.pessoaNome,
      usuarioNome:  laudo.usuarioNome,
      dataExame:    laudo.dataExame,
      tipoExame:    tipoLabel,
      laudo:        laudo.laudo,
      conclusao:    laudo.conclusao,
      cid:          laudo.cid,
    })
    const link    = document.createElement("a")
    link.href     = `data:application/pdf;base64,${b64}`
    link.download = `laudo_${laudo.tipoExame.toLowerCase()}_${(laudo.pessoaNome ?? "paciente").replace(/\s+/g, "_")}_${laudo.dataExame}.pdf`
    link.click()
  }

  if (loading) {
    return (
      <TPage title="Laudo" breadcrumb={["Otorrinolaringologia", "Laudos", "Carregando..."]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title     ={idParam ? "Editar Laudo" : "Novo Laudo"}
      breadcrumb={["Otorrinolaringologia", "Laudos", idParam ? "Editar" : "Novo"]}
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
              />
            </TCol>
            <TCol flex={2}>
              <TCombo name="tipoExame" label="Tipo de Exame" width="100%"
                options={TIPO_OPTIONS} placeholder="Selecione o tipo..."
                defaultValue={tipo} onChange={setTipo} />
            </TCol>
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

        <TPanel title="Laudo">
          <TRow>
            <TCol>
              <TText name="laudo" label="Laudo" width="100%" height="220px"
                placeholder="Descrição do exame..."
                defaultValue={laudo?.laudo ?? ""} />
            </TCol>
          </TRow>
        </TPanel>

        <TPanel title="Conclusão">
          <TRow>
            <TCol>
              <TText name="conclusao" label="Conclusão" width="100%" height="100px"
                placeholder="Conclusão do exame..."
                defaultValue={laudo?.conclusao ?? ""} />
            </TCol>
          </TRow>
          <TRow>
            <TCol>
              <TEntry name="cid" label="CID (opcional)" width="200px"
                placeholder="Ex: J34.2"
                defaultValue={laudo?.cid ?? ""} />
            </TCol>
          </TRow>
        </TPanel>

        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Voltar" variant="cancel" type="button"
              onClick={() => navigate("/otorrino/laudos")} />
            {laudo && (
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
