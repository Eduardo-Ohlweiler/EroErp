import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"

interface TRoleRouteProps {
  roles: string[]
}

export function TRoleRoute({ roles }: TRoleRouteProps) {
  const { hasRole } = useAuth()

  const temAcesso = roles.some((role) => hasRole(role))

  return temAcesso ? <Outlet /> : <Navigate to="/sem-acesso" replace />
}