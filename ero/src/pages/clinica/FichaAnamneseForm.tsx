import { useEffect, useState }                                    from "react"
import { useNavigate, useParams }                                  from "react-router-dom"
import axios                                                       from "axios"
import { api }                                                     from "../../services/api"
import type {
  FichaAnamneseResponse,
  TemplateAnamneseResponse,
  CampoAnamneseResponse,
  TipoFinalidade,
} from "../../types/Anamnese"
import type { ErrorResponse }                                      from "../../types/ErrorResponse"
import { TPage }                                                   from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TRow }                                                    from "../../components/trow"
import { TCol }                                                    from "../../components/tcol"
import { TSpace }                                                  from "../../components/tspace"
import { TPanel }                                                  from "../../components/tpanel"
import { TEntry }                                                  from "../../components/tentry"
import { TCombo }                                                  from "../../components/tcombo"
import { TText }                                                   from "../../components/ttext"
import { TDate }                                                   from "../../components/tdate"
import { TButton }                                                 from "../../components/tbutton"
import { TDbCombo }                                                from "../../components/tdbcombo"
import { useMessage }                                              from "../../hooks/useMessage"
import { displayPessoa, displayEmitente }                         from "../../utils/pessoas"
import { FINALIDADE_LABEL, FINALIDADE_OPTIONS }                    from "../../utils/anamnese"
import { gerarPdfFichaAnamnese }                                   from "../../utils/geradorPdf"

