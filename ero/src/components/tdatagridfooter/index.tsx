interface TDataGridFooterProps {
  page: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function TDataGridFooter({
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange
}: TDataGridFooterProps) {

  const inicio = page * pageSize + 1
  const fim    = Math.min((page + 1) * pageSize, totalElements)

  return (
    <div className="flex items-center justify-between px-2 py-3 text-sm text-(--text-secondary)">

      <span>
        Exibindo {inicio}–{fim} de {totalElements} registros
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(0)}
          disabled={page === 0}
          className="px-2 py-1 rounded border border-(--border) hover:bg-(--bg-hover)
          disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          «
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="px-2 py-1 rounded border border-(--border) hover:bg-(--bg-hover)
          disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          ‹
        </button>

        <span className="px-3 py-1 rounded border border-(--accent) bg-(--accent-light)
          text-(--accent) font-medium">
          {page + 1}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="px-2 py-1 rounded border border-(--border) hover:bg-(--bg-hover)
          disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          ›
        </button>
        <button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={page >= totalPages - 1}
          className="px-2 py-1 rounded border border-(--border) hover:bg-(--bg-hover)
          disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          »
        </button>
      </div>

    </div>
  )
}