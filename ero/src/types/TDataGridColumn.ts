export interface TDataGridColumn<T = Record<string, unknown>> {
  label:      string
  field?:     keyof T
  width?:     string
  align?:     "left" | "center" | "right"
  mask?:   "cpf" | "cnpj" | "telefone" | "celular" | "cep" | "data" | "hora" | "moeda"
  render?:    (row: T) => React.ReactNode
}