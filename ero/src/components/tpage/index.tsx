interface TPageProps {
  title: string
  subtitle?: string
  breadcrumb?: string[]
  children: React.ReactNode
  actions?: React.ReactNode 
}

export function TPage({ title, subtitle, breadcrumb, children, actions }: TPageProps) {
  return (
    <div className="flex flex-col gap-4">
      
      {/* Cabeçalho da página */}
      <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
        <div>
          {breadcrumb && (
            <p className="text-xs text-[#6e7681] mb-1">
              {breadcrumb.join(" › ")}
            </p>
          )}
          <h2 className="text-xl font-semibold text-[#e6edf3]">{title}</h2>
          {subtitle && (
            <p className="text-sm text-[#6e7681] mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>

      {/* Conteúdo */}
      <div>{children}</div>

    </div>
  )
}