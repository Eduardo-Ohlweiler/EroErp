interface TComboOption {
  label: string
  value: string
}

interface TComboProps {
  name: string
  label: string
  options: TComboOption[]
  placeholder?: string
  defaultValue?: string
  required?: boolean
  disabled?: boolean
  width?: string
  hint?: string
  onChange?: (value: string) => void
}

export function TCombo({
  name,
  label,
  options,
  placeholder = "Selecione...",
  defaultValue,
  required,
  disabled,
  width = "100%",
  hint,
  onChange
}: TComboProps) {
  return (
    <div className="flex flex-col gap-1" style={{ width }}>

      <label className="text-sm text-[var(--text-secondary)]">
        {label}
        {required && <span className="text-[var(--danger)] ml-1">*</span>}
      </label>

      <select
        name={name}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-md px-3 py-2 text-sm
        text-[var(--text-primary)]
        focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]
        disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <option value="" disabled className="text-[var(--text-muted)]">
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[var(--bg-input)]">
            {opt.label}
          </option>
        ))}
      </select>

      {hint && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}

    </div>
  )
}