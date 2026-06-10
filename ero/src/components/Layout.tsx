import { useState } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "./sidebar"
import Header from "./header"

export default function Layout() {

  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 640)

  return (
    <div className="flex h-screen overflow-hidden bg-(--bg-base)">

      {/* overlay mobile — clica fora fecha a sidebar */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-20 bg-black/40 sm:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* sidebar: drawer no mobile, fixa no desktop */}
      <div className={`
        fixed inset-y-0 left-0 z-30 transition-transform duration-300 sm:relative sm:translate-x-0
        ${collapsed ? "-translate-x-full sm:translate-x-0" : "translate-x-0"}
      `}>
        <Sidebar
          collapsed        ={false}
          collapsedDesktop ={collapsed}
          onClose          ={() => setCollapsed(true)}  // ← novo
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header toggleMenu={() => setCollapsed((prev) => !prev)} />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

    </div>
  )
}