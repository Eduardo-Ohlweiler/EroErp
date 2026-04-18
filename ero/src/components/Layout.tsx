import { useState } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "./sidebar"
import Header from "./header"

export default function Layout() {

  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-(--bg-base) transition-all duration-300">

      <Sidebar collapsed={collapsed} />

      <div className="flex flex-col flex-1">

        <Header toggleMenu={() => setCollapsed((prev) => !prev)} />

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>

      </div>

    </div>
  )
}