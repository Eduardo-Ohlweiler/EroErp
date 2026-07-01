// Filtros da tela de kanban de atendimento.
export interface FiltrosKanban {
  usuarioId:   string
  andamentoId: string
}

// Opção simples para combos de filtro (usuários).
export interface UsuarioComboOption {
  id:   number
  nome: string
}

// Evento SSE recebido do backend.
export type SseEventoTipo = "mensagem-nova" | "atendimento-atualizado"
