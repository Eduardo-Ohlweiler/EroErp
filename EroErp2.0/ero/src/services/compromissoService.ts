import { api } from './api'
import type {
  CalendarioFiltros,
  CompromissoCalendario,
  CompromissoRequest,
  CompromissoResponse,
  Disponibilidade,
  DisponibilidadeRequest,
  EscopoCancelamento,
} from '@/types/compromisso'

/** Agenda. O escopo é sempre o tenant efetivo do token. */
export const compromissoService = {
  /** Até 62 dias por vez. */
  calendario: (params: CalendarioFiltros) =>
    api.get<CompromissoCalendario[]>('/compromissos/calendario', { params }).then((r) => r.data),

  findById: (id: string) =>
    api.get<CompromissoResponse>(`/compromissos/${id}`).then((r) => r.data),

  /** Não grava: quem já está ocupado nos horários do formulário. */
  disponibilidade: (dto: DisponibilidadeRequest) =>
    api.post<Disponibilidade>('/compromissos/disponibilidade', dto).then((r) => r.data),

  /** Com recorrência, devolve todas as ocorrências criadas. */
  create: (dto: CompromissoRequest) =>
    api.post<CompromissoResponse[]>('/compromissos', dto).then((r) => r.data),

  update: (id: string, dto: Omit<CompromissoRequest, 'recorrencia'>) =>
    api.put<CompromissoResponse>(`/compromissos/${id}`, dto).then((r) => r.data),

  confirmar: (id: string) =>
    api.patch<CompromissoResponse>(`/compromissos/${id}/confirmar`).then((r) => r.data),

  concluir: (id: string) =>
    api.patch<CompromissoResponse>(`/compromissos/${id}/concluir`).then((r) => r.data),

  faltou: (id: string) =>
    api.patch<CompromissoResponse>(`/compromissos/${id}/faltou`).then((r) => r.data),

  cancelar: (id: string, motivo?: string, escopo?: EscopoCancelamento) =>
    api
      .patch<CompromissoResponse>(`/compromissos/${id}/cancelar`, { motivo, escopo })
      .then((r) => r.data),
}
