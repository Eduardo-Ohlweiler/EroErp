import { useEffect, useMemo, useState }                            from "react"
import { useNavigate, useParams }                                  from "react-router-dom"
import axios                                                       from "axios"
import { api }                                                     from "../../services/api"
import type {
  QuestionarioSummary,
  QuestionarioDetalhe,
  QuestionarioAplicadoResponse,
  QuestionarioAplicadoPayload,
}                                                                  from "../../types/Otorrino"
import type { ErrorResponse }                                      from "../../types/ErrorResponse"
import { TPage }                                                   from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TPanel }                                                  from "../../components/tpanel"
import { TRow }                                                    from "../../components/trow"
import { TCol }                                                    from "../../components/tcol"
import { TCombo }                                                  from "../../components/tcombo"
import { TDate }                                                   from "../../components/tdate"
import { TDbCombo }                                                from "../../components/tdbcombo"
import { TButton }                                                 from "../../components/tbutton"
import { useMessage }                                              from "../../hooks/useMessage"
import { displayPessoa }                                           from "../../utils/pessoas"
import { gerarPdfEscala }                                          from "../../utils/geradorPdf"

function formatarData(iso: string): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

function hoje(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// ── Cartão de resultado ─────────────────────────────────────────────────────

function ResultadoPanel({ aplicado }: { aplicado: QuestionarioAplicadoResponse }) {
  return (
    <TPanel title="Resultado">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-40 border border-(--border) rounded-lg p-4 bg-(--bg-input)">
          <p className="text-sm text-(--text-muted) mb-1">Score total</p>
          <p className="text-2xl font-bold text-(--text-primary)">{aplicado.scoreTotal ?? "—"}</p>
        </div>
        <div className="flex-1 min-w-40 border border-(--border) rounded-lg p-4 bg-(--bg-input)">
          <p className="text-sm text-(--text-muted) mb-1">Classificação</p>
          <p className="text-lg font-semibold text-(--accent)">{aplicado.classificacao ?? "—"}</p>
        </div>
      </div>
      {aplicado.interpretacao && (
        <p className="text-sm text-(--text-secondary) mt-3 leading-relaxed">
          {aplicado.interpretacao}
        </p>
      )}
    </TPanel>
  )
}

// ── Componente ─────────────────────────────────────────────────────────────────

export default function QuestionarioAplicadoForm() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const isView          = !!idParam   // modo somente leitura (backend não tem PUT)

  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [formKey, setFormKey] = useState(0)

  // ── modo criação ──
  const [catalogo,  setCatalogo]  = useState<QuestionarioSummary[]>([])
  const [pessoaId,  setPessoaId]  = useState("")
  const [dataVal,   setDataVal]   = useState(hoje())
  const [escalaId,  setEscalaId]  = useState("")
  const [detalhe,   setDetalhe]   = useState<QuestionarioDetalhe | null>(null)
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)
  // respostas: itemId -> valor
  const [respostas, setRespostas] = useState<Record<number, number>>({})

  // ── modo visualização ──
  const [aplicado, setAplicado] = useState<QuestionarioAplicadoResponse | null>(null)

  useEffect(() => {
    if (idParam) carregarAplicado(idParam)
    else         carregarCatalogo()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam])

  async function carregarCatalogo() {
    try {
      const res = await api.get<QuestionarioSummary[]>("/otorrino/questionarios")
      setCatalogo(res.data ?? [])
    } catch {
      showMessage("error", "Erro ao carregar catálogo de escalas")
    }
  }

  async function carregarAplicado(id: string) {
    setLoading(true)
    try {
      const res = await api.get<QuestionarioAplicadoResponse>(`/otorrino/questionarios-aplicados/${id}`)
      setAplicado(res.data)
      setFormKey(k => k + 1)
    } catch {
      showMessage("error", "Erro ao carregar escala aplicada")
    } finally {
      setLoading(false)
    }
  }

  async function handleSelecionarEscala(value: string) {
    setEscalaId(value)
    setDetalhe(null)
    setRespostas({})
    if (!value) return
    setCarregandoDetalhe(true)
    try {
      const res = await api.get<QuestionarioDetalhe>(`/otorrino/questionarios/${value}`)
      setDetalhe(res.data)
    } catch {
      showMessage("error", "Erro ao carregar a escala selecionada")
    } finally {
      setCarregandoDetalhe(false)
    }
  }

  function responder(itemId: number, valor: number) {
    setRespostas(prev => ({ ...prev, [itemId]: valor }))
  }

  // contadores / score parcial (apenas feedback — fonte da verdade é o backend)
  const totalItens   = detalhe?.itens.length ?? 0
  const respondidos  = useMemo(
    () => (detalhe ? detalhe.itens.filter(i => respostas[i.id] != null).length : 0),
    [detalhe, respostas],
  )
  const scoreParcial = useMemo(
    () => (detalhe ? detalhe.itens.reduce((s, i) => s + (respostas[i.id] ?? 0), 0) : 0),
    [detalhe, respostas],
  )
  const completo = totalItens > 0 && respondidos === totalItens

  async function handleCriar() {
    if (!pessoaId) { showMessage("error", "Selecione o paciente"); return }
    if (!escalaId) { showMessage("error", "Selecione a escala"); return }
    if (!dataVal)  { showMessage("error", "Informe a data de aplicação"); return }
    if (!detalhe)  { showMessage("error", "Carregue a escala selecionada"); return }
    if (!completo) {
      showMessage("error", `Responda todos os itens (${respondidos}/${totalItens})`)
      return
    }

    const payload: QuestionarioAplicadoPayload = {
      pessoaId:       parseInt(pessoaId),
      questionarioId: parseInt(escalaId),
      consultaId:     null,
      dataAplicacao:  dataVal,
      respostas:      detalhe.itens.map(i => ({ itemId: i.id, valor: respostas[i.id] })),
    }

    setSaving(true)
    try {
      const res = await api.post<QuestionarioAplicadoResponse>("/otorrino/questionarios-aplicados", payload)
      showMessage("success", "Escala aplicada com sucesso!")
      // exibe o resultado calculado pelo backend em modo visualização
      setAplicado(res.data)
      navigate(`/otorrino/escalas/${res.data.id}`, { replace: true })
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as ErrorResponse
        showMessage("error", data.erro ?? "Erro ao salvar aplicação")
      } else {
        showMessage("error", "Erro ao salvar aplicação")
      }
    } finally {
      setSaving(false)
    }
  }

  function handleGerarPdf() {
    if (!aplicado) return
    const b64 = gerarPdfEscala({
      dataEmissao:      hoje(),
      pacienteNome:     aplicado.pessoaNome,
      usuarioNome:      aplicado.usuarioNome,
      dataAplicacao:    aplicado.dataAplicacao,
      questionarioNome: aplicado.questionarioNome,
      scoreTotal:       aplicado.scoreTotal,
      classificacao:    aplicado.classificacao,
      interpretacao:    aplicado.interpretacao,
      respostas:        aplicado.respostas.map((r, idx) => ({
        enunciado: r.enunciado ?? `Item ${idx + 1}`,
        valor:     r.valor,
      })),
    })
    const link    = document.createElement("a")
    link.href     = `data:application/pdf;base64,${b64}`
    link.download = `escala_${aplicado.questionarioCodigo.toLowerCase()}_${(aplicado.pessoaNome ?? "paciente").replace(/\s+/g, "_")}_${aplicado.dataAplicacao}.pdf`
    link.click()
  }

  if (loading) {
    return (
      <TPage title="Escala" breadcrumb={["Otorrinolaringologia", "Escalas e Questionários", "Carregando..."]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  MODO VISUALIZAÇÃO (somente leitura) — :id
  // ════════════════════════════════════════════════════════════════════════════
  if (isView && aplicado) {
    return (
      <TPage
        title     ={aplicado.questionarioNome}
        breadcrumb={["Otorrinolaringologia", "Escalas e Questionários", "Visualizar"]}
      >
        <div key={formKey} className="flex flex-col gap-4">
          <TPanel title="Dados da Aplicação">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-(--text-muted)">Paciente</p>
                <p className="font-medium text-(--text-primary)">{aplicado.pessoaNome}</p>
              </div>
              <div>
                <p className="text-(--text-muted)">Escala</p>
                <p className="font-medium text-(--text-primary)">
                  {aplicado.questionarioCodigo} — {aplicado.questionarioNome}
                </p>
              </div>
              <div>
                <p className="text-(--text-muted)">Data de aplicação</p>
                <p className="font-medium text-(--text-primary)">{formatarData(aplicado.dataAplicacao)}</p>
              </div>
              {aplicado.usuarioNome && (
                <div>
                  <p className="text-(--text-muted)">Aplicado por</p>
                  <p className="font-medium text-(--text-primary)">{aplicado.usuarioNome}</p>
                </div>
              )}
            </div>
          </TPanel>

          <ResultadoPanel aplicado={aplicado} />

          <TPanel title="Respostas">
            <div className="flex flex-col divide-y divide-(--border)">
              {aplicado.respostas.map((r, idx) => (
                <div key={r.itemId} className="flex items-start justify-between gap-4 py-3">
                  <p className="text-sm text-(--text-primary) flex-1">
                    <span className="text-(--text-muted) mr-2">{idx + 1}.</span>
                    {r.enunciado ?? `Item #${r.itemId}`}
                  </p>
                  <span className="px-2 py-0.5 rounded text-sm font-semibold bg-(--accent-light) text-(--accent) whitespace-nowrap">
                    {r.valor}
                  </span>
                </div>
              ))}
            </div>
          </TPanel>

          <TFormFooter>
            <TFormActionsLeft>
              <TButton label="Voltar" variant="cancel" type="button"
                onClick={() => navigate("/otorrino/escalas")} />
              <TButton label="Gerar PDF" variant="secondary" type="button"
                onClick={handleGerarPdf} />
            </TFormActionsLeft>
          </TFormFooter>
        </div>
      </TPage>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  MODO CRIAÇÃO — aplicar nova escala
  // ════════════════════════════════════════════════════════════════════════════
  const escalaOptions = catalogo.map(q => ({ value: String(q.id), label: q.nome }))

  return (
    <TPage title="Aplicar Escala" breadcrumb={["Otorrinolaringologia", "Escalas e Questionários", "Aplicar"]}>
      <TForm onSubmit={() => { void handleCriar() }}>

        <TPanel title="Dados da Aplicação">
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
                onChange    ={setPessoaId}
                placeholder ="Buscar paciente..."
              />
            </TCol>
            <TCol flex={2}>
              <TCombo name="escalaId" label="Escala" width="100%"
                options={escalaOptions} placeholder="Selecione a escala..."
                defaultValue={escalaId} onChange={handleSelecionarEscala} />
            </TCol>
            <TCol flex={1}>
              <TDate name="dataAplicacao" label="Data de Aplicação" required
                defaultValue={dataVal} onChange={setDataVal} />
            </TCol>
          </TRow>
        </TPanel>

        {carregandoDetalhe && (
          <div className="flex justify-center py-8">
            <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {detalhe && (
          <>
            {detalhe.instrucao && (
              <div className="rounded-lg border border-(--border) bg-(--accent-light) p-4">
                <p className="text-sm text-(--text-primary) leading-relaxed">{detalhe.instrucao}</p>
              </div>
            )}

            <TPanel title={`${detalhe.codigo} — ${detalhe.nome}`}>
              {/* contador de progresso + score parcial */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-sm">
                <span className="text-(--text-secondary)">
                  <strong className={completo ? "text-(--success)" : "text-(--text-primary)"}>
                    {respondidos}
                  </strong> de {totalItens} respondidos
                </span>
                <span className="text-(--text-muted)">
                  Score parcial: <strong className="text-(--text-primary)">{scoreParcial}</strong>
                </span>
              </div>

              <div className="flex flex-col divide-y divide-(--border)">
                {detalhe.itens.map((item, idx) => (
                  <div key={item.id} className="py-4">
                    <p className="text-sm text-(--text-primary) mb-2">
                      <span className="text-(--text-muted) mr-2">{idx + 1}.</span>
                      {item.enunciado}
                      {item.dominio && (
                        <span className="ml-2 text-xs text-(--text-muted)">({item.dominio})</span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2 pl-6">
                      {detalhe.opcoes.map(opc => {
                        const selecionado = respostas[item.id] === opc.valor
                        return (
                          <label
                            key={opc.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border cursor-pointer select-none text-sm transition
                              ${selecionado
                                ? "border-(--accent) bg-(--accent-light) text-(--accent) font-medium"
                                : "border-(--border) bg-(--bg-input) text-(--text-secondary) hover:bg-(--bg-hover)"}`}
                          >
                            <input
                              type    ="radio"
                              name    ={`item-${item.id}`}
                              checked ={selecionado}
                              onChange={() => responder(item.id, opc.valor)}
                              className="w-3.5 h-3.5 accent-(--accent) cursor-pointer"
                            />
                            {opc.rotulo}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </TPanel>
          </>
        )}

        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Voltar" variant="cancel" type="button"
              onClick={() => navigate("/otorrino/escalas")} />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="Salvar" variant="save" type="submit"
              loading={saving} disabled={!completo} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
