export interface User {
  id: number
  nome: string
  email: string
  roles: string[]
}

export interface AuthResponse {
  token: string
  id: number
  nome: string
  email: string
  roles: string[]
}