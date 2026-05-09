export type TDataGridMask = "cpf" | "cnpj" | "telefone" | "celular" | "cep" | "data" | "hora" | "moeda"

export interface TDataGridColumn<T = Record<string, unknown>> {
  label:   string
  field?:  keyof T
  width?:  string
  align?:  "left" | "center" | "right"
  mask?:   TDataGridMask | ((row: T) => TDataGridMask)
  render?: (row: T, mask: (value: string) => string) => React.ReactNode
}