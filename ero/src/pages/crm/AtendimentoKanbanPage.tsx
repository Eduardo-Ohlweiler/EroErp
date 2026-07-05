import { useCallback, useEffect, useState } from "react"
import axios from "axios"
import { api } from "../../services/api"
import { useMessage } from "../../hooks/useMessage"
import { useAtendimentosStream } from "../../hooks/useAtendimentosStream"
import type { AtendimentoResponse } from "../../types/Atendimento"
import type { MensagemResponse } from "../../types/Mensagem"
import type { FluxoKanbanColunaResponse } from "../../types/FluxoKanban"
import type { UsuarioComboOption } from "../../types/FiltrosKanban"
import type { ErrorResponse } from "../../types/ErrorResponse"
import { TCombo } from "../../components/tcombo"
import { TButton } from "../../components/tbutton"
import { KanbanBoard } from "../../components/crm/KanbanBoard"
import { ChatPanel } from "../../components/crm/ChatPanel"
import { IniciarAtendimentoModal } from "../../components/crm/IniciarAtendimentoModal"

export default function AtendimentoKanbanPage() {
  const { showMessage } = useMessage()

  const [colunas, setColunas] = useState<FluxoKanbanColunaResponse[]>([])
  const [atendimentos, setAtendimentos] = useState<AtendimentoResponse[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioComboOption[]>([])
  const [loading, setLoading] = useState(true)

  const [filtroUsuario, setFiltroUsuario] = useState("")
  const [filtroAndamento, setFiltroAndamento] = useState("")

  const [contatoOpen, setContatoOpen] = useState(false)

  const [atendimentoAtivo, setAtendimentoAtivo] = useState<AtendimentoResponse | null>(null)
  const [mensagemExterna, setMensagemExterna] = useState<MensagemResponse | null>(null)
  const [mensagemAtualizadaExterna, setMensagemAtualizadaExterna] = useState<MensagemResponse | null>(null)

  // ── carga dos dados fixos (colunas + usuários) ──
  useEffect(() => {
    async function carregarFixos() {
      try {
        const [fluxoRes, usuariosRes] = await Promise.all([
          api.get("/crm/fluxo-kanban"),
          api.get("/usuarios/select-personal").catch(() => ({ data: [] })),
        ])
        setColunas((fluxoRes.data ?? []) as FluxoKanbanColunaResponse[])
        const content = (usuariosRes.data?.content ?? usuariosRes.data ?? []) as Array<{ id: number; nome: string }>
        setUsuarios(content.map((u) => ({ id: u.id, nome: u.nome })))
      } catch {
        showMessage("error", "Erro ao carregar o fluxo Kanban")
      }
    }
    carregarFixos()
  }, [showMessage])

  // ── carga dos atendimentos (com filtros) ──
  const carregarAtendimentos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroUsuario) params.append("usuarioId", filtroUsuario)
      if (filtroAndamento) params.append("andamentoId", filtroAndamento)
      const qs = params.toString()
      const res = await api.get(`/crm/atendimentos${qs ? `?${qs}` : ""}`)
      setAtendimentos((res.data ?? []) as AtendimentoResponse[])
    } catch {
      showMessage("error", "Erro ao carregar atendimentos")
    } finally {
      setLoading(false)
    }
  }, [filtroUsuario, filtroAndamento, showMessage])

  useEffect(() => {
    carregarAtendimentos()
  }, [carregarAtendimentos])

  // ── helpers de estado ──
  function upsertAtendimento(at: AtendimentoResponse) {
    setAtendimentos((prev) => {
      const idx = prev.findIndex((a) => a.id === at.id)
      if (idx === -1) return [at, ...prev]
      const next = [...prev]
      next[idx] = at
      return next
    })
    setAtendimentoAtivo((prev) => (prev?.id === at.id ? at : prev))
  }

  // ── tempo real (SSE) ──
  useAtendimentosStream({
    onMensagemNova: (msg) => {
      // repassa para o chat aberto
      setMensagemExterna(msg)
      // atualiza data da última mensagem do card correspondente
      setAtendimentos((prev) =>
        prev.map((a) =>
          a.id === msg.atendimentoId
            ? { ...a, dataUltimaMensagem: msg.dataMensagem }
            : a
        )
      )
    },
    onMensagemAtualizada: (msg) => {
      // repassa a mudança de status (entregue/lido) para o chat aberto
      setMensagemAtualizadaExterna(msg)
    },
    onAtendimentoAtualizado: (at) => {
      upsertAtendimento(at)
    },
  })

  // ── mover andamento (drag-drop ou combo do chat) ──
  async function moverAndamento(atendimentoId: number, andamentoId: number) {
    const anterior = atendimentos.find((a) => a.id === atendimentoId)
    // otimista
    setAtendimentos((prev) =>
      prev.map((a) => (a.id === atendimentoId ? { ...a, andamentoId } : a))
    )
    setAtendimentoAtivo((prev) =>
      prev?.id === atendimentoId ? { ...prev, andamentoId } : prev
    )
    try {
      const res = await api.put(`/crm/atendimentos/${atendimentoId}/andamento`, { andamentoId })
      upsertAtendimento(res.data as AtendimentoResponse)
    } catch (err) {
      // rollback
      if (anterior) upsertAtendimento(anterior)
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao mover atendimento")
      } else {
        showMessage("error", "Erro inesperado ao mover atendimento")
      }
    }
  }

  const temChat = atendimentoAtivo != null

  return (
    <div className="flex h-full flex-col">
      {/* barra de filtros */}
      <div className="flex flex-wrap items-end gap-3 border-b border-(--border) bg-(--bg-surface) px-3 py-2">
        <h1 className="mr-2 text-base font-semibold text-(--text-primary)">Atendimentos</h1>

        <div className="w-52">
          <TCombo
            name="filtroUsuario"
            label="Usuário"
            width="100%"
            placeholder="Todos"
            defaultValue={filtroUsuario}
            onChange={setFiltroUsuario}
            options={usuarios.map((u) => ({ value: String(u.id), label: u.nome }))}
          />
        </div>

        <div className="w-52">
          <TCombo
            name="filtroAndamento"
            label="Andamento"
            width="100%"
            placeholder="Todos"
            defaultValue={filtroAndamento}
            onChange={setFiltroAndamento}
            options={colunas.map((c) => ({
              value: String(c.andamentoId),
              label: c.andamentoNome,
            }))}
          />
        </div>

        {(filtroUsuario || filtroAndamento) && (
          <TButton
            label="Limpar"
            variant="cancel"
            type="button"
            onClick={() => {
              setFiltroUsuario("")
              setFiltroAndamento("")
            }}
          />
        )}

        <div className="ml-auto flex items-center gap-3">
          <TButton
            label="Entrar em contato"
            variant="new"
            type="button"
            onClick={() => setContatoOpen(true)}
          />
          <span className="text-xs text-(--text-muted)">
            {atendimentos.length} atendimento(s)
          </span>
        </div>
      </div>

      {/* corpo: board + chat */}
      <div className="flex min-h-0 flex-1">
        {/* board */}
        <div className={`min-w-0 flex-1 ${temChat ? "hidden lg:block" : "block"}`}>
          {loading && atendimentos.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-(--accent) border-t-transparent" />
            </div>
          ) : (
            <KanbanBoard
              colunas={colunas}
              atendimentos={atendimentos}
              atendimentoAtivoId={atendimentoAtivo?.id ?? null}
              onCardClick={setAtendimentoAtivo}
              onMover={moverAndamento}
            />
          )}
        </div>

        {/* chat: painel lateral no desktop, tela cheia no mobile */}
        {temChat && atendimentoAtivo && (
          <div className="w-full border-l border-(--border) lg:w-105 lg:shrink-0">
            <ChatPanel
              key={atendimentoAtivo.id}
              atendimento={atendimentoAtivo}
              colunas={colunas}
              onClose={() => setAtendimentoAtivo(null)}
              onMover={moverAndamento}
              onAtualizado={upsertAtendimento}
              mensagemExterna={mensagemExterna}
              mensagemAtualizadaExterna={mensagemAtualizadaExterna}
            />
          </div>
        )}
      </div>

      <IniciarAtendimentoModal
        open={contatoOpen}
        onClose={() => setContatoOpen(false)}
        onIniciado={(at) => {
          upsertAtendimento(at)
          setAtendimentoAtivo(at)
        }}
      />
    </div>
  )
}
