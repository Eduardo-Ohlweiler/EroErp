import { useEffect, useState } from "react"
import {
    PieChart, Pie, Cell,
    BarChart, Bar as RBar,
    AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import { api }                                 from "../../services/api"
import { useMessage }                          from "../../hooks/useMessage"
import type { OtorrinoGeralDashboard as OtorrinoGeralDashboardDto } from "../../types/Otorrino"
import { TPage }                               from "../../components/tpage"
import {
    FaAssistiveListeningSystems, FaWaveSquare, FaClipboardList,
    FaFileMedicalAlt, FaUsers, FaCalendarAlt, FaChartPie, FaDeaf,
} from "react-icons/fa"

// ── helpers visuais ────────────────────────────────────────────────────────────

function fmtNum(v: number | null | undefined, casas = 0) {
    if (v == null || Number.isNaN(v)) return "—"
    return v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-xs font-semibold text-(--text-primary) uppercase tracking-wider mb-3 flex items-center gap-2">
            {children}
        </h3>
    )
}

function EmptyState({ children = "Sem dados no período" }: { children?: React.ReactNode }) {
    return <p className="text-sm text-(--text-muted) py-10 text-center">{children}</p>
}

function KpiCard({
    label, value, sublabel, icon: Icon, color,
}: {
    label:     string
    value:     string
    sublabel?: string
    icon:      React.ElementType
    color:     string
}) {
    return (
        <div className="flex-1 min-w-40 rounded-xl border border-(--border) bg-(--bg-surface) p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-(--text-muted) uppercase tracking-wide">{label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4 text-white" />
                </div>
            </div>
            <p className="text-2xl font-bold text-(--text-primary) leading-tight">{value}</p>
            {sublabel && <p className="text-xs text-(--text-muted)">{sublabel}</p>}
        </div>
    )
}

// ── paleta / estilos ──────────────────────────────────────────────────────────

const PALETTE    = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"]
const AXIS_COLOR = "#94a3b8"
const GRID_COLOR = "#cbd5e1"

const TOOLTIP_STYLE: React.CSSProperties = {
    background:   "rgba(30, 41, 59, 0.95)",
    border:       "1px solid rgba(148, 163, 184, 0.4)",
    borderRadius: 8,
    color:        "#f8fafc",
    fontSize:     12,
}
const TOOLTIP_LABEL_STYLE: React.CSSProperties = { color: "#cbd5e1", marginBottom: 4 }
const TOOLTIP_ITEM_STYLE:  React.CSSProperties = { color: "#f8fafc" }

const PERIODOS = [
    { label: "6 meses",  dias: 180 },
    { label: "12 meses", dias: 365 },
    { label: "24 meses", dias: 730 },
    { label: "Tudo",     dias: 0   },
]

/** Cor por grau de perda auditiva. */
function corGrau(classif: string | null | undefined): string {
    if (!classif) return "#94a3b8"
    switch (classif.toUpperCase()) {
        case "NORMAL":   return "#22c55e"   // verde
        case "LEVE":     return "#3b82f6"   // azul
        case "MODERADA": return "#f59e0b"   // amber
        case "SEVERA":   return "#fb923c"   // laranja
        case "PROFUNDA": return "#ef4444"   // vermelho
        default:         return "#94a3b8"
    }
}

const GRAU_LABEL: Record<string, string> = {
    NORMAL: "Normal", LEVE: "Leve", MODERADA: "Moderada", SEVERA: "Severa", PROFUNDA: "Profunda",
}
function grauLabel(g: string | null | undefined) {
    if (!g) return "—"
    return GRAU_LABEL[g.toUpperCase()] ?? g
}

const LAUDO_LABEL: Record<string, string> = {
    NASOFIBROSCOPIA:    "Nasofibroscopia",
    LARINGOSCOPIA:      "Laringoscopia",
    VIDEOLARINGOSCOPIA: "Videolaringoscopia",
    RINOSCOPIA:         "Rinoscopia",
    OUTRO:              "Outro",
}
function laudoLabel(t: string | null | undefined) {
    if (!t) return "—"
    return LAUDO_LABEL[t.toUpperCase()] ?? t
}

/** "YYYY-MM" → "MM/AA". */
function fmtPeriodo(p: string) {
    const [y, m] = p.split("-")
    if (!y || !m) return p
    return `${m}/${y.slice(2)}`
}

// ── componente principal ───────────────────────────────────────────────────────

export default function OtorrinoGeralDashboard() {
    const { showMessage } = useMessage()

    const [data,    setData]    = useState<OtorrinoGeralDashboardDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [periodo, setPeriodo] = useState(365)   // default: 12 meses

    useEffect(() => {
        setLoading(true)
        api.get<OtorrinoGeralDashboardDto>(`/otorrino/dashboard/geral?dias=${periodo}`)
            .then(r => setData(r.data))
            .catch(() => showMessage("error", "Erro ao carregar dashboard de otorrinolaringologia"))
            .finally(() => setLoading(false))
    }, [periodo]) // eslint-disable-line

    if (loading && !data) {
        return (
            <TPage title="Dashboard Otorrino" breadcrumb={["Dashboards", "Otorrino"]}>
                <div className="flex justify-center py-16">
                    <span className="w-7 h-7 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            </TPage>
        )
    }

    if (!data) return null

    const kpis            = data.kpis
    const examesPorTipo   = data.examesPorTipo          ?? []
    const audiomPorPeriodo = (data.audiometriasPorPeriodo ?? []).map(p => ({ ...p, label: fmtPeriodo(p.periodo) }))
    const distGrau        = data.distribuicaoGrauPerda  ?? []
    const escalasPorTipo  = data.escalasPorTipo         ?? []
    const laudosPorTipo   = (data.laudosPorTipo         ?? []).map(l => ({ ...l, label: laudoLabel(l.tipo) }))

    return (
        <TPage title="Dashboard Otorrino" breadcrumb={["Dashboards", "Otorrino"]}>

            {/* ── Barra de filtros ──────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2 mb-5 items-end">
                <div className="flex flex-col gap-1">
                    <span className="text-sm text-(--text-secondary)">Período</span>
                    <div className="flex gap-1 p-1 bg-(--bg-input) rounded-lg w-fit h-9.5 items-center">
                        {PERIODOS.map(p => (
                            <button
                                key      ={p.dias}
                                type     ="button"
                                onClick  ={() => setPeriodo(p.dias)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition
                                    ${periodo === p.dias
                                        ? "bg-(--accent) text-white shadow-sm"
                                        : "text-(--text-muted) hover:text-(--text-primary)"}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── KPIs ─────────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 mb-5">
                <KpiCard label="Audiometrias"     value={fmtNum(kpis.totalAudiometrias)}
                    sublabel="no período" icon={FaAssistiveListeningSystems} color="bg-(--accent)" />
                <KpiCard label="Imitanciometrias" value={fmtNum(kpis.totalImitanciometrias)}
                    sublabel="no período" icon={FaWaveSquare} color="bg-blue-500" />
                <KpiCard label="Escalas"          value={fmtNum(kpis.totalEscalas)}
                    sublabel="aplicadas" icon={FaClipboardList} color="bg-violet-500" />
                <KpiCard label="Laudos"           value={fmtNum(kpis.totalLaudos)}
                    sublabel="descritivos" icon={FaFileMedicalAlt} color="bg-amber-500" />
                <KpiCard label="Pacientes"        value={fmtNum(kpis.totalPacientes)}
                    sublabel="atendidos" icon={FaUsers} color="bg-emerald-500" />
            </div>

            {/* ── Exames por tipo + distribuição de grau ─────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaChartPie className="text-(--accent)" /> Exames por tipo
                    </SectionTitle>
                    {examesPorTipo.length === 0 || examesPorTipo.every(e => e.total === 0) ? (
                        <EmptyState />
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={examesPorTipo} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} vertical={false} />
                                <XAxis dataKey="tipo" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} allowDecimals={false} />
                                <Tooltip
                                    cursor      ={{ fill: "rgba(148, 163, 184, 0.12)" }}
                                    contentStyle={TOOLTIP_STYLE}
                                    labelStyle  ={TOOLTIP_LABEL_STYLE}
                                    itemStyle   ={TOOLTIP_ITEM_STYLE}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter   ={(v: any) => [`${fmtNum(Number(v))} registros`, "Total"]}
                                />
                                <RBar dataKey="total" name="Total" radius={[4, 4, 0, 0]} barSize={48}>
                                    {examesPorTipo.map((_, i) => (
                                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                                    ))}
                                </RBar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaDeaf className="text-rose-500" /> Distribuição por grau de perda
                    </SectionTitle>
                    {distGrau.length === 0 || distGrau.every(d => d.quantidade === 0) ? (
                        <EmptyState />
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data        ={distGrau}
                                    cx          ="50%"
                                    cy          ="50%"
                                    innerRadius ={58}
                                    outerRadius ={100}
                                    paddingAngle={2}
                                    dataKey     ="quantidade"
                                    nameKey     ="classificacao"
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    label       ={(e: any) => `${grauLabel(String(e.classificacao))}: ${fmtNum(Number(e.quantidade ?? 0))}`}
                                    labelLine   ={false}
                                >
                                    {distGrau.map((d, i) => (
                                        <Cell key={i} fill={corGrau(d.classificacao)} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={TOOLTIP_STYLE}
                                    labelStyle  ={TOOLTIP_LABEL_STYLE}
                                    itemStyle   ={TOOLTIP_ITEM_STYLE}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter   ={(v: any, _n: any, p: any) => [
                                        `${fmtNum(Number(v))} orelhas`,
                                        grauLabel(String(p?.payload?.classificacao ?? "")),
                                    ]}
                                />
                                <Legend formatter={(value: string) => grauLabel(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* ── Audiometrias por período ───────────────────────────────────── */}
            <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                <SectionTitle>
                    <FaCalendarAlt className="text-(--accent)" /> Audiometrias por período
                </SectionTitle>
                {audiomPorPeriodo.length === 0 ? (
                    <EmptyState />
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={audiomPorPeriodo} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                            <defs>
                                <linearGradient id="colorAudiom" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor={PALETTE[0]} stopOpacity={0.35} />
                                    <stop offset="95%" stopColor={PALETTE[0]} stopOpacity={0}    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                            <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} allowDecimals={false} />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                labelStyle  ={TOOLTIP_LABEL_STYLE}
                                itemStyle   ={TOOLTIP_ITEM_STYLE}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter   ={(v: any) => [`${fmtNum(Number(v))} audiometrias`, "Total"]}
                            />
                            <Area type="monotone" dataKey="total" name="Audiometrias"
                                stroke={PALETTE[0]} strokeWidth={2} fill="url(#colorAudiom)" />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* ── Escalas por tipo + Laudos por tipo ─────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaClipboardList className="text-violet-500" /> Escalas aplicadas por tipo
                    </SectionTitle>
                    {escalasPorTipo.length === 0 || escalasPorTipo.every(e => e.quantidade === 0) ? (
                        <EmptyState />
                    ) : (
                        <ResponsiveContainer width="100%" height={Math.max(280, escalasPorTipo.length * 40)}>
                            <BarChart data={escalasPorTipo} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} allowDecimals={false} />
                                <YAxis
                                    type     ="category"
                                    dataKey  ="codigo"
                                    width    ={90}
                                    tick     ={{ fontSize: 11, fill: AXIS_COLOR }}
                                    stroke   ={AXIS_COLOR}
                                />
                                <Tooltip
                                    cursor      ={{ fill: "rgba(148, 163, 184, 0.12)" }}
                                    contentStyle={TOOLTIP_STYLE}
                                    labelStyle  ={TOOLTIP_LABEL_STYLE}
                                    itemStyle   ={TOOLTIP_ITEM_STYLE}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter   ={(v: any, _n: any, p: any) => {
                                        const sm = p?.payload?.scoreMedio
                                        const nome = p?.payload?.nome ?? p?.payload?.codigo ?? ""
                                        const extra = sm != null ? ` · score médio ${fmtNum(Number(sm), 1)}` : ""
                                        return [`${fmtNum(Number(v))} aplicações${extra}`, String(nome)]
                                    }}
                                />
                                <RBar dataKey="quantidade" name="Aplicações" fill={PALETTE[5]} radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaFileMedicalAlt className="text-amber-500" /> Laudos por tipo
                    </SectionTitle>
                    {laudosPorTipo.length === 0 || laudosPorTipo.every(l => l.total === 0) ? (
                        <EmptyState />
                    ) : (
                        <ResponsiveContainer width="100%" height={Math.max(280, laudosPorTipo.length * 40)}>
                            <BarChart data={laudosPorTipo} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} allowDecimals={false} />
                                <YAxis
                                    type     ="category"
                                    dataKey  ="label"
                                    width    ={130}
                                    tick     ={{ fontSize: 11, fill: AXIS_COLOR }}
                                    stroke   ={AXIS_COLOR}
                                    tickFormatter={(v: string) => v.length > 16 ? `${v.slice(0, 16)}…` : v}
                                />
                                <Tooltip
                                    cursor      ={{ fill: "rgba(148, 163, 184, 0.12)" }}
                                    contentStyle={TOOLTIP_STYLE}
                                    labelStyle  ={TOOLTIP_LABEL_STYLE}
                                    itemStyle   ={TOOLTIP_ITEM_STYLE}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter   ={(v: any, _n: any, p: any) => [
                                        `${fmtNum(Number(v))} laudos`,
                                        String(p?.payload?.label ?? ""),
                                    ]}
                                />
                                <RBar dataKey="total" name="Laudos" fill={PALETTE[2]} radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

        </TPage>
    )
}
