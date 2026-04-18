import { useState, useRef } from "react"
import { api } from "../../services/api"

interface TUniqueSearchProps {
  name: string
  label: string
  url: string
  valueField: string
  displayField: string | ((item: Record<string, unknown>) => string)
  searchField: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  width?: string
  hint?: string
  minLength?: number
  onChange?: (value: string, item?: Record<string, unknown>) => void
}

export function TUniqueSearch({
  name,
  label,
  url,
  valueField,
  displayField,
  searchField,
  placeholder = "Digite para buscar...",
  required,
  disabled,
  width = "100%",
  hint,
  minLength = 2,
  onChange
}: TUniqueSearchProps) {

  const [search,   setSearch]   = useState("")
  const [options,  setOptions]  = useState<Record<string, unknown>[]>([])
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null)
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  function getDisplay(item: Record<string, unknown>): string {
    if (typeof displayField === "function") return displayField(item)
    return String(item[displayField] ?? "")
  }

  function handleSearch(value: string) {
    setSearch(value)
    setSelected(null)

    if (debounce.current) clearTimeout(debounce.current)

    if (value.length < minLength) {
      setOptions([])
      setOpen(false)
      return
    }

    debounce.current = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ size: "20" })
        params.append(searchField, value)
        const response = await api.get(`${url}?${params.toString()}`)
        setOptions(response.data.content ?? response.data)
        setOpen(true)
      } catch {
        setOptions([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  function handleSelect(item: Record<string, unknown>) {
    setSelected(item)
    setSearch(getDisplay(item))
    setOpen(false)
    onChange?.(String(item[valueField]), item)
  }

  function handleClear() {
    setSelected(null)
    setSearch("")
    setOptions([])
    onChange?.("")
  }

  return (
    <div className="flex flex-col gap-1 relative" style={{ width }}>

      <label className="text-sm text-(--text-secondary)">
        {label}
        {required && <span className="text-(--danger) ml-1">*</span>}
      </label>

      {/* input hidden com o valor real */}
      <input type="hidden" name={name} value={selected ? String(selected[valueField]) : ""} />

      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-(--bg-input) border border-(--border) rounded-md px-3 py-2 pr-8 text-sm
          text-(--text-primary) placeholder-(--text-muted)
          focus:outline-none focus:border-(--accent) focus:ring-1 focus:ring-(--accent)
          disabled:opacity-50 disabled:cursor-not-allowed transition"
        />

        {/* botão limpar */}
        {search && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-(--text-muted)
            hover:text-(--text-primary) transition"
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-(--bg-surface) border border-(--border)
        rounded-md shadow-xl z-50 max-h-48 overflow-y-auto">
          {loading && (
            <div className="px-3 py-2 text-sm text-(--text-muted)">Buscando...</div>
          )}
          {!loading && options.length === 0 && (
            <div className="px-3 py-2 text-sm text-(--text-muted)">Nenhum resultado</div>
          )}
          {!loading && options.map((opt) => (
            <button
              key={String(opt[valueField])}
              type="button"
              onMouseDown={() => handleSelect(opt)}
              className="w-full text-left px-3 py-2 text-sm text-(--text-primary)
              hover:bg-(--bg-hover) transition"
            >
              {getDisplay(opt)}
            </button>
          ))}
        </div>
      )}

      {hint && <p className="text-xs text-(--text-muted)">{hint}</p>}

    </div>
  )
}