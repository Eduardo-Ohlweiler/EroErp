import { api } from './api'
import type { Page } from '@/types/comum'
import type {
  ConsultaCalculo,
  ConsultaCalculoRequest,
  ConsultaCreateRequest,
  ConsultaFiltros,
  ConsultaLista,
  ConsultaResponse,
  ConsultaUpdateRequest,
  PrecoSugerido,
  ReconsultaRequest,
} from '@/types/consulta'
import type { ProdutoSelect } from '@/types/produto'

/** Consulta. O escopo é sempre o tenant efetivo do token. */
export const consultaService = {
  getAll: (params: ConsultaFiltros) =>
    api.get<Page<ConsultaLista>>('/consultas', { params }).then((r) => r.data),

  findById: (id: string) => api.get<ConsultaResponse>(`/consultas/${id}`).then((r) => r.data),

  /** Não grava: os totais do que está na tela, com as mesmas guardas do salvar. */
  calculo: (dto: ConsultaCalculoRequest) =>
    api.post<ConsultaCalculo>('/consultas/calculo', dto).then((r) => r.data),

  /** O preço que a filial sugere — de um serviço ou de um produto. */
  preco: (filialId: string, item: { servicoId: string } | { produtoId: string }) =>
    api.get<PrecoSugerido>('/consultas/preco', { params: { filialId, ...item } }).then((r) => r.data),

  /** Os produtos com estoque ativo na filial. */
  produtos: (filialId: string, termo?: string) =>
    api.get<ProdutoSelect[]>('/consultas/produtos', { params: { filialId, termo } }).then((r) => r.data),

  create: (dto: ConsultaCreateRequest) =>
    api.post<ConsultaResponse>('/consultas', dto).then((r) => r.data),

  update: (id: string, dto: ConsultaUpdateRequest) =>
    api.put<ConsultaResponse>(`/consultas/${id}`, dto).then((r) => r.data),

  iniciar: (id: string) => api.patch<ConsultaResponse>(`/consultas/${id}/iniciar`).then((r) => r.data),

  /** Baixa o estoque; sem saldo, 409 nomeando o produto e nada baixa. */
  concluir: (id: string) => api.patch<ConsultaResponse>(`/consultas/${id}/concluir`).then((r) => r.data),

  /** Só esta consulta: a série se cancela pela agenda. */
  cancelar: (id: string, motivo?: string) =>
    api.patch<ConsultaResponse>(`/consultas/${id}/cancelar`, { motivo }).then((r) => r.data),

  faltou: (id: string) => api.patch<ConsultaResponse>(`/consultas/${id}/faltou`).then((r) => r.data),

  reconsulta: (id: string, dto: ReconsultaRequest) =>
    api.post<ConsultaResponse>(`/consultas/${id}/reconsulta`, dto).then((r) => r.data),
}
