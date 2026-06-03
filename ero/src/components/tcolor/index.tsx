import { useRef } from "react"

interface TColorProps {
    name:      string
    label?:    string
    value?:    string
    width?:    string
    required?: boolean
    disabled?: boolean
    onChange?: (value: string) => void
}

export function TColor({
    name,
    label,
    value    = "#3B82F6",
    width    = "160px",
    required = false,
    disabled = false,
    onChange
}: TColorProps) {

    const inputRef = useRef<HTMLInputElement>(null)

    function openPicker() {
        if (!disabled) inputRef.current?.click()
    }

    return (
        <div className="flex flex-col gap-1" style={{ width }}>
            {label && (
                <label className="text-sm font-medium text-(--text)">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="flex items-center gap-2">
                <input
    ref      ={inputRef}
    type     ="color"
    value    ={value}
    onChange ={(e) => onChange?.(e.target.value)}
    onBlur   ={(e) => onChange?.(e.target.value)}
    className="absolute opacity-0 w-0 h-0 pointer-events-none"
/>

                <input
                    type      ="text"
                    name      ={name}
                    value     ={value}
                    readOnly
                    onClick   ={openPicker}
                    disabled  ={disabled}
                    className ="flex-1 px-2 py-2 text-sm border rounded bg-white border-(--border)
                                cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                    type      ="button"
                    onClick   ={openPicker}
                    disabled  ={disabled}
                    className ="w-8 h-8 rounded border border-(--border) shrink-0 cursor-pointer
                                disabled:opacity-50 disabled:cursor-not-allowed"
                    style     ={{ backgroundColor: value }}
                    title     ={value}
                />
            </div>
        </div>
    )
}