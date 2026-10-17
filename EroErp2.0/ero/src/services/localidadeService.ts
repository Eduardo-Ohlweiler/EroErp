import { api } from './api'
import type { SelectOption } from '@/types/comum'

export interface CidadeSelect {
  id: string
  nome: string
  estadoSigla: string
}

/** Espelha `CepResponseDto`: endereço pelo CEP, com a cidade já na tabela IBGE. */
export interface CepResponse {
  cep: string
  logradouro: string
  bairro: string
  /** Nulo só se o município do CEP não estiver na tabela — `motivo` diz. */
  cidadeId: string | null
  cidadeNome: string | null
  estadoSigla: string | null
  /** CEP geral da cidade: rua e bairro não vêm. */
  cepUnico: boolean
  motivo: string | null
}

/**
 * Estados e municípios do IBGE — referência global, igual para todo cliente.
 * São mais de cinco mil cidades: a busca é sempre no servidor.
 */
export const localidadeService = {
  estados: () => api.get<SelectOption[]>('/estados/select').then((r) => r.data),

  cidades: (nome?: string, estadoId?: string) =>
    api
      .get<CidadeSelect[]>('/cidades/select', { params: { nome, estadoId } })
      .then((r) => r.data),

  /** Para o `TCombo`, que espera `{ id, nome }`. A UF entra no rótulo. */
  cidadesParaCombo: (nome?: string, estadoId?: string) =>
    localidadeService
      .cidades(nome, estadoId)
      .then((cidades) =>
        cidades.map((c) => ({ id: c.id, nome: `${c.nome} — ${c.estadoSigla}` })),
      ),

  /**
   * Endereço pelo CEP (ViaCEP, pelo backend). 400 sem 8 dígitos, 404 se não
   * existe, 503 se o provedor não respondeu — quem chama mostra inline.
   */
  consultarCep: (cep: string) =>
    api.get<CepResponse>(`/cep/${cep}`).then((r) => r.data),
}
