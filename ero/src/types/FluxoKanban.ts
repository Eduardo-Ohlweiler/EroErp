// Coluna do fluxo Kanban do CRM (ordenada).
export interface FluxoKanbanColunaResponse {
  id:           number
  andamentoId:  number
  andamentoNome: string
  cor:          string | null
  sistema:      boolean
  ordem:        number
}

// Body do PUT /crm/fluxo-kanban.
export interface FluxoKanbanColunaPayload {
  andamentoId: number
  ordem:       number
}
