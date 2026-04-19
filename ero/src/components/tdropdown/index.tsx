import { useState, useRef, useEffect } from "react"

interface TDropdownOption {
    label:    string
    icon?:    React.ReactNode
    onClick:  () => void
    divider?: boolean  // linha separadora antes da opção
    }

    interface TDropdownProps {
    label?:   string
    icon?:    React.ReactNode
    options:  TDropdownOption[]
    align?:   "left" | "right"
    }

    export function TDropdown({
    label,
    icon,
    options,
    align = "right"
    }: TDropdownProps) {

    const [open, setOpen] = useState(false)
    const ref             = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
        if (ref.current && !ref.current.contains(e.target as Node)) {
            setOpen(false)
        }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={ref}>

        <button
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm
            text-(--text-sidebar) hover:text-(--text-inverse)
            hover:bg-(--bg-hover) transition"
        >
            {icon}
            {label && <span>{label}</span>}
        </button>

        {open && (
            <div
            className={`absolute top-full mt-2 bg-(--bg-surface) border border-(--border)
            rounded-lg shadow-xl z-50 min-w-180px
            ${align === "right" ? "right-0" : "left-0"}`}
            >
            {options.map((opt, index) => (
                <div key={index}>
                {opt.divider && (
                    <div className="border-t border-(--border) my-1" />
                )}
                <button
                    onClick={() => { opt.onClick(); setOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm
                    text-(--text-secondary) hover:text-(--text-primary)
                    hover:bg-(--bg-hover) transition"
                >
                    {opt.icon && <span className="text-base">{opt.icon}</span>}
                    {opt.label}
                </button>
                </div>
            ))}
            </div>
        )}

        </div>
    )
}