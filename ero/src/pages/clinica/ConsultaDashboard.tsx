import { useEffect, useState }                          from "react"
import {
    PieChart, Pie, Cell,
    ComposedChart, Bar as RBar, Line as RLine,
    BarChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import { api }                                           from "../../services/api"
import { useMessage }                                    from "../../hooks/useMessage"
import { displayEmitente, displayPessoa }               from "../../utils/pessoas"
import type {
    ConsultaAnaliticoResponse,
    StatusDistribuicaoDto,
    PeriodoDto,
    ServicoRankingAnaliticoDto,
    EmitenteRankingDto,
    ClienteRankingAnaliticoDto,
    DiaSemanaAnaliticoDto,
} from "../../types/ConsultaDashboard"
import { TPage }                                         from "../../components/tpage"
import { TCombo }                                        from "../../components/tcombo"
import { TDbCombo }                                      from "../../components/tdbcombo"
import {
    FaStethoscope, FaCheckCircle, FaBan, FaRedo,
    FaPercentage, FaMoneyBillWave, FaChartLine, FaTrophy,
    FaChartPie, FaBuilding, FaUsers, FaCalendarAlt,
} from "react-icons/fa"

// ── helpers visuais ────────────────────────────────────────────────────────────

function fmtMoeda(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function fmtNum(v: number) {
    return v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })
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

function EmptyState({ children = "Sem dados no período" }: { children?: React.ReactNode }) {
    return <p className="text-sm text-(--text-muted) py-10 text-center">{children}</p>
}

// ── paleta (Recharts não lê CSS vars em fills SVG) ──────────────────────────────

const PALETTE = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"]

// cores neutras para tooltip/eixos/grid que funcionam em tema claro/escuro
const AXIS_COLOR = "#94a3b8"   // slate-400
const GRID_COLOR = "#cbd5e1"   // slate-300
const TOOLTIP_STYLE: React.CSSProperties = {
    background:   "rgba(30, 41, 59, 0.95)",   // slate-800
    border:       "1px solid rgba(148, 163, 184, 0.4)",
    borderRadius: 8,
    color:        "#f8fafc",
    fontSize:     12,
}
const TOOLTIP_LABEL_STYLE: React.CSSProperties = { color: "#cbd5e1", marginBottom: 4 }
const TOOLTIP_ITEM_STYLE:  React.CSSProperties = { color: "#f8fafc" }

// cores fixas por status de consulta
const STATUS_META: Record<string, { label: string; cor: string }> = {
    CONCLUIDA:      { label: "Concluída",      cor: "#10b981" },   // emerald
    AGENDADA:       { label: "Agendada",       cor: "#6366f1" },   // indigo
    EM_ATENDIMENTO: { label: "Em atendimento", cor: "#f59e0b" },   // amber
    CANCELADA:      { label: "Cancelada",      cor: "#ef4444" },   // red
}
function statusLabel(s: string) { return STATUS_META[s]?.label ?? s }
function statusCor(s: string)   { return STATUS_META[s]?.cor   ?? "#94a3b8" }

const PERIODOS = [
    { label: "30 dias",   dias: 30  },
    { label: "90 dias",   dias: 90  },
    { label: "12 meses",  dias: 365 },
    { label: "Tudo",      dias: 0   },
]

// ── componente principal ───────────────────────────────────────────────────────

export default function ConsultaDashboard() {
    const { showMessage }  = useMessage()

    const [data,    setData]    = useState<ConsultaAnaliticoResponse | null>(null)
    const [loading, setLoading] = useState(true)

    const [periodo,    setPeriodo]    = useState(365)
    const [emitenteId, setEmitenteId] = useState("")
    const [status,     setStatus]     = useState("")
    const [pessoaId,   setPessoaId]   = useState("")

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true)

        const params = new URLSearchParams()
        params.set("dias", String(periodo))
        if (emitenteId) params.set("emitenteId", emitenteId)
        if (status)     params.set("status",     status)
        if (pessoaId)   params.set("pessoaId",    pessoaId)

        api.get<ConsultaAnaliticoResponse>(`/consultas/dashboard/analitico?${params.toString()}`)
            .then(r => setData(r.data))
            .catch(() => showMessage("error", "Erro ao carregar dashboard de consultas"))
            .finally(() => setLoading(false))
    }, [periodo, emitenteId, status, pessoaId]) // eslint-disable-line

    // ── loading inicial ────────────────────────────────────────────────────────
    if (loading && !data) {
        return (
            <TPage title="Dashboard Consultas" breadcrumb={["Dashboards", "Consultas"]}>
                <div className="flex justify-center py-16">
                    <span className="w-7 h-7 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            </TPage>
        )
    }

    if (!data) return null

    // dados dos gráficos
    const statusData:   StatusDistribuicaoDto[]        = data.porStatus           ?? []
    const periodoData:  PeriodoDto[]                   = data.porPeriodo          ?? []
    const servicoData:  ServicoRankingAnaliticoDto[]   = (data.servicosMaisVendidos ?? []).slice(0, 10)
    const emitenteData: EmitenteRankingDto[]           = (data.porEmitente ?? []).filter(e => e.receita > 0)
    const clienteData:  ClienteRankingAnaliticoDto[]   = (data.clientesMaisFieis ?? []).slice(0, 10)
    const diaSemanaData: DiaSemanaAnaliticoDto[]       = data.porDiaSemana        ?? []

    return (
        <TPage title="Dashboard Consultas" breadcrumb={["Dashboards", "Consultas"]}>

            {/* ── Barra de filtros ──────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2 mb-5 items-end">

                {/* período */}
                <div className="flex gap-1 p-1 bg-(--bg-input) rounded-lg w-fit">
                    {PERIODOS.map(p => (
                        <button
                            key      ={p.dias}
                            type     ="button"
                            onClick  ={() => setPeriodo(p.dias)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition
                                ${periodo === p.dias
                                    ? "bg-(--accent) text-white shadow-sm"
                                    : "text-(--text-muted) hover:text-(--text-primary)"}`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* emitente */}
                <TDbCombo
                    name        ="emitenteId"
                    label       ="Emitente"
                    url         ="/emitentes/select"
                    valueField  ="id"
                    displayField={displayEmitente}
                    searchField ="nome"
                    placeholder ="Todos"
                    width       ="260px"
                    value       ={emitenteId}
                    onChange    ={setEmitenteId}
                />

                {/* status */}
                <TCombo
                    name        ="status"
                    label       ="Status"
                    width       ="180px"
                    placeholder ="Todos"
                    defaultValue={status}
                    options     ={[
                        { value: "",               label: "Todos"          },
                        { value: "AGENDADA",       label: "Agendada"       },
                        { value: "EM_ATENDIMENTO", label: "Em atendimento" },
                        { value: "CONCLUIDA",      label: "Concluída"      },
                        { value: "CANCELADA",      label: "Cancelada"      },
                    ]}
                    onChange    ={setStatus}
                />

                {/* paciente */}
                <TDbCombo
                    name        ="pessoaId"
                    label       ="Paciente"
                    url         ="/pessoas/select"
                    valueField  ="id"
                    displayField={displayPessoa}
                    searchField ="nome"
                    placeholder ="Todos"
                    width       ="260px"
                    value       ={pessoaId}
                    onChange    ={setPessoaId}
                />
            </div>

            {/* ── KPIs ─────────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 mb-5">
                <KpiCard label="Total de consultas" value={data.totalConsultas}
                    sublabel="no período selecionado"
                    icon={FaStethoscope} color="bg-(--accent)" />
                <KpiCard label="Concluídas" value={data.totalConcluidas}
                    sublabel="no período selecionado"
                    icon={FaCheckCircle} color="bg-emerald-500" />
                <KpiCard label="Canceladas" value={data.totalCanceladas}
                    sublabel="no período selecionado"
                    icon={FaBan} color="bg-red-500" />
                <KpiCard label="Reconsultas" value={data.totalReconsultas}
                    sublabel="retornos no período"
                    icon={FaRedo} color="bg-indigo-500" />
                <KpiCard label="Taxa de reconsulta" value={data.taxaReconsulta}
                    sublabel={`${fmtNum(data.taxaReconsulta)}% das consultas`}
                    icon={FaPercentage} color="bg-violet-500" />
                <KpiCard label="Receita total" value={data.receitaTotal}
                    sublabel="no período selecionado" money
                    icon={FaMoneyBillWave} color="bg-teal-500" />
                <KpiCard label="Receita no mês" value={data.receitaMes}
                    sublabel="mês atual" money
                    icon={FaChartLine} color="bg-emerald-500" />
                <KpiCard label="Ticket médio" value={data.ticketMedio}
                    sublabel="por consulta concluída" money
                    icon={FaTrophy} color="bg-amber-500" />
            </div>

            {/* ── Linha: status + emitente (donuts) ─────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

                {/* Distribuição por status */}
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaChartPie className="text-(--accent)" /> Distribuição por status
                    </SectionTitle>
                    {statusData.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data        ={statusData}
                                    cx          ="50%"
                                    cy          ="50%"
                                    innerRadius ={62}
                                    outerRadius ={100}
                                    paddingAngle={2}
                                    dataKey     ="quantidade"
                                    nameKey     ="status"
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    label       ={(e: any) =>
                                        `${statusLabel(String(e.status))}: ${fmtNum(Number(e.quantidade ?? 0))}`}
                                    labelLine   ={false}
                                >
                                    {statusData.map((s, i) => (
                                        <Cell key={i} fill={statusCor(s.status)} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={TOOLTIP_STYLE}
                                    labelStyle  ={TOOLTIP_LABEL_STYLE}
                                    itemStyle   ={TOOLTIP_ITEM_STYLE}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter   ={(v: any, _n: any, p: any) => [
                                        `${fmtNum(Number(v))} consultas`,
                                        statusLabel(String(p?.payload?.status ?? "")),
                                    ]}
                                />
                                <Legend formatter={(value: string) => statusLabel(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Receita por emitente */}
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaBuilding className="text-indigo-500" /> Receita por emitente
                    </SectionTitle>
                    {emitenteData.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data        ={emitenteData}
                                    cx          ="50%"
                                    cy          ="50%"
                                    innerRadius ={62}
                                    outerRadius ={100}
                                    paddingAngle={2}
                                    dataKey     ="receita"
                                    nameKey     ="nome"
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    label       ={(e: any) => fmtMoeda(Number(e.receita ?? 0))}
                                    labelLine   ={false}
                                >
                                    {emitenteData.map((e, i) => (
                                        <Cell key={i} fill={e.cor || PALETTE[i % PALETTE.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={TOOLTIP_STYLE}
                                    labelStyle  ={TOOLTIP_LABEL_STYLE}
                                    itemStyle   ={TOOLTIP_ITEM_STYLE}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter   ={(v: any, _n: any, p: any) => [
                                        `${fmtMoeda(Number(v))} · ${fmtNum(Number(p?.payload?.consultas ?? 0))} consultas`,
                                        String(p?.payload?.nome ?? ""),
                                    ]}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* ── Faturamento por período ───────────────────────────────────── */}
            <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                <SectionTitle>
                    <FaCalendarAlt className="text-(--accent)" /> Faturamento por período
                </SectionTitle>
                {periodoData.length === 0 ? (
                    <EmptyState />
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={periodoData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
                            <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                            <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} allowDecimals={false} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR}
                                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                labelStyle  ={TOOLTIP_LABEL_STYLE}
                                itemStyle   ={TOOLTIP_ITEM_STYLE}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter   ={(v: any, n: any) =>
                                    n === "Receita" ? [fmtMoeda(Number(v)), "Receita"] : [fmtNum(Number(v)), "Consultas"]}
                            />
                            <Legend />
                            <RBar  yAxisId="left"  dataKey="consultas" name="Consultas" fill={PALETTE[0]} radius={[4, 4, 0, 0]} barSize={28} />
                            <RLine yAxisId="right" dataKey="receita"   name="Receita"   stroke={PALETTE[1]} strokeWidth={2} dot={{ r: 3 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* ── Serviços mais realizados (barras horizontais) ─────────────── */}
            <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                <SectionTitle>
                    <FaTrophy className="text-amber-500" /> Serviços mais realizados
                    <span className="text-(--text-muted) font-normal normal-case">(top 10)</span>
                </SectionTitle>
                {servicoData.length === 0 ? (
                    <EmptyState />
                ) : (
                    <ResponsiveContainer width="100%" height={Math.max(280, servicoData.length * 36)}>
                        <BarChart
                            data   ={servicoData}
                            layout ="vertical"
                            margin ={{ top: 4, right: 24, left: 8, bottom: 4 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR}
                                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                            <YAxis
                                type     ="category"
                                dataKey  ="servicoNome"
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
                                    `${fmtMoeda(Number(v))} · ${fmtNum(Number(p?.payload?.atendimentos ?? 0))} atend.`,
                                    String(p?.payload?.servicoNome ?? ""),
                                ]}
                            />
                            <RBar dataKey="receitaTotal" name="Receita" fill={PALETTE[1]} radius={[0, 4, 4, 0]} barSize={18} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* ── Linha: clientes + dia da semana ───────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Clientes mais fiéis */}
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaUsers className="text-violet-500" /> Clientes mais fiéis
                        <span className="text-(--text-muted) font-normal normal-case">(top 10)</span>
                    </SectionTitle>
                    {clienteData.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <ResponsiveContainer width="100%" height={Math.max(280, clienteData.length * 34)}>
                            <BarChart
                                data   ={clienteData}
                                layout ="vertical"
                                margin ={{ top: 4, right: 24, left: 8, bottom: 4 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} allowDecimals={false} />
                                <YAxis
                                    type     ="category"
                                    dataKey  ="pessoaNome"
                                    width    ={130}
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
                                        `${fmtNum(Number(v))} consultas · ${fmtMoeda(Number(p?.payload?.receitaTotal ?? 0))}`,
                                        String(p?.payload?.pessoaNome ?? ""),
                                    ]}
                                />
                                <RBar dataKey="consultas" name="Consultas" fill={PALETTE[0]} radius={[0, 4, 4, 0]} barSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Atendimentos por dia da semana */}
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaCalendarAlt className="text-(--accent)" /> Atendimentos por dia da semana
                    </SectionTitle>
                    {diaSemanaData.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={diaSemanaData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} vertical={false} />
                                <XAxis dataKey="diaSemana" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} allowDecimals={false} />
                                <Tooltip
                                    cursor      ={{ fill: "rgba(148, 163, 184, 0.12)" }}
                                    contentStyle={TOOLTIP_STYLE}
                                    labelStyle  ={TOOLTIP_LABEL_STYLE}
                                    itemStyle   ={TOOLTIP_ITEM_STYLE}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter   ={(v: any, _n: any, p: any) => [
                                        `${fmtNum(Number(v))} atend. · ${fmtMoeda(Number(p?.payload?.receita ?? 0))}`,
                                        String(p?.payload?.diaSemana ?? ""),
                                    ]}
                                />
                                <RBar dataKey="atendimentos" name="Atendimentos" fill={PALETTE[5]} radius={[4, 4, 0, 0]} barSize={28} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

        </TPage>
    )
}
