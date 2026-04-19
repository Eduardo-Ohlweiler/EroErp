export interface TDataGridColumn<T = Record<string, unknown>> {
  label:      string
  field?:     keyof T
  width?:     string
  align?:     "left" | "center" | "right"
  render?:    (row: T) => React.ReactNode
}