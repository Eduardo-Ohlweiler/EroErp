import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { FaUser, FaRegClock } from "react-icons/fa6"
import type { AtendimentoResponse } from "../../types/Atendimento"

interface KanbanCardProps {
  atendimento: AtendimentoResponse
  selecionado: boolean
  onClick:     (atendimento: AtendimentoResponse) => void
}

function formatHora(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  const hoje = new Date()
  const mesmoDia =
    d.getFullYear() === hoje.getFullYear() &&
    d.getMonth() === hoje.getMonth() &&
    d.getDate() === hoje.getDate()
  return mesmoDia
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

export function KanbanCard({ atendimento, selecionado, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `atendimento-${atendimento.id}`,
    data: { atendimento },
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  }

  const nome = atendimento.contatoNome || atendimento.pessoaNome || atendimento.numero
  const naoLidas = atendimento.mensagensNaoLidas ?? 0
  const temNaoLidas = naoLidas > 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onClick(atendimento)}
      className={`
        cursor-pointer rounded-md border bg-(--bg-surface) p-3 text-left shadow-sm
        transition select-none touch-none
        hover:border-(--accent)
        ${selecionado ? "border-(--accent) ring-1 ring-(--accent)" : "border-(--border)"}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`min-w-0 flex-1 truncate text-sm text-(--text-primary) ${temNaoLidas ? "font-bold" : "font-medium"}`}>
          {nome}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-xs text-(--text-muted)">
          <FaRegClock size={10} />
          {formatHora(atendimento.dataUltimaMensagem ?? atendimento.dataAbertura)}
        </span>
        {temNaoLidas && (
          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-(--accent) px-1.5 text-xs font-semibold text-(--text-inverse)">
            {naoLidas}
          </span>
        )}
      </div>

      {atendimento.assunto && (
        <p className="mt-1 line-clamp-2 text-xs text-(--text-secondary)">
          {atendimento.assunto}
        </p>
      )}

      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="text-(--text-muted)">#{atendimento.numero}</span>
        {atendimento.usuarioNome ? (
          <span className="ml-auto flex items-center gap-1 rounded bg-(--accent-light) px-2 py-0.5 font-medium text-(--accent)">
            <FaUser size={9} />
            {atendimento.usuarioNome}
          </span>
        ) : (
          <span
            className="ml-auto rounded px-2 py-0.5 font-medium text-(--text-inverse)"
            style={{ backgroundColor: "var(--warning)" }}
          >
            Sem dono
          </span>
        )}
      </div>
    </div>
  )
}
