import { useEffect } from "react"

interface TWindowProps {
    title:      string
    open:       boolean
    onClose:    () => void
    children:   React.ReactNode
    width?:     string
    actions?:   React.ReactNode
}

export function TWindow({
    title,
    open,
    onClose,
    children,
    width   = "600px",
    actions
    }: TWindowProps) {

    // fecha com ESC
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
        if (e.key === "Escape") onClose()
        }
        if (open) document.addEventListener("keydown", handleKey)
        return () => document.removeEventListener("keydown", handleKey)
    }, [open, onClose])

    if (!open) return null

    return (
        <>
        {/* overlay */}
        <div
            className="fixed inset-0 bg-black/50 z-9998"
            onClick={onClose}
        />

        {/* janela */}
        <div
            style={{ width }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            bg-(--bg-surface) border border-(--border) rounded-lg shadow-2xl
            z-9999 flex flex-col max-h-[90vh]"
        >
            {/* header */}
            <div className="flex items-center justify-between px-6 py-4
            border-b border-(--border) shrink-0">
            <h3 className="text-base font-semibold text-(--text-primary)">
                {title}
            </h3>
            <button
                onClick={onClose}
                className="text-(--text-muted) hover:text-(--text-primary) transition text-lg"
            >
                ✕
            </button>
            </div>

            {/* conteúdo com scroll */}
            <div className="flex-1 overflow-y-auto p-6">
            {children}
            </div>

            {/* footer com ações */}
            {actions && (
            <div className="flex justify-end gap-2 px-6 py-4
                border-t border-(--border) shrink-0">
                {actions}
            </div>
            )}
        </div>
        </>
    )
}