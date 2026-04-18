import { useState, useEffect } from "react";
import { api } from "../../services/api";

interface TDbCheckboxProps {
  name: string;
  label: string;
  url: string;
  valueField: string;
  labelField: string;
  defaultValues?: string[];
  disabled?: boolean;
  direction?: "row" | "column";
  hint?: string;
  onChange?: (values: string[]) => void;
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
  const [options, setOptions] = useState<Record<string, unknown>[]>([]);
  const [selected, setSelected] = useState<string[]>(defaultValues);

  useEffect(() => {
    let cancelled = false;

    api
      .get(`${url}?size=100`)
      .then((response) => {
        if (!cancelled) setOptions(response.data.content ?? response.data);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  function handleChange(value: string, checked: boolean) {
    const next = checked
      ? [...selected, value]
      : selected.filter((v) => v !== value);
    setSelected(next);
    onChange?.(next);
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-(--text-secondary)">{label}</span>
      <div
        className={`flex gap-4 ${direction === "column" ? "flex-col ml-3" : "flex-row flex-wrap"}`}
      >
        {options.map((opt) => (
          <label
            key={String(opt[valueField])}
            className={`flex items-center gap-2 cursor-pointer select-none text-sm text-(--text-secondary)
              ${disabled ? "opacity-50 cursor-not-allowed" : "hover:text-(--text-primary)"}`}
          >
            <input
              type="checkbox"
              name={name}
              value={String(opt[valueField])}
              defaultChecked={defaultValues.includes(String(opt[valueField]))}
              disabled={disabled}
              onChange={(e) =>
                handleChange(String(opt[valueField]), e.target.checked)
              }
              className="w-4 h-4 cursor-pointer accent-(--accent)"
            />
            {String(opt[labelField] ?? "")}
          </label>
        ))}
      </div>
      {hint && <p className="text-xs text-(--text-muted)">{hint}</p>}
    </div>
  );
}
