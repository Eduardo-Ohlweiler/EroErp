export type DiaSemana = "SEGUNDA" | "TERCA" | "QUARTA" | "QUINTA" | "SEXTA" | "SABADO" | "DOMINGO"

export interface RefeicaoSummary {
  id: number
  nome: string
  descricao: string | null
  ativo: boolean
}

export interface Refeicao {
  id: number
  nome: string
  descricao: string | null
  ativo: boolean
  createdAt: string
  updatedAt: string
}

export interface ItemPlanoAlimentarResponse {
  id: number
  diaSemana: DiaSemana
  horario: string
  refeicaoId: number | null
  refeicaoNome: string | null
  quantidade: string | null
  peso: number | null
  observacao: string | null
}

export interface PlanoAlimentarResponse {
  id: number
  pessoaId: number
  pessoaNome: string
  emitenteId: number | null
  emitenteNome: string | null
  nome: string
  dataInicio: string
  dataFim: string | null
  observacao: string | null
  ativo: boolean
  itens: ItemPlanoAlimentarResponse[]
  createdAt: string
  updatedAt: string
}

export interface PlanoAlimentarSummary {
  id: number
  pessoaId: number
  pessoaNome: string
  nome: string
  dataInicio: string
  dataFim: string | null
  ativo: boolean
}
