import { useEffect, useState }                          from "react"
import {
    PieChart, Pie, Cell,
    ComposedChart, Bar as RBar, Line as RLine,
    BarChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import { api }                                           from "../../services/api"
import { useMessage }                                    from "../../hooks/useMessage"
import { displayEmitente }                               from "../../utils/pessoas"
import type {
    DocumentoDashboardResponse,
    StatusDistribuicaoDto,
    PeriodoDto,
    EmitenteRankingDto,
    CidadeRankingDto,
    PessoaRankingDto,
} from "../../types/DocumentoDashboard"
import { TPage }                                         from "../../components/tpage"
import { TCombo }                                        from "../../components/tcombo"
import { TDbCombo }                                      from "../../components/tdbcombo"
import {
    FaFileContract, FaCheckCircle, FaPenFancy, FaBan,
    FaMoneyBillWave, FaTrophy, FaChartPie, FaBuilding,
    FaChartLine, FaMapMarkerAlt, FaUsers, FaCalendarAlt,
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

// cores fixas por status
const STATUS_META: Record<string, { label: string; cor: string }> = {
    EMITIDO:   { label: "Emitido",   cor: "#10b981" },   // emerald
    RASCUNHO:  { label: "Rascunho",  cor: "#f59e0b" },   // amber
    CANCELADO: { label: "Cancelado", cor: "#ef4444" },   // red
}
function statusLabel(s: string) { return STATUS_META[s]?.label ?? s }
function statusCor(s: string)   { return STATUS_META[s]?.cor   ?? "#94a3b8" }

const PERIODOS = [
    { label: "30 dias",   dias: 30  },
    { label: "90 dias",   dias: 90  },
    { label: "12 meses",  dias: 365 },
    { label: "Tudo",      dias: 0   },
]

interface CidadeOption { value: string; label: string }

// ── componente principal ───────────────────────────────────────────────────────

export default function DocumentoDashboard() {
    const { showMessage }  = useMessage()

    const [data,    setData]    = useState<DocumentoDashboardResponse | null>(null)
    const [loading, setLoading] = useState(true)

    const [periodo,      setPeriodo]      = useState(365)
    const [statusFiltro, setStatusFiltro] = useState("")
    const [emitenteId,   setEmitenteId]   = useState("")
    const [cidadeId,     setCidadeId]     = useState("")

    // mantém a lista de cidades estável: só atualiza quando NÃO está filtrando por cidade
    const [cidadeOptions, setCidadeOptions] = useState<CidadeOption[]>([])

    useEffect(() => {
        setLoading(true)

        const params = new URLSearchParams()
        params.set("dias", String(periodo))
        if (statusFiltro) params.set("status",      statusFiltro)
        if (emitenteId)   params.set("emitenteId",  emitenteId)
        if (cidadeId)     params.set("cidadeId",    cidadeId)

        api.get<DocumentoDashboardResponse>(`/documentos/dashboard?${params.toString()}`)
            .then(r => {
                setData(r.data)

                // só repopula as opções de cidade quando não há filtro de cidade ativo,
                // assim a lista não encolhe ao selecionar uma cidade
                if (!cidadeId) {
                    setCidadeOptions(
                        (r.data.porCidade ?? [])
                            .filter(c => c.cidadeId != null)
                            .map(c => ({
                                value: String(c.cidadeId),
                                label: `${c.nome}/${c.uf}`,
                            })),
                    )
                }
            })
            .catch(() => showMessage("error", "Erro ao carregar dashboard de documentos"))
            .finally(() => setLoading(false))
    }, [periodo, statusFiltro, emitenteId, cidadeId]) // eslint-disable-line

    // ── loading ──────────────────────────────────────────────────────────────
    if (loading && !data) {
        return (
            <TPage title="Dashboard Contratos" breadcrumb={["Dashboards", "Contratos"]}>
                <div className="flex justify-center py-16">
                    <span className="w-7 h-7 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            </TPage>
        )
    }

    if (!data) return null

    // dados dos gráficos
    const statusData:   StatusDistribuicaoDto[] = data.porStatus  ?? []
    const periodoData:  PeriodoDto[]            = data.porPeriodo ?? []
    const emitenteData: EmitenteRankingDto[]    = (data.porEmitente ?? []).slice(0, 8)
    const cidadeData:   CidadeRankingDto[]      = (data.porCidade   ?? []).slice(0, 10)
    const pessoaData:   PessoaRankingDto[]      = (data.porPessoa   ?? []).slice(0, 10)

    return (
        <TPage title="Dashboard Contratos" breadcrumb={["Dashboards", "Contratos"]}>

            {/* ── Barra de filtros ──────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2 mb-5 items-end">

                {/* período */}
                <div className="flex gap-1 p-1 bg-(--bg-input) rounded-lg w-fit">
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

                {/* status */}
                <TCombo
                    name        ="status"
                    label       ="Status"
                    width       ="170px"
                    placeholder ="Todos"
                    defaultValue={statusFiltro}
                    options     ={[
                        { value: "",          label: "Todos"     },
                        { value: "RASCUNHO",  label: "Rascunho"  },
                        { value: "EMITIDO",   label: "Emitido"   },
                        { value: "CANCELADO", label: "Cancelado" },
                    ]}
                    onChange    ={setStatusFiltro}
                />

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

                {/* cidade */}
                <TCombo
                    name        ="cidadeId"
                    label       ="Cidade"
                    width       ="210px"
                    placeholder ="Todas"
                    defaultValue={cidadeId}
                    options     ={[{ value: "", label: "Todas" }, ...cidadeOptions]}
                    onChange    ={setCidadeId}
                />
            </div>

            {/* ── KPIs ─────────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 mb-5">
                <KpiCard label="Total de contratos" value={data.totalDocumentos}
                    sublabel="no período selecionado"
                    icon={FaFileContract} color="bg-(--accent)" />
                <KpiCard label="Emitidos" value={data.totalEmitidos}
                    sublabel="no período selecionado"
                    icon={FaCheckCircle} color="bg-emerald-500" />
                <KpiCard label="Rascunhos" value={data.totalRascunhos}
                    sublabel="aguardando emissão"
                    icon={FaPenFancy} color="bg-amber-500" />
                <KpiCard label="Cancelados" value={data.totalCancelados}
                    sublabel="no período selecionado"
                    icon={FaBan} color="bg-red-500" />
                <KpiCard label="Valor total emitido" value={data.valorTotalEmitido}
                    sublabel="contratos emitidos" money
                    icon={FaMoneyBillWave} color="bg-teal-500" />
                <KpiCard label="Valor emitido (mês)" value={data.valorEmitidoMes}
                    sublabel="mês atual" money
                    icon={FaChartLine} color="bg-indigo-500" />
                <KpiCard label="Ticket médio" value={data.ticketMedio}
                    sublabel="por contrato emitido" money
                    icon={FaTrophy} color="bg-violet-500" />
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
                                    data       ={statusData}
                                    cx         ="50%"
                                    cy         ="50%"
                                    innerRadius={62}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey    ="quantidade"
                                    nameKey    ="status"
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    label      ={(e: any) =>
                                        `${statusLabel(String(e.status))}: ${fmtNum(Number(e.quantidade ?? 0))}`}
                                    labelLine  ={false}
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
                                        `${fmtNum(Number(v))} contratos · ${fmtMoeda(Number(p?.payload?.valor ?? 0))}`,
                                        statusLabel(String(p?.payload?.status ?? "")),
                                    ]}
                                />
                                <Legend formatter={(value: string) => statusLabel(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Contratos por emitente */}
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaBuilding className="text-indigo-500" /> Contratos por emitente
                    </SectionTitle>
                    {emitenteData.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data       ={emitenteData}
                                    cx         ="50%"
                                    cy         ="50%"
                                    innerRadius={62}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey    ="quantidade"
                                    nameKey    ="nome"
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    label      ={(e: any) => fmtNum(Number(e.quantidade ?? 0))}
                                    labelLine  ={false}
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
                                        `${fmtNum(Number(v))} contratos · ${fmtMoeda(Number(p?.payload?.valor ?? 0))}`,
                                        String(p?.payload?.nome ?? ""),
                                    ]}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* ── Contratos por período ─────────────────────────────────────── */}
            <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                <SectionTitle>
                    <FaCalendarAlt className="text-(--accent)" /> Contratos por período
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
                                    n === "Valor" ? [fmtMoeda(Number(v)), "Valor"] : [fmtNum(Number(v)), "Quantidade"]}
                            />
                            <Legend />
                            <RBar  yAxisId="left"  dataKey="quantidade" name="Quantidade" fill={PALETTE[0]} radius={[4, 4, 0, 0]} barSize={28} />
                            <RLine yAxisId="right" dataKey="valor"      name="Valor"      stroke={PALETTE[1]} strokeWidth={2} dot={{ r: 3 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* ── Linha: cidade + pessoa (barras horizontais) ───────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Contratos por cidade */}
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaMapMarkerAlt className="text-emerald-500" /> Contratos por cidade
                        <span className="text-(--text-muted) font-normal normal-case">(top 10)</span>
                    </SectionTitle>
                    {cidadeData.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <ResponsiveContainer width="100%" height={Math.max(280, cidadeData.length * 34)}>
                            <BarChart
                                data   ={cidadeData}
                                layout ="vertical"
                                margin ={{ top: 4, right: 24, left: 8, bottom: 4 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} allowDecimals={false} />
                                <YAxis
                                    type     ="category"
                                    dataKey  ="nome"
                                    width    ={120}
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
                                        `${fmtNum(Number(v))} contratos · ${fmtMoeda(Number(p?.payload?.valor ?? 0))}`,
                                        `${p?.payload?.nome ?? ""}${p?.payload?.uf ? "/" + p.payload.uf : ""}`,
                                    ]}
                                />
                                <RBar dataKey="quantidade" name="Contratos" fill={PALETTE[1]} radius={[0, 4, 4, 0]} barSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Contratos por pessoa */}
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaUsers className="text-violet-500" /> Contratos por cliente
                        <span className="text-(--text-muted) font-normal normal-case">(top 10)</span>
                    </SectionTitle>
                    {pessoaData.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <ResponsiveContainer width="100%" height={Math.max(280, pessoaData.length * 34)}>
                            <BarChart
                                data   ={pessoaData}
                                layout ="vertical"
                                margin ={{ top: 4, right: 24, left: 8, bottom: 4 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} allowDecimals={false} />
                                <YAxis
                                    type     ="category"
                                    dataKey  ="nome"
                                    width    ={120}
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
                                        `${fmtNum(Number(v))} contratos · ${fmtMoeda(Number(p?.payload?.valor ?? 0))}`,
                                        String(p?.payload?.nome ?? ""),
                                    ]}
                                />
                                <RBar dataKey="quantidade" name="Contratos" fill={PALETTE[5]} radius={[0, 4, 4, 0]} barSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

        </TPage>
    )
}
