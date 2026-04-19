import axios from "axios"

export const api = axios.create({
  baseURL: "http://localhost:8080"
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {

    const isLogin = error.config?.url?.includes("/auth/login")

    if (error.response?.status === 401 && !isLogin) {
      const msg = error.response?.data?.erro ?? "Sessão expirada"

      localStorage.removeItem("token")
      localStorage.removeItem("user")

      sessionStorage.setItem("authError", msg)
      
      window.location.href = "/login"
    }

    return Promise.reject(error)
  }
)