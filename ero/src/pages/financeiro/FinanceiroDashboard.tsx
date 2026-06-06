import { useEffect, useState } from "react"
import { api }                 from "../../services/api"
import { useMessage }          from "../../hooks/useMessage"
import { TPage }               from "../../components/tpage"
import {
    FaUniversity, FaArrowUp, FaArrowDown,
    FaExclamationTriangle, FaCheckCircle, FaMinusCircle,
} from "react-icons/fa"

// ── types ─────────────────────────────────────────────────────────────────────

interface FinanceiroDashboardDto {
    totalPendenteReceber:         number
    totalPendenteAtrasadoReceber: number
    totalPendentePagar:           number
    totalPendenteAtrasadoPagar:   number
    totalRecebidoMes:             number
    totalPagoMes:                 number
    saldoGeral:                   number
    fluxoMensal:     { mes: string; recebido: number; pago: number }[]
    saldoPorConta:   { nome: string; saldo: number }[]
}

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtMoeda(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

// ── SVG Line Chart ────────────────────────────────────────────────────────────

function LineChart({ data }: { data: { mes: string; recebido: number; pago: number }[] }) {
    if (!data || data.length === 0) {
        return (
            <p className="text-sm text-(--text-muted) py-6 text-center">
                Sem dados de fluxo mensal
            </p>
        )
    }

    const W = 560, H = 180, PAD = { top: 10, right: 20, bottom: 30, left: 60 }
    const innerW = W - PAD.left - PAD.right
    const innerH = H - PAD.top - PAD.bottom
    const maxVal = Math.max(...data.flatMap(d => [d.recebido, d.pago]), 1)

    const xOf = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * innerW
    const yOf = (v: number) => PAD.top + innerH - (v / maxVal) * innerH

    const line = (field: "recebido" | "pago") =>
        data.map((d, i) => `${xOf(i)},${yOf(d[field])}`).join(" ")

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 200 }}>
            {/* grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(t => {
                const y = PAD.top + innerH * t
                const v = maxVal * (1 - t)
                return (
                    <g key={t}>
                        <line
                            x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                            stroke="currentColor" strokeOpacity={0.1} strokeDasharray="4 2"
                        />
                        <text
                            x={PAD.left - 6} y={y + 4}
                            fontSize={9} textAnchor="end"
                            fill="currentColor" fillOpacity={0.5}
                        >
                            {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)}
                        </text>
                    </g>
                )
            })}
            {/* x labels */}
            {data.map((d, i) => (
                <text
                    key={i} x={xOf(i)} y={H - 4}
                    fontSize={9} textAnchor="middle"
                    fill="currentColor" fillOpacity={0.6}
                >
                    {d.mes}
                </text>
            ))}
            {/* lines */}
            <polyline
                points={line("recebido")}
                fill="none" stroke="var(--success)" strokeWidth={2} strokeLinejoin="round"
            />
            <polyline
                points={line("pago")}
                fill="none" stroke="var(--danger)" strokeWidth={2} strokeLinejoin="round"
            />
            {/* dots with tooltips */}
            {data.map((d, i) => (
                <g key={i}>
                    <circle cx={xOf(i)} cy={yOf(d.recebido)} r={3} fill="var(--success)">
                        <title>{d.mes} — Recebido: {fmtMoeda(d.recebido)}</title>
                    </circle>
                    <circle cx={xOf(i)} cy={yOf(d.pago)} r={3} fill="var(--danger)">
                        <title>{d.mes} — Pago: {fmtMoeda(d.pago)}</title>
                    </circle>
                </g>
            ))}
        </svg>
    )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
    label, value, sublabel, icon: Icon, valueColor,
}: {
    label:      string
    value:      number
    sublabel?:  string
    icon:       React.ElementType
    valueColor: string
}) {
    return (
        <div className="bg-(--bg-surface) border border-(--border) rounded-xl p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-(--text-secondary) font-medium uppercase tracking-wide">
                    {label}
                </span>
                <Icon className={`w-4 h-4 ${valueColor}`} />
            </div>
            <span className={`text-2xl font-bold ${valueColor}`}>
                {fmtMoeda(value)}
            </span>
            {sublabel && (
                <span className="text-xs text-(--text-muted)">{sublabel}</span>
            )}
        </div>
    )
}

// ── Saldo por Conta Bar List ──────────────────────────────────────────────────

