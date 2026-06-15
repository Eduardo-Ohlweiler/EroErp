import { useState } from "react"
import { api } from "../services/api"
import { AuthContext } from "./AuthContext"
import type { User } from "./AuthContext"
import type { AuthResponse } from "../types/Auth"

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [user, setUser] = useState<User | null>(() => {
    const savedUser     = localStorage.getItem("user")
    return savedUser ? JSON.parse(savedUser) : null
  })

  async function login(email: string, senha: string) {
    const response                    = await api.post<AuthResponse>("/auth/login", { email, senha })
    const { token, id, nome, roles }  = response.data
    const loggedUser: User            = { id, nome, email, roles }
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(loggedUser))
    setUser(loggedUser)
  }

  function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
  }

  function hasRole(role: string) {
    return user?.roles.includes(role) ?? false
  }

  function updateUser(partial: Partial<User>) {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...partial }
      localStorage.setItem("user", JSON.stringify(updated))
      return updated
    })
  }

  return (
    <AuthContext.Provider value={{ user, signed: !!user, loading: false, login, logout, hasRole, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}