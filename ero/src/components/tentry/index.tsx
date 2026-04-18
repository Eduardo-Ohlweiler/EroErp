import { useState } from "react"

type MaskType = "cpf" | "cnpj" | "telefone" | "celular" | "cep" | "data" | "hora" | "moeda"

function applyMask(value: string, mask: MaskType): string {
  const onlyDigits = value.replace(/\D/g, "")

  switch (mask) {
    case "cpf":
      return onlyDigits.slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")

    case "cnpj":
      return onlyDigits.slice(0, 14)
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2")

    case "telefone":
      return onlyDigits.slice(0, 10)
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d{1,4})$/, "$1-$2")

    case "celular":
      return onlyDigits.slice(0, 11)
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d{1,4})$/, "$1-$2")

    case "cep":
      return onlyDigits.slice(0, 8)
        .replace(/(\d{5})(\d{1,3})$/, "$1-$2")

    case "data":
      return onlyDigits.slice(0, 8)
        .replace(/(\d{2})(\d)/, "$1/$2")
        .replace(/(\d{2})(\d{1,4})$/, "$1/$2")

    case "hora":
      return onlyDigits.slice(0, 4)
        .replace(/(\d{2})(\d{1,2})$/, "$1:$2")

    case "moeda": {
      const cents = onlyDigits.slice(0, 13)
      const num   = parseInt(cents || "0", 10) / 100
      return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    }

    default:
      return value
  }
}

function removeMask(value: string): string {
  return value.replace(/\D/g, "")
}

interface TEntryProps {
  name:          string
  label:         string
  type?:         "text" | "email" | "password" | "number" | "date" | "tel" | "hidden"
  placeholder?:  string
  required?:     boolean
  defaultValue?: string
  disabled?:     boolean
  width?:        string
  hint?:         string
  maxLength?:    number
  mask?:         MaskType
  onChange?:     (value: string) => void
}

export function TEntry({
  name,
  label,
  type         = "text",
  placeholder,
  required,
  defaultValue,
  disabled,
  hint,
  width        = "100%",
  maxLength,
  mask,
  onChange
}: TEntryProps) {

  const initialDisplay = defaultValue && mask
    ? applyMask(defaultValue, mask)
    : defaultValue ?? ""

  const [displayValue, setDisplayValue] = useState(initialDisplay)
  const [rawValue,     setRawValue]     = useState(
    defaultValue ? removeMask(defaultValue) : ""
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value

    if (mask) {
      const masked    = applyMask(value, mask)
      const raw       = removeMask(masked)
      e.target.value  = masked
      setDisplayValue(masked)
      setRawValue(raw)
      onChange?.(raw)
    } else {
      setDisplayValue(value)
      setRawValue(value)
      onChange?.(value)
    }
  }

  if (type === "hidden") {
    return <input type="hidden" name={name} defaultValue={defaultValue} />
  }

  return (
    <div className="flex flex-col gap-1" style={{ width }}>

      <label className="text-sm text-(--text-secondary)">
        {label}
        {required && <span className="text-(--danger) ml-1">*</span>}
      </label>

      <input
        type        ={type}
        placeholder ={placeholder}
        required    ={required}
        disabled    ={disabled}
        maxLength   ={maxLength}
        value       ={displayValue}
        onChange    ={handleChange}
        className   ="w-full bg-(--bg-input) border border-(--border) rounded-md px-3 py-2 text-sm
                      text-(--text-primary) placeholder-(--text-muted)
                      focus:outline-none focus:border-(--accent) focus:ring-1 focus:ring-(--accent)
                      disabled:opacity-50 disabled:cursor-not-allowed transition"
      />

      <input
        type="hidden"
        name={name}
        value={mask ? rawValue : displayValue}
      />

      {hint && <p className="text-xs text-(--text-muted)">{hint}</p>}

    </div>
  )
}