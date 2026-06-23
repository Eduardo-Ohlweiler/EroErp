import { useEffect, useState }                  from "react"
import { useNavigate, useParams }                from "react-router-dom"
import axios                                     from "axios"
import { api }                                   from "../../services/api"
import { useMessage }                            from "../../hooks/useMessage"
import type { ErrorResponse }                    from "../../types/ErrorResponse"
import type { PacoteContratadoResponse, StatusPacote, SessaoResumo } from "../../types/Pacote"
import type { StatusConsulta }                   from "../../types/Clinica"
import type { ContaReceberResponse, StatusConta } from "../../types/ContaReceber"
import { TPage }                                 from "../../components/tpage"
import { TPanel }                                from "../../components/tpanel"
import { TButton }                               from "../../components/tbutton"
import { TWindow }                               from "../../components/twindow"
import { TDateTime }                             from "../../components/tdatetime"
import { formatarDocumento }                     from "../../utils/pessoas"
import { gerarPdfPacote }                        from "../../utils/geradorPdf"

const STATUS_PACOTE_LABEL: Record<StatusPacote, string> = {
  ATIVO:     "Ativo",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
}
const STATUS_PACOTE_COLOR: Record<StatusPacote, string> = {
  ATIVO:     "bg-blue-100 text-blue-800 border-blue-200",
  CONCLUIDO: "bg-green-100 text-green-800 border-green-200",
  CANCELADO: "bg-red-100 text-red-800 border-red-200",
}

const STATUS_CONSULTA_LABEL: Record<StatusConsulta, string> = {
  AGENDADA:       "Agendada",
  EM_ATENDIMENTO: "Em Atendimento",
  CONCLUIDA:      "Concluída",
  CANCELADA:      "Cancelada",
}
const STATUS_CONSULTA_COLOR: Record<StatusConsulta, string> = {
  AGENDADA:       "bg-blue-500",
  EM_ATENDIMENTO: "bg-yellow-500",
  CONCLUIDA:      "bg-green-500",
  CANCELADA:      "bg-red-500",
}

const STATUS_CONTA_LABEL: Record<StatusConta, string> = {
  ABERTO:            "Em aberto",
  PARCIALMENTE_PAGO: "Parc. Pago",
  PAGO:              "Pago",
  CANCELADO:         "Cancelado",
}

function todayStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function fmtMoeda(v: number) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}
function fmtDT(iso: string) {
  if (!iso) return "—"
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
// ISO ("2026-06-25T08:00:00") -> formato do TDateTime ("2026-06-25T08:00")
function toInputDT(iso: string) {
  return iso ? iso.slice(0, 16) : ""
}
// formato do TDateTime -> formato esperado pela API ("...:00")
function toApiDT(dt: string) {
  if (!dt) return ""
  return dt.length === 16 ? `${dt}:00` : dt
}

export default function PacoteForm() {
  const { id }          = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()

  const [pacote,  setPacote]  = useState<PacoteContratadoResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [enviandoWpp, setEnviandoWpp] = useState(false)

  // Modal cancelar pacote
  const [cancelPacoteOpen, setCancelPacoteOpen] = useState(false)
  const [motivoPacote,     setMotivoPacote]     = useState("")
  const [cancelandoPacote, setCancelandoPacote] = useState(false)

  // Modal cancelar sessão
  const [cancelSessaoOpen, setCancelSessaoOpen] = useState(false)
  const [sessaoAlvo,       setSessaoAlvo]       = useState<SessaoResumo | null>(null)
  const [motivoSessao,     setMotivoSessao]     = useState("")
  const [cancelandoSessao, setCancelandoSessao] = useState(false)

  // Modal remarcar sessão (alterar data/horário)
  const [remarcarOpen,   setRemarcarOpen]   = useState(false)
  const [sessaoRemarcar, setSessaoRemarcar] = useState<SessaoResumo | null>(null)
  const [remarcarInicio, setRemarcarInicio] = useState("")
  const [remarcarFim,    setRemarcarFim]    = useState("")
  const [remarcando,     setRemarcando]     = useState(false)

  useEffect(() => {
    if (id) load(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function load(pacoteId: string) {
    setLoading(true)
    try {
      const res = await api.get<PacoteContratadoResponse>(`/pacotes/${pacoteId}`)
      setPacote(res.data)
    } catch {
      showMessage("error", "Erro ao carregar pacote")
      navigate("/clinica/pacotes")
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelarPacote() {
    if (!id) return
    setCancelandoPacote(true)
    try {
      const res = await api.patch<PacoteContratadoResponse>(`/pacotes/${id}/cancelar`, { motivo: motivoPacote || null })
      setPacote(res.data)
      showMessage("success", "Pacote cancelado!")
      setCancelPacoteOpen(false)
      setMotivoPacote("")
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao cancelar pacote")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setCancelandoPacote(false)
    }
  }

  function baixarPdf(base64: string, nomeArquivo: string) {
    const link = document.createElement("a")
    link.href = `data:application/pdf;base64,${base64}`
    link.download = nomeArquivo
    link.click()
  }

  // Monta o PDF do pacote (busca as parcelas da conta a receber, se houver) e retorna o base64.
  async function montarBase64Pdf(): Promise<string> {
    if (!pacote) throw new Error("Pacote não carregado")

    let financeiro: NonNullable<Parameters<typeof gerarPdfPacote>[0]["financeiro"]> | null = null
    if (pacote.contaReceberId != null) {
      try {
        const res = await api.get<ContaReceberResponse>(`/financeiro/contas-receber/${pacote.contaReceberId}`)
        const conta = res.data
        financeiro = {
          parcelas: conta.parcelas.map(p => ({
            numeroParcela:  p.numeroParcela,
            dataVencimento: p.dataVencimento,
            valor:          Number(p.valor),
            statusLabel:    STATUS_CONTA_LABEL[p.status] ?? "Em aberto",
            dataPagamento:  p.dataPagamento,
            valorPago:      p.valorPago != null ? Number(p.valorPago) : null,
          })),
          totalGeral: conta.valorTotal,
        }
      } catch {
        financeiro = null
      }
    }

    return gerarPdfPacote({
      pacoteId:          pacote.id,
      nome:              pacote.nome,
      statusLabel:       STATUS_PACOTE_LABEL[pacote.status],
      emitenteNome:      pacote.emitenteNome,
      pessoaNome:        pacote.pessoaNome,
      pessoaDocumento:   pacote.pessoaDocumento,
      produtoNome:       pacote.produtoNome,
      valorTotal:        pacote.valorTotal,
      quantidadeSessoes: pacote.quantidadeSessoes,
      sessoesUsadas:     pacote.sessoesUsadas,
      sessoesRestantes:  pacote.sessoesRestantes,
      dataEmissao:       todayStr(),
      observacao:        pacote.observacao,
      sessoes: pacote.sessoes.map(s => ({
        sessao:      s.sessao,
        statusLabel: STATUS_CONSULTA_LABEL[s.status],
        inicio:      s.inicio,
        fim:         s.fim,
      })),
      financeiro,
    })
  }

  // Apenas gera e baixa o PDF (não envia).
  async function handleGerarPdf() {
    if (!pacote) return
    setGerandoPdf(true)
    try {
      const base64 = await montarBase64Pdf()
      baixarPdf(base64, `pacote-${pacote.id}.pdf`)
      showMessage("success", "PDF gerado com sucesso!")
    } catch {
      showMessage("error", "Erro ao gerar PDF do pacote")
    } finally {
      setGerandoPdf(false)
    }
  }

  // Gera e envia o PDF ao paciente por WhatsApp (ação explícita).
  async function handleEnviarWhatsapp() {
    if (!id || !pacote) return
    setEnviandoWpp(true)
    try {
      const base64 = await montarBase64Pdf()
      await api.post(`/pacotes/${id}/enviar-pdf`, {
        base64,
        fileName: `pacote-${pacote.id}.pdf`,
        caption:  `Resumo do Pacote — ${pacote.nome}`,
      })
      showMessage("success", "PDF enviado por WhatsApp!")
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao enviar por WhatsApp")
      } else {
        showMessage("error", "Erro ao enviar por WhatsApp")
      }
    } finally {
      setEnviandoWpp(false)
    }
  }

  function openCancelarSessao(s: SessaoResumo) {
    setSessaoAlvo(s)
    setMotivoSessao("")
    setCancelSessaoOpen(true)
  }

  async function handleCancelarSessao() {
    if (!id || !sessaoAlvo) return
    setCancelandoSessao(true)
    try {
      const res = await api.patch<PacoteContratadoResponse>(
        `/pacotes/${id}/sessoes/${sessaoAlvo.consultaId}/cancelar`,
        { motivo: motivoSessao || null },
      )
      setPacote(res.data)
      showMessage("success", "Sessão cancelada!")
      setCancelSessaoOpen(false)
      setSessaoAlvo(null)
      setMotivoSessao("")
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao cancelar sessão")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setCancelandoSessao(false)
    }
  }

  function openRemarcar(s: SessaoResumo) {
    setSessaoRemarcar(s)
    setRemarcarInicio(toInputDT(s.inicio))
    setRemarcarFim(toInputDT(s.fim))
    setRemarcarOpen(true)
  }

  async function handleRemarcar() {
    if (!id || !sessaoRemarcar) return
    if (!remarcarInicio || !remarcarFim) {
      showMessage("error", "Informe início e fim")
      return
    }
    if (new Date(toApiDT(remarcarFim)) <= new Date(toApiDT(remarcarInicio))) {
      showMessage("error", "O fim deve ser posterior ao início")
      return
    }
    setRemarcando(true)
    try {
      const res = await api.patch<PacoteContratadoResponse>(
        `/pacotes/${id}/sessoes/${sessaoRemarcar.consultaId}/remarcar`,
        { inicio: toApiDT(remarcarInicio), fim: toApiDT(remarcarFim) },
      )
      setPacote(res.data)
      showMessage("success", "Sessão remarcada!")
      setRemarcarOpen(false)
      setSessaoRemarcar(null)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao remarcar sessão")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setRemarcando(false)
    }
  }

  if (loading || !pacote) {
    return (
      <TPage title="Carregando..." breadcrumb={["Clínica", "Pacotes"]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  const podeCancelarPacote = pacote.status === "ATIVO"

  return (
    <TPage title={pacote.nome} breadcrumb={["Clínica", "Pacotes", "Detalhe"]}>

      {/* Banner de status */}
      <div className={`mb-4 px-4 py-2 rounded-lg border text-sm font-medium ${STATUS_PACOTE_COLOR[pacote.status]}`}>
        Status: {STATUS_PACOTE_LABEL[pacote.status]}
        {pacote.motivoCancelamento && (
          <span className="ml-2 font-normal">— Motivo: {pacote.motivoCancelamento}</span>
        )}
      </div>

      {/* Cabeçalho */}
      <TPanel title="Dados do Pacote">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <div>
            <span className="text-(--text-muted)">Serviço: </span>
            <span className="font-medium">{pacote.produtoNome}</span>
          </div>
          <div>
            <span className="text-(--text-muted)">Paciente: </span>
            <span className="font-medium">{pacote.pessoaNome}</span>
            {pacote.pessoaDocumento && (
              <span className="ml-1 text-xs opacity-60">({formatarDocumento(pacote.pessoaDocumento)})</span>
            )}
          </div>
          <div>
            <span className="text-(--text-muted)">Emitente: </span>
            <span className="font-medium">{pacote.emitenteNome}</span>
          </div>
          <div>
            <span className="text-(--text-muted)">Valor Total: </span>
            <span className="font-bold text-(--accent)">{fmtMoeda(pacote.valorTotal)}</span>
          </div>
          <div>
            <span className="text-(--text-muted)">Sessões usadas: </span>
            <span className="font-medium">{pacote.sessoesUsadas} / {pacote.quantidadeSessoes}</span>
          </div>
          <div>
            <span className="text-(--text-muted)">Sessões restantes: </span>
            <span className="font-medium">{pacote.sessoesRestantes}</span>
          </div>
          {pacote.observacao && (
            <div className="sm:col-span-2">
              <span className="text-(--text-muted)">Observação: </span>
              <span>{pacote.observacao}</span>
            </div>
          )}
        </div>

        {/* Aviso financeiro */}
        <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          ⚠ O financeiro deste pacote é tratado manualmente: cancelar o pacote ou uma sessão
          <strong> não altera</strong> a conta a receber. Devoluções/créditos devem ser feitos pelo módulo Financeiro.
        </div>
      </TPanel>

      {/* Sessões */}
      <TPanel title={`Sessões (${pacote.sessoes.length})`}>
        <div className="flex flex-col gap-2">
          {pacote.sessoes.length === 0 && (
            <div className="text-sm text-(--text-muted)">Nenhuma sessão.</div>
          )}
          {pacote.sessoes.map((s) => {
            const podeCancelarSessao = s.status === "AGENDADA" || s.status === "EM_ATENDIMENTO"
            return (
              <div
                key={s.consultaId}
                className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-(--border) bg-(--surface)"
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-(--surface-secondary) text-xs font-bold text-(--text-secondary) shrink-0">
                  {s.sessao}
                </span>
                <span className="text-sm font-medium">
                  Sessão {s.sessao}/{pacote.quantidadeSessoes}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${STATUS_CONSULTA_COLOR[s.status]}`}>
                  {STATUS_CONSULTA_LABEL[s.status]}
                </span>
                <span className="text-sm text-(--text-muted)">{fmtDT(s.inicio)}</span>
                <div className="ml-auto flex gap-2">
                  <TButton
                    label  ="Abrir consulta"
                    variant="secondary"
                    type   ="button"
                    onClick={() => navigate(`/clinica/consultas/${s.consultaId}`)}
                  />
                  {podeCancelarSessao && (
                    <TButton
                      label  ="Alterar data"
                      variant="new"
                      type   ="button"
                      onClick={() => openRemarcar(s)}
                    />
                  )}
                  {podeCancelarSessao && (
                    <TButton
                      label  ="Cancelar Sessão"
                      variant="cancel"
                      type   ="button"
                      onClick={() => openCancelarSessao(s)}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </TPanel>

      {/* Rodapé */}
      <div className="flex flex-wrap justify-between items-center gap-3 pt-2 border-t border-(--border)">
        <div className="flex flex-wrap gap-2">
          <TButton label="Voltar" variant="cancel" type="button" onClick={() => navigate("/clinica/pacotes")} />
          <TButton label="Gerar PDF" variant="secondary" type="button"
            loading={gerandoPdf} onClick={handleGerarPdf} />
          <TButton label="Enviar por WhatsApp" variant="save" type="button"
            loading={enviandoWpp} onClick={handleEnviarWhatsapp} />
        </div>
        {podeCancelarPacote && (
          <TButton label="Cancelar Pacote" variant="danger" type="button"
            onClick={() => { setMotivoPacote(""); setCancelPacoteOpen(true) }} />
        )}
      </div>

      {/* Modal: cancelar pacote */}
      <TWindow
        title   ="Cancelar Pacote"
        open    ={cancelPacoteOpen}
        onClose ={() => { setCancelPacoteOpen(false); setMotivoPacote("") }}
        width   ="480px"
        actions ={
          <>
            <TButton label="Voltar" variant="cancel"
              onClick={() => { setCancelPacoteOpen(false); setMotivoPacote("") }} />
            <TButton label="Confirmar Cancelamento" variant="danger"
              loading={cancelandoPacote} onClick={handleCancelarPacote} />
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-(--text-muted)">
            Todas as sessões agendadas/em atendimento serão canceladas. O financeiro
            <strong> não</strong> será alterado. Informe o motivo (opcional):
          </p>
          <textarea
            rows      ={4}
            maxLength ={500}
            value     ={motivoPacote}
            onChange  ={e => setMotivoPacote(e.target.value)}
            placeholder="Motivo do cancelamento..."
            className ="border border-(--border) rounded px-3 py-2 text-sm
                        bg-(--bg-surface) text-(--text-primary) resize-none
                        focus:outline-none focus:ring-1 focus:ring-(--accent) w-full"
          />
        </div>
      </TWindow>

      {/* Modal: cancelar sessão */}
      <TWindow
        title   ={sessaoAlvo ? `Cancelar Sessão ${sessaoAlvo.sessao}` : "Cancelar Sessão"}
        open    ={cancelSessaoOpen}
        onClose ={() => { setCancelSessaoOpen(false); setSessaoAlvo(null); setMotivoSessao("") }}
        width   ="480px"
        actions ={
          <>
            <TButton label="Voltar" variant="cancel"
              onClick={() => { setCancelSessaoOpen(false); setSessaoAlvo(null); setMotivoSessao("") }} />
            <TButton label="Confirmar Cancelamento" variant="danger"
              loading={cancelandoSessao} onClick={handleCancelarSessao} />
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-(--text-muted)">
            A consulta desta sessão e seu compromisso na agenda serão cancelados. O financeiro
            <strong> não</strong> será alterado. Informe o motivo (opcional):
          </p>
          <textarea
            rows      ={4}
            maxLength ={500}
            value     ={motivoSessao}
            onChange  ={e => setMotivoSessao(e.target.value)}
            placeholder="Motivo do cancelamento..."
            className ="border border-(--border) rounded px-3 py-2 text-sm
                        bg-(--bg-surface) text-(--text-primary) resize-none
                        focus:outline-none focus:ring-1 focus:ring-(--accent) w-full"
          />
        </div>
      </TWindow>

      {/* Modal: remarcar sessão (alterar data/horário) */}
      <TWindow
        title   ={sessaoRemarcar ? `Alterar data — Sessão ${sessaoRemarcar.sessao}` : "Alterar data"}
        open    ={remarcarOpen}
        onClose ={() => { setRemarcarOpen(false); setSessaoRemarcar(null) }}
        width   ="480px"
        actions ={
          <>
            <TButton label="Voltar" variant="cancel"
              onClick={() => { setRemarcarOpen(false); setSessaoRemarcar(null) }} />
            <TButton label="Salvar" variant="save"
              loading={remarcando} onClick={handleRemarcar} />
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-(--text-muted)">
            A consulta desta sessão e o compromisso na agenda serão movidos para a nova data/horário.
            Conflitos de horário são verificados automaticamente.
          </p>
          <div className="flex flex-wrap gap-3">
            <TDateTime
              key         ={`rem-ini-${sessaoRemarcar?.consultaId ?? "x"}`}
              name        ="remarcarInicio"
              label       ="Início (*)"
              width       ="200px"
              defaultValue={remarcarInicio}
              onChange    ={setRemarcarInicio}
            />
            <TDateTime
              key         ={`rem-fim-${sessaoRemarcar?.consultaId ?? "x"}`}
              name        ="remarcarFim"
              label       ="Fim (*)"
              width       ="200px"
              defaultValue={remarcarFim}
              onChange    ={setRemarcarFim}
            />
          </div>
        </div>
      </TWindow>
    </TPage>
  )
}
