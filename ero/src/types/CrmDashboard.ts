// Tipos do endpoint GET /crm/dashboard?dias=&usuarioId=&andamentoId=&uf=
// Espelha com.api.ero_erp.crm.dashboard.dtos.CrmDashboardDto (backend).

/** KPIs agregados. `taxaConclusao` é fração (0..1). Tempos em horas ou null. */
export interface CrmResumoDto {
  total:                    number
  abertos:                  number
  concluidos:               number
  cancelados:               number
  semResponsavel:           number
  mensagensNaoLidas:        number
  tempoMedioConclusaoHoras: number | null
  tempoMedioRespostaHoras:  number | null
  taxaConclusao:            number
}

/** Distribuição por andamento (coluna do kanban). */
export interface CrmContagemAndamentoDto {
  andamentoId: number
  nome:        string
  cor:         string
  chave:       string | null
  quantidade:  number
}

/** Distribuição por usuário responsável (usuarioId null = "Sem responsável"). */
export interface CrmContagemUsuarioDto {
  usuarioId:  number | null
  nome:       string
  total:      number
  abertos:    number
  concluidos: number
  cancelados: number
}

/** Série temporal: aberturas × conclusões por bucket ("dd/MM" ou "MM/yyyy"). */
export interface CrmPontoPeriodoDto {
  periodo:    string
  abertos:    number
  concluidos: number
}

/** Distribuição por UF (sigla) — `uf` pode ser "Sem localização". */
export interface CrmContagemUfDto {
  uf:         string
  quantidade: number
}

/** Distribuição por região do Brasil — pode ser "Sem localização". */
export interface CrmContagemRegiaoDto {
  regiao:     string
  quantidade: number
}

/** Pendências por usuário responsável (usuarioId null = "Sem responsável"). */
export interface CrmPendenciaUsuarioDto {
  usuarioId:  number | null
  nome:       string
  quantidade: number
}

/** Pendências por faixa de aging: "0-24h" | "24-48h" | "48-72h" | ">72h". */
export interface CrmPendenciaFaixaDto {
  faixa:      string
  quantidade: number
}

/** Bloco de pendências (só quando pendenciasAtivas === true). */
export interface CrmPendenciasDto {
  total:      number
  porUsuario: CrmPendenciaUsuarioDto[]
  porFaixa:   CrmPendenciaFaixaDto[]
}

/** Payload completo do dashboard BI do CRM. */
export interface CrmDashboardDto {
  resumo:           CrmResumoDto
  porAndamento:     CrmContagemAndamentoDto[]
  porUsuario:       CrmContagemUsuarioDto[]
  porPeriodo:       CrmPontoPeriodoDto[]
  porUf:            CrmContagemUfDto[]
  porRegiao:        CrmContagemRegiaoDto[]
  pendenciasAtivas: boolean
  pendencias:       CrmPendenciasDto | null
}
