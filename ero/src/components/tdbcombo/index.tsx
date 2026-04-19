import { useState, useEffect, useRef } from "react"
import { api } from "../../services/api"

interface TDbComboProps {
  name:          string
  label:         string
  url:           string
  value?:        string
  valueField:    string
  displayField:  string | ((item: Record<string, unknown>) => string)
  searchField?:  string
  placeholder?:  string
  required?:     boolean
  disabled?:     boolean
  width?:        string
  hint?:         string
  minLength?:    number
  onChange?:     (value: string, item?: Record<string, unknown>) => void
}

export function TDbCombo({
  name,
  label,
  url,
  valueField,
  displayField,
  searchField,
  placeholder  = "Selecione...",
  value,
  required,
  disabled,
  width        = "100%",
  hint,
  minLength    = 0,
  onChange
}: TDbComboProps) {

  const [search,  setSearch]  = useState("")
  const [options, setOptions] = useState<Record<string, unknown>[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  function getDisplay(item: Record<string, unknown>): string {
    if (typeof displayField === "function") return displayField(item)
    return String(item[displayField] ?? "")
  }

  useEffect(() => {
    if (!value) {
      setSearch("")
      return
    }

    api.get(`${url}/${value}`)
      .then((response) => {
        const item  = response.data
        const label = getDisplay(item)

        setSearch((prev) => (prev !== label ? label : prev))
      })
      .catch(() => {})
  }, [value])

  useEffect(() => {
    if (minLength === 0) {
      buscar("", false)
    }
  }, [])

  function buscar(valor: string, abrirDropdown = true) {
    if (debounce.current) clearTimeout(debounce.current)

    debounce.current = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (valor && searchField) {
          params.append(searchField, valor)
        }

        const response = await api.get(`${url}?${params.toString()}`)
        const data = response.data

        setOptions(Array.isArray(data) ? data : data.content ?? [])

        if (abrirDropdown) {
          setOpen(true)
        }
      } catch {
        setOptions([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const valor = e.target.value
    setSearch(valor)

    onChange?.("")

    if (valor.length >= minLength) {
      buscar(valor)
    } else {
      setOptions([])
      setOpen(false)
    }
  }

  function handleSelect(item: Record<string, unknown>) {
    const label = getDisplay(item)
    const val   = String(item[valueField])

    setSearch(label)
    setOpen(false)

    onChange?.(val, item)
  }

  function handleClear() {
    setSearch("")
    setOptions([])
    setOpen(false)

    onChange?.("")

    if (minLength === 0) {
      buscar("", false)
    }
  }

  function handleFocus() {
    if (options.length > 0 && search.length >= minLength) {
      setOpen(true)
    } else if (search.length >= minLength) {
      buscar(search)
    }
  }

  return (
    <div className="flex flex-col gap-1 relative" style={{ width }}>

      <label className="text-sm text-(--text-secondary)">
        {label}
        {required && <span className="text-(--danger) ml-1">*</span>}
      </label>

      <input
        type="hidden"
        name={name}
        value={value ?? ""}
      />

      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={handleInput}
          onFocus={handleFocus}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={minLength > 0 ? `Digite ${minLength}+ caracteres...` : placeholder}
          disabled={disabled}
          className="w-full bg-(--bg-input) border border-(--border) rounded-md px-3 py-2 pr-8 text-sm
                     text-(--text-primary) placeholder-(--text-muted)
                     focus:outline-none focus:border-(--accent) focus:ring-1 focus:ring-(--accent)
                     disabled:opacity-50 disabled:cursor-not-allowed transition"
        />

        {search && !disabled && (
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
          rounded-md shadow-xl z-50 max-h-52 overflow-y-auto">

          {loading && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-(--text-muted)">
              <span className="w-3 h-3 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
              Buscando...
            </div>
          )}

          {!loading && options.length === 0 && (
            <div className="px-3 py-2 text-sm text-(--text-muted)">
              Nenhum resultado encontrado
            </div>
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