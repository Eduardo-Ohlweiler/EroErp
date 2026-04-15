// components/adianti/TEntry.tsx
interface TEntryProps {
  name: string
  label: string
  type?: "text" | "email" | "password" | "number" | "date" | "tel"
  placeholder?: string
  required?: boolean
  defaultValue?: string
  disabled?: boolean
  hint?: string          // texto de ajuda abaixo do campo
  colSpan?: 1 | 2 | 3   // para ocupar mais colunas no grid
  onChange?: (value: string) => void
}

export function TEntry({
  name,
  label,
  type = "text",
  placeholder,
  required,
  defaultValue,
  disabled,
  hint,
  colSpan,
  onChange
}: TEntryProps) {

  const spanClass = colSpan ? `col-span-${colSpan}` : ""

  return (
    <div className={`flex flex-col gap-1 ${spanClass}`}>

      <label className="text-sm text-[#9da5b4]">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="bg-[#0e1116] border border-[#30363d] rounded-md px-3 py-2 text-sm
        text-[#e6edf3] placeholder-[#6e7681]
        focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        transition"
      />

      {hint && (
        <p className="text-xs text-[#6e7681]">{hint}</p>
      )}

    </div>
  )
}