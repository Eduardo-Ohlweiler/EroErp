interface TRadioOption {
  label: string
  value: string
}

interface TRadioProps {
  name:           string
  label:          string
  options:        TRadioOption[]
  defaultValue?:  string
  disabled?:      boolean
  direction?:     "row" | "column"
  hint?:          string
  onChange?:      (value: string) => void
}

export function TRadio({
  name, label, options, defaultValue, disabled, direction = "row", hint, onChange
}: TRadioProps) {
  return (
    <div className="flex flex-col gap-1">

      <span className="text-sm text-(--text-secondary)">{label}</span>

      <div className={`flex gap-4 ${direction === "column" ? "flex-col ml-3" : "flex-row flex-wrap"}`}>
        {options.map((opt) => (
          <label
            key       ={opt.value}
            className ={`flex items-center gap-2 cursor-pointer select-none text-sm text-(--text-secondary)
                        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:text-(--text-primary)"}`}
          >
            <input
              type          ="radio"
              name          ={name}
              value         ={opt.value}
              defaultChecked={defaultValue === opt.value}
              disabled      ={disabled}
              onChange      ={() => onChange?.(opt.value)}
              className     ="cursor-pointer accent-(--accent)"
            />
            {opt.label}
          </label>
        ))}
      </div>

      {hint && <p className="text-xs text-(--text-muted)">{hint}</p>}

    </div>
  )
}