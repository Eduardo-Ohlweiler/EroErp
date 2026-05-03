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
  height?:        string;
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
  direction = "column",
  height    = "200px",
  hint,
  onChange,
}: TDbCheckboxProps) {

  const [options,  setOptions]  = useState<Record<string, unknown>[]>([])
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    setSelected(defaultValues)
  }, [defaultValues])

  useEffect(() => {
    api.get(url)
      .then((response) => {
        const data = response.data
        setOptions(Array.isArray(data) ? data : data.content ?? [])
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
    <div className="flex flex-col gap-1" style={direction === "column" ? { display: "inline-flex" } : undefined}>

      <span className="text-sm text-(--text-secondary)">{label}</span>

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
              key       ={value}
              className ={`flex items-center gap-2 cursor-pointer select-none text-sm text-(--text-secondary) mb-2
                ${disabled ? "opacity-50 cursor-not-allowed" : "hover:text-(--text-primary)"}`}
            >
              <input
                type     ="checkbox"
                name     ={name}
                value    ={value}
                checked  ={selected.includes(value)}
                disabled ={disabled}
                onChange ={(e) => handleChange(value, e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-(--accent)"
              />
              {String(opt[labelField])}
            </label>
          )
        })}
      </div>

      <input
        type ="hidden"
        name ={name}
        value={selected.join(",")}
      />

      {hint && <p className="text-xs text-(--text-muted)">{hint}</p>}

    </div>
  )
}