import type { TDataGridColumn } from "../../types/TDataGridColumn"

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

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-(--border)">
      <table className="w-full text-sm">

        <thead>
          <tr className="bg-(--metal-700) border-b border-(--border)">

            {actions && (
              <th
                style     ={{ width: actionsWidth }}
                className ="px-4 py-3 font-medium text-(--text-inverse) text-center"
              >
                Ações
              </th>
            )}

            {columns.map((col) => (
              <th
                key       ={String(col.field ?? col.label)}
                style     ={{ width: col.width }}
                className ={`px-4 py-3 font-medium text-(--text-inverse)
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
                colSpan={columns.length + (actions ? 1 : 0)}
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
                colSpan={columns.length + (actions ? 1 : 0)}
                className="px-4 py-8 text-center text-(--text-muted)"
              >
                {emptyMessage}
              </td>
            </tr>
          )}

          {!loading && data.map((row, rowIndex) => (
            <tr
              key={String(row[keyField])}
              onClick={() => onRowClick?.(row)}
              className={`
                border-b border-(--border) transition
                ${rowIndex % 2 === 0 ? "bg-(--bg-surface)" : "bg-(--bg-base)"}
                ${onRowClick ? "cursor-pointer hover:bg-(--accent-light)" : "hover:bg-(--bg-hover)"}
              `}
            >
              {actions && (
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {actions(row)}
                  </div>
                </td>
              )}
              {columns.map((col) => (
                <td
                  key={String(col.field ?? col.label)}
                  className={`px-4 py-3 text-(--text-primary) ${alignClass[col.align ?? "left"]}`}
                >
                  {col.render
                    ? col.render(row)
                    : col.field
                      ? String(row[col.field] ?? "")
                      : ""
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