import { useDroppable } from "@dnd-kit/core"
import type { AtendimentoResponse } from "../../types/Atendimento"
import type { FluxoKanbanColunaResponse } from "../../types/FluxoKanban"
import { KanbanCard } from "./KanbanCard"

interface KanbanColumnProps {
  coluna:            FluxoKanbanColunaResponse
  atendimentos:      AtendimentoResponse[]
  atendimentoAtivoId: number | null
  onCardClick:       (atendimento: AtendimentoResponse) => void
}

export function KanbanColumn({
  coluna,
  atendimentos,
  atendimentoAtivoId,
  onCardClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `coluna-${coluna.andamentoId}`,
    data: { andamentoId: coluna.andamentoId },
  })

  const cor = coluna.cor ?? "var(--accent)"

  return (
    <div className="flex h-full w-72 shrink-0 flex-col">
      {/* cabeçalho da coluna */}
      <div className="flex items-center gap-2 rounded-t-md border border-b-0 border-(--border) bg-(--bg-surface) px-3 py-2">
        <span
          className="h-3 w-3 shrink-0 rounded-full border border-(--border)"
          style={{ backgroundColor: cor }}
        />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-(--text-primary)">
          {coluna.andamentoNome}
        </span>
        <span className="shrink-0 rounded-full bg-(--bg-hover) px-2 py-0.5 text-xs font-medium text-(--text-secondary)">
          {atendimentos.length}
        </span>
      </div>

      {/* área droppable com scroll */}
      <div
        ref={setNodeRef}
        className={`
          flex flex-1 flex-col gap-2 overflow-y-auto rounded-b-md border border-(--border)
          p-2 transition-colors
          ${isOver ? "bg-(--accent-light)" : "bg-(--bg-base)"}
        `}
      >
        {atendimentos.length === 0 ? (
          <p className="py-6 text-center text-xs text-(--text-muted)">
            Nenhum atendimento
          </p>
        ) : (
          atendimentos.map((a) => (
            <KanbanCard
              key={a.id}
              atendimento={a}
              selecionado={a.id === atendimentoAtivoId}
              onClick={onCardClick}
            />
          ))
        )}
      </div>
    </div>
  )
}
