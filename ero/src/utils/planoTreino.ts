import type { DiaSemanaGym, TipoExecucao } from "../types/PlanoTreino"

export const DIA_SEMANA_LABEL: Record<DiaSemanaGym, string> = {
  SEGUNDA: "Segunda-feira",
  TERCA:   "Terça-feira",
  QUARTA:  "Quarta-feira",
  QUINTA:  "Quinta-feira",
  SEXTA:   "Sexta-feira",
  SABADO:  "Sábado",
  DOMINGO: "Domingo",
}

export const DIA_SEMANA_ABREV: Record<DiaSemanaGym, string> = {
  SEGUNDA: "Seg",
  TERCA:   "Ter",
  QUARTA:  "Qua",
  QUINTA:  "Qui",
  SEXTA:   "Sex",
  SABADO:  "Sáb",
  DOMINGO: "Dom",
}

export const DIAS_SEMANA: DiaSemanaGym[] = [
  "SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO", "DOMINGO"
]

export const DIA_SEMANA_OPTIONS = DIAS_SEMANA.map(d => ({
  value: d,
  label: DIA_SEMANA_LABEL[d],
}))

export const TIPO_EXECUCAO_LABEL: Record<TipoExecucao, string> = {
  NORMAL:            "Normal",
  DROPSET:           "Drop Set",
  DROPSET_INVERTIDO: "Drop Set Invertido",
}

export const TIPO_EXECUCAO_OPTIONS = [
  { value: "NORMAL",            label: "Normal"              },
  { value: "DROPSET",           label: "Drop Set"            },
  { value: "DROPSET_INVERTIDO", label: "Drop Set Invertido"  },
]

export function formatarDataBR(d: string | null | undefined): string {
  if (!d) return "—"
  const [y, m, dia] = d.split("-")
  return `${dia}/${m}/${y}`
}

export function formatarPausa(segundos: number | null | undefined): string {
  if (segundos == null) return "—"
  if (segundos < 60) return `${segundos}s`
  const min = Math.floor(segundos / 60)
  const sec = segundos % 60
  return sec === 0 ? `${min}min` : `${min}min ${sec}s`
}
