import { useState, useEffect }   from "react"
import { useParams }             from "react-router-dom"
import axios                     from "axios"
import { TAssinaturaCanvas }     from "../../../components/TAssinaturaCanvas"
import type { AssinaturaStatus } from "../../../types/AssinaturaDocumento"

const API_BASE_URL = import.meta.env.VITE_API_URL as string || "http://localhost:8080"

interface AssinaturaInfo {
    nomeDocumento: string
    nomeCliente: string
    status: AssinaturaStatus
}

export default function AssinaturaPage() {
    const { token } = useParams<{ token: string }>()

    const [loading,    setLoading]    = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error,      setError]      = useState<string | null>(null)
    const [submitted,  setSubmitted]  = useState(false)
    const [info,       setInfo]       = useState<AssinaturaInfo | null>(null)
    const [dadosAssinatura, setDadosAssinatura] = useState("")

    useEffect(() => {
        if (!token) {
            setError("Link inválido ou expirado.")
            setLoading(false)
            return
        }
        axios.get(`${API_BASE_URL}/public/assinatura/${token}`)
            .then((r) => {
                setInfo({
                    nomeDocumento: r.data.nomeDocumento ?? "Documento",
                    nomeCliente:   r.data.nomeCliente   ?? "",
                    status:        r.data.status        ?? "PENDENTE",
                })
            })
            .catch((err) => {
                if (axios.isAxiosError(err) && err.response?.status === 404) {
                    setError("Link inválido ou expirado.")
                } else {
                    setError("Erro ao carregar o documento. Tente novamente.")
                }
            })
            .finally(() => setLoading(false))
    }, [token])

    async function handleSubmeter() {
        if (!dadosAssinatura || dadosAssinatura === JSON.stringify([])) {
            return
        }
        setSubmitting(true)
        try {
            await axios.post(`${API_BASE_URL}/public/assinatura/${token}`, {
                dadosAssinatura,
            })
            setSubmitted(true)
            setInfo((prev) => prev ? { ...prev, status: "ASSINADO" } : prev)
        } catch {
            setError("Erro ao enviar assinatura. Tente novamente.")
        } finally {
            setSubmitting(false)
        }
    }

    // Loading
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <span className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    // Erro (link inválido)
    if (error && !info) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="text-5xl mb-4">🔗</div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Link inválido</h2>
                    <p className="text-gray-500">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">

                {/* Cabeçalho */}
                <div className="mb-6">
                    <div className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">
                        Assinatura Digital
                    </div>
                    <h1 className="text-xl font-bold text-gray-800 mb-1">
                        {info?.nomeDocumento}
                    </h1>
                    {info?.nomeCliente && (
                        <p className="text-sm text-gray-500">
                            Contratante: <span className="font-medium text-gray-700">{info.nomeCliente}</span>
                        </p>
                    )}
                </div>

                {/* Status: PENDENTE — canvas ativo */}
                {(info?.status === "PENDENTE" && !submitted) && (
                    <div>
                        <p className="text-sm text-gray-600 mb-3">
                            Desenhe sua assinatura no campo abaixo e clique em <strong>Confirmar Assinatura</strong>.
                        </p>
                        <TAssinaturaCanvas onChange={setDadosAssinatura} />
                        {error && (
                            <p className="mt-2 text-sm text-red-500">{error}</p>
                        )}
                        <button
                            type="button"
                            onClick={handleSubmeter}
                            disabled={submitting || !dadosAssinatura || dadosAssinatura === JSON.stringify([])}
                            className="mt-4 w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-base
                                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                                       transition-colors"
                        >
                            {submitting ? "Enviando..." : "Confirmar Assinatura"}
                        </button>
                    </div>
                )}

                {/* Status: ASSINADO — aguardando confirmação */}
                {(info?.status === "ASSINADO" || submitted) && (
                    <div className="text-center py-6">
                        <div className="text-5xl mb-4">✅</div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-1">
                            Assinatura enviada!
                        </h2>
                        <p className="text-sm text-gray-500">
                            Aguardando confirmação do responsável.
                        </p>
                    </div>
                )}

                {/* Status: ACEITO */}
                {info?.status === "ACEITO" && !submitted && (
                    <div className="text-center py-6">
                        <div className="text-5xl mb-4">🎉</div>
                        <h2 className="text-lg font-semibold text-green-700 mb-1">
                            Assinatura confirmada com sucesso!
                        </h2>
                        <p className="text-sm text-gray-500">
                            O documento foi assinado e aceito pelo responsável.
                        </p>
                    </div>
                )}

                {/* Status: REJEITADO */}
                {info?.status === "REJEITADO" && !submitted && (
                    <div className="text-center py-6">
                        <div className="text-5xl mb-4">❌</div>
                        <h2 className="text-lg font-semibold text-red-700 mb-1">
                            Assinatura rejeitada
                        </h2>
                        <p className="text-sm text-gray-500">
                            Solicite um novo link ao responsável.
                        </p>
                    </div>
                )}

                <div className="mt-8 pt-4 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">Powered by EroErp — Assinatura Digital</p>
                </div>
            </div>
        </div>
    )
}
