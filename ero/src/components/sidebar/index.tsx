import { useState, useRef } from "react"
import { Link, useLocation } from "react-router-dom"
import { menu } from "../../config/menu"
import type { MenuItem } from "../../types/MenuItem"

interface SideBarProps {
  collapsed: boolean
}

export default function Sidebar({ collapsed }: SideBarProps) {

  const location              = useLocation()
  const [open, setOpen]       = useState<Record<string, boolean>>({})
  const [hovered, setHovered] = useState<string | null>(null)
  const closeTimeout          = useRef<ReturnType<typeof setTimeout> | null>(null)

  function toggle(label: string) {
    setOpen((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  function isActive(path?: string) {
    if (!path) 
      return false
    return location.pathname.startsWith(path)
  }

  function handleMouseEnter(label: string) {
    if (closeTimeout.current) 
      clearTimeout(closeTimeout.current)
    setHovered(label)
  }

  function handleMouseLeave() {
    closeTimeout.current = setTimeout(() => setHovered(null), 400)
  }

  function renderMenu(items: MenuItem[], level = 0): React.ReactNode {
    return items.map((item) => {
      const padding = level > 0 ? "ml-5" : ""
      const Icon = item.icon

      if (item.children && item.children.length > 0) {
        return (
          <div
            key={item.label}
            className="relative"
            onMouseEnter={() => collapsed && handleMouseEnter(item.label)}
            onMouseLeave={() => collapsed && handleMouseLeave()}
          >
            <button
              onClick={() => !collapsed && toggle(item.label)}
              title={collapsed ? item.label : ""}
              className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition
                text-[var(--text-sidebar)] hover:text-[var(--text-sidebar-active)] hover:bg-[var(--bg-hover)] ${padding}`}
            >
              <div className="flex items-center gap-3">
                {Icon && <Icon size={18} />}
                {!collapsed && item.label}
              </div>
              {!collapsed && (
                <span className={`text-xs transition-transform ${open[item.label] ? "rotate-90" : ""}`}>
                  &gt;
                </span>
              )}
            </button>

            {/* submenu normal */}
            {!collapsed && open[item.label] && (
              <div className="mt-1 space-y-1 border-l border-[var(--border)] ml-3 pl-3">
                {renderMenu(item.children, level + 1)}
              </div>
            )}

            {/* flyout */}
            {collapsed && hovered === item.label && (
              <div
                onMouseEnter={() => handleMouseEnter(item.label)}
                onMouseLeave={() => handleMouseLeave()}
                className="absolute left-full top-0 ml-2 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-md shadow-xl p-2 min-w-[220px] z-50"
              >
                {item.children.map((child) => {
                  const ChildIcon = child.icon

                  if (child.children && child.children.length > 0) {
                    return (
                      <div key={child.label} className="border-t border-[var(--border)] mt-1 pt-1">
                        <div className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-sidebar-active)]">
                          {ChildIcon && <ChildIcon size={16} />}
                          {child.label}
                        </div>
                        {child.children.map((sub) => {
                          const SubIcon = sub.icon
                          return (
                            <Link
                              key={sub.label}
                              to={sub.path || "#"}
                              className="flex items-center gap-3 px-6 py-2 text-sm rounded-md
                                text-[var(--text-sidebar)] hover:text-[var(--text-sidebar-active)] hover:bg-[var(--bg-hover)]"
                            >
                              {SubIcon && <SubIcon size={14} />}
                              {sub.label}
                            </Link>
                          )
                        })}
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={child.label}
                      to={child.path || "#"}
                      className="flex items-center gap-3 px-3 py-2 text-sm rounded-md
                        text-[var(--text-sidebar)] hover:text-[var(--text-sidebar-active)] hover:bg-[var(--bg-hover)]"
                    >
                      {ChildIcon && <ChildIcon size={16} />}
                      {child.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      }

      if (item.path) {
        const active = isActive(item.path)
        return (
          <div
            key={item.label}
            className="relative"
            onMouseEnter={() => collapsed && handleMouseEnter(item.label)}
            onMouseLeave={() => collapsed && handleMouseLeave()}
          >
            <Link
              to={item.path}
              title={collapsed ? item.label : ""}
              className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition ${padding}
                ${active
                  ? "bg-[var(--accent)] text-[var(--text-inverse)]"
                  : "text-[var(--text-sidebar)] hover:text-[var(--text-sidebar-active)] hover:bg-[var(--bg-hover)]"
                }`}
            >
              {Icon && <Icon size={18} />}
              {!collapsed && item.label}
            </Link>

            {/* tooltip */}
            {collapsed && hovered === item.label && (
              <div
                onMouseEnter={() => handleMouseEnter(item.label)}
                onMouseLeave={() => handleMouseLeave()}
                className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-sidebar-active)] shadow-lg whitespace-nowrap z-50"
              >
                {item.label}
              </div>
            )}
          </div>
        )
      }

      return null
    })
  }

  return (
    <aside
      className={`${collapsed ? "w-16" : "w-64"} 
        bg-[var(--bg-sidebar)] text-[var(--text-sidebar)] min-h-screen flex flex-col 
        border-r border-[var(--border-strong)] transition-all duration-300`}
    >
      {/* LOGO */}
      <div className="px-4 py-5 text-lg font-semibold tracking-wide border-b border-[var(--border-strong)] text-[var(--text-inverse)] flex justify-center">
        {collapsed ? "Ero" : "EroErp"}
      </div>

      {/* MENU */}
      <nav className="flex-1 p-3 space-y-1 overflow-visible">
        {renderMenu(menu)}
      </nav>

      {/* FOOTER */}
      {!collapsed && (
        <div className="flex justify-center p-4 text-xs text-[var(--text-muted)] border-t border-[var(--border-strong)]">
          EroErp
        </div>
      )}
    </aside>
  )
}