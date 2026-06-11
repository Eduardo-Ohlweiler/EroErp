import type { DiaSemana } from "../types/PlanoAlimentar"

export const DIA_SEMANA_LABEL: Record<DiaSemana, string> = {
  SEGUNDA: "Segunda-feira",
  TERCA:   "Terça-feira",
  QUARTA:  "Quarta-feira",
  QUINTA:  "Quinta-feira",
  SEXTA:   "Sexta-feira",
  SABADO:  "Sábado",
  DOMINGO: "Domingo",
}

export const DIA_SEMANA_ABREV: Record<DiaSemana, string> = {
  SEGUNDA: "Seg",
  TERCA:   "Ter",
  QUARTA:  "Qua",
  QUINTA:  "Qui",
  SEXTA:   "Sex",
  SABADO:  "Sáb",
  DOMINGO: "Dom",
}

export const DIAS_SEMANA: DiaSemana[] = [
  "SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO", "DOMINGO"
]

export const DIA_SEMANA_OPTIONS = DIAS_SEMANA.map(d => ({
  value: d,
  label: DIA_SEMANA_LABEL[d],
}))

export function formatarHorario(h: string): string {
  return h?.length >= 5 ? h.substring(0, 5) : (h ?? "")
}

export function formatarDataBR(d: string | null | undefined): string {
  if (!d) return "—"
  const [y, m, dia] = d.split("-")
  return `${dia}/${m}/${y}`
}
