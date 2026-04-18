interface TTextProps {
  name:           string
  label:          string
  placeholder?:   string
  required?:      boolean
  defaultValue?:  string
  disabled?:      boolean
  width?:         string
  height?:        string
  hint?:          string
  maxLength?:     number
  resize?:        "none" | "vertical" | "horizontal" | "both"
  onChange?:      (value: string) => void
}

export function TText({
  name,
  label,
  placeholder,
  required,
  defaultValue,
  disabled,
  width = "100%",
  height = "120px",
  hint,
  maxLength,
  resize = "vertical",
  onChange
}: TTextProps) {
  return (
    <div className="flex flex-col gap-1" style={{ width }}>

      <label className="text-sm text-(--text-secondary)">
        {label}
        {required && <span className="text-(--danger) ml-1">*</span>}
      </label>

      <textarea
        name        ={name}
        placeholder ={placeholder}
        required    ={required}
        defaultValue={defaultValue}
        disabled    ={disabled}
        maxLength   ={maxLength}
        onChange    ={(e) => onChange?.(e.target.value)}
        style       ={{ height, resize }}
                      className="w-full bg-(--bg-input) border border-(--border) rounded-md px-3 py-2 text-sm
                      text-(--text-primary) placeholder-(--text-muted)
                      focus:outline-none focus:border-(--accent) focus:ring-1 focus:ring-(--accent)
                      disabled:opacity-50 disabled:cursor-not-allowed transition"
      />

      <div className="flex justify-between">
        {hint
          ? <p className="text-xs text-(--text-muted)">{hint}</p>
          : <span />
        }
        {maxLength && (
          <p className="text-xs text-(--text-muted)">
            máx. {maxLength} caracteres
          </p>
        )}
      </div>

    </div>
  )
}