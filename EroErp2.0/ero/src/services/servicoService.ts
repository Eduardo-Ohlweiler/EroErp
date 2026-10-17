import { api } from './api'
import type { Page } from '@/types/comum'
import type { ServicoFiltros, ServicoRequest, ServicoResponse, ServicoSelect } from '@/types/servico'

/** Módulo de negócio: o escopo é sempre o tenant efetivo do token. */
export const servicoService = {
  getAll: (params: ServicoFiltros) =>
    api.get<Page<ServicoResponse>>('/servicos', { params }).then((r) => r.data),

  findById: (id: string) => api.get<ServicoResponse>(`/servicos/${id}`).then((r) => r.data),

  /** Só os ativos, por nome ou código. Sem valores. */
  select: (termo?: string) =>
    api.get<ServicoSelect[]>('/servicos/select', { params: { termo } }).then((r) => r.data),

  create: (dto: ServicoRequest) => api.post<ServicoResponse>('/servicos', dto).then((r) => r.data),

  update: (id: string, dto: ServicoRequest) =>
    api.put<ServicoResponse>(`/servicos/${id}`, dto).then((r) => r.data),

  alterarAtivo: (id: string, ativo: boolean) =>
    api
      .patch<ServicoResponse>(`/servicos/${id}/ativo`, null, { params: { ativo } })
      .then((r) => r.data),
}
