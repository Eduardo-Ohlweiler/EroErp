import { useState } from "react"
import { TButton } from "../tbutton"

interface TFieldListColumn {
    label:     string
    name:      string
    width?:    string
    render?:   (rowIndex: number) => React.ReactNode
}

interface TFieldListProps {
    name:      string
    columns:   TFieldListColumn[]
    minRows?:  number
}

export function TFieldList({ name, columns, minRows = 1 }: TFieldListProps) {

    const [rows, setRows] = useState(() =>
        Array.from({ length: minRows }, (_, i) => i)
    )

    function addRow() {
        setRows((prev) => [...prev, prev.length > 0 ? prev[prev.length - 1] + 1 : 0])
    }

    function removeRow(index: number) {
        if (rows.length <= 1) return
        setRows((prev) => prev.filter((_, i) => i !== index))
    }

    return (
        <div className="flex flex-col gap-2">

        {/* tabela */}
        <div className="w-full overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">

            {/* cabeçalho */}
            <thead>
                <tr className="bg-[var(--metal-700)] border-b border-[var(--border)]">
                <th className="px-3 py-2 text-center text-[var(--text-inverse)] w-[40px]">
                    #
                </th>
                {columns.map((col) => (
                    <th
                    key       ={col.name}
                    style     ={{ width: col.width }}
                    className ="px-3 py-2 text-left text-[var(--text-inverse)] font-medium"
                    >
                    {col.label}
                    </th>
                ))}
                <th className="px-3 py-2 w-[50px]" />
                </tr>
            </thead>

            {/* linhas */}
            <tbody>
                {rows.map((rowId, rowIndex) => (
                <tr
                    key       ={rowId}
                    className ={`border-b border-[var(--border)]
                    ${rowIndex % 2 === 0 ? "bg-[var(--bg-surface)]" : "bg-[var(--bg-base)]"}`}
                >
                    {/* número da linha */}
                    <td className="px-3 py-2 text-center text-[var(--text-muted)] text-xs">
                    {rowIndex + 1}
                    </td>

                    {/* células */}
                    {columns.map((col) => (
                    <td key={col.name} className="px-2 py-1.5">
                        {col.render
                        ? col.render(rowIndex)
                        : (
                            <input
                            name      ={`${name}[${rowIndex}][${col.name}]`}
                            className ="w-full bg-[var(--bg-input)] border border-[var(--border)]
                                rounded px-2 py-1.5 text-sm text-[var(--text-primary)]
                                focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]
                                transition"
                            />
                        )
                        }
                    </td>
                    ))}

                    {/* botão remover */}
                    <td className="px-2 py-1.5 text-center">
                    <button
                        type      ="button"
                        onClick   ={() => removeRow(rowIndex)}
                        disabled  ={rows.length <= 1}
                        className ="text-[var(--danger)] hover:text-[var(--danger-hover)]
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

        {/* botão adicionar linha */}
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