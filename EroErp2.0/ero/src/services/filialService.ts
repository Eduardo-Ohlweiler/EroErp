import { api } from './api'
import type { Page } from '@/types/comum'
import type { FilialFiltros, FilialRequest, FilialResponse, FilialSelect, TipoFilial } from '@/types/filial'

/** Módulo de negócio: o escopo é sempre o tenant efetivo do token. */
export const filialService = {
  getAll: (params: FilialFiltros) =>
    api.get<Page<FilialResponse>>('/filiais', { params }).then((r) => r.data),

  findById: (id: string) => api.get<FilialResponse>(`/filiais/${id}`).then((r) => r.data),

  /**
   * Só as ativas. `tipo: 'MATRIZ'` é o combo de matriz do cadastro;
   * `ignorarId` tira a própria filial do resultado.
   */
  select: (termo?: string, tipo?: TipoFilial, ignorarId?: string) =>
    api
      .get<FilialSelect[]>('/filiais/select', { params: { termo, tipo, ignorarId } })
      .then((r) => r.data),

  create: (dto: FilialRequest) => api.post<FilialResponse>('/filiais', dto).then((r) => r.data),

  update: (id: string, dto: FilialRequest) =>
    api.put<FilialResponse>(`/filiais/${id}`, dto).then((r) => r.data),

  alterarAtivo: (id: string, ativo: boolean) =>
    api
      .patch<FilialResponse>(`/filiais/${id}/ativo`, null, { params: { ativo } })
      .then((r) => r.data),
}