function SaldoPorContaList({ contas }: { contas: { nome: string; saldo: number }[] }) {
    if (contas.length === 0) {
        return (
            <p className="text-sm text-(--text-muted) py-4 text-center">
                Nenhuma conta financeira cadastrada
            </p>
        )
    }

    const maxAbs = Math.max(...contas.map(c => Math.abs(c.saldo)), 1)

    return (
        <div className="flex flex-col gap-3">
            {contas.map((c, i) => {
                const pct     = Math.round((Math.abs(c.saldo) / maxAbs) * 100)
                const positive = c.saldo >= 0
                return (
                    <div key={i} className="flex items-center gap-3">
                        <span className="text-sm text-(--text-primary) font-medium w-36 truncate shrink-0">
                            {c.nome}
                        </span>
                        <div className="flex-1 h-2.5 bg-(--border) rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${positive ? "bg-(--success)" : "bg-(--danger)"}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <span
                            className={`text-sm font-semibold w-32 text-right shrink-0 ${positive ? "text-(--success)" : "text-(--danger)"}`}
                        >
                            {fmtMoeda(c.saldo)}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

// ── componente principal ───────────────────────────────────────────────────────

export default function FinanceiroDashboard() {
    const { showMessage }             = useMessage()
    const [dashboard, setDashboard]   = useState<FinanceiroDashboardDto | null>(null)
    const [loading,   setLoading]     = useState(true)
    const [error,     setError]       = useState(false)

    useEffect(() => {
        setLoading(true)
        setError(false)
        api.get<FinanceiroDashboardDto>("/financeiro/dashboard")
            .then(r => setDashboard(r.data))
            .catch(() => {
                showMessage("error", "Erro ao carregar dashboard financeiro")
                setError(true)
            })
            .finally(() => setLoading(false))
    }, []) // eslint-disable-line

    // ── loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <TPage title="Dashboard Financeiro" breadcrumb={["Dashboards", "Financeiro"]}>
                <div className="flex justify-center py-16">
                    <span className="w-7 h-7 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            </TPage>
        )
    }

    // ── error ────────────────────────────────────────────────────────────────
    if (error || !dashboard) {
        return (
            <TPage title="Dashboard Financeiro" breadcrumb={["Dashboards", "Financeiro"]}>
                <div className="flex flex-col items-center py-16 gap-3 text-(--text-muted)">
                    <FaExclamationTriangle className="w-8 h-8 text-(--danger)" />
                    <p className="text-sm">Não foi possível carregar os dados financeiros.</p>
                </div>
            </TPage>
        )
    }

    const saldoPositivo = dashboard.saldoGeral >= 0

    return (
        <TPage title="Dashboard Financeiro" breadcrumb={["Dashboards", "Financeiro"]}>

            {/* ── Cabeçalho de período ─────────────────────────────────────── */}
            <p className="text-xs text-(--text-muted) mb-5">
                Dados do mês atual — Cards refletem posição corrente; gráfico exibe os últimos 12 meses.
            </p>

            {/* ── Saldo Geral destaque ──────────────────────────────────────── */}
            <div className="flex items-center gap-4 mb-5 p-4 bg-(--bg-surface) border border-(--border) rounded-xl">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${saldoPositivo ? "bg-(--success)" : "bg-(--danger)"}`}>
                    <FaUniversity className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-(--text-muted) uppercase tracking-wide font-medium">
                        Saldo Geral
                    </span>
                    <span className={`text-3xl font-bold ${saldoPositivo ? "text-(--success)" : "text-(--danger)"}`}>
                        {fmtMoeda(dashboard.saldoGeral)}
                    </span>
                    <span className="text-xs text-(--text-muted)">consolidado de todas as contas</span>
                </div>
            </div>

            {/* ── 6 KPIs ───────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                <KpiCard
                    label      ="A Receber"
                    value      ={dashboard.totalPendenteReceber}
                    sublabel   ="pendente no mês"
                    icon       ={FaArrowUp}
                    valueColor ="text-(--accent)"
                />
                <KpiCard
                    label      ="Em Atraso — Receber"
                    value      ={dashboard.totalPendenteAtrasadoReceber}
                    sublabel   ="vencido a receber"
                    icon       ={FaExclamationTriangle}
                    valueColor ="text-(--danger)"
                />
                <KpiCard
                    label      ="A Pagar"
                    value      ={dashboard.totalPendentePagar}
                    sublabel   ="pendente no mês"
                    icon       ={FaArrowDown}
                    valueColor ="text-(--warning)"
                />
                <KpiCard
                    label      ="Em Atraso — Pagar"
                    value      ={dashboard.totalPendenteAtrasadoPagar}
                    sublabel   ="vencido a pagar"
                    icon       ={FaExclamationTriangle}
                    valueColor ="text-(--danger)"
                />
                <KpiCard
                    label      ="Recebido (Mês)"
                    value      ={dashboard.totalRecebidoMes}
                    sublabel   ="entradas no mês atual"
                    icon       ={FaCheckCircle}
                    valueColor ="text-(--success)"
                />
                <KpiCard
                    label      ="Pago (Mês)"
                    value      ={dashboard.totalPagoMes}
                    sublabel   ="saídas no mês atual"
                    icon       ={FaMinusCircle}
                    valueColor ="text-(--text-secondary)"
                />
            </div>

            {/* ── Fluxo de Caixa ────────────────────────────────────────────── */}
            <div className="bg-(--bg-surface) border border-(--border) rounded-xl p-4 mb-4">
                <h3 className="text-sm font-semibold text-(--text-secondary) mb-3">
                    Fluxo de Caixa — Últimos 12 Meses
                </h3>
                <div className="flex gap-4 mb-2">
                    <span className="flex items-center gap-1.5 text-xs text-(--text-muted)">
                        <span className="w-3 h-0.5 bg-(--success) inline-block rounded" />
                        Recebido
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-(--text-muted)">
                        <span className="w-3 h-0.5 bg-(--danger) inline-block rounded" />
                        Pago
                    </span>
                </div>
                <LineChart data={dashboard.fluxoMensal} />
            </div>

            {/* ── Saldo por Conta ───────────────────────────────────────────── */}
            <div className="bg-(--bg-surface) border border-(--border) rounded-xl p-4">
                <h3 className="text-sm font-semibold text-(--text-secondary) mb-4">
                    Saldo por Conta
                </h3>
                <SaldoPorContaList contas={dashboard.saldoPorConta} />
            </div>

        </TPage>
    )
}
