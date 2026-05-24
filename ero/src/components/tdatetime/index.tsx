import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"

interface TDateTimeProps {
    name:          string
    label:         string
    required?:     boolean
    disabled?:     boolean
    defaultValue?: string   // "2025-06-10T09:00" ou "2025-06-10T09:00:00"
    width?:        string
    hint?:         string
    onChange?:     (value: string) => void
}

const MESES       = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"]

function parseISO(v?: string): { date: Date; hour: number; minute: number } | null {
    if (!v) return null
    const [datePart, timePart] = v.split("T")
    if (!datePart) return null
    const [h = "0", m = "0"] = (timePart ?? "00:00").split(":")
    const date = new Date(datePart + "T00:00:00")
    if (isNaN(date.getTime())) return null
    return { date, hour: Number(h), minute: Number(m) }
}

function pad(n: number) { return String(n).padStart(2, "0") }

function toISO(date: Date, hour: number, minute: number) {
    const y  = date.getFullYear()
    const mo = pad(date.getMonth() + 1)
    const d  = pad(date.getDate())
    return `${y}-${mo}-${d}T${pad(hour)}:${pad(minute)}`
}

function toDisplay(date: Date, hour: number, minute: number) {
    return `${pad(date.getDate())}/${pad(date.getMonth()+1)}/${date.getFullYear()} ${pad(hour)}:${pad(minute)}`
}

