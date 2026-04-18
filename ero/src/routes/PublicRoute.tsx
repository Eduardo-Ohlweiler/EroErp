import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"

export function PublicRoute() {
  const { signed, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-(--bg-base)">
        <span className="text-(--text-muted) text-sm">Carregando...</span>
      </div>
    )
  }

  return signed ? <Navigate to="/" replace /> : <Outlet />
}