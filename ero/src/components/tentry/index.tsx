// Tipos de máscara disponíveis
type MaskType = "cpf" | "cnpj" | "telefone" | "celular" | "cep" | "data" | "hora" | "moeda"

function applyMask(value: string, mask: MaskType): string {
  const onlyDigits = value.replace(/\D/g, "")

  switch (mask) {
    case "cpf":
      return onlyDigits
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")

    case "cnpj":
      return onlyDigits
        .slice(0, 14)
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2")

    case "telefone":
      return onlyDigits
        .slice(0, 10)
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d{1,4})$/, "$1-$2")

    case "celular":
      return onlyDigits
        .slice(0, 11)
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d{1,4})$/, "$1-$2")

    case "cep":
      return onlyDigits
        .slice(0, 8)
        .replace(/(\d{5})(\d{1,3})$/, "$1-$2")

    case "data":
      return onlyDigits
        .slice(0, 8)
        .replace(/(\d{2})(\d)/, "$1/$2")
        .replace(/(\d{2})(\d{1,4})$/, "$1/$2")

    case "hora":
      return onlyDigits
        .slice(0, 4)
        .replace(/(\d{2})(\d{1,2})$/, "$1:$2")

    case "moeda": {
      const cents = onlyDigits.slice(0, 13)
      const num = parseInt(cents || "0", 10) / 100
      return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    }

    default:
      return value
  }
}

interface TEntryProps {
  name: string
  label: string
  type?: "text" | "email" | "password" | "number" | "date" | "tel" | "hidden"
  placeholder?: string
  required?: boolean
  defaultValue?: string
  disabled?: boolean
  width?: string
  hint?: string
  maxLength?: number
  mask?: MaskType
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
  width = "100%",
  maxLength,
  mask,
  onChange
}: TEntryProps) {

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value

    if (mask) {
      value = applyMask(value, mask)
      e.target.value = value  // atualiza o input visualmente
    }

    onChange?.(value)
  }

  if (type === "hidden") {
    return <input type="hidden" name={name} defaultValue={defaultValue} />
  }

  return (
    <div className="flex flex-col gap-1" style={{ width }}>

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
        maxLength={maxLength}
        onChange={handleChange}
        className="w-full bg-[#0e1116] border border-[#30363d] rounded-md px-3 py-2 text-sm
        text-[#e6edf3] placeholder-[#6e7681]
        focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed transition"
      />

      {hint && <p className="text-xs text-[#6e7681]">{hint}</p>}

    </div>
  )
}