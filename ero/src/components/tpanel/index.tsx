import { useState } from "react"

interface TPanelProps {
  title:      string
  children:   React.ReactNode
  collapsed?: boolean
}

export function TPanel({ title, children, collapsed = false }: TPanelProps) {

  const [open, setOpen] = useState(!collapsed)

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">

      <button
        type      ="button"
        onClick   ={() => setOpen((prev) => !prev)}
        className ="w-full flex items-center justify-between px-4 py-3
          bg-[var(--metal-700)] text-[var(--text-inverse)] text-sm font-medium
          hover:bg-[var(--metal-600)] transition"
      >
        <span>{title}</span>
        <span className={`text-xs transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
          ›
        </span>
      </button>

      {open && (
        <div className="p-4 bg-[var(--bg-surface)] flex flex-col gap-4">
          {children}
        </div>
      )}

    </div>
  )
}