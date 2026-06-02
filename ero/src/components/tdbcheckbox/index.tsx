import { useEffect, useState } from "react";
import { api } from "../../services/api";

interface TDbCheckboxProps {
  name:      string;
  label:     string;
  url:       string;
  valueField: string;
  labelField: string;
  values:    string[];                    // ← controlado, sem default
  disabled?: boolean;
  direction?: "row" | "column";
  height?:   string;
  hint?:     string;
  required?: boolean;
  onChange:  (values: string[]) => void; // ← obrigatório
}

export function TDbCheckbox({
  name, label, url, valueField, labelField,
  values, disabled, direction = "column",
  height = "200px", hint, required, onChange,
}: TDbCheckboxProps) {

  const [options, setOptions] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    api.get(url)
      .then((r) => {
        const data = r.data
        setOptions(Array.isArray(data) ? data : data.content ?? [])
      })
      .catch(() => setOptions([]))
  }, [url])

  function handleChange(value: string, checked: boolean) {
    onChange(checked ? [...values, value] : values.filter((v) => v !== value))
  }

  return (
    <div className="flex flex-col gap-1" style={direction === "column" ? { display: "inline-flex" } : undefined}>
      <label className="text-sm text-(--text-secondary)">
        {label}
        {required && <span className="text-(--danger) ml-1">*</span>}
      </label>
      <div
        className={direction === "column"
          ? "ml-3 overflow-y-auto pr-2 border border-(--border) rounded-md p-2"
          : "flex flex-row flex-wrap gap-4"
        }
        style={direction === "column" ? { height, width: "fit-content", minWidth: "150px" } : undefined}
      >
        {options.map((opt) => {
          const value = String(opt[valueField])
          return (
            <label
              key={value}
              className={`flex items-center gap-2 cursor-pointer select-none text-sm text-(--text-secondary) mb-2
                ${disabled ? "opacity-50 cursor-not-allowed" : "hover:text-(--text-primary)"}`}
            >
              <input
                type="checkbox"
                name={`${name}_visual`}
                value={value}
                checked={values.includes(value)}
                disabled={disabled}
                onChange={(e) => handleChange(value, e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-(--accent)"
              />
              {String(opt[labelField])}
            </label>
          )
        })}
      </div>
      <input type="hidden" name={name} value={values.join(",")} />
      {hint && <p className="text-xs text-(--text-muted)">{hint}</p>}
    </div>
  )
}