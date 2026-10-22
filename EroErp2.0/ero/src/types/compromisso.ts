/** Espelha `StatusCompromisso`. Agendado, confirmado e em atendimento estão abertos; em atendimento só na consulta. */
export type StatusCompromisso =
  | 'AGENDADO'
  | 'CONFIRMADO'
  | 'EM_ATENDIMENTO'
  | 'CONCLUIDO'
  | 'CANCELADO'
  | 'FALTOU'

/** Espelha `TipoRecorrencia`. */
export type TipoRecorrencia =
  | 'DIARIO'
  | 'SEMANAL'
  | 'QUINZENAL'
  | 'MENSAL'
  | 'TRIMESTRAL'
  | 'SEMESTRAL'
  | 'ANUAL'

export type EscopoCancelamento = 'ESTE' | 'SEGUINTES'

export interface Convidado {
  usuarioId: string
  nome: string
}

/** Espelha `CompromissoResponseDto`. Instantes em ISO, formatados só na exibição. */
export interface CompromissoResponse {
  id: string
  filialId: string
  filialNome: string
  responsavelId: string
  responsavelNome: string
  pessoaId: string | null
  pessoaNome: string | null
  titulo: string
  descricao: string | null
  /** A gravada; vazia quando segue a filial. */
  cor: string | null
  /** A que se pinta: a gravada ou a da filial. */
  corExibicao: string
  inicio: string
  fim: string
  status: StatusCompromisso
  motivoCancelamento: string | null
  serieId: string | null
  tipoRecorrencia: TipoRecorrencia | null
  /** A consulta feita sobre ele; ausente quando não é consulta. */
  consultaId?: string | null
  /** Em ordem de nome. */
  convidados: Convidado[]
  /** Quem digitou — não é necessariamente o responsável. */
  criadoPorNome: string | null
  createdAt: string
  updatedAt: string | null
}

/** Espelha `CompromissoCalendarioDto` — o bloco do calendário. */
export interface CompromissoCalendario {
  id: string
  titulo: string
  inicio: string
  fim: string
  status: StatusCompromisso
  cor: string
  filialId: string
  filialNome: string
  responsavelId: string
  responsavelNome: string
  pessoaNome: string | null
  convidadoIds: string[]
  recorrente: boolean
  /** A consulta feita sobre ele; ausente quando não é consulta. */
  consultaId?: string | null
}

/** Uma data da série como ficou na prévia. */
export interface Ocorrencia {
  inicio: string
  fim: string
}

export interface Recorrencia {
  tipo: TipoRecorrencia
  /** Contando a primeira: de 2 a 52. */
  quantidade: number
}

/** Espelha `CompromissoCreateDto`; o update é o mesmo sem a recorrência. */
export interface CompromissoRequest {
  filialId: string
  responsavelId: string
  pessoaId?: string | null
  titulo: string
  descricao?: string
  /** #RRGGBB, ou nulo para seguir a filial. */
  cor?: string | null
  inicio: string
  fim: string
  convidadoIds: string[]
  recorrencia?: Recorrencia | null
  /** Só numa série: as datas como ficaram na prévia. Nula, valem as que o tipo gera. */
  ocorrencias?: Ocorrencia[] | null
}

export interface CalendarioFiltros {
  inicio: string
  fim: string
  filialId?: string
  /** O que o usuário atende ou para o que foi convidado. */
  usuarioId?: string
}

export interface DisponibilidadeRequest {
  inicio: string
  fim: string
  responsavelId?: string
  convidadoIds: string[]
  recorrencia?: Recorrencia | null
  ocorrencias?: Ocorrencia[] | null
  ignorarId?: string
}

export interface Choque {
  usuarioId: string
  usuarioNome: string
  /** O choque é do responsável — impede salvar. */
  responsavel: boolean
  compromissoId: string
  titulo: string
  inicio: string
  fim: string
}

/** Espelha `DisponibilidadeResponseDto`: uma ocorrência por data da série. */
export interface Disponibilidade {
  ocorrencias: { inicio: string; fim: string; choques: Choque[] }[]
  /** Algum choque é do responsável: salvar dará 409. */
  bloqueia: boolean
}

/**
 * Quem executa os botões de situação do `AcoesCompromisso`. A agenda passa os
 * dela (`acoesDaAgenda`, tela AGENDA); a consulta passa os seus, que gravam o
 * mesmo compromisso pela tela CONSULTAS. Ação ausente, botão ausente.
 */
export interface AcoesDeSituacao<R> {
  confirmar?: (id: string) => Promise<R>
  concluir?: (id: string) => Promise<R>
  faltou: (id: string) => Promise<R>
  cancelar: (id: string, motivo?: string) => Promise<R>
  /** "Este e os seguintes" — só a agenda, dona da série. */
  cancelarSeguintes?: (id: string, motivo?: string) => Promise<R>
}
