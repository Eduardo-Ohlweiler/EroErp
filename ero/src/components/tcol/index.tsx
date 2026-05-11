interface TColProps {
  children: React.ReactNode
  flex?: number
}

export function TCol({
  children,
  flex = 1
}: TColProps) {

  return (
    <div
      style={{
        flex: `${flex} 1 auto`,
        minWidth: 0
      }}
    >
      {children}
    </div>
  )
}