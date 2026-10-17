import { api } from './api'
import type { Page } from '@/types/comum'
import type { ProdutoFiltros, ProdutoRequest, ProdutoResponse, ProdutoSelect } from '@/types/produto'

/** Módulo de negócio: o escopo é sempre o tenant efetivo do token. */
export const produtoService = {
  getAll: (params: ProdutoFiltros) =>
    api.get<Page<ProdutoResponse>>('/produtos', { params }).then((r) => r.data),

  findById: (id: string) => api.get<ProdutoResponse>(`/produtos/${id}`).then((r) => r.data),

  /** Só os ativos, por nome, código ou EAN. Sem custo. */
  select: (termo?: string) =>
    api.get<ProdutoSelect[]>('/produtos/select', { params: { termo } }).then((r) => r.data),

  create: (dto: ProdutoRequest) => api.post<ProdutoResponse>('/produtos', dto).then((r) => r.data),

  update: (id: string, dto: ProdutoRequest) =>
    api.put<ProdutoResponse>(`/produtos/${id}`, dto).then((r) => r.data),

  alterarAtivo: (id: string, ativo: boolean) =>
    api
      .patch<ProdutoResponse>(`/produtos/${id}/ativo`, null, { params: { ativo } })
      .then((r) => r.data),
}
