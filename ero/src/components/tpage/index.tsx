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

      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div>
          {breadcrumb && (
            <p className="text-xs text-[var(--text-muted)] mb-1">
              {breadcrumb.join(" › ")}
            </p>
          )}
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
          {subtitle && (
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>

      <div>{children}</div>

    </div>
  )
}