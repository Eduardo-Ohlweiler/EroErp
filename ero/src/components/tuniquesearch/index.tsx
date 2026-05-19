import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
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
    defaultValue?: string
    defaultDisplay?: string
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
    defaultValue,
    defaultDisplay,
    onChange
}: TUniqueSearchProps) {

    const [search, setSearch] = useState(defaultDisplay ?? "")
    const [selectedId, setSelectedId] = useState(defaultValue ?? "")
    const [options, setOptions] = useState<Record<string, unknown>[]>([])
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (defaultValue && !defaultDisplay) {
            api.get(`${url}/${defaultValue}`)
                .then((response) => setSearch(getDisplay(response.data)))
                .catch(() => {})
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function getDisplay(item: Record<string, unknown>): string {
        if (typeof displayField === "function") return displayField(item)
        return String(item[displayField] ?? "")
    }

    function updateDropdownPosition() {
        if (!inputRef.current) return

        const rect = inputRef.current.getBoundingClientRect()

        setDropdownStyle({
            position: "fixed",
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
            zIndex: 999999
        })
    }

    function handleSearch(value: string) {
        setSearch(value)
        setSelectedId("")

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
                updateDropdownPosition()
                setOpen(true)

            } catch {
                setOptions([])
            } finally {
                setLoading(false)
            }
        }, 300)
    }

    function handleSelect(item: Record<string, unknown>) {
        const id = String(item[valueField])

        setSelectedId(id)
        setSearch(getDisplay(item))
        setOpen(false)

        onChange?.(id, item)
    }

    function handleClear() {
        setSelectedId("")
        setSearch("")
        setOptions([])
        setOpen(false)

        onChange?.("")
    }

    useEffect(() => {
        if (!open) return

        const update = () => updateDropdownPosition()

        window.addEventListener("scroll", update, true)
        window.addEventListener("resize", update)

        return () => {
            window.removeEventListener("scroll", update, true)
            window.removeEventListener("resize", update)
        }
    }, [open])

    return (
        <div className="flex flex-col gap-1" style={{ width }}>

            <label className="text-sm text-(--text-secondary)">
                {label}
                {required && <span className="text-(--danger) ml-1">*</span>}
            </label>

            <input type="hidden" name={name} value={selectedId} />

            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    onBlur={() => setTimeout(() => setOpen(false), 200)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full bg-(--bg-input) border border-(--border)
                               rounded-md px-3 py-2 pr-8 text-sm
                               text-(--text-primary)
                               placeholder-(--text-muted)
                               focus:outline-none
                               focus:border-(--accent)
                               focus:ring-1
                               focus:ring-(--accent)
                               disabled:opacity-50
                               disabled:cursor-not-allowed transition"
                />

                {search && !disabled && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2
                                   text-(--text-muted)
                                   hover:text-(--text-primary)"
                    >
                        ✕
                    </button>
                )}
            </div>

            {open && createPortal(
                <div
                    style={dropdownStyle}
                    className="bg-(--bg-surface)
                               border border-(--border)
                               rounded-md shadow-xl
                               max-h-48 overflow-y-auto"
                >
                    {loading && (
                        <div className="px-3 py-2 text-sm text-(--text-muted)">
                            Buscando...
                        </div>
                    )}

                    {!loading && options.length === 0 && (
                        <div className="px-3 py-2 text-sm text-(--text-muted)">
                            Nenhum resultado
                        </div>
                    )}

                    {!loading && options.map((opt) => (
                        <button
                            key={String(opt[valueField])}
                            type="button"
                            onMouseDown={() => handleSelect(opt)}
                            className="w-full text-left px-3 py-2 text-sm
                                       text-(--text-primary)
                                       hover:bg-(--bg-hover)"
                        >
                            {getDisplay(opt)}
                        </button>
                    ))}
                </div>,
                document.body
            )}

            {hint && (
                <p className="text-xs text-(--text-muted)">
                    {hint}
                </p>
            )}
        </div>
    )
}