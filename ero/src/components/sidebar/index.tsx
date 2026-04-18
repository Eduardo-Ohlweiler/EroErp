import { useState, useRef } from "react"
import { Link, useLocation } from "react-router-dom"
import { menu } from "../../config/menu"
import { useAuth } from "../../hooks/useAuth"
import type { MenuItem } from "../../types/MenuItem"

interface SideBarProps {
  collapsed: boolean
}

export default function Sidebar({ collapsed }: SideBarProps) {

  const location              = useLocation()
  const { hasRole }           = useAuth()
  const [open, setOpen]       = useState<Record<string, boolean>>({})
  const [hovered, setHovered] = useState<string | null>(null)
  const closeTimeout          = useRef<ReturnType<typeof setTimeout> | null>(null)

  function toggle(label: string) {
    setOpen((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  function isActive(path?: string) {
    if (!path) return false
    return location.pathname.startsWith(path)
  }

  function handleMouseEnter(label: string) {
    if (closeTimeout.current) clearTimeout(closeTimeout.current)
    setHovered(label)
  }

  function handleMouseLeave() {
    closeTimeout.current = setTimeout(() => setHovered(null), 400)
  }

  function temAcesso(item: MenuItem): boolean {
    if (!item.roles || item.roles.length === 0) return true
    return item.roles.some((role) => hasRole(role))
  }

  function filtrarMenu(items: MenuItem[]): MenuItem[] {
    return items
      .filter(temAcesso)
      .map((item) => ({
        ...item,
        children: item.children ? filtrarMenu(item.children) : undefined
      }))
  }

  function renderMenu(items: MenuItem[], level = 0): React.ReactNode {
    return filtrarMenu(items).map((item) => {
      const padding = level > 0 ? "ml-5" : ""
      const Icon    = item.icon

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
                text-(--text-sidebar) hover:text-(--text-sidebar-active) hover:bg-(--bg-hover) ${padding}`}
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
              <div className="mt-1 space-y-1 border-l border-(--border) ml-3 pl-3">
                {renderMenu(item.children, level + 1)}
              </div>
            )}

            {collapsed && hovered === item.label && (
              <div
                onMouseEnter={() => handleMouseEnter(item.label)}
                onMouseLeave={() => handleMouseLeave()}
                className="absolute left-full top-0 ml-2 bg-(--bg-sidebar) border border-(--border) rounded-md shadow-xl p-2 min-w-220px z-50"
              >
                {item.children.map((child) => {
                  const ChildIcon = child.icon

                  if (child.children && child.children.length > 0) {
                    return (
                      <div key={child.label} className="border-t border-(--border) mt-1 pt-1">
                        <div className="flex items-center gap-3 px-3 py-2 text-sm text-(--text-sidebar-active)">
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
                                text-(--text-sidebar) hover:text-(--text-sidebar-active) hover:bg-(--bg-hover)"
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
                        text-(--text-sidebar) hover:text-(--text-sidebar-active) hover:bg-(--bg-hover)"
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
                  ? "bg-(--accent) text-(--text-inverse)"
                  : "text-(--text-sidebar) hover:text-(--text-sidebar-active) hover:bg-(--bg-hover)"
                }`}
            >
              {Icon && <Icon size={18} />}
              {!collapsed && item.label}
            </Link>

            {collapsed && hovered === item.label && (
              <div
                onMouseEnter={() => handleMouseEnter(item.label)}
                onMouseLeave={() => handleMouseLeave()}
                className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-(--bg-sidebar) border border-(--border) rounded-md px-3 py-2 text-sm text-(--text-sidebar-active) shadow-lg whitespace-nowrap z-50"
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
        bg-(--bg-sidebar) text-(--text-sidebar) min-h-screen flex flex-col 
        border-r border-(--border-strong) transition-all duration-300`}
    >
      {/* LOGO */}
      <div className="px-4 py-5 text-lg font-semibold tracking-wide border-b border-(--border-strong) text-(--text-inverse) flex justify-center">
        {collapsed ? "Ero" : "EroErp"}
      </div>

      {/* MENU */}
      <nav className="flex-1 p-3 space-y-1 overflow-visible">
        {renderMenu(menu)}
      </nav>

      {/* FOOTER */}
      {!collapsed && (
        <div className="flex justify-center p-4 text-xs text-(--text-muted) border-t border-(--border-strong)">
          EroErp
        </div>
      )}
    </aside>
  )
}