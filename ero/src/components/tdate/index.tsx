import { useState, useRef, useEffect } from "react"

interface TDateProps {
    name:          string
    label:         string
    required?:     boolean
    disabled?:     boolean
    defaultValue?: string
    width?:        string
    hint?:         string
    onChange?:     (value: string) => void
}

const MESES       = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"]

export function TDate({
    name, label, required, disabled, defaultValue, width = "200px", hint, onChange
    }: TDateProps) {

    const today         = new Date()
    const parseDate     = (v?: string) => v ? new Date(v + "T00:00:00") : null
    const formatDisplay = (d: Date)    => `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`
    const formatValue   = (d: Date)    => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`

    const initial                     = parseDate(defaultValue)
    const [selected, setSelected]     = useState<Date | null>(initial)
    const [viewing,  setViewing]      = useState(initial ?? today)
    const [open,     setOpen]         = useState(false)
    const ref                         = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClick(e: MouseEvent) {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate() }
    function getFirstDay(year: number, month: number)    { return new Date(year, month, 1).getDay() }

    function handleSelect(day: number) {
        const date = new Date(viewing.getFullYear(), viewing.getMonth(), day)
        setSelected(date)
        setOpen(false)
        onChange?.(formatValue(date))
    }

    function prevMonth() { setViewing(new Date(viewing.getFullYear(), viewing.getMonth() - 1, 1)) }
    function nextMonth() { setViewing(new Date(viewing.getFullYear(), viewing.getMonth() + 1, 1)) }

    const year      = viewing.getFullYear()
    const month     = viewing.getMonth()
    const daysCount = getDaysInMonth(year, month)
    const firstDay  = getFirstDay(year, month)
    const days      = Array.from({ length: daysCount }, (_, i) => i + 1)
    const blanks    = Array.from({ length: firstDay })

    return (
        <div className="flex flex-col gap-1 relative" style={{ width }} ref={ref}>

        <label className="text-sm text-[var(--text-secondary)]">
            {label}
            {required && <span className="text-[var(--danger)] ml-1">*</span>}
        </label>

        <input type="hidden" name={name} value={selected ? formatValue(selected) : ""} />

        <div className="relative">
            <input
            type        ="text"
            readOnly
            value       ={selected ? formatDisplay(selected) : ""}
            placeholder ="dd/mm/aaaa"
            disabled    ={disabled}
            onClick     ={() => !disabled && setOpen((p) => !p)}
            className   ="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-md
                px-3 py-2 pr-8 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]
                focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]
                disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none">
            📅
            </span>
            {selected && !disabled && (
            <button
                type      ="button"
                onClick   ={(e) => { e.stopPropagation(); setSelected(null); onChange?.("") }}
                className ="absolute right-7 top-1/2 -translate-y-1/2 text-[var(--text-muted)]
                hover:text-[var(--text-primary)] transition text-xs"
            >
                ✕
            </button>
            )}
        </div>

        {open && (
            <div className="absolute top-full left-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border)]
            rounded-lg shadow-xl z-50 p-3 w-[280px]">

            <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={prevMonth}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 py-1 transition">
                ‹
                </button>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                {MESES[month]} {year}
                </span>
                <button type="button" onClick={nextMonth}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 py-1 transition">
                ›
                </button>
            </div>

            <div className="grid grid-cols-7 mb-1">
                {DIAS_SEMANA.map((d) => (
                <div key={d} className="text-center text-xs text-[var(--text-muted)] py-1">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
                {blanks.map((_, i) => <div key={`b-${i}`} />)}
                {days.map((day) => {
                const isSelected = selected &&
                    selected.getDate()     === day &&
                    selected.getMonth()    === month &&
                    selected.getFullYear() === year
                const isToday =
                    today.getDate()     === day &&
                    today.getMonth()    === month &&
                    today.getFullYear() === year
                return (
                    <button
                    key       ={day}
                    type      ="button"
                    onClick   ={() => handleSelect(day)}
                    className ={`text-center text-sm py-1 rounded-md transition
                        ${isSelected
                        ? "bg-[var(--accent)] text-[var(--text-inverse)]"
                        : isToday
                            ? "border border-[var(--accent)] text-[var(--accent)]"
                            : "text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                        }`}
                    >
                    {day}
                    </button>
                )
                })}
            </div>

            </div>
        )}

        {hint && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
        </div>
    )
}