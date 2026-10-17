import { api } from './api'
import type { Page } from '@/types/comum'
import type {
  AjusteRequest,
  EntradaRequest,
  EstoqueCreateRequest,
  EstoqueFiltros,
  EstoqueMovimentavel,
  EstoqueResponse,
  EstoqueUpdateRequest,
  MovimentacaoFiltros,
  MovimentacaoResponse,
  TransferenciaRequest,
} from '@/types/estoque'

/** Módulo de negócio: o escopo é sempre o tenant efetivo do token. */
export const estoqueService = {
  getAll: (params: EstoqueFiltros) =>
    api.get<Page<EstoqueResponse>>('/estoques', { params }).then((r) => r.data),

  findById: (id: string) => api.get<EstoqueResponse>(`/estoques/${id}`).then((r) => r.data),

  /** O que se movimenta numa filial: com controle, ativo, de produto ativo. */
  movimentaveis: (filialId: string, termo?: string) =>
    api
      .get<EstoqueMovimentavel[]>('/estoques/movimentaveis', { params: { filialId, termo } })
      .then((r) => r.data),

  movimentacoes: (params: MovimentacaoFiltros) =>
    api.get<Page<MovimentacaoResponse>>('/estoques/movimentacoes', { params }).then((r) => r.data),

  create: (dto: EstoqueCreateRequest) =>
    api.post<EstoqueResponse>('/estoques', dto).then((r) => r.data),

  update: (id: string, dto: EstoqueUpdateRequest) =>
    api.put<EstoqueResponse>(`/estoques/${id}`, dto).then((r) => r.data),

  alterarAtivo: (id: string, ativo: boolean) =>
    api
      .patch<EstoqueResponse>(`/estoques/${id}/ativo`, null, { params: { ativo } })
      .then((r) => r.data),

  entrada: (id: string, dto: EntradaRequest) =>
    api.post<MovimentacaoResponse>(`/estoques/${id}/entradas`, dto).then((r) => r.data),

  ajuste: (id: string, dto: AjusteRequest) =>
    api.post<MovimentacaoResponse>(`/estoques/${id}/ajustes`, dto).then((r) => r.data),

  /** Devolve os dois movimentos: a saída e a entrada. */
  transferir: (dto: TransferenciaRequest) =>
    api.post<MovimentacaoResponse[]>('/estoques/transferencias', dto).then((r) => r.data),
}
