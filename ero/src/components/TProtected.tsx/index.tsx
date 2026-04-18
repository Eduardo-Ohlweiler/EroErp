import { useAuth } from "../../hooks/useAuth"

interface TProtectedProps {
  roles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode  // o que mostrar se não tiver acesso
}

export function TProtected({ roles, children, fallback = null }: TProtectedProps) {
  const { hasRole } = useAuth()

  const temAcesso = roles.some((role) => hasRole(role))

  return temAcesso ? <>{children}</> : <>{fallback}</>
}