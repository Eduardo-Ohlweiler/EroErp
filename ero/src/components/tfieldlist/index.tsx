import { useState } from "react"
import { TButton }  from "../tbutton"
import { TEntry }   from "../tentry"
import { TCombo }   from "../tcombo"

type MaskType = "cpf" | "cnpj" | "telefone" | "celular" | "cep" | "data" | "hora" | "moeda" | "numero"

interface ColBase {
    label:  string
    name:   string
    width?: string
}

interface ColEntry extends ColBase {
    component:  "entry"
    mask?:      MaskType
    maxLength?: number
    type?:      "text" | "email" | "password" | "number" | "tel"
}

interface ColCombo extends ColBase {
    component: "combo"
    options:   { value: string; label: string }[]
}

interface ColCheckbox extends ColBase {
    component: "checkbox"
}

interface ColHidden extends ColBase {
    component: "hidden"
}

// render customizado mantido para casos que ainda precisarem
interface ColCustom extends ColBase {
    component: "custom"
    render:    (rowIndex: number, rowData: Record<string, string>, onChange: (field: string, value: string) => void) => React.ReactNode
}

export type TFieldListColumn =
    | ColEntry
    | ColCombo
    | ColCheckbox
    | ColHidden
    | ColCustom

interface TFieldListProps {
    name:         string
    columns:      TFieldListColumn[]
    minRows?:     number
    initialData?: Record<string, string>[]
}


export function TFieldList({ name, columns, minRows = 1, initialData }: TFieldListProps) {

    const [rows, setRows] = useState<Record<string, string>[]>(() => {
        if (initialData && initialData.length > 0)
            return initialData
        return Array.from({ length: minRows }, () => ({}))
    })

    function addRow() {
        setRows(prev => [...prev, {}])
    }

    function removeRow(index: number) {
        if (rows.length <= 1) return
        setRows(prev => prev.filter((_, i) => i !== index))
    }

    function updateField(rowIndex: number, field: string, value: string) {
        setRows(prev => prev.map((row, i) =>
            i === rowIndex ? { ...row, [field]: value } : row
        ))
    }

    function renderCell(col: TFieldListColumn, rowIndex: number, rowData: Record<string, string>) {
        const fieldName = `${name}[${rowIndex}][${col.name}]`
        const value     = rowData[col.name] ?? ""

        switch (col.component) {

            case "entry":
                return (
                    <TEntry
                        name         ={fieldName}
                        label        =""
                        mask         ={col.mask}
                        maxLength    ={col.maxLength}
                        type         ={col.type}
                        defaultValue ={value}
                        width        ="100%"
                        onChange     ={(v) => updateField(rowIndex, col.name, v)}
                    />
                )

            case "combo":
                return (
                    <TCombo
                        name         ={fieldName}
                        label        =""
                        options      ={col.options}
                        defaultValue ={value}
                        width        ="100%"
                        onChange     ={(v) => updateField(rowIndex, col.name, v)}
                    />
                )

            case "checkbox":
                return (
                    <div className="flex justify-center items-center h-full py-1">
                        <input
                            type           ="checkbox"
                            name           ={fieldName}
                            value          ="true"
                            defaultChecked ={value === "true"}
                            onChange       ={(e) => updateField(rowIndex, col.name, e.target.checked ? "true" : "false")}
                            className      ="w-4 h-4 cursor-pointer accent-(--accent)"
                        />
                    </div>
                )

            case "hidden":
                return (
                    <input
                        type         ="hidden"
                        name         ={fieldName}
                        defaultValue ={value}
                    />
                )

            case "custom":
                return col.render(rowIndex, rowData, (field, val) => updateField(rowIndex, field, val))
        }
    }

    const visibleColumns = columns.filter(c => c.component !== "hidden")
    const hiddenColumns  = columns.filter(c => c.component === "hidden")

    return (
        <div className="flex flex-col gap-2">

            <div className="w-full overflow-x-auto rounded-lg border border-(--border)">
                <table className="w-full text-sm">

                    <thead>
                        <tr className="bg-(--metal-700) border-b border-(--border)">
                            <th className="px-3 py-2 text-center text-(--text-inverse) w-10">
                                #
                            </th>
                            {visibleColumns.map((col) => (
                                <th
                                    key       ={col.name}
                                    style     ={{ width: col.width }}
                                    className ="px-3 py-2 text-left text-(--text-inverse) font-medium"
                                >
                                    {col.label}
                                </th>
                            ))}
                            <th className="px-3 py-2 w-12.5" />
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((rowData, rowIndex) => (
                            <tr
                                key       ={rowIndex}
                                className ={`border-b border-(--border)
                                    ${rowIndex % 2 === 0 ? "bg-(--bg-surface)" : "bg-(--bg-base)"}`}
                            >
                                <td className="px-3 py-2 text-center text-(--text-muted) text-xs">
                                    {rowIndex + 1}
                                </td>

                                {hiddenColumns.map(col => (
                                    <td key={col.name} style={{ display: "none" }}>
                                        {renderCell(col, rowIndex, rowData)}
                                    </td>
                                ))}

                                {visibleColumns.map((col) => (
                                    <td key={col.name} className="px-2 py-1.5 align-middle">
                                        {renderCell(col, rowIndex, rowData)}
                                    </td>
                                ))}

                                <td className="px-2 py-1.5 text-center align-middle">
                                    <button
                                        type      ="button"
                                        onClick   ={() => removeRow(rowIndex)}
                                        disabled  ={rows.length <= 1}
                                        className ="text-(--danger) hover:text-(--danger-hover)
                                            disabled:opacity-30 disabled:cursor-not-allowed transition"
                                        title="Remover linha"
                                    >
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>

            <div>
                <TButton
                    label   ="+ Adicionar linha"
                    variant ="secondary"
                    type    ="button"
                    onClick ={addRow}
                />
            </div>

        </div>
    )
}