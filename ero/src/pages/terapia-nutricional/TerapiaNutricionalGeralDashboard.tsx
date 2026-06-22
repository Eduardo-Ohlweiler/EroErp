import { useEffect, useState } from "react"
import {
    PieChart, Pie, Cell,
    BarChart, Bar as RBar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import { api }                                 from "../../services/api"
import { useMessage }                          from "../../hooks/useMessage"
import type {
    TerapiaNutricionalGeralDashboard as DashboardDto,
    ContagemItem,
} from "../../types/TerapiaNutricional"
import { TPage }                               from "../../components/tpage"
import { TDate }                               from "../../components/tdate"
import { TButton }                             from "../../components/tbutton"
import {
    FaClipboardList, FaUsers, FaCalendarAlt,
    FaFireAlt, FaDrumstickBite, FaChartPie, FaFlask, FaLayerGroup, FaTrophy,
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

const PALETTE = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"]
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

/** Cor da classificação (replicada de ResultadoNutricionalView). */
function corClassif(classif: string | null | undefined): string {
    if (!classif) return "#94a3b8"
    const c = classif.toLowerCase()
    if (c.includes("eutrof") || c.includes("adequad") || c.includes("normal")) return "#22c55e"
    if (c.includes("desnutri") || c.includes("baixo") || c.includes("magrez")) return "#3b82f6"
    if (c.includes("sobrepeso") || c.includes("obesid") || c.includes("excesso")) return "#f59e0b"
    return "#94a3b8"
}

function hojeISO(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
function isoMesesAtras(meses: number): string {
    const d = new Date()
    d.setMonth(d.getMonth() - meses)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// ── donut de classificação reutilizável ──────────────────────────────────────────

function ClassifDonut({ data }: { data: ContagemItem[] }) {
    if (data.length === 0) return <EmptyState />
    return (
        <ResponsiveContainer width="100%" height={260}>
            <PieChart>
                <Pie
                    data        ={data}
                    cx          ="50%"
                    cy          ="50%"
                    innerRadius ={58}
                    outerRadius ={95}
                    paddingAngle={2}
                    dataKey     ="total"
                    nameKey     ="label"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    label       ={(e: any) => fmtNum(Number(e.total ?? 0))}
                    labelLine   ={false}
                >
                    {data.map((c, i) => (
                        <Cell key={i} fill={corClassif(c.label)} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle  ={TOOLTIP_LABEL_STYLE}
                    itemStyle   ={TOOLTIP_ITEM_STYLE}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter   ={(v: any, _n: any, p: any) => [
                        `${fmtNum(Number(v))} avaliações`,
                        String(p?.payload?.label ?? ""),
                    ]}
                />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    )
}

const PERIODOS = [
    { label: "6 meses",  meses: 6  },
    { label: "12 meses", meses: 12 },
    { label: "24 meses", meses: 24 },
    { label: "Tudo",     meses: 0  },
]

// ── componente principal ───────────────────────────────────────────────────────

export default function TerapiaNutricionalGeralDashboard() {
    const { showMessage } = useMessage()

    const [data,    setData]    = useState<DashboardDto | null>(null)
    const [loading, setLoading] = useState(true)

    const [periodoMeses, setPeriodoMeses] = useState(12)   // default: 12 meses
    const [dataInicio,   setDataInicio]   = useState(isoMesesAtras(12))
    const [dataFim,      setDataFim]      = useState(hojeISO())

    function aplicarPeriodo(meses: number) {
        setPeriodoMeses(meses)
        if (meses > 0) {
            setDataInicio(isoMesesAtras(meses))
            setDataFim(hojeISO())
        } else {
            setDataInicio("")
            setDataFim("")
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true)
        const params = new URLSearchParams()
        if (dataInicio) params.set("dataInicio", dataInicio)
        if (dataFim)    params.set("dataFim",    dataFim)

        api.get<DashboardDto>(`/terapia-nutricional/dashboard/geral?${params.toString()}`)
            .then(r => setData(r.data))
            .catch(() => showMessage("error", "Erro ao carregar dashboard de terapia nutricional"))
            .finally(() => setLoading(false))
    }, [dataInicio, dataFim]) // eslint-disable-line

    if (loading && !data) {
        return (
            <TPage title="Dashboard Terapia Nutricional" breadcrumb={["Dashboards", "Terapia Nutricional"]}>
                <div className="flex justify-center py-16">
                    <span className="w-7 h-7 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            </TPage>
        )
    }

    if (!data) return null

    const porImc     = data.porClassificacaoImc ?? []
    const porFase    = data.porFase             ?? []
    const porFormula = data.porFormula          ?? []
    const ranking    = data.rankingPacientes    ?? []

    return (
        <TPage title="Dashboard Terapia Nutricional" breadcrumb={["Dashboards", "Terapia Nutricional"]}>

            {/* ── Barra de filtros ──────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2 mb-5 items-end">
                <div className="flex flex-col gap-1">
                    <span className="text-sm text-(--text-secondary)">Período</span>
                    <div className="flex gap-1 p-1 bg-(--bg-input) rounded-lg w-fit h-9.5 items-center">
                        {PERIODOS.map(p => (
                            <button
                                key      ={p.meses}
                                type     ="button"
                                onClick  ={() => aplicarPeriodo(p.meses)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition
                                    ${periodoMeses === p.meses
                                        ? "bg-(--accent) text-white shadow-sm"
                                        : "text-(--text-muted) hover:text-(--text-primary)"}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                <TDate name="dataInicio" label="Data Inicial" width="160px"
                    defaultValue={dataInicio} onChange={(v) => { setDataInicio(v); setPeriodoMeses(-1) }} />
                <TDate name="dataFim" label="Data Final" width="160px"
                    defaultValue={dataFim} onChange={(v) => { setDataFim(v); setPeriodoMeses(-1) }} />

                <TButton label="Limpar período" variant="cancel" type="button"
                    onClick={() => aplicarPeriodo(0)} />
            </div>

            {/* ── KPIs ─────────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 mb-5">
                <KpiCard label="Avaliações"        value={fmtNum(data.totalAvaliacoes)}
                    sublabel="total geral" icon={FaClipboardList} color="bg-(--accent)" />
                <KpiCard label="Pacientes"         value={fmtNum(data.totalPacientes)}
                    sublabel="atendidos" icon={FaUsers} color="bg-indigo-500" />
                <KpiCard label="No período"        value={fmtNum(data.avaliacoesNoPeriodo)}
                    sublabel="avaliações no período" icon={FaCalendarAlt} color="bg-emerald-500" />
                <KpiCard label="Kcal/kg média"     value={fmtNum(data.mediaKcalKg, 1)}
                    sublabel="das dietas" icon={FaFireAlt} color="bg-orange-500" />
                <KpiCard label="Proteína g/kg média" value={fmtNum(data.mediaPtnKg, 2)}
                    sublabel="das dietas" icon={FaDrumstickBite} color="bg-rose-500" />
            </div>

            {/* ── Classificação IMC + Fase ──────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaChartPie className="text-blue-500" /> Classificação IMC (OMS)
                    </SectionTitle>
                    <ClassifDonut data={porImc} />
                </div>

                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaLayerGroup className="text-violet-500" /> Distribuição por fase da terapia
                    </SectionTitle>
                    {porFase.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={porFase} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} allowDecimals={false} />
                                <Tooltip
                                    cursor      ={{ fill: "rgba(148, 163, 184, 0.12)" }}
                                    contentStyle={TOOLTIP_STYLE}
                                    labelStyle  ={TOOLTIP_LABEL_STYLE}
                                    itemStyle   ={TOOLTIP_ITEM_STYLE}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter   ={(v: any) => [`${fmtNum(Number(v))} avaliações`, "Avaliações"]}
                                />
                                <RBar dataKey="total" name="Avaliações" fill={PALETTE[5]} radius={[4, 4, 0, 0]} barSize={48} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* ── Fórmulas + ranking de pacientes ───────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaFlask className="text-teal-500" /> Uso de fórmulas enterais
                    </SectionTitle>
                    {porFormula.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <ResponsiveContainer width="100%" height={Math.max(260, porFormula.length * 34)}>
                            <BarChart data={porFormula} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} allowDecimals={false} />
                                <YAxis
                                    type     ="category"
                                    dataKey  ="label"
                                    width    ={140}
                                    tick     ={{ fontSize: 11, fill: AXIS_COLOR }}
                                    stroke   ={AXIS_COLOR}
                                    tickFormatter={(v: string) => v.length > 18 ? `${v.slice(0, 18)}…` : v}
                                />
                                <Tooltip
                                    cursor      ={{ fill: "rgba(148, 163, 184, 0.12)" }}
                                    contentStyle={TOOLTIP_STYLE}
                                    labelStyle  ={TOOLTIP_LABEL_STYLE}
                                    itemStyle   ={TOOLTIP_ITEM_STYLE}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter   ={(v: any, _n: any, p: any) => [
                                        `${fmtNum(Number(v))} avaliações`,
                                        String(p?.payload?.label ?? ""),
                                    ]}
                                />
                                <RBar dataKey="total" name="Avaliações" fill={PALETTE[7]} radius={[0, 4, 4, 0]} barSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaTrophy className="text-amber-500" /> Pacientes mais avaliados
                        <span className="text-(--text-muted) font-normal normal-case">(top 10)</span>
                    </SectionTitle>
                    {ranking.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <ResponsiveContainer width="100%" height={Math.max(260, ranking.length * 34)}>
                            <BarChart data={ranking} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} allowDecimals={false} />
                                <YAxis
                                    type     ="category"
                                    dataKey  ="pessoaNome"
                                    width    ={140}
                                    tick     ={{ fontSize: 11, fill: AXIS_COLOR }}
                                    stroke   ={AXIS_COLOR}
                                    tickFormatter={(v: string) => v.length > 18 ? `${v.slice(0, 18)}…` : v}
                                />
                                <Tooltip
                                    cursor      ={{ fill: "rgba(148, 163, 184, 0.12)" }}
                                    contentStyle={TOOLTIP_STYLE}
                                    labelStyle  ={TOOLTIP_LABEL_STYLE}
                                    itemStyle   ={TOOLTIP_ITEM_STYLE}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter   ={(v: any, _n: any, p: any) => [
                                        `${fmtNum(Number(v))} avaliações`,
                                        String(p?.payload?.pessoaNome ?? ""),
                                    ]}
                                />
                                <RBar dataKey="total" name="Avaliações" fill={PALETTE[0]} radius={[0, 4, 4, 0]} barSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

        </TPage>
    )
}
