import { useState, useEffect } from "react";
import { api } from "../../services/api";

interface TDbRadioProps {
  name: string;
  label: string;
  url: string;
  valueField: string;
  labelField: string;
  defaultValue?: string;
  disabled?: boolean;
  direction?: "row" | "column";
  hint?: string;
  onChange?: (value: string) => void;
}

export function TDbRadio({
  name,
  label,
  url,
  valueField,
  labelField,
  defaultValue,
  disabled,
  direction = "row",
  hint,
  onChange,
}: TDbRadioProps) {
  const [options, setOptions] = useState<Record<string, unknown>[]>([]);

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
              type="radio"
              name={name}
              value={String(opt[valueField])}
              defaultChecked={defaultValue === String(opt[valueField])}
              disabled={disabled}
              onChange={() => onChange?.(String(opt[valueField]))}
              className="cursor-pointer accent-(--accent)"
            />
            {String(opt[labelField] ?? "")}
          </label>
        ))}
      </div>
      {hint && <p className="text-xs text-(--text-muted)">{hint}</p>}
    </div>
  );
}
