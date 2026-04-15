interface TColProps {
  children: React.ReactNode
  flex?: number
}

export function TCol({ children, flex = 1 }: TColProps) {
  return (
    <div style={{ flex }}>
      {children}
    </div>
  )
}