import { useEffect, useRef } from "react"
import type { AtendimentoResponse } from "../types/Atendimento"
import type { MensagemResponse } from "../types/Mensagem"

interface StreamHandlers {
  // Chega uma mensagem nova (recebida do cliente ou enviada por outro atendente/rotina).
  onMensagemNova?: (mensagem: MensagemResponse) => void
  // Uma mensagem teve o status alterado (entregue/lido).
  onMensagemAtualizada?: (mensagem: MensagemResponse) => void
  // Um atendimento foi criado ou atualizado (novo card, mudança de coluna, dono, etc.).
  onAtendimentoAtualizado?: (atendimento: AtendimentoResponse) => void
}

// Base da API (mesma do axios). O EventSource não envia header Authorization,
// então o JWT vai na query (?token=), conforme o backend.
const API_BASE = import.meta.env.VITE_API_URL ?? ""

/**
 * Conecta ao stream SSE do CRM e dispara os handlers nos eventos.
 * Reconecta automaticamente se a conexão cair.
 */
export function useAtendimentosStream(handlers: StreamHandlers, enabled = true) {
  // guardamos os handlers num ref para não recriar o EventSource a cada render
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!enabled) return

    const token = localStorage.getItem("token")
    if (!token) return

    let source: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let fechado = false

    function conectar() {
      if (fechado) return

      const url = `${API_BASE}/crm/atendimentos/stream?token=${encodeURIComponent(token!)}`
      source = new EventSource(url)

      source.addEventListener("mensagem-nova", (e) => {
        try {
          const data = JSON.parse((e as MessageEvent).data) as MensagemResponse
          handlersRef.current.onMensagemNova?.(data)
        } catch {
          /* payload inválido — ignora */
        }
      })

      source.addEventListener("mensagem-atualizada", (e) => {
        try {
          const data = JSON.parse((e as MessageEvent).data) as MensagemResponse
          handlersRef.current.onMensagemAtualizada?.(data)
        } catch {
          /* payload inválido — ignora */
        }
      })

      source.addEventListener("atendimento-atualizado", (e) => {
        try {
          const data = JSON.parse((e as MessageEvent).data) as AtendimentoResponse
          handlersRef.current.onAtendimentoAtualizado?.(data)
        } catch {
          /* payload inválido — ignora */
        }
      })

      source.onerror = () => {
        // fecha e tenta reconectar após um intervalo
        source?.close()
        source = null
        if (!fechado) {
          reconnectTimer = setTimeout(conectar, 3000)
        }
      }
    }

    conectar()

    return () => {
      fechado = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      source?.close()
      source = null
    }
  }, [enabled])
}