export function TDateTime({
    name, label, required, disabled,
    defaultValue, width = "260px", hint, onChange
}: TDateTimeProps) {

    const today   = new Date()
    const initial = parseISO(defaultValue)

    const [selDate, setSelDate] = useState<Date | null>(initial?.date ?? null)
    const [selHour, setSelHour] = useState<number>(initial?.hour   ?? 8)
    const [selMin,  setSelMin]  = useState<number>(initial?.minute ?? 0)
    const [viewing, setViewing] = useState<Date>(initial?.date ?? today)
    const [open,    setOpen]    = useState(false)
    const [tab,     setTab]     = useState<"date" | "time">("date")

    // posição do dropdown calculada em relação ao campo
    const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 300 })

    const fieldRef   = useRef<HTMLDivElement>(null)
    const dropRef    = useRef<HTMLDivElement>(null)

    // fecha ao clicar fora (tanto do campo quanto do dropdown)
    useEffect(() => {
        function onMouseDown(e: MouseEvent) {
            const target = e.target as Node
            if (
                fieldRef.current && !fieldRef.current.contains(target) &&
                dropRef.current  && !dropRef.current.contains(target)
            ) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", onMouseDown)
        return () => document.removeEventListener("mousedown", onMouseDown)
    }, [])

    // recalcula posição quando abre
    useEffect(() => {
        if (!open || !fieldRef.current) return
        const rect = fieldRef.current.getBoundingClientRect()
        setDropPos({
            top:   rect.bottom + window.scrollY + 4,
            left:  rect.left   + window.scrollX,
            width: 300,
        })
    }, [open])

    // atualiza se defaultValue mudar externamente (ex: formKey reset)
    useEffect(() => {
        const p = parseISO(defaultValue)
        setSelDate(p?.date ?? null)
        setSelHour(p?.hour   ?? 8)
        setSelMin(p?.minute  ?? 0)
        setViewing(p?.date   ?? today)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultValue])

    function getDaysInMonth(y: number, mo: number) { return new Date(y, mo + 1, 0).getDate() }
    function getFirstDay   (y: number, mo: number) { return new Date(y, mo, 1).getDay() }

    function handleSelectDay(day: number) {
        const date = new Date(viewing.getFullYear(), viewing.getMonth(), day)
        setSelDate(date)
        setTab("time")
        fireChange(date, selHour, selMin)
    }

    function handleTimeChange(h: number, m: number) {
        setSelHour(h)
        setSelMin(m)
        if (selDate) fireChange(selDate, h, m)
    }

    function fireChange(date: Date, h: number, m: number) {
        onChange?.(toISO(date, h, m))
    }

    function handleClear(e: React.MouseEvent) {
        e.stopPropagation()
        setSelDate(null)
        setSelHour(8)
        setSelMin(0)
        onChange?.("")
    }

    function prevMonth() { setViewing(new Date(viewing.getFullYear(), viewing.getMonth() - 1, 1)) }
    function nextMonth() { setViewing(new Date(viewing.getFullYear(), viewing.getMonth() + 1, 1)) }

    const year      = viewing.getFullYear()
    const month     = viewing.getMonth()
    const daysCount = getDaysInMonth(year, month)
    const firstDay  = getFirstDay(year, month)
    const days      = Array.from({ length: daysCount }, (_, i) => i + 1)
    const blanks    = Array.from({ length: firstDay })

    const displayValue = selDate ? toDisplay(selDate, selHour, selMin) : ""
    const hiddenValue  = selDate ? toISO(selDate, selHour, selMin)     : ""

    const hours   = Array.from({ length: 24 }, (_, i) => i)
    const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

    // ── dropdown renderizado via portal no body ──
    const dropdown = open ? createPortal(
        <div
            ref={dropRef}
            style={{ position: "absolute", top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
            className="bg-(--bg-surface) border border-(--border) rounded-lg shadow-xl"
        >
            {/* abas */}
            <div className="flex border-b border-(--border)">
                {(["date", "time"] as const).map(t => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={[
                            "flex-1 py-2 text-xs font-medium transition",
                            tab === t
                                ? "text-(--accent) border-b-2 border-(--accent) -mb-px"
                                : "text-(--text-muted) hover:text-(--text-primary)"
                        ].join(" ")}
                    >
                        {t === "date" ? "📅 Data" : "⏰ Hora"}
                    </button>
                ))}
            </div>

            {/* ── aba: calendário ── */}
            {tab === "date" && (
                <div className="p-3">
                    <div className="flex items-center justify-between mb-3">
                        <button type="button" onClick={prevMonth}
                            className="text-(--text-muted) hover:text-(--text-primary) px-2 py-1 transition text-lg leading-none">
                            ‹
                        </button>
                        <span className="text-sm font-medium text-(--text-primary)">
                            {MESES[month]} {year}
                        </span>
                        <button type="button" onClick={nextMonth}
                            className="text-(--text-muted) hover:text-(--text-primary) px-2 py-1 transition text-lg leading-none">
                            ›
                        </button>
                    </div>

                    <div className="grid grid-cols-7 mb-1">
                        {DIAS_SEMANA.map(d => (
                            <div key={d} className="text-center text-xs text-(--text-muted) py-1">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-0.5">
                        {blanks.map((_, i) => <div key={`b-${i}`} />)}
                        {days.map(day => {
                            const isSel = selDate &&
                                selDate.getDate()     === day &&
                                selDate.getMonth()    === month &&
                                selDate.getFullYear() === year
                            const isToday =
                                today.getDate()     === day &&
                                today.getMonth()    === month &&
                                today.getFullYear() === year

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleSelectDay(day)}
                                    className={[
                                        "text-center text-sm py-1 rounded-md transition",
                                        isSel
                                            ? "bg-(--accent) text-(--text-inverse)"
                                            : isToday
                                                ? "border border-(--accent) text-(--accent)"
                                                : "text-(--text-primary) hover:bg-(--bg-hover)"
                                    ].join(" ")}
                                >
                                    {day}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ── aba: horário ── */}
            {tab === "time" && (
                <div className="p-3 flex flex-col gap-3">
                    <div className="text-center text-2xl font-semibold text-(--accent) tracking-widest">
                        {pad(selHour)}:{pad(selMin)}
                    </div>

                    <div>
                        <p className="text-xs text-(--text-muted) mb-1">Hora</p>
                        <div className="grid grid-cols-6 gap-1">
                            {hours.map(h => (
                                <button
                                    key={h}
                                    type="button"
                                    onClick={() => handleTimeChange(h, selMin)}
                                    className={[
                                        "text-xs py-1 rounded transition",
                                        selHour === h
                                            ? "bg-(--accent) text-(--text-inverse)"
                                            : "text-(--text-primary) hover:bg-(--bg-hover)"
                                    ].join(" ")}
                                >
                                    {pad(h)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-(--text-muted) mb-1">Minuto</p>
                        <div className="grid grid-cols-6 gap-1">
                            {minutes.map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => handleTimeChange(selHour, m)}
                                    className={[
                                        "text-xs py-1 rounded transition",
                                        selMin === m
                                            ? "bg-(--accent) text-(--text-inverse)"
                                            : "text-(--text-primary) hover:bg-(--bg-hover)"
                                    ].join(" ")}
                                >
                                    {pad(m)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* rodapé */}
            <div className="flex justify-between items-center px-3 py-2 border-t border-(--border)">
                <span className="text-xs text-(--text-muted)">
                    {selDate
                        ? `${pad(selDate.getDate())}/${pad(selDate.getMonth()+1)}/${selDate.getFullYear()} ${pad(selHour)}:${pad(selMin)}`
                        : "Nenhuma data selecionada"}
                </span>
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-xs px-3 py-1 rounded bg-(--accent) text-(--text-inverse)
                                hover:opacity-90 transition font-medium"
                >
                    OK
                </button>
            </div>
        </div>,
        document.body
    ) : null

    return (
        <div className="flex flex-col gap-1" style={{ width }} ref={fieldRef}>

            <label className="text-sm text-(--text-secondary)">
                {label}
                {required && <span className="text-(--danger) ml-1">*</span>}
            </label>

            <input type="hidden" name={name} value={hiddenValue} />

            <div
                onClick={() => !disabled && setOpen(p => !p)}
                className={[
                    "relative flex items-center w-full",
                    "bg-(--bg-input) border border-(--border) rounded-md",
                    "px-3 py-2 text-sm text-(--text-primary)",
                    "transition cursor-pointer select-none",
                    open    ? "border-(--accent) ring-1 ring-(--accent)" : "",
                    disabled ? "opacity-50 cursor-not-allowed" : "",
                ].join(" ")}
            >
                <span className={displayValue ? "text-(--text-primary)" : "text-(--text-muted)"}>
                    {displayValue || "dd/mm/aaaa hh:mm"}
                </span>

                {selDate && !disabled && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="ml-auto mr-5 text-(--text-muted) hover:text-(--text-primary) transition text-xs"
                    >
                        ✕
                    </button>
                )}

                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted) text-sm pointer-events-none">
                    📅
                </span>
            </div>

            {hint && <span className="text-xs text-(--text-muted)">{hint}</span>}

            {dropdown}
        </div>
    )
}