import { useRef, useState } from "react"
import { FaPaperPlane, FaImage, FaMicrophone, FaStop } from "react-icons/fa6"
import { useMessage } from "../../hooks/useMessage"
import type { EnviarMensagemPayload } from "../../types/Mensagem"

interface ChatInputProps {
  disabled?: boolean
  onEnviar: (payload: EnviarMensagemPayload) => Promise<void>
}

// Converte um Blob/File para base64 puro (sem o prefixo data:...;base64,).
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      const base64 = result.includes(",") ? result.split(",")[1] : result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function ChatInput({ disabled, onEnviar }: ChatInputProps) {
  const { showMessage } = useMessage()
  const [texto, setTexto] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [gravando, setGravando] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  async function enviarTexto() {
    const conteudo = texto.trim()
    if (!conteudo || enviando || disabled) return
    setEnviando(true)
    try {
      await onEnviar({ tipo: "TEXTO", conteudo })
      setTexto("")
    } finally {
      setEnviando(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      enviarTexto()
    }
  }

  async function handleImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // permite reenviar o mesmo arquivo
    if (!file) return

    if (!file.type.startsWith("image/")) {
      showMessage("warning", "Selecione um arquivo de imagem.")
      return
    }

    setEnviando(true)
    try {
      const base64 = await blobToBase64(file)
      await onEnviar({
        tipo: "IMAGEM",
        base64,
        mimetype: file.type,
        fileName: file.name,
      })
    } catch {
      showMessage("error", "Erro ao processar a imagem.")
    } finally {
      setEnviando(false)
    }
  }

  async function iniciarGravacao() {
    if (disabled) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data)
      }
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null

        if (blob.size === 0) return
        setEnviando(true)
        try {
          const base64 = await blobToBase64(blob)
          await onEnviar({
            tipo: "AUDIO",
            base64,
            mimetype: blob.type,
            fileName: "audio.webm",
          })
        } catch {
          showMessage("error", "Erro ao enviar o áudio.")
        } finally {
          setEnviando(false)
        }
      }

      recorder.start()
      recorderRef.current = recorder
      setGravando(true)
    } catch {
      showMessage("error", "Não foi possível acessar o microfone.")
    }
  }

  function pararGravacao() {
    recorderRef.current?.stop()
    recorderRef.current = null
    setGravando(false)
  }

  const bloqueado = disabled || enviando

  return (
    <div className="flex items-end gap-2 border-t border-(--border) bg-(--bg-surface) p-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImagem}
      />

      <button
        type="button"
        title="Anexar imagem"
        disabled={bloqueado || gravando}
        onClick={() => fileInputRef.current?.click()}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-(--text-secondary) transition hover:bg-(--bg-hover) hover:text-(--text-primary) disabled:opacity-50"
      >
        <FaImage size={16} />
      </button>

      {gravando ? (
        <button
          type="button"
          title="Parar e enviar áudio"
          onClick={pararGravacao}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--danger) text-(--text-inverse) transition"
        >
          <FaStop size={14} />
        </button>
      ) : (
        <button
          type="button"
          title="Gravar áudio"
          disabled={bloqueado}
          onClick={iniciarGravacao}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-(--text-secondary) transition hover:bg-(--bg-hover) hover:text-(--text-primary) disabled:opacity-50"
        >
          <FaMicrophone size={16} />
        </button>
      )}

      <textarea
        value={texto}
        rows={1}
        disabled={bloqueado || gravando}
        placeholder={gravando ? "Gravando áudio..." : "Digite uma mensagem..."}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={handleKeyDown}
        className="max-h-28 min-h-9 flex-1 resize-none rounded-md border border-(--border) bg-(--bg-input) px-3 py-2 text-sm text-(--text-primary) placeholder-(--text-muted) focus:border-(--accent) focus:outline-none focus:ring-1 focus:ring-(--accent) disabled:opacity-50"
      />

      <button
        type="button"
        title="Enviar"
        disabled={bloqueado || gravando || !texto.trim()}
        onClick={enviarTexto}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--accent) text-(--text-inverse) transition hover:bg-(--accent-hover) disabled:opacity-50"
      >
        {enviando ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <FaPaperPlane size={14} />
        )}
      </button>
    </div>
  )
}