function hoje(): string {
  const d   = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// ── Renderizador de campo dinâmico ──────────────────────────────────────────

interface CampoProps {
  campo:      CampoAnamneseResponse
  templateId: number
  valor:      string
  onChange:   (campoId: number, valor: string) => void
}

function RenderCampo({ campo, templateId, valor, onChange }: CampoProps) {
  const label = campo.rotulo + (campo.obrigatorio ? " (*)" : "")

  switch (campo.tipo) {
    case "TEXTO":
      return (
        <TEntry
          key          ={`campo_${campo.id}_${templateId}`}
          name         ={`campo_${campo.id}`}
          label        ={label}
          width        ="400px"
          defaultValue ={valor}
          onChange     ={(v) => onChange(campo.id, v)}
        />
      )

    case "TEXTO_LONGO":
      return (
        <TText
          key          ={`campo_${campo.id}_${templateId}`}
          name         ={`campo_${campo.id}`}
          label        ={label}
          width        ="100%"
          height       ="80px"
          defaultValue ={valor}
          onChange     ={(v) => onChange(campo.id, v)}
        />
      )

    case "CHECKBOX":
      return (
        <div key={`campo_${campo.id}_${templateId}`} className="flex items-center gap-2 py-1">
          <input
            type      ="checkbox"
            id        ={`campo_${campo.id}`}
            checked   ={valor === "true"}
            onChange  ={(e) => onChange(campo.id, String(e.target.checked))}
            className ="w-4 h-4 accent-(--accent)"
          />
          <label htmlFor={`campo_${campo.id}`} className="text-sm text-(--text-primary)">
            {campo.rotulo}
          </label>
        </div>
      )

    case "DATA":
      return (
        <TDate
          key          ={`campo_${campo.id}_${templateId}`}
          name         ={`campo_${campo.id}`}
          label        ={label}
          width        ="180px"
          defaultValue ={valor}
          onChange     ={(v) => onChange(campo.id, v)}
        />
      )

    case "NUMERO":
      return (
        <TEntry
          key          ={`campo_${campo.id}_${templateId}`}
          name         ={`campo_${campo.id}`}
          label        ={label}
          mask         ="numero"
          width        ="160px"
          defaultValue ={valor}
          onChange     ={(v) => onChange(campo.id, v)}
        />
      )

    case "OPCOES": {
      const opts = campo.opcoes
        ? [{ value: "", label: "Selecione..." }, ...(() => { try { return JSON.parse(campo.opcoes).map((o: string) => ({ value: o, label: o })) } catch { return [] } })()]
        : [{ value: "", label: "Selecione..." }]
      return (
        <TCombo
          key          ={`campo_${campo.id}_${templateId}`}
          name         ={`campo_${campo.id}`}
          label        ={label}
          width        ="300px"
          defaultValue ={valor}
          onChange     ={(v) => onChange(campo.id, v)}
          options      ={opts}
        />
      )
    }

    case "MULTIPLAS_OPCOES": {
      let opts: string[] = []
      if (campo.opcoes) { try { opts = JSON.parse(campo.opcoes) } catch { opts = [] } }
      const selecionados = valor ? valor.split(",").map(s => s.trim()).filter(Boolean) : []
      return (
        <div key={`campo_${campo.id}_${templateId}`}>
          <p className="text-sm font-medium text-(--text-primary) mb-1">{label}</p>
          <div className="flex flex-wrap gap-3">
            {opts.map(opt => (
              <div key={opt} className="flex items-center gap-1">
                <input
                  type      ="checkbox"
                  id        ={`campo_${campo.id}_${opt}`}
                  checked   ={selecionados.includes(opt)}
                  onChange  ={(e) => {
                    const novos = e.target.checked
                      ? [...selecionados, opt]
                      : selecionados.filter(s => s !== opt)
                    onChange(campo.id, novos.join(","))
                  }}
                  className ="w-4 h-4 accent-(--accent)"
                />
                <label htmlFor={`campo_${campo.id}_${opt}`} className="text-sm text-(--text-primary)">
                  {opt}
                </label>
              </div>
            ))}
          </div>
        </div>
      )
    }

    default:
      return null
  }
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function FichaAnamneseForm() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()

  const [formKey,         setFormKey]         = useState(0)
  const [loading,         setLoading]         = useState(false)
  const [saving,          setSaving]          = useState(false)
  const [sendingPdf,      setSendingPdf]      = useState(false)
  const [ficha,           setFicha]           = useState<FichaAnamneseResponse | null>(null)
  const [currentId,       setCurrentId]       = useState<string | undefined>(idParam)

  const [pessoaId,        setPessoaId]        = useState("")
  const [emitenteId,      setEmitenteId]      = useState("")
  const [finalidade,      setFinalidade]      = useState<TipoFinalidade | "">("")
  const [template,        setTemplate]        = useState<TemplateAnamneseResponse | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [campoValores,    setCampoValores]    = useState<Record<number, string>>({})

  const isEdit = !!currentId

  // ── Carregar ficha existente ───────────────────────────────────────────────

  useEffect(() => {
    if (!currentId) { setFicha(null); return }
    setLoading(true)
    api.get<FichaAnamneseResponse>(`/fichas-anamnese/${currentId}`)
      .then(r => loadFicha(r.data))
      .catch(() => { showMessage("error", "Erro ao carregar ficha"); navigate("/clinica/fichas-anamnese") })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  function loadFicha(data: FichaAnamneseResponse) {
    setFicha(data)
    setPessoaId(String(data.pessoaId))
    setEmitenteId(data.emitenteId ? String(data.emitenteId) : "")
    setFinalidade(data.finalidade)

    // Carregar template completo para ter os campos
    api.get<TemplateAnamneseResponse>(`/templates-anamnese/${data.templateId}`)
      .then(r => {
        setTemplate(r.data)
        // Inicializar valores com "" e depois preencher com respostas da ficha
        const vals: Record<number, string> = {}
        r.data.campos.forEach(c => { vals[c.id] = "" })
        data.respostas.forEach(resp => { vals[resp.campoId] = resp.valor ?? "" })
        setCampoValores(vals)
      })
      .catch(() => showMessage("error", "Erro ao carregar template da ficha"))

    setFormKey(k => k + 1)
  }

  // ── Quando o usuário seleciona finalidade (modo novo) ─────────────────────

  async function handleFinalidadeChange(val: string) {
    setFinalidade(val as TipoFinalidade | "")
    setTemplate(null)
    setCampoValores({})
    if (!val) return
    setLoadingTemplate(true)
    try {
      const res = await api.get<TemplateAnamneseResponse>(`/templates-anamnese/por-finalidade/${val}`)
      setTemplate(res.data)
      const vals: Record<number, string> = {}
      res.data.campos.forEach(c => { vals[c.id] = "" })
      setCampoValores(vals)
    } catch {
      showMessage("error", "Nenhum template encontrado para esta finalidade")
    } finally {
      setLoadingTemplate(false)
    }
  }

  // ── Novo ───────────────────────────────────────────────────────────────────

  function handleNovo() {
    setCurrentId(undefined)
    setFicha(null)
    setPessoaId("")
    setEmitenteId("")
    setFinalidade("")
    setTemplate(null)
    setCampoValores({})
    setFormKey(k => k + 1)
  }

  // ── Validação de campos obrigatórios ───────────────────────────────────────

  function validarCamposObrigatorios(): boolean {
    if (!template) return true
    const erros: string[] = []
    template.campos.filter(c => c.ativo && c.obrigatorio).forEach(c => {
      if (c.tipo === "CHECKBOX") return // checkbox obrigatório não é validado no sentido tradicional
      const val = campoValores[c.id] ?? ""
      if (c.tipo === "OPCOES" && val === "") {
        erros.push(c.rotulo)
      } else if (c.tipo !== "OPCOES" && !val.trim()) {
        erros.push(c.rotulo)
      }
    })
    if (erros.length) {
      showMessage("error", `Campos obrigatórios não preenchidos: ${erros.join(", ")}`)
      return false
    }
    return true
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(data: Record<string, string>) {
    if (!pessoaId)        { showMessage("error", "Paciente é obrigatório");         return }
    if (!finalidade)      { showMessage("error", "Especialidade é obrigatória");    return }
    if (!template)        { showMessage("error", "Nenhum template carregado");      return }
    if (!data.dataPreenchimento) { showMessage("error", "Data de preenchimento é obrigatória"); return }
    if (!validarCamposObrigatorios()) return

    setSaving(true)
    try {
      const respostas = Object.entries(campoValores)
        .map(([campoId, valor]) => ({ campoId: Number(campoId), valor: valor || null }))

      if (isEdit) {
        const payload = {
          emitenteId:         emitenteId ? Number(emitenteId) : null,
          dataPreenchimento:  data.dataPreenchimento,
          observacoes:        data.observacoes?.trim() || null,
          respostas,
        }
        await api.put(`/fichas-anamnese/${currentId}`, payload)
        showMessage("success", "Ficha atualizada com sucesso!")
        const r = await api.get<FichaAnamneseResponse>(`/fichas-anamnese/${currentId}`)
        loadFicha(r.data)
      } else {
        const payload = {
          templateId:         template.id,
          pessoaId:           Number(pessoaId),
          emitenteId:         emitenteId ? Number(emitenteId) : null,
          dataPreenchimento:  data.dataPreenchimento,
          observacoes:        data.observacoes?.trim() || null,
          respostas,
        }
        const res = await api.post<FichaAnamneseResponse>("/fichas-anamnese", payload)
        showMessage("success", "Ficha criada com sucesso!")
        const novoId = String(res.data.id)
        setCurrentId(novoId)
        const r = await api.get<FichaAnamneseResponse>(`/fichas-anamnese/${novoId}`)
        loadFicha(r.data)
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao salvar ficha")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setSaving(false)
    }
  }

  // ── PDF ────────────────────────────────────────────────────────────────────

  function montarDadosPdf() {
    if (!ficha || !template) return null

    const secoesSet = [...new Set(
      template.campos.filter(c => c.ativo).map(c => c.secao ?? "Geral")
    )].sort()

    const secoes = secoesSet.map(nomeSec => ({
      nome:   nomeSec,
      campos: template.campos
        .filter(c => c.ativo && (c.secao ?? "Geral") === nomeSec)
        .sort((a, b) => a.ordem - b.ordem)
        .map(c => {
          const resposta = ficha.respostas.find(r => r.campoId === c.id)
          return {
            rotulo: c.rotulo,
            tipo:   c.tipo,
            valor:  resposta?.valor ?? null,
          }
        }),
    }))

    return {
      fichaId:           ficha.id,
      emitenteNome:      ficha.emitenteNome ?? "Clínica",
      finalidadeLabel:   FINALIDADE_LABEL[ficha.finalidade],
      templateNome:      ficha.templateNome,
      pessoaNome:        ficha.pessoaNome,
      pessoaDocumento:   ficha.pessoaDocumento,
      dataPreenchimento: ficha.dataPreenchimento,
      observacoes:       ficha.observacoes,
      secoes,
    }
  }

  function handleImprimirPdf() {
    const dados = montarDadosPdf()
    if (!dados) { showMessage("error", "Dados insuficientes para gerar o PDF"); return }
    const base64 = gerarPdfFichaAnamnese(dados)
    const link   = document.createElement("a")
    link.href     = `data:application/pdf;base64,${base64}`
    link.download = `ficha-anamnese-${ficha!.id}.pdf`
    link.click()
  }

  async function handleEnviarWhatsapp() {
    const dados = montarDadosPdf()
    if (!dados) { showMessage("error", "Dados insuficientes para gerar o PDF"); return }
    setSendingPdf(true)
    try {
      const base64   = gerarPdfFichaAnamnese(dados)
      const fileName = `ficha-anamnese-${ficha!.id}.pdf`
      const caption  = `Ficha de Anamnese — ${FINALIDADE_LABEL[ficha!.finalidade]} — ${ficha!.pessoaNome}`
      await api.post(`/fichas-anamnese/${currentId}/enviar-pdf`, { base64, fileName, caption })
      showMessage("success", "PDF enviado por WhatsApp com sucesso!")
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao enviar PDF")
      } else {
        showMessage("error", "Erro ao enviar PDF")
      }
    } finally {
      setSendingPdf(false)
    }
  }

  // ── Agrupamento de campos por seção ────────────────────────────────────────

  const secoes = template
    ? [...new Set(
        template.campos.filter(c => c.ativo).map(c => c.secao ?? "Geral")
      )].sort()
    : []

  function camposDaSecao(nomeSec: string) {
    return (template?.campos ?? [])
      .filter(c => c.ativo && (c.secao ?? "Geral") === nomeSec)
      .sort((a, b) => a.ordem - b.ordem)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <TPage title="Carregando..." breadcrumb={["Clínica", "Fichas de Anamnese"]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title     ={isEdit ? `Ficha #${ficha?.id ?? ""}` : "Nova Ficha de Anamnese"}
      breadcrumb={["Clínica", "Fichas de Anamnese", isEdit ? "Editar" : "Nova"]}
    >
      {isEdit && ficha && (
        <div className="mb-3 px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-sm text-blue-800">
          <strong>{FINALIDADE_LABEL[ficha.finalidade]}</strong>
          {" — "}{ficha.templateNome}
          {" — "}{ficha.pessoaNome}
          {ficha.createdByNome && (
            <span className="ml-2 text-blue-600 font-normal">
              (criado por {ficha.createdByNome})
            </span>
          )}
        </div>
      )}

      <TForm key={formKey} onSubmit={handleSubmit}>
        {/* ── Dados principais ── */}
        <TRow>
          <TCol>
            <TDbCombo
              name         ="pessoaId"
              label        ="Paciente (*)"
              url          ="/pessoas/select"
              valueField   ="id"
              displayField ={displayPessoa}
              searchField  ="nome"
              placeholder  ="Selecione o paciente..."
              required
              width        ="50%"
              minWidth     ="200px"
              disabled     ={isEdit}
              value        ={pessoaId}
              onChange     ={(val) => setPessoaId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="emitenteId"
              label        ="Emitente (responsável)"
              url          ="/emitentes/select"
              valueField   ="id"
              displayField ={displayEmitente}
              searchField  ="nome"
              placeholder  ="Selecione o emitente (opcional)..."
              width        ="50%"
              minWidth     ="200px"
              value        ={emitenteId}
              onChange     ={(val) => setEmitenteId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TCombo
              name        ="finalidade"
              label       ="Especialidade (*)"
              width       ="200px"
              defaultValue={finalidade}
              disabled    ={isEdit}
              onChange    ={isEdit ? undefined : handleFinalidadeChange}
              options     ={[{ value: "", label: "Selecione..." }, ...FINALIDADE_OPTIONS]}
            />
          </TCol>
          <TCol>
            <TDate
              name        ="dataPreenchimento"
              label       ="Data de Preenchimento (*)"
              width       ="200px"
              defaultValue={ficha?.dataPreenchimento ?? hoje()}
            />
          </TCol>
          <TSpace />
        </TRow>
        <TRow>
          <TCol>
            <TText
              name        ="observacoes"
              label       ="Observações"
              placeholder ="Observações gerais sobre a ficha..."
              width       ="50%"
              minWidth    ="200px"
              height      ="80px"
              defaultValue={ficha?.observacoes ?? ""}
            />
          </TCol>
        </TRow>

        {/* ── Indicador de carregamento do template ── */}
        {loadingTemplate && (
          <div className="flex items-center gap-2 py-4 text-sm text-(--text-muted)">
            <span className="w-4 h-4 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
            Carregando formulário da especialidade...
          </div>
        )}

        {/* ── Campos dinâmicos por seção ── */}
        {template && !loadingTemplate && secoes.map(nomeSec => (
          <TPanel key={`secao_${nomeSec}_${template.id}`} title={nomeSec}>
            <div className="flex flex-col gap-4">
              {camposDaSecao(nomeSec).map(campo => (
                <RenderCampo
                  key      ={`campo_${campo.id}_${template.id}`}
                  campo    ={campo}
                  templateId={template.id}
                  valor    ={campoValores[campo.id] ?? ""}
                  onChange ={(campoId, valor) =>
                    setCampoValores(prev => ({ ...prev, [campoId]: valor }))
                  }
                />
              ))}
            </div>
          </TPanel>
        ))}

        {/* ── Aviso quando nenhum template foi encontrado ── */}
        {finalidade && !template && !loadingTemplate && (
          <div className="px-4 py-3 rounded-lg border border-yellow-200 bg-yellow-50 text-sm text-yellow-800">
            Nenhum template de anamnese encontrado para a especialidade selecionada.
            Cadastre um template em <strong>Templates de Anamnese</strong> antes de criar fichas.
          </div>
        )}

        {/* ── Auditoria ── */}
        {isEdit && ficha && (
          <TRow>
            <TCol>
              <TEntry name="createdByNome" label="Criado por" disabled
                defaultValue={ficha.createdByNome ?? "—"} />
            </TCol>
            <TCol>
              <TEntry name="createdAt" label="Criado em" disabled width="180px"
                defaultValue={ficha.createdAt ? new Date(ficha.createdAt).toLocaleString("pt-BR") : "—"} />
            </TCol>
            <TSpace />
          </TRow>
        )}

        {/* ── Rodapé ── */}
        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Voltar" variant="cancel" type="button"
              onClick={() => navigate("/clinica/fichas-anamnese")} />
            <TButton label="Novo" variant="new" type="button" onClick={handleNovo} />
          </TFormActionsLeft>
          <TFormActionsRight>
            {isEdit && (
              <>
                <TButton label="Imprimir PDF" variant="secondary" type="button"
                  onClick={handleImprimirPdf} />
                <TButton label="Enviar por WhatsApp" variant="success" type="button"
                  loading={sendingPdf} onClick={handleEnviarWhatsapp} />
              </>
            )}
            <TButton label="Salvar" variant="save" type="submit" loading={saving} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
