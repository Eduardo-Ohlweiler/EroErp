import { useEffect, useState } from "react"
import { FaFileLines, FaDownload } from "react-icons/fa6"
import { api } from "../../services/api"
import type { MensagemResponse } from "../../types/Mensagem"

interface ChatMessageProps {
  mensagem: MensagemResponse
}

function formatHora(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

// Componente que busca a mídia (imagem/áudio/vídeo) via proxy do backend como blob.
function MidiaMensagem({ mensagem }: ChatMessageProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [erro, setErro] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelado = false

    async function buscar() {
      setCarregando(true)
      setErro(false)
      try {
        const res = await api.get(`/crm/atendimentos/mensagens/${mensagem.id}/midia`, {
          responseType: "blob",
        })
        if (cancelado) return
        objectUrl = URL.createObjectURL(res.data as Blob)
        setUrl(objectUrl)
      } catch {
        if (!cancelado) setErro(true)
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    buscar()

    return () => {
      cancelado = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [mensagem.id])

  if (carregando) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-(--text-muted)">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-(--accent) border-t-transparent" />
        Carregando mídia...
      </div>
    )
  }

  if (erro || !url) {
    return (
      <p className="py-1 text-xs text-(--danger)">
        Não foi possível carregar a mídia.
      </p>
    )
  }

  if (mensagem.tipo === "IMAGEM") {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img
          src={url}
          alt={mensagem.midiaNome ?? "imagem"}
          className="max-h-64 max-w-full rounded-md"
        />
      </a>
    )
  }

  if (mensagem.tipo === "AUDIO") {
    return <audio controls src={url} className="max-w-full" />
  }

  if (mensagem.tipo === "VIDEO") {
    return <video controls src={url} className="max-h-64 max-w-full rounded-md" />
  }

  // DOCUMENTO
  return (
    <a
      href={url}
      download={mensagem.midiaNome ?? "documento"}
      className="flex items-center gap-2 rounded-md bg-(--bg-hover) px-3 py-2 text-sm text-(--text-primary)"
    >
      <FaFileLines size={16} />
      <span className="min-w-0 flex-1 truncate">{mensagem.midiaNome ?? "Documento"}</span>
      <FaDownload size={13} />
    </a>
  )
}

export function ChatMessage({ mensagem }: ChatMessageProps) {
  const enviada = mensagem.direcao === "ENVIADA"
  const temMidia = mensagem.tipo !== "TEXTO"

  return (
    <div className={`flex ${enviada ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm
          ${enviada
            ? "rounded-br-none bg-(--accent) text-(--text-inverse)"
            : "rounded-bl-none border border-(--border) bg-(--bg-surface) text-(--text-primary)"}
        `}
      >
        {enviada && mensagem.usuarioNome && (
          <p className="mb-0.5 text-xs font-medium opacity-80">{mensagem.usuarioNome}</p>
        )}

        {temMidia && <MidiaMensagem mensagem={mensagem} />}

        {mensagem.conteudo && (
          <p className={`whitespace-pre-wrap break-words ${temMidia ? "mt-1" : ""}`}>
            {mensagem.conteudo}
          </p>
        )}

        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
            enviada ? "text-(--text-inverse) opacity-70" : "text-(--text-muted)"
          }`}
        >
          <span>{formatHora(mensagem.dataMensagem)}</span>
          {enviada && mensagem.status === "ERRO" && (
            <span className="font-semibold text-(--danger)">falhou</span>
          )}
        </div>
      </div>
    </div>
  )
}
