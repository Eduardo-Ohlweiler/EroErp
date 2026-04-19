import { useState, useEffect } from "react";
import { api } from "../../services/api";

interface TDbCheckboxProps {
  name:           string;
  label:          string;
  url:            string;
  valueField:     string;
  labelField:     string;
  defaultValues?: string[];
  disabled?:      boolean;
  direction?:     "row" | "column";
  hint?:          string;
  onChange?:      (values: string[]) => void;
}

export function TDbCheckbox({
  name,
  label,
  url,
  valueField,
  labelField,
  defaultValues = [],
  disabled,
  direction = "row",
  hint,
  onChange,
}: TDbCheckboxProps) {

  const [options,  setOptions]  = useState<Record<string, unknown>[]>([])
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    setSelected(defaultValues)
  }, [defaultValues])

  useEffect(() => {
    api.get(`${url}?size=100`)
      .then((response) => {
        setOptions(response.data.content ?? response.data)
      })
      .catch(() => setOptions([]))
  }, [url])

  function handleChange(value: string, checked: boolean) {
    const next = checked
      ? [...selected, value]
      : selected.filter((v) => v !== value)

    setSelected(next)
    onChange?.(next)
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-(--text-secondary)">{label}</span>

      <div className={`flex gap-4 ${direction === "column" ? "flex-col ml-3" : "flex-row flex-wrap"}`}>
        {options.map((opt) => {
          const value = String(opt[valueField])

          return (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type    ="checkbox"
                name    ={name}
                value   ={value}
                checked ={selected.includes(value)}
                disabled={disabled}
                onChange={(e) => handleChange(value, e.target.checked)}
              />
              {String(opt[labelField])}
            </label>
          )
        })}
      </div>
      <input
        type="hidden"
        name={name}
        value={selected.join(",")}
      />
      {hint && <p className="text-xs text-(--text-muted)">{hint}</p>}
    </div>
  )
}
