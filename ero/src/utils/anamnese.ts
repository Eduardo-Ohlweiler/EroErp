import type { TipoFinalidade, TipoCampo } from "../types/Anamnese"

export const FINALIDADE_LABEL: Record<TipoFinalidade, string> = {
  ESTETICA:      "Estética",
  CLINICA_GERAL: "Clínica Geral",
  DENTISTA:      "Odontologia",
  PODOLOGIA:     "Podologia",
  NUTRICAO:      "Nutrição",
  VETERINARIA:   "Veterinária",
}

export const FINALIDADE_OPTIONS = Object.entries(FINALIDADE_LABEL).map(([value, label]) => ({ value, label }))

export const TIPO_CAMPO_LABEL: Record<TipoCampo, string> = {
  TEXTO:            "Texto curto",
  TEXTO_LONGO:      "Texto longo",
  CHECKBOX:         "Sim/Não",
  DATA:             "Data",
  NUMERO:           "Número",
  OPCOES:           "Opções (uma)",
  MULTIPLAS_OPCOES: "Opções (múltiplas)",
}

export const TIPO_CAMPO_OPTIONS = Object.entries(TIPO_CAMPO_LABEL).map(([value, label]) => ({ value, label }))
