import { useState } from "react"

type MaskType = "cpf" | "cnpj" | "telefone" | "celular" | "cep" | "data" | "hora" | "moeda" | "numero"

function applyMask(value: string, mask: MaskType): string {
  const onlyDigits = value.replace(/\D/g, "")

  switch (mask) {
    case "numero":
      return onlyDigits
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

    case "hora":
      return onlyDigits.slice(0, 4)
        .replace(/(\d{2})(\d{1,2})$/, "$1:$2")

    // data: exibe DD/MM/YYYY mas armazena YYYY-MM-DD
    case "data":
      return onlyDigits.slice(0, 8)
        .replace(/(\d{2})(\d)/, "$1/$2")
        .replace(/(\d{2})(\d{1,4})$/, "$1/$2")

    // moeda: exibe R$ 1.234,56 mas armazena 1234.56
    case "moeda": {
      const cents = onlyDigits.slice(0, 13)
      const num   = parseInt(cents || "0", 10) / 100
      return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    }

    default:
      return value
  }
}

function getRawValue(masked: string, mask: MaskType): string {
  switch (mask) {
    // apenas dígitos
    case "cpf":
    case "cnpj":
    case "telefone":
    case "celular":
    case "cep":
    case "numero":
      return masked.replace(/\D/g, "")

    // hora: envia HH:mm
    case "hora": {
      const digits = masked.replace(/\D/g, "")
      if (digits.length === 4) {
        return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`
      }
      return masked
    }


    // data: converte DD/MM/YYYY → YYYY-MM-DD
    case "data": {
      const digits = masked.replace(/\D/g, "")
      if (digits.length === 8) {
        const dd   = digits.slice(0, 2)
        const mm   = digits.slice(2, 4)
        const yyyy = digits.slice(4, 8)
        return `${yyyy}-${mm}-${dd}`
      }
      return digits
    }

    // moeda: converte R$ 1.234,56 → 1234.56
    case "moeda": {
      const digits = masked.replace(/\D/g, "")
      const num    = parseInt(digits || "0", 10) / 100
      return num.toFixed(2)
    }

    default:
      return masked
  }
}

// converte valor do backend para display
function toDisplay(value: string, mask: MaskType): string {
  switch (mask) {
    // data: recebe YYYY-MM-DD → exibe DD/MM/YYYY
    case "data": {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [yyyy, mm, dd] = value.split("-")
        return `${dd}/${mm}/${yyyy}`
      }
      return applyMask(value, mask)
    }

    // moeda: recebe 1234.56 → exibe R$ 1.234,56
    case "moeda": {
      const num = parseFloat(value)
      if (!isNaN(num)) {
        return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      }
      return applyMask(value, mask)
    }

    // demais: aplica máscara normalmente
    default:
      return applyMask(value, mask)
  }
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
    ? toDisplay(defaultValue, mask)
    : defaultValue ?? ""

  const initialRaw = defaultValue && mask
    ? getRawValue(toDisplay(defaultValue, mask), mask)
    : defaultValue ?? ""

  const [displayValue, setDisplayValue] = useState(initialDisplay)
  const [rawValue,     setRawValue]     = useState(initialRaw)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value

    if (mask) {
      const masked    = applyMask(value, mask)
      const raw       = getRawValue(masked, mask)
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
        className={`w-full border rounded-md px-3 py-2 text-sm
                      focus:outline-none focus:ring-1 transition
                      disabled:cursor-not-allowed
                      ${disabled
                        ? "bg-(--metal-200) border-(--border) text-(--text-muted) focus:border-(--border) focus:ring-0"
                        : "bg-(--bg-input) border-(--border) text-(--text-primary) placeholder-(--text-muted) focus:border-(--accent) focus:ring-(--accent)"
                  }`}
      />

      {/* envia o valor correto para o backend */}
      <input
        type  ="hidden"
        name  ={name}
        value ={mask ? rawValue : displayValue}
      />

      {hint && <p className="text-xs text-(--text-muted)">{hint}</p>}

    </div>
  )
}