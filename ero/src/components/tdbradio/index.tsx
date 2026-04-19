import { useState, useEffect } from "react"
import { api } from "../../services/api"

interface TDbRadioProps {
  name:          string
  label:         string
  url:           string
  valueField:    string
  labelField:    string
  defaultValue?: string
  disabled?:     boolean
  direction?:    "row" | "column"
  hint?:         string
  onChange?:     (value: string) => void
}

export function TDbRadio({
  name,
  label,
  url,
  valueField,
  labelField,
  defaultValue,
  disabled,
  direction = "row",
  hint,
  onChange,
}: TDbRadioProps) {

  const [options,  setOptions]  = useState<Record<string, unknown>[]>([])
  const [selected, setSelected] = useState(defaultValue ?? "")

  useEffect(() => {
    let cancelled = false

    api.get(url)
      .then((response) => {
        if (!cancelled) {
          const data = response.data
          setOptions(Array.isArray(data) ? data : data.content ?? [])
        }
      })
      .catch(() => {
        if (!cancelled) setOptions([])
      })

    return () => { cancelled = true }
  }, [url])

  function handleChange(value: string) {
    setSelected(value)
    onChange?.(value)
  }

  return (
    <div className="flex flex-col gap-1">

      <span className="text-sm text-(--text-secondary)">{label}</span>

      <div className={`flex gap-4 ${direction === "column" ? "flex-col ml-3" : "flex-row flex-wrap"}`}>
        {options.map((opt) => {
          const value = String(opt[valueField])
          return (
            <label
              key       ={value}
              className ={`flex items-center gap-2 cursor-pointer select-none text-sm text-(--text-secondary)
                          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:text-(--text-primary)"}`}
            >
              <input
                type     ="radio"
                name     ={name}
                value    ={value}
                checked  ={selected === value}
                disabled ={disabled}
                onChange ={() => handleChange(value)}
                className="cursor-pointer accent-(--accent)"
              />
              {String(opt[labelField] ?? "")}
            </label>
          )
        })}
      </div>

      {hint && <p className="text-xs text-(--text-muted)">{hint}</p>}

    </div>
  )
}