import { useRef, useEffect, useState, useCallback } from "react"

interface Props {
    onChange?: (data: string) => void
    strokeData?: string
    disabled?: boolean
}

export function TAssinaturaCanvas({ onChange, strokeData, disabled = false }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [strokes, setStrokes] = useState<number[][][]>([])
    const [drawing, setDrawing] = useState(false)
    const currentStroke = useRef<number[][]>([])

    // Carrega strokeData existente
    useEffect(() => {
        if (strokeData) {
            try {
                const parsed = JSON.parse(strokeData) as number[][][]
                setStrokes(parsed)
            } catch { /* ignore */ }
        }
    }, [strokeData])

    // Redesenha sempre que strokes muda
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = "#111"
        ctx.lineWidth = 2
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        strokes.forEach(stroke => {
            if (stroke.length < 2) return
            ctx.beginPath()
            ctx.moveTo(stroke[0][0], stroke[0][1])
            stroke.slice(1).forEach(([x, y]) => ctx.lineTo(x, y))
            ctx.stroke()
        })
    }, [strokes])

    const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        if ("touches" in e) {
            const touch = e.touches[0]
            return [(touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY]
        }
        const m = e as React.MouseEvent
        return [(m.clientX - rect.left) * scaleX, (m.clientY - rect.top) * scaleY]
    }

    const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return
        e.preventDefault()
        const canvas = canvasRef.current
        if (!canvas) return
        setDrawing(true)
        const pos = getPos(e, canvas)
        currentStroke.current = [pos]
    }, [disabled]) // eslint-disable-line

    const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!drawing || disabled) return
        e.preventDefault()
        const canvas = canvasRef.current
        if (!canvas) return
        const pos = getPos(e, canvas)
        currentStroke.current.push(pos)

        // Desenha incrementalmente
        const ctx = canvas.getContext("2d")
        if (!ctx || currentStroke.current.length < 2) return
        const pts = currentStroke.current
        ctx.strokeStyle = "#111"
        ctx.lineWidth = 2
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.beginPath()
        ctx.moveTo(pts[pts.length - 2][0], pts[pts.length - 2][1])
        ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1])
        ctx.stroke()
    }, [drawing, disabled])

    const endDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!drawing || disabled) return
        e.preventDefault()
        setDrawing(false)
        if (currentStroke.current.length > 1) {
            const newStrokes = [...strokes, currentStroke.current]
            setStrokes(newStrokes)
            onChange?.(JSON.stringify(newStrokes))
        }
        currentStroke.current = []
    }, [drawing, disabled, strokes, onChange])

    function limpar() {
        setStrokes([])
        onChange?.(JSON.stringify([]))
        const canvas = canvasRef.current
        if (canvas) {
            const ctx = canvas.getContext("2d")
            ctx?.clearRect(0, 0, canvas.width, canvas.height)
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="border border-(--border) rounded-lg overflow-hidden bg-white">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={220}
                    style={{ width: "100%", height: "220px", display: "block", cursor: disabled ? "default" : "crosshair" }}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                />
            </div>
            {!disabled && (
                <button
                    type="button"
                    onClick={limpar}
                    className="text-sm text-(--text-secondary) underline self-start hover:text-(--text-primary)"
                >
                    Limpar assinatura
                </button>
            )}
        </div>
    )
}
