import { useCallback, useEffect, useRef, useState } from "react"
import axios from "axios"
import { FaXmark, FaUserPlus, FaUserCheck } from "react-icons/fa6"
import { api } from "../../services/api"
import { useAuth } from "../../hooks/useAuth"
import { useMessage } from "../../hooks/useMessage"
import type { AtendimentoResponse } from "../../types/Atendimento"
import type { MensagemResponse, EnviarMensagemPayload } from "../../types/Mensagem"
import type { FluxoKanbanColunaResponse } from "../../types/FluxoKanban"
import type { ErrorResponse } from "../../types/ErrorResponse"
import { TCombo } from "../tcombo"
import { TButton } from "../tbutton"
import { ChatMessage } from "./ChatMessage"
import { ChatInput } from "./ChatInput"
import { AssumirWindow } from "./AssumirWindow"

interface ChatPanelProps {
  atendimento: AtendimentoResponse
  colunas:     FluxoKanbanColunaResponse[]
  onClose:     () => void
  // callbacks para o pai refletir mudanças no board
  onMover:     (atendimentoId: number, andamentoId: number) => void
  onAtualizado: (atendimento: AtendimentoResponse) => void
  // mensagens que chegam via SSE para este atendimento (empurradas pelo pai)
  mensagemExterna: MensagemResponse | null
}

const PAGE_SIZE = 30

