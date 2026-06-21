import type { TipoExameLaudo } from "../../types/Otorrino"

// Rótulos amigáveis dos tipos de exame de laudo — compartilhado entre List, Form e PDF.
// Mantido fora dos componentes para não quebrar o Fast Refresh (react-refresh/only-export-components).
export const TIPO_EXAME_LABEL: Record<TipoExameLaudo, string> = {
  NASOFIBROSCOPIA:    "Nasofibroscopia",
  LARINGOSCOPIA:      "Laringoscopia",
  VIDEOLARINGOSCOPIA: "Videolaringoscopia",
  RINOSCOPIA:         "Rinoscopia",
  OUTRO:              "Outro",
}
