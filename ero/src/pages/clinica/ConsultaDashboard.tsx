import { useEffect, useState }                          from "react"
import { api }                                           from "../../services/api"
import { useMessage }                                    from "../../hooks/useMessage"
import type { ConsultaDashboardResponse }                from "../../types/ConsultaDashboard"
import { TPage }                                         from "../../components/tpage"
import {
    FaStethoscope, FaCalendarCheck, FaMoneyBillWave,
    FaChartLine, FaTrophy, FaUsers, FaCalendarAlt,
} from "react-icons/fa"

// ── helpers visuais ────────────────────────────────────────────────────────────

function fmtMoeda(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function fmtNum(v: number) {
    return v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })
}

function Bar({ value, max, color = "bg-(--accent)" }: { value: number; max: number; color?: string }) {
    const pct = max === 0 ? 0 : Math.round((value / max) * 100)
    return (
        <div className="flex-1 h-2.5 bg-(--border) rounded-full overflow-hidden">
            <div className={`h-full ${color} rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }} />
        </div>
    )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-xs font-semibold text-(--text-primary) uppercase tracking-wider mb-3 flex items-center gap-2">
            {children}
        </h3>
    )
}

function KpiCard({
    label, value, sublabel, icon: Icon, color, money = false,
}: {
    label:     string
    value:     number
    sublabel?: string
    icon:      React.ElementType
    color:     string
    money?:    boolean
}) {
    return (
        <div className="flex-1 min-w-40 rounded-xl border border-(--border) bg-(--bg-surface) p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-(--text-muted) uppercase tracking-wide">{label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4 text-white" />
                </div>
            </div>
            <p className="text-2xl font-bold text-(--text-primary) leading-tight">
                {money ? fmtMoeda(value) : fmtNum(value)}
            </p>
            {sublabel && <p className="text-xs text-(--text-muted)">{sublabel}</p>}
        </div>
    )
}

const PERIODOS = [
    { label: "30 dias",   dias: 30  },
    { label: "90 dias",   dias: 90  },
    { label: "12 meses",  dias: 365 },
    { label: "Tudo",      dias: 0   },
]

// ── componente principal ───────────────────────────────────────────────────────

export default function ConsultaDashboard() {
    const { showMessage }  = useMessage()
    const [data,    setData]    = useState<ConsultaDashboardResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [periodo, setPeriodo] = useState(365)

    useEffect(() => {
        setLoading(true)
        api.get<ConsultaDashboardResponse>(`/consultas/dashboard?dias=${periodo}`)
            .then(r => setData(r.data))
            .catch(() => showMessage("error", "Erro ao carregar dashboard de consultas"))
            .finally(() => setLoading(false))
    }, [periodo]) // eslint-disable-line

    // ── loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <TPage title="Dashboard Consultas" breadcrumb={["Dashboards", "Consultas"]}>
                <div className="flex justify-center py-16">
                    <span className="w-7 h-7 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            </TPage>
        )
    }

    if (!data) return null

    const maxServico   = Math.max(...data.servicosMaisVendidos.map(s => s.receitaTotal), 1)
    const maxCliente   = Math.max(...data.clientesMaisVieis.map(c => c.consultas), 1)
    const maxDiaSemana = Math.max(...data.porDiaSemana.map(d => d.atendimentos), 1)
    const maxReceita30 = Math.max(...data.receitaUltimos30Dias.map(d => d.receita), 1)
    const maxAtend30   = Math.max(...data.receitaUltimos30Dias.map(d => d.atendimentos), 1)

    return (
        <TPage title="Dashboard Consultas" breadcrumb={["Dashboards", "Consultas"]}>

            {/* ── Seletor de período ────────────────────────────────────────── */}
            <div className="flex gap-1 mb-5 p-1 bg-(--bg-input) rounded-lg w-fit">
                {PERIODOS.map(p => (
                    <button
                        key     ={p.dias}
                        type    ="button"
                        onClick ={() => setPeriodo(p.dias)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition
                            ${periodo === p.dias
                                ? "bg-(--accent) text-white shadow-sm"
                                : "text-(--text-muted) hover:text-(--text-primary)"}`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* ── KPIs ─────────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 mb-5">
                <KpiCard label="Consultas concluídas" value={data.totalConcluidas}
                    sublabel="no período selecionado"
                    icon={FaStethoscope} color="bg-(--accent)" />
                <KpiCard label="Consultas este mês" value={data.concluidasEsteMes}
                    sublabel="mês atual"
                    icon={FaCalendarCheck} color="bg-indigo-500" />
                <KpiCard label="Receita total" value={data.receitaTotal}
                    sublabel="no período selecionado" money
                    icon={FaMoneyBillWave} color="bg-emerald-500" />
                <KpiCard label="Receita este mês" value={data.receitaMes}
                    sublabel="mês atual" money
                    icon={FaChartLine} color="bg-teal-500" />
                <KpiCard label="Ticket médio" value={data.ticketMedio}
                    sublabel="por consulta concluída" money
                    icon={FaTrophy} color="bg-amber-500" />
            </div>

            {/* ── Serviços mais vendidos ────────────────────────────────────── */}
            {data.servicosMaisVendidos.length > 0 && (
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                    <SectionTitle>
                        <FaTrophy className="text-amber-500" /> Serviços mais realizados
                    </SectionTitle>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-(--text-muted) text-xs uppercase tracking-wide border-b border-(--border)">
                                    <th className="pb-2 pr-3 w-6">#</th>
                                    <th className="pb-2 pr-3">Serviço</th>
                                    <th className="pb-2 pr-3 text-right w-24">Atend.</th>
                                    <th className="pb-2 pr-3 text-right w-24">Qtd. total</th>
                                    <th className="pb-2 pr-3 text-right w-32">Preço médio</th>
                                    <th className="pb-2 text-right w-32">Receita</th>
                                    <th className="pb-2 pl-3 w-32"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border)">
                                {data.servicosMaisVendidos.map((s, i) => (
                                    <tr key={i} className="hover:bg-(--bg-input) transition">
                                        <td className="py-2.5 pr-3 text-(--text-muted) font-mono">{i + 1}</td>
                                        <td className="py-2.5 pr-3 font-medium text-(--text-primary) max-w-48 truncate">
                                            {s.servicoNome}
                                        </td>
                                        <td className="py-2.5 pr-3 text-right text-(--text-primary)">
                                            {fmtNum(s.atendimentos)}
                                        </td>
                                        <td className="py-2.5 pr-3 text-right text-(--text-muted)">
                                            {s.qtdTotal.toLocaleString("pt-BR", { minimumFractionDigits: 3 })}
                                        </td>
                                        <td className="py-2.5 pr-3 text-right text-(--text-muted)">
                                            {fmtMoeda(s.precoMedio)}
                                        </td>
                                        <td className="py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                            {fmtMoeda(s.receitaTotal)}
                                        </td>
                                        <td className="py-2.5 pl-3">
                                            <Bar value={s.receitaTotal} max={maxServico} color="bg-amber-400" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Linha: clientes + dia da semana ──────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

                {/* Clientes mais fiéis */}
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaUsers className="text-indigo-500" /> Clientes mais fiéis
                    </SectionTitle>
                    {data.clientesMaisVieis.length === 0 ? (
                        <p className="text-sm text-(--text-muted) py-4 text-center">Sem dados no período</p>
                    ) : (
                        <div className="flex flex-col gap-2.5">
                            {data.clientesMaisVieis.map((c, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-xs text-(--text-muted) w-5 text-right font-medium shrink-0">
                                        {i + 1}.
                                    </span>
                                    <span className="text-sm text-(--text-primary) w-36 truncate shrink-0">
                                        {c.pessoaNome}
                                    </span>
                                    <Bar value={c.consultas} max={maxCliente} color="bg-indigo-400" />
                                    <span className="text-xs font-semibold text-(--text-primary) w-6 text-right shrink-0">
                                        {c.consultas}
                                    </span>
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 w-24 text-right shrink-0">
                                        {fmtMoeda(c.receitaTotal)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Distribuição por dia da semana */}
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaCalendarAlt className="text-(--accent)" /> Atendimentos por dia da semana
                    </SectionTitle>
                    <div className="flex flex-col gap-2.5">
                        {data.porDiaSemana.map((d, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-xs font-medium text-(--text-muted) w-7 shrink-0">
                                    {d.diaSemana}
                                </span>
                                <Bar value={d.atendimentos} max={maxDiaSemana} color="bg-violet-400" />
                                <span className="text-xs font-semibold text-(--text-primary) w-5 text-right shrink-0">
                                    {d.atendimentos}
                                </span>
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 w-24 text-right shrink-0">
                                    {d.receita > 0 ? fmtMoeda(d.receita) : "—"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Receita últimos 30 dias ───────────────────────────────────── */}
            <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                <SectionTitle>
                    <FaChartLine className="text-emerald-500" /> Receita — últimos 30 dias
                </SectionTitle>
                {data.receitaUltimos30Dias.every(d => d.receita === 0) ? (
                    <p className="text-sm text-(--text-muted) py-4 text-center">
                        Nenhuma consulta concluída nos últimos 30 dias
                    </p>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        {data.receitaUltimos30Dias
                            .filter(d => d.receita > 0 || d.atendimentos > 0)
                            .map((d, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-(--text-muted) w-10 shrink-0">
                                        {d.data}
                                    </span>
                                    <Bar value={d.receita} max={maxReceita30} color="bg-emerald-400" />
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 w-24 text-right shrink-0">
                                        {fmtMoeda(d.receita)}
                                    </span>
                                    <span className="text-xs text-(--text-muted) w-16 text-right shrink-0">
                                        {d.atendimentos} atend.
                                    </span>
                                </div>
                            ))}
                    </div>
                )}

                {/* Mini-summary da barra de receita diária */}
                {maxReceita30 > 0 && (
                    <div className="mt-4 pt-3 border-t border-(--border) flex gap-6 text-xs text-(--text-muted)">
                        <span>
                            Maior dia:{" "}
                            <span className="font-semibold text-(--text-primary)">
                                {fmtMoeda(maxReceita30)}
                            </span>
                        </span>
                        <span>
                            Dias com atend.:{" "}
                            <span className="font-semibold text-(--text-primary)">
                                {data.receitaUltimos30Dias.filter(d => d.atendimentos > 0).length}
                            </span>
                        </span>
                        <span>
                            Maior fluxo:{" "}
                            <span className="font-semibold text-(--text-primary)">
                                {maxAtend30} atend./dia
                            </span>
                        </span>
                    </div>
                )}
            </div>

        </TPage>
    )
}
