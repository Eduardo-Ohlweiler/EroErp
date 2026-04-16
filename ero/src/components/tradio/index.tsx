interface TRadioOption {
  label: string
  value: string
}

interface TRadioProps {
  name: string
  label: string
  options: TRadioOption[]
  defaultValue?: string
  disabled?: boolean
  direction?: "row" | "column"
  hint?: string
  onChange?: (value: string) => void
}

export function TRadio({
  name,
  label,
  options,
  defaultValue,
  disabled,
  direction = "row",
  hint,
  onChange
}: TRadioProps) {
  return (
    <div className="flex flex-col gap-1">

      <span className="text-sm text-[#9da5b4]">{label}</span>

      <div className={`flex gap-4 ${direction === "column" ? "flex-col" : "flex-row flex-wrap"}`}>
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-center gap-2 cursor-pointer select-none text-sm text-[#9da5b4]
              ${disabled ? "opacity-50 cursor-not-allowed" : "hover:text-[#e6edf3]"}`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              defaultChecked={defaultValue === opt.value}
              disabled={disabled}
              onChange={() => onChange?.(opt.value)}
              className="accent-blue-500 cursor-pointer"
            />
            {opt.label}
          </label>
        ))}
      </div>

      {hint && <p className="text-xs text-[#6e7681]">{hint}</p>}

    </div>
  )
}