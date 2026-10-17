import { api } from './api'
import type { Page } from '@/types/comum'
import type {
  AuxiliarFiltros,
  AuxiliarResponse,
  AuxiliarSelect,
  AuxiliarSimples,
  SubgrupoFiltros,
  SubgrupoResponse,
  SubgrupoSelect,
} from '@/types/auxiliarProduto'

const ROTAS: Record<AuxiliarSimples, string> = {
  grupos: '/grupos-produto',
  categorias: '/categorias-produto',
  marcas: '/marcas-produto',
}

/**
 * Grupo, categoria e marca têm as mesmas rotas, mudando o caminho. Os
 * `/select` são de qualquer autenticado — o cadastro de produto os usa.
 */
export function auxiliarService(tipo: AuxiliarSimples) {
  const rota = ROTAS[tipo]
  return {
    getAll: (params: AuxiliarFiltros) =>
      api.get<Page<AuxiliarResponse>>(rota, { params }).then((r) => r.data),

    select: (termo?: string) =>
      api.get<AuxiliarSelect[]>(`${rota}/select`, { params: { termo } }).then((r) => r.data),

    create: (nome: string) => api.post<AuxiliarResponse>(rota, { nome }).then((r) => r.data),

    update: (id: string, nome: string) =>
      api.put<AuxiliarResponse>(`${rota}/${id}`, { nome }).then((r) => r.data),

    alterarAtivo: (id: string, ativo: boolean) =>
      api
        .patch<AuxiliarResponse>(`${rota}/${id}/ativo`, null, { params: { ativo } })
        .then((r) => r.data),
  }
}

export const subgrupoService = {
  getAll: (params: SubgrupoFiltros) =>
    api.get<Page<SubgrupoResponse>>('/subgrupos-produto', { params }).then((r) => r.data),

  /** Subgrupos ativos de grupos ativos. */
  select: (termo?: string, grupoId?: string) =>
    api
      .get<SubgrupoSelect[]>('/subgrupos-produto/select', { params: { termo, grupoId } })
      .then((r) => r.data),

  create: (grupoId: string, nome: string) =>
    api.post<SubgrupoResponse>('/subgrupos-produto', { grupoId, nome }).then((r) => r.data),

  update: (id: string, grupoId: string, nome: string) =>
    api.put<SubgrupoResponse>(`/subgrupos-produto/${id}`, { grupoId, nome }).then((r) => r.data),

  alterarAtivo: (id: string, ativo: boolean) =>
    api
      .patch<SubgrupoResponse>(`/subgrupos-produto/${id}/ativo`, null, { params: { ativo } })
      .then((r) => r.data),
}
