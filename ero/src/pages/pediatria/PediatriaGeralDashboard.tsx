import { useEffect, useState } from "react"
import {
    PieChart, Pie, Cell,
    ComposedChart, Bar as RBar,
    BarChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import { api }                                 from "../../services/api"
import { useMessage }                          from "../../hooks/useMessage"
import type {
    PediatriaGeralDashboardDto,
    PediatriaClassificacaoDto,
} from "../../types/PediatriaDashboard"
import { TPage }                               from "../../components/tpage"
import { TDbCombo }                            from "../../components/tdbcombo"
import { TCombo }                              from "../../components/tcombo"
import {
    FaClipboardList, FaUsers, FaCalendarAlt, FaChild,
    FaWeight, FaChartLine, FaPercentage, FaFireAlt,
    FaChartPie, FaFlask, FaBaby, FaVenusMars, FaTrophy,
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

/** Cor da classificação (replicada de ResultadoPediatricoView). */
function corClassif(classif: string | null | undefined): string {
    if (!classif) return "#94a3b8"
    const c = classif.toLowerCase()
    if (c.includes("adequad") || c.includes("normal")) return "#22c55e"
    if (c.includes("baix")    || c.includes("magrez")) return "#3b82f6"
    if (c.includes("acima")   || c.includes("sobrepeso") || c.includes("alta")) return "#f59e0b"
    return "#94a3b8"
}

/** Cor por sexo. */
function corSexo(sexo: string): string {
    if (sexo === "M") return "#3b82f6"
    if (sexo === "F") return "#ec4899"
    return "#94a3b8"
}
function sexoLabel(s: string) {
    if (s === "M") return "Masculino"
    if (s === "F") return "Feminino"
    return s || "—"
}

const PERIODOS = [
    { label: "6 meses",  dias: 180 },
    { label: "12 meses", dias: 365 },
    { label: "24 meses", dias: 730 },
    { label: "Tudo",     dias: 0   },
]

// Faixas de mês de vida — limites idênticos ao PediatriaDashboardService.
const FAIXAS_MES: { label: string; min?: number; max?: number }[] = [
    { label: "Todas"  },
    { label: "0–6",   min: 0,  max: 6  },
    { label: "6–12",  min: 6,  max: 12 },
    { label: "12–24", min: 12, max: 24 },
    { label: "24–36", min: 24, max: 36 },
    { label: "36–60", min: 36, max: 60 },
    { label: "60+",   min: 60          },
]

// ── donut de classificação reutilizável ──────────────────────────────────────────

function ClassifDonut({ data }: { data: PediatriaClassificacaoDto[] }) {
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
                    dataKey     ="quantidade"
                    nameKey     ="classificacao"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    label       ={(e: any) => fmtNum(Number(e.quantidade ?? 0))}
                    labelLine   ={false}
                >
                    {data.map((c, i) => (
                        <Cell key={i} fill={corClassif(c.classificacao)} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle  ={TOOLTIP_LABEL_STYLE}
                    itemStyle   ={TOOLTIP_ITEM_STYLE}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter   ={(v: any, _n: any, p: any) => [
                        `${fmtNum(Number(v))} avaliações`,
                        String(p?.payload?.classificacao ?? ""),
                    ]}
                />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    )
}

// ── componente principal ───────────────────────────────────────────────────────

export default function PediatriaGeralDashboard() {
    const { showMessage } = useMessage()

    const [data,    setData]    = useState<PediatriaGeralDashboardDto | null>(null)
    const [loading, setLoading] = useState(true)

    const [periodo,   setPeriodo]   = useState(365)   // default: 12 meses
    const [faixaIdx,  setFaixaIdx]  = useState(0)      // default: Todas
    const [formulaId, setFormulaId] = useState("")
    const [sexo,      setSexo]      = useState("")

    useEffect(() => {
        setLoading(true)

        const faixa  = FAIXAS_MES[faixaIdx]
        const params = new URLSearchParams()
        params.set("dias", String(periodo))
        if (formulaId)         params.set("formulaLacteaId", formulaId)
        if (faixa.min != null) params.set("mesesMin", String(faixa.min))
        if (faixa.max != null) params.set("mesesMax", String(faixa.max))
        if (sexo)              params.set("sexo", sexo)

        api.get<PediatriaGeralDashboardDto>(`/pediatria/dashboard/geral?${params.toString()}`)
            .then(r => setData(r.data))
            .catch(() => showMessage("error", "Erro ao carregar dashboard de pediatria"))
            .finally(() => setLoading(false))
    }, [periodo, faixaIdx, formulaId, sexo]) // eslint-disable-line

    if (loading && !data) {
        return (
            <TPage title="Dashboard Pediatria" breadcrumb={["Dashboards", "Pediatria"]}>
                <div className="flex justify-center py-16">
                    <span className="w-7 h-7 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            </TPage>
        )
    }

    if (!data) return null

    const porPeriodo  = data.porPeriodo             ?? []
    const porFormula  = data.porFormula             ?? []
    const porFaixa    = data.porFaixaEtaria         ?? []
    const porSexo     = data.porSexo                ?? []
    const ranking     = data.pacientesMaisAvaliados ?? []

    return (
        <TPage title="Dashboard Pediatria" breadcrumb={["Dashboards", "Pediatria"]}>

            {/* ── Barra de filtros ──────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2 mb-5 items-end">

                {/* período */}
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

                {/* faixa de mês de vida */}
                <TCombo
                    name        ="faixaMes"
                    label       ="Faixa de mês de vida"
                    width       ="180px"
                    defaultValue={String(faixaIdx)}
                    options     ={FAIXAS_MES.map((f, i) => ({ value: String(i), label: f.label }))}
                    onChange    ={(v) => setFaixaIdx(Number(v) || 0)}
                />

                {/* fórmula */}
                <TDbCombo
                    name        ="formulaLacteaId"
                    label       ="Fórmula"
                    url         ="/formulas-lacteas/select"
                    valueField  ="id"
                    displayField="nome"
                    searchField ="nome"
                    placeholder ="Todas"
                    width       ="220px"
                    value       ={formulaId}
                    onChange    ={setFormulaId}
                />

                {/* sexo */}
                <TCombo
                    name        ="sexo"
                    label       ="Sexo"
                    width       ="150px"
                    placeholder ="Todos"
                    defaultValue={sexo}
                    options     ={[
                        { value: "",  label: "Todos"      },
                        { value: "M", label: "Masculino"  },
                        { value: "F", label: "Feminino"   },
                    ]}
                    onChange    ={setSexo}
                />
            </div>

            {/* ── KPIs ─────────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 mb-5">
                <KpiCard label="Avaliações"        value={fmtNum(data.totalAvaliacoes)}
                    sublabel="no período" icon={FaClipboardList} color="bg-(--accent)" />
                <KpiCard label="Pacientes"         value={fmtNum(data.totalPacientes)}
                    sublabel="atendidos no período" icon={FaUsers} color="bg-indigo-500" />
                <KpiCard label="Avaliações no mês" value={fmtNum(data.avaliacoesMes)}
                    sublabel="mês atual" icon={FaCalendarAlt} color="bg-emerald-500" />
                <KpiCard label="Idade média"       value={`${fmtNum(data.idadeMediaMeses, 1)} m`}
                    sublabel="meses de vida" icon={FaChild} color="bg-violet-500" />
                <KpiCard label="Peso médio"        value={`${fmtNum(data.pesoMedio, 2)} kg`}
                    sublabel="das avaliações" icon={FaWeight} color="bg-blue-500" />
                <KpiCard label="IMC médio"         value={fmtNum(data.imcMedio, 2)}
                    sublabel="das avaliações" icon={FaChartLine} color="bg-amber-500" />
                <KpiCard label="% IMC adequado"    value={`${fmtNum(data.percImcAdequado, 1)}%`}
                    sublabel="classificação adequada" icon={FaPercentage} color="bg-emerald-500" />
                <KpiCard label="Cobertura calórica" value={`${fmtNum(data.coberturaCaloricaMedia, 1)}%`}
                    sublabel="média (% calórico)" icon={FaFireAlt} color="bg-orange-500" />
            </div>

            {/* ── Avaliações por período ─────────────────────────────────────── */}
            <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                <SectionTitle>
                    <FaCalendarAlt className="text-(--accent)" /> Avaliações por período
                </SectionTitle>
                {porPeriodo.length === 0 ? (
                    <EmptyState />
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={porPeriodo} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} vertical={false} />
                            <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                            <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} allowDecimals={false} />
                            <Tooltip
                                cursor      ={{ fill: "rgba(148, 163, 184, 0.12)" }}
                                contentStyle={TOOLTIP_STYLE}
                                labelStyle  ={TOOLTIP_LABEL_STYLE}
                                itemStyle   ={TOOLTIP_ITEM_STYLE}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter   ={(v: any) => [`${fmtNum(Number(v))} avaliações`, "Avaliações"]}
                            />
                            <RBar dataKey="avaliacoes" name="Avaliações" fill={PALETTE[0]} radius={[4, 4, 0, 0]} barSize={28} />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* ── 3 distribuições de classificação ──────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaChartPie className="text-blue-500" /> Classificação Peso / Idade
                    </SectionTitle>
                    <ClassifDonut data={data.porClassifPesoIdade ?? []} />
                </div>

                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaChartPie className="text-green-500" /> Classificação Estatura / Idade
                    </SectionTitle>
                    <ClassifDonut data={data.porClassifEstaturaIdade ?? []} />
                </div>
            </div>

            <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                <SectionTitle>
                    <FaChartPie className="text-amber-500" /> Classificação IMC / Idade
                </SectionTitle>
                <ClassifDonut data={data.porClassifImcIdade ?? []} />
            </div>

            {/* ── Uso de fórmulas + faixa etária ────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaFlask className="text-teal-500" /> Uso de fórmulas
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
                                    dataKey  ="formulaNome"
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
                                        String(p?.payload?.formulaNome ?? ""),
                                    ]}
                                />
                                <RBar dataKey="quantidade" name="Avaliações" fill={PALETTE[7]} radius={[0, 4, 4, 0]} barSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaBaby className="text-(--accent)" /> Distribuição por faixa etária
                    </SectionTitle>
                    {porFaixa.length === 0 || porFaixa.every(f => f.quantidade === 0) ? (
                        <EmptyState />
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={porFaixa} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} vertical={false} />
                                <XAxis dataKey="faixa" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} allowDecimals={false} />
                                <Tooltip
                                    cursor      ={{ fill: "rgba(148, 163, 184, 0.12)" }}
                                    contentStyle={TOOLTIP_STYLE}
                                    labelStyle  ={TOOLTIP_LABEL_STYLE}
                                    itemStyle   ={TOOLTIP_ITEM_STYLE}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter   ={(v: any, _n: any, p: any) => [
                                        `${fmtNum(Number(v))} avaliações`,
                                        `${p?.payload?.faixa ?? ""} meses`,
                                    ]}
                                />
                                <RBar dataKey="quantidade" name="Avaliações" fill={PALETTE[5]} radius={[4, 4, 0, 0]} barSize={36} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* ── Sexo + pacientes mais avaliados ───────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaVenusMars className="text-pink-500" /> Distribuição por sexo
                    </SectionTitle>
                    {porSexo.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data        ={porSexo}
                                    cx          ="50%"
                                    cy          ="50%"
                                    outerRadius ={100}
                                    paddingAngle={2}
                                    dataKey     ="quantidade"
                                    nameKey     ="sexo"
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    label       ={(e: any) =>
                                        `${sexoLabel(String(e.sexo))}: ${fmtNum(Number(e.quantidade ?? 0))}`}
                                    labelLine   ={false}
                                >
                                    {porSexo.map((s, i) => (
                                        <Cell key={i} fill={corSexo(s.sexo)} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={TOOLTIP_STYLE}
                                    labelStyle  ={TOOLTIP_LABEL_STYLE}
                                    itemStyle   ={TOOLTIP_ITEM_STYLE}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter   ={(v: any, _n: any, p: any) => [
                                        `${fmtNum(Number(v))} avaliações`,
                                        sexoLabel(String(p?.payload?.sexo ?? "")),
                                    ]}
                                />
                                <Legend formatter={(value: string) => sexoLabel(value)} />
                            </PieChart>
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
                        <ResponsiveContainer width="100%" height={Math.max(280, ranking.length * 34)}>
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
                                <RBar dataKey="avaliacoes" name="Avaliações" fill={PALETTE[0]} radius={[0, 4, 4, 0]} barSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

        </TPage>
    )
}
