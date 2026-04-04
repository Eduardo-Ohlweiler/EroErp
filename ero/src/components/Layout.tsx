import { useState } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "./sidebar"
import Header from "./header"

export default function Layout() {

  const [collapsed, setCollapsed] = useState(false)

  function toggleMenu() {
    setCollapsed((prev) => !prev)
  }

  return (
    <div className="flex h-screen bg-[#161b22] transition-all duration-300">

      <Sidebar collapsed={collapsed} />

      <div className="flex flex-col flex-1">

        <Header toggleMenu={toggleMenu} />

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>

      </div>

    </div>
  )
}