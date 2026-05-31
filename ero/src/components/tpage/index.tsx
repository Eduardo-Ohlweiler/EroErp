interface TPageProps {
  title:        string
  subtitle?:    string
  breadcrumb?:  string[]
  children:     React.ReactNode
  actions?:     React.ReactNode
}

export function TPage({ title, subtitle, breadcrumb, children, actions }: TPageProps) {
  return (
    <div className="flex flex-col gap-4">

      <div className="flex flex-col gap-2 border-b border-(--border) pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {breadcrumb && (
            <p className="text-xs text-(--text-muted) mb-1 truncate">
              {breadcrumb.join(" › ")}
            </p>
          )}
          <h2 className="text-xl font-semibold text-(--text-primary) wrap-break-word">{title}</h2>
          {subtitle && (
            <p className="text-sm text-(--text-muted) mt-0.5 wrap-break-word">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex gap-2 flex-wrap shrink-0">
            {actions}
          </div>
        )}
      </div>

      <div>{children}</div>

    </div>
  )
}