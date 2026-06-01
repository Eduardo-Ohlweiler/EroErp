import { useEffect, useState }                       from "react"
import { useNavigate }                                from "react-router-dom"
import { api }                                        from "../../services/api"
import { useMessage }                                 from "../../hooks/useMessage"
import type { CompromissoDashboard, PorDiaDto,
              PorHoraDto, PorPessoaDto }              from "../../types/CompromissoDashboard"
import { TPage }                                      from "../../components/tpage"
import {
    FaCalendarCheck, FaCalendarTimes, FaCheckCircle,
    FaCalendarDay, FaCalendarWeek, FaUser, FaClock
} from "react-icons/fa"

// ── helpers ────────────────────────────────────────────────────────────────────

function Bar({ value, max, color = "bg-(--accent)" }: { value: number; max: number; color?: string }) {
    const pct = max === 0 ? 0 : Math.round((value / max) * 100)
    return (
        <div className="flex-1 h-3 bg-(--border) rounded-full overflow-hidden">
            <div className={`h-full ${color} rounded-full transition-all duration-500`}
                 style={{ width: `${pct}%` }} />
        </div>
    )
}

function KpiCard({
    label, value, sublabel, icon: Icon, color
}: {
    label:    string
    value:    number
    sublabel?: string
    icon:     React.ElementType
    color:    string
}) {
    return (
        <div className="flex-1 min-w-[140px] rounded-xl border border-(--border)
                        bg-(--bg-surface) p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-(--text-muted) uppercase tracking-wide">{label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4 text-white" />
                </div>
            </div>
            <p className="text-3xl font-bold text-(--text-primary)">{value.toLocaleString("pt-BR")}</p>
            {sublabel && <p className="text-xs text-(--text-muted)">{sublabel}</p>}
        </div>
    )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-sm font-semibold text-(--text-primary) uppercase tracking-wide mb-3">
            {children}
        </h3>
    )
}

// ── componente principal ───────────────────────────────────────────────────────

export function DashBoard() {
    const navigate             = useNavigate()
    const { showMessage }      = useMessage()
    const [data,    setData]   = useState<CompromissoDashboard | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get<CompromissoDashboard>("/compromissos/dashboard")
            .then((r) => setData(r.data))
            .catch(() => showMessage("error", "Erro ao carregar dashboard"))
            .finally(() => setLoading(false))
    }, []) // eslint-disable-line

    if (loading) {
        return (
            <TPage title="Dashboard" breadcrumb={["Dashboard"]}>
                <div className="flex justify-center py-16">
                    <span className="w-7 h-7 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            </TPage>
        )
    }

    if (!data) return null

    const maxPessoa = Math.max(...data.topPessoas.map((p: PorPessoaDto) => p.total), 1)
    const maxDia    = Math.max(...data.ultimosSeteDias.map((d: PorDiaDto) => d.total), 1)
    const maxHora   = Math.max(...data.distribuicaoHorario.map((h: PorHoraDto) => h.total), 1)

    return (
        <TPage title="Dashboard" breadcrumb={["Dashboard"]}>

            {/* ── KPIs ─────────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 mb-6">
                <KpiCard label="Agendados"  value={data.totalAgendados}
                    sublabel="ativos no momento"
                    icon={FaCalendarCheck}  color="bg-blue-500" />
                <KpiCard label="Hoje"       value={data.totalHoje}
                    sublabel="compromissos no dia"
                    icon={FaCalendarDay}    color="bg-indigo-500" />
                <KpiCard label="Esta semana" value={data.totalSemana}
                    sublabel="de segunda a domingo"
                    icon={FaCalendarWeek}   color="bg-violet-500" />
                <KpiCard label="Cancelados" value={data.totalCancelados}
                    sublabel="total acumulado"
                    icon={FaCalendarTimes}  color="bg-red-500" />
                <KpiCard label="Concluídos" value={data.totalConcluidos}
                    sublabel="total acumulado"
                    icon={FaCheckCircle}    color="bg-green-500" />
            </div>

            {/* ── linha 2: próximos + top pessoas ──────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

                {/* Próximos hoje */}
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <span className="flex items-center gap-2">
                            <FaClock className="text-(--accent)" /> Próximos hoje
                        </span>
                    </SectionTitle>

                    {data.proximosHoje.length === 0 ? (
                        <p className="text-sm text-(--text-muted) py-4 text-center">
                            Nenhum compromisso restante hoje
                        </p>
                    ) : (
                        <div className="flex flex-col divide-y divide-(--border)">
                            {data.proximosHoje.map((c) => (
                                <button
                                    key       ={c.id}
                                    type      ="button"
                                    onClick   ={() => navigate(`/compromissos/${c.id}`)}
                                    className ="flex items-start gap-3 py-2.5 text-left
                                                hover:bg-(--bg-input) rounded-lg px-2 -mx-2 transition"
                                >
                                    <span className="text-xs font-mono font-semibold text-(--accent)
                                                     bg-(--bg-input) px-2 py-1 rounded whitespace-nowrap mt-0.5">
                                        {c.inicio} – {c.fim}
                                    </span>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-medium text-(--text-primary) truncate">
                                            {c.titulo}
                                        </span>
                                        {c.pessoaNome && (
                                            <span className="text-xs text-(--text-muted) flex items-center gap-1">
                                                <FaUser className="w-2.5 h-2.5" /> {c.pessoaNome}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top 5 pessoas */}
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <span className="flex items-center gap-2">
                            <FaUser className="text-(--accent)" /> Top pessoas
                        </span>
                    </SectionTitle>

                    {data.topPessoas.length === 0 ? (
                        <p className="text-sm text-(--text-muted) py-4 text-center">
                            Nenhum dado disponível
                        </p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {data.topPessoas.map((p, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-xs text-(--text-muted) w-4 text-right font-medium">
                                        {i + 1}.
                                    </span>
                                    <span className="text-sm text-(--text-primary) w-36 truncate">
                                        {p.pessoaNome}
                                    </span>
                                    <Bar value={p.total} max={maxPessoa} />
                                    <span className="text-xs font-semibold text-(--text-primary) w-8 text-right">
                                        {p.total}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── linha 3: últimos 7 dias ───────────────────────────────────── */}
            <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                <SectionTitle>
                    <span className="flex items-center gap-2">
                        <FaCalendarWeek className="text-(--accent)" /> Últimos 7 dias
                    </span>
                </SectionTitle>

                <div className="flex flex-col gap-2.5">
                    {data.ultimosSeteDias.map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-xs text-(--text-muted) w-8">{d.diaSemana}</span>
                            <span className="text-xs text-(--text-muted) w-12">{d.data}</span>
                            <Bar value={d.total} max={maxDia} color="bg-indigo-500" />
                            <span className="text-xs font-semibold text-(--text-primary) w-6 text-right">
                                {d.total}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── linha 4: distribuição por horário ────────────────────────── */}
            {data.distribuicaoHorario.length > 0 && (
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <span className="flex items-center gap-2">
                            <FaClock className="text-(--accent)" /> Distribuição por horário
                            <span className="text-xs font-normal normal-case text-(--text-muted)">
                                (últimos 30 dias)
                            </span>
                        </span>
                    </SectionTitle>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {data.distribuicaoHorario.map((h) => (
                            <div key={h.hora} className="flex items-center gap-2">
                                <span className="text-xs font-mono text-(--text-muted) w-10 text-right">
                                    {String(h.hora).padStart(2, "0")}h
                                </span>
                                <Bar value={h.total} max={maxHora} color="bg-violet-500" />
                                <span className="text-xs font-semibold text-(--text-primary) w-6 text-right">
                                    {h.total}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </TPage>
    )
}
