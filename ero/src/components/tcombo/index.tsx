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

      <label className="text-sm text-[#9da5b4]">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <select
        name={name}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full bg-[#0e1116] border border-[#30363d] rounded-md px-3 py-2 text-sm
        text-[#e6edf3]
        focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <option value="" disabled className="text-[#6e7681]">
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#0e1116]">
            {opt.label}
          </option>
        ))}
      </select>

      {hint && <p className="text-xs text-[#6e7681]">{hint}</p>}

    </div>
  )
}