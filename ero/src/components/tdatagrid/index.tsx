import type { TDataGridColumn, TDataGridMask } from "../../types/TDataGridColumn"

interface           TDataGridProps<T extends object> {
  columns:          TDataGridColumn<T>[]
  data:             T[]
  keyField:         keyof T
  loading?:         boolean
  emptyMessage?:    string
  onRowClick?:      (row: T) => void
  actions?:         (row: T) => React.ReactNode
  actionsWidth?:    string
}

export function TDataGrid<T extends object>({
  columns,
  data,
  keyField,
  loading = false,
  emptyMessage = "Nenhum registro encontrado",
  onRowClick,
  actions,
  actionsWidth = "120px"
}: TDataGridProps<T>) {

  const alignClass = {
    left:   "text-left",
    center: "text-center",
    right:  "text-right",
  }

  function applyColumnMask(value: string, mask: TDataGridMask): string {
    if (!mask || !value)
      return value
    const d = value.replace(/\D/g, "")

    switch (mask) {
      case "cpf":
        return d.slice(0,11).replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d{1,2})$/,"$1-$2")
      case "cnpj":
        return d.slice(0,14).replace(/(\d{2})(\d)/,"$1.$2").replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d)/,"$1/$2").replace(/(\d{4})(\d{1,2})$/,"$1-$2")
      case "telefone":
        return d.slice(0,10).replace(/(\d{2})(\d)/,"($1) $2").replace(/(\d{4})(\d{1,4})$/,"$1-$2")
      case "celular":
        return d.slice(0,11).replace(/(\d{2})(\d)/,"($1) $2").replace(/(\d{5})(\d{1,4})$/,"$1-$2")
      case "cep":
        return d.slice(0,8).replace(/(\d{5})(\d{1,3})$/,"$1-$2")
      case "hora":
        return d.slice(0,4).replace(/(\d{2})(\d{1,2})$/,"$1:$2")
      case "data": {
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          const [yyyy, mm, day] = value.split("-")
          return `${day}/${mm}/${yyyy}`
        }
        return d.slice(0,8).replace(/(\d{2})(\d)/,"$1/$2").replace(/(\d{2})(\d{1,4})$/,"$1/$2")
      }
      case "moeda": {
        const num = parseFloat(value)
        if (!isNaN(num)) return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
        const cents = parseInt(d || "0", 10) / 100
        return cents.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      }
      default:
        return value
    }
  }

  function resolveMask(row: T, col: TDataGridColumn<T>): string {
    if (!col.field) return ""
    const value  = String(row[col.field] ?? "")
    if (!col.mask) return value
    const mask = typeof col.mask === "function" ? col.mask(row) : col.mask
    return applyColumnMask(value, mask)
  }

  return (
    // ← wrapper externo garante que o scroll horizontal fique contido na página
    <div className="w-full min-w-0 overflow-x-auto rounded-lg border border-(--border)">
      {/* ← min-w garante que a tabela não colapse abaixo de 400px em mobile */}
      <table className="w-full min-w-100 text-sm">

        <thead>
          <tr className="bg-(--metal-700) border-b border-(--border)">
            {actions && (
              <th
                style     ={{ width: actionsWidth }}
                // ← whitespace-nowrap evita que "Ações" quebre em duas linhas
                className ="px-3 py-3 font-medium text-(--text-inverse) text-center whitespace-nowrap"
              >
                Ações
              </th>
            )}
            {columns.map((col) => (
              <th
                key       ={String(col.field ?? col.label)}
                style     ={{ width: col.width }}
                // ← whitespace-nowrap nos headers evita quebras indesejadas
                className ={`px-3 py-3 font-medium text-(--text-inverse) whitespace-nowrap
                  ${alignClass[col.align ?? "left"]}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading && (
            <tr>
              <td
                colSpan  ={columns.length + (actions ? 1 : 0)}
                className="px-4 py-8 text-center text-(--text-muted)"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                  Carregando...
                </div>
              </td>
            </tr>
          )}

          {!loading && data.length === 0 && (
            <tr>
              <td
                colSpan  ={columns.length + (actions ? 1 : 0)}
                className="px-4 py-8 text-center text-(--text-muted)"
              >
                {emptyMessage}
              </td>
            </tr>
          )}

          {!loading && data.map((row, rowIndex) => (
            <tr
              key      ={String(row[keyField])}
              onClick  ={() => onRowClick?.(row)}
              className={`
                border-b border-(--border) transition
                ${rowIndex % 2 === 0 ? "bg-(--bg-surface)" : "bg-(--bg-base)"}
                ${onRowClick ? "cursor-pointer hover:bg-(--accent-light)" : "hover:bg-(--bg-hover)"}
              `}
            >
              {actions && (
                <td className="px-3 py-3 text-center">
                  {/* ← flex-nowrap evita que os botões de ação quebrem linha */}
                  <div className="flex items-center justify-center gap-2 flex-nowrap">
                    {actions(row)}
                  </div>
                </td>
              )}
              {columns.map((col) => (
                <td
                  key      ={String(col.field ?? col.label)}
                  // ← max-w + truncate evita que texto longo estoure a célula
                  className={`px-3 py-3 text-(--text-primary) max-w-50 truncate ${alignClass[col.align ?? "left"]}`}
                >
                  {col.render 
                      ? col.render(row, (val) => {
                          if (!col.mask) 
                            return val
                          const m = typeof col.mask === "function" ? col.mask(row) : col.mask
                          return applyColumnMask(val, m)
                        }) 
                      : resolveMask(row, col)
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}