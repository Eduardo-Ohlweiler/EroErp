interface TCheckboxProps {
  name: string
  label: string
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  hint?: string
  onChange?: (checked: boolean) => void
}

export function TCheckbox({
  name,
  label,
  checked,
  defaultChecked,
  disabled,
  hint,
  onChange
}: TCheckboxProps) {
  return (
    <div className="flex flex-col gap-1">

      <label className={`flex items-center gap-2 cursor-pointer select-none
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input
          type="checkbox"
          name={name}
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className="w-4 h-4 rounded border-[#30363d] bg-[#0e1116]
          accent-blue-500 cursor-pointer"
        />
        <span className="text-sm text-[#9da5b4]">{label}</span>
      </label>

      {hint && <p className="text-xs text-[#6e7681] ml-6">{hint}</p>}

    </div>
  )
}