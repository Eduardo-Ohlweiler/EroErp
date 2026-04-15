interface TRowProps {
  children: React.ReactNode
  gap?: number
  wrap?: boolean
  align?: "start" | "center" | "end"
}

export function TRow({
  children,
  gap = 4,
  wrap = true,
  align = "start"
}: TRowProps) {
  const alignClass = {
    start: "items-start",
    center: "items-center",
    end: "items-end"
  }[align]

  return (
    <div
      className={`
        flex 
        ${wrap ? "flex-wrap" : ""}
        ${alignClass}
        gap-${gap}
      `}
    >
      {children}
    </div>
  )
}