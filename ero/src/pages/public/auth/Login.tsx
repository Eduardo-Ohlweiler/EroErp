import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../../../hooks/useAuth"
import type { ErrorResponse } from "../../../types/ErrorResponse"

export function Login() {

  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setLoading(true)
    setErro("")

    try {
      await login(email, senha)
      navigate("/")
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as ErrorResponse
        setErro(data?.erro ?? "Usuário ou senha inválidos")
      } else {
        setErro("Erro inesperado, tente novamente")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg-base)">

      <div className="w-full max-w-sm bg-(--bg-surface) border border-(--border) rounded-lg p-8 shadow-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-(--text-primary)">EroErp</h1>
          <p className="text-sm text-(--text-muted) mt-1">
            Acesse sua conta
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-(--text-secondary)">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (erro) setErro("")
              }}
              placeholder="seu@email.com"
              required
              className="bg-(--bg-input) border border-(--border) rounded-md px-3 py-2 text-sm
              text-(--text-primary) placeholder-(--text-muted)
              focus:outline-none focus:border-(--accent) focus:ring-1 focus:ring-(--accent) transition"
            />
          </div>

          {/* Senha */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-(--text-secondary)">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value)
                if (erro) setErro("")
              }}
              placeholder="••••••••"
              required
              className="bg-(--bg-input) border border-(--border) rounded-md px-3 py-2 text-sm
              text-(--text-primary) placeholder-(--text-muted)
              focus:outline-none focus:border-(--accent) focus:ring-1 focus:ring-(--accent) transition"
            />
          </div>

          {/* Erro */}
          {erro && (
            <div className="text-sm text-(--danger) px-3 py-2 rounded-md border border-(--danger) bg-red-500/10">
              {erro}
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 px-4 py-2 rounded-md text-sm font-medium
            bg-(--accent) hover:bg-(--accent-hover) text-(--text-inverse)
            disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Entrar"
            )}
          </button>

        </form>

      </div>

    </div>
  )
}