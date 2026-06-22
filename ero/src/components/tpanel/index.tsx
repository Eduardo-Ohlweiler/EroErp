import { useState } from "react"

interface TPanelProps {
  title:      string
  children:   React.ReactNode
  collapsed?: boolean
}

export function TPanel({ title, children, collapsed = false }: TPanelProps) {

  const [open, setOpen] = useState(!collapsed)

  return (
    <div className="border border-(--border) rounded-lg">

      <button
        type      ="button"
        onClick   ={() => setOpen((prev) => !prev)}
        className ={`w-full flex items-center justify-between px-4 py-3
          bg-(--metal-700) text-(--text-inverse) text-sm font-medium
          hover:bg-(--metal-600) transition
          ${open ? "rounded-t-lg" : "rounded-lg"}`}
      >
        <span>{title}</span>
        <span className={`text-xs transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
          ›
        </span>
      </button>

      {open && (
        <div className="p-4 bg-(--bg-surface) flex flex-col gap-4 rounded-b-lg">
          {children}
        </div>
      )}

    </div>
  )
}