import { useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import type { AtendimentoResponse } from "../../types/Atendimento"
import type { FluxoKanbanColunaResponse } from "../../types/FluxoKanban"
import { KanbanColumn } from "./KanbanColumn"
import { KanbanCard } from "./KanbanCard"

interface KanbanBoardProps {
  colunas:            FluxoKanbanColunaResponse[]
  atendimentos:       AtendimentoResponse[]
  atendimentoAtivoId: number | null
  onCardClick:        (atendimento: AtendimentoResponse) => void
  // dispara ao soltar um card em uma coluna diferente da atual
  onMover:            (atendimentoId: number, andamentoId: number) => void
}

export function KanbanBoard({
  colunas,
  atendimentos,
  atendimentoAtivoId,
  onCardClick,
  onMover,
}: KanbanBoardProps) {
  const [arrastado, setArrastado] = useState<AtendimentoResponse | null>(null)

  // exige um pequeno movimento antes de iniciar o drag,
  // assim o clique simples no card continua abrindo o chat
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function handleDragStart(event: DragStartEvent) {
    const at = event.active.data.current?.atendimento as AtendimentoResponse | undefined
    setArrastado(at ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setArrastado(null)
    const { active, over } = event
    if (!over) return

    const at = active.data.current?.atendimento as AtendimentoResponse | undefined
    const destinoAndamentoId = over.data.current?.andamentoId as number | undefined
    if (!at || destinoAndamentoId == null) return

    if (at.andamentoId !== destinoAndamentoId) {
      onMover(at.id, destinoAndamentoId)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-3 overflow-x-auto p-3">
        {colunas.length === 0 ? (
          <div className="flex w-full items-center justify-center">
            <p className="text-sm text-(--text-muted)">
              Nenhuma coluna configurada. Configure o Fluxo Kanban no Auxiliar CRM.
            </p>
          </div>
        ) : (
          colunas.map((col) => (
            <KanbanColumn
              key={col.andamentoId}
              coluna={col}
              atendimentos={atendimentos.filter((a) => a.andamentoId === col.andamentoId)}
              atendimentoAtivoId={atendimentoAtivoId}
              onCardClick={onCardClick}
            />
          ))
        )}
      </div>

      <DragOverlay>
        {arrastado ? (
          <div className="w-72">
            <KanbanCard
              atendimento={arrastado}
              selecionado={false}
              onClick={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
