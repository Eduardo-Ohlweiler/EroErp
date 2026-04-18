import { createContext } from "react"

interface User {
  id:     number
  nome:   string
  email:  string
  roles:  string[]
}

interface AuthContextData {
  user:     User | null
  signed:   boolean
  loading:  boolean
  login:    (email: string, senha: string) => Promise<void>
  logout:   () => void
  hasRole:  (role: string) => boolean
}

export type { User, AuthContextData }
export const AuthContext = createContext<AuthContextData>({} as AuthContextData)