export function ChatPanel({
  atendimento,
  colunas,
  onClose,
  onMover,
  onAtualizado,
  mensagemExterna,
}: ChatPanelProps) {
  const { user } = useAuth()
  const { showMessage } = useMessage()

  const [mensagens, setMensagens] = useState<MensagemResponse[]>([])
  const [page, setPage] = useState(0)
  const [temMais, setTemMais] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [assumirOpen, setAssumirOpen] = useState(false)

  const listaRef = useRef<HTMLDivElement>(null)

  const semDono = atendimento.usuarioId == null
  const souDono = atendimento.usuarioId != null && atendimento.usuarioId === user?.id

  // carrega a primeira página (mais recentes) ao trocar de atendimento
  const carregarInicial = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await api.get(
        `/crm/atendimentos/${atendimento.id}/mensagens?page=0&size=${PAGE_SIZE}&sort=dataMensagem,desc`
      )
      const content = (res.data?.content ?? []) as MensagemResponse[]
      // API devolve desc (mais recente primeiro); invertemos p/ exibir cronológico
      setMensagens([...content].reverse())
      setPage(0)
      setTemMais(!(res.data?.last ?? true))
    } catch {
      showMessage("error", "Erro ao carregar mensagens")
    } finally {
      setCarregando(false)
    }
  }, [atendimento.id, showMessage])

  useEffect(() => {
    carregarInicial()
  }, [carregarInicial])

  // rola para o fim quando a lista inicial carrega
  useEffect(() => {
    if (!carregando && page === 0 && listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight
    }
  }, [carregando, page])

  // anexa mensagem que chegou via SSE (se for deste atendimento e ainda não estiver na lista)
  useEffect(() => {
    if (!mensagemExterna) return
    if (mensagemExterna.atendimentoId !== atendimento.id) return
    setMensagens((prev) => {
      if (prev.some((m) => m.id === mensagemExterna.id)) return prev
      return [...prev, mensagemExterna]
    })
    // rola para o fim
    requestAnimationFrame(() => {
      if (listaRef.current) listaRef.current.scrollTop = listaRef.current.scrollHeight
    })
  }, [mensagemExterna, atendimento.id])

  async function carregarMais() {
    if (carregando || !temMais) return
    const proxima = page + 1
    setCarregando(true)
    const el = listaRef.current
    const alturaAntes = el?.scrollHeight ?? 0
    try {
      const res = await api.get(
        `/crm/atendimentos/${atendimento.id}/mensagens?page=${proxima}&size=${PAGE_SIZE}&sort=dataMensagem,desc`
      )
      const content = (res.data?.content ?? []) as MensagemResponse[]
      setMensagens((prev) => [...[...content].reverse(), ...prev])
      setPage(proxima)
      setTemMais(!(res.data?.last ?? true))
      // mantém a posição de scroll após prepend
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - alturaAntes
      })
    } catch {
      showMessage("error", "Erro ao carregar mais mensagens")
    } finally {
      setCarregando(false)
    }
  }

  function handleScroll() {
    if (listaRef.current && listaRef.current.scrollTop < 40 && temMais && !carregando) {
      carregarMais()
    }
  }

  async function enviarMensagem(payload: EnviarMensagemPayload) {
    try {
      const res = await api.post(`/crm/atendimentos/${atendimento.id}/mensagens`, payload)
      const nova = res.data as MensagemResponse
      setMensagens((prev) => (prev.some((m) => m.id === nova.id) ? prev : [...prev, nova]))
      requestAnimationFrame(() => {
        if (listaRef.current) listaRef.current.scrollTop = listaRef.current.scrollHeight
      })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao enviar mensagem")
      } else {
        showMessage("error", "Erro inesperado ao enviar mensagem")
      }
      throw err
    }
  }

  function handleMoverAndamento(value: string) {
    const andamentoId = Number(value)
    if (!andamentoId || andamentoId === atendimento.andamentoId) return
    onMover(atendimento.id, andamentoId)
  }

  async function handlePegar() {
    try {
      const res = await api.post(`/crm/atendimentos/${atendimento.id}/pegar`)
      showMessage("success", "Atendimento atribuído a você")
      onAtualizado(res.data as AtendimentoResponse)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao pegar atendimento")
      } else {
        showMessage("error", "Erro inesperado")
      }
    }
  }

  async function handleAssumir(motivo: string) {
    try {
      const res = await api.post(`/crm/atendimentos/${atendimento.id}/assumir`, { motivo })
      showMessage("success", "Atendimento assumido")
      setAssumirOpen(false)
      onAtualizado(res.data as AtendimentoResponse)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao assumir atendimento")
      } else {
        showMessage("error", "Erro inesperado")
      }
      throw err
    }
  }

  const nome = atendimento.contatoNome || atendimento.pessoaNome || atendimento.numero
  const podeEnviar = souDono

  return (
    <div className="flex h-full flex-col bg-(--bg-base)">
      {/* cabeçalho */}
      <div className="flex items-center gap-3 border-b border-(--border) bg-(--bg-surface) px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-(--text-primary)">{nome}</p>
          <p className="truncate text-xs text-(--text-muted)">
            #{atendimento.numero}
            {atendimento.usuarioNome ? ` • ${atendimento.usuarioNome}` : " • sem dono"}
          </p>
        </div>

        <div className="w-44 shrink-0">
          <TCombo
            name="andamento"
            label=""
            width="100%"
            defaultValue={String(atendimento.andamentoId)}
            onChange={handleMoverAndamento}
            options={colunas.map((c) => ({
              value: String(c.andamentoId),
              label: c.andamentoNome,
            }))}
          />
        </div>

        <button
          type="button"
          title="Fechar"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-(--text-muted) transition hover:bg-(--bg-hover) hover:text-(--text-primary)"
        >
          <FaXmark size={18} />
        </button>
      </div>

      {/* barra de ações de dono */}
      <div className="flex items-center gap-2 border-b border-(--border) bg-(--bg-surface) px-3 py-2">
        {semDono && (
          <TButton
            label="Pegar"
            variant="primary"
            type="button"
            icon={<FaUserPlus size={13} />}
            onClick={handlePegar}
          />
        )}
        {!semDono && !souDono && (
          <TButton
            label="Assumir"
            variant="secondary"
            type="button"
            icon={<FaUserCheck size={13} />}
            onClick={() => setAssumirOpen(true)}
          />
        )}
        {souDono && (
          <span className="flex items-center gap-1 text-xs font-medium text-(--success)">
            <FaUserCheck size={12} />
            Você é o responsável
          </span>
        )}
      </div>

      {/* lista de mensagens */}
      <div
        ref={listaRef}
        onScroll={handleScroll}
        className="flex flex-1 flex-col gap-2 overflow-y-auto p-3"
      >
        {temMais && (
          <button
            type="button"
            onClick={carregarMais}
            className="mx-auto rounded-full bg-(--bg-hover) px-3 py-1 text-xs text-(--text-secondary) transition hover:text-(--text-primary)"
          >
            Carregar anteriores
          </button>
        )}

        {carregando && mensagens.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-(--accent) border-t-transparent" />
          </div>
        ) : mensagens.length === 0 ? (
          <p className="py-8 text-center text-sm text-(--text-muted)">
            Nenhuma mensagem ainda.
          </p>
        ) : (
          mensagens.map((m) => <ChatMessage key={m.id} mensagem={m} />)
        )}
      </div>

      {/* input */}
      {podeEnviar ? (
        <ChatInput onEnviar={enviarMensagem} />
      ) : (
        <div className="border-t border-(--border) bg-(--bg-surface) p-3 text-center text-xs text-(--text-muted)">
          {semDono
            ? 'Pegue o atendimento para responder.'
            : 'Assuma o atendimento para responder.'}
        </div>
      )}

      <AssumirWindow
        open={assumirOpen}
        onClose={() => setAssumirOpen(false)}
        onConfirmar={handleAssumir}
      />
    </div>
  )
}
