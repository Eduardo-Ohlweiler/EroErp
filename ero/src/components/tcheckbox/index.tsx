import { useState } from "react"

interface TCheckboxOption {
  label: string
  value: string
}

interface TCheckboxProps {
  name: string
  label: string
  options: TCheckboxOption[]
  defaultValues?: string[]
  disabled?: boolean
  direction?: "row" | "column"
  hint?: string
  onChange?: (values: string[]) => void
}

export function TCheckbox({
  name,
  label,
  options,
  defaultValues = [],
  disabled,
  direction = "row",
  hint,
  onChange
}: TCheckboxProps) {

  const [selected, setSelected] = useState<string[]>(defaultValues)

  function handleChange(value: string, checked: boolean) {
    const next = checked
      ? [...selected, value]
      : selected.filter((v) => v !== value)
    setSelected(next)
    onChange?.(next)
  }

  return (
    <div className="flex flex-col gap-1">

      <span className="text-sm text-[var(--text-secondary)]">{label}</span>

      <div className={`flex gap-4 ${direction === "column" ? "flex-col ml-3" : "flex-row flex-wrap"}`}>
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-center gap-2 cursor-pointer select-none text-sm text-[var(--text-secondary)]
              ${disabled ? "opacity-50 cursor-not-allowed" : "hover:text-[var(--text-primary)]"}`}
          >
            <input
              type="checkbox"
              name={name}
              value={opt.value}
              defaultChecked={defaultValues.includes(opt.value)}
              disabled={disabled}
              onChange={(e) => handleChange(opt.value, e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-[var(--accent)]"
            />
            {opt.label}
          </label>
        ))}
      </div>

      {hint && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}

    </div>
  )
}