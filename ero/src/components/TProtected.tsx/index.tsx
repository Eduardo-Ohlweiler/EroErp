import { useAuth } from "../../hooks/useAuth"

interface TProtectedProps {
  roles:      string[]
  children:   React.ReactNode
  fallback?:  React.ReactNode  
}

export function TProtected({ roles, children, fallback = null }: TProtectedProps) {
  const { hasRole } = useAuth()
  const temAcesso   = roles.some((role) => hasRole(role))

  return temAcesso ? <>{children}</> : <>{fallback}</>
}