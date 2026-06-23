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
    PedidoDashboardResponse,
    StatusDistribuicaoDto,
    PeriodoDto,
    TipoPedidoRankingDto,
    ProdutoRankingDto,
    EmitenteRankingDto,
    ClienteRankingDto,
    DiaSemanaDto,
} from "../../types/PedidoDashboard"
import type { TipoPedidoSummary }                        from "../../types/Pedido"
import { TPage }                                         from "../../components/tpage"
import { TCombo }                                        from "../../components/tcombo"
import { TDbCombo }                                      from "../../components/tdbcombo"
import { TDate }                                         from "../../components/tdate"
import {
    FaShoppingCart, FaFolderOpen, FaCheckCircle, FaBan,
    FaMoneyBillWave, FaChartLine, FaTrophy,
    FaChartPie, FaBuilding, FaUsers, FaCalendarAlt, FaTags,
} from "react-icons/fa"

// ── helpers visuais ────────────────────────────────────────────────────────────

function fmtMoeda(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}
function fmtNum(v: number) {
    return v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })
}
function todayStr() { return new Date().toISOString().slice(0, 10) }
function daysAgoStr(n: number) {
    const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10)
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
    label: string; value: number; sublabel?: string
    icon: React.ElementType; color: string; money?: boolean
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

const PALETTE = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"]
const AXIS_COLOR = "#94a3b8"
const GRID_COLOR = "#cbd5e1"
const TOOLTIP_STYLE: React.CSSProperties = {
    background: "rgba(30, 41, 59, 0.95)", border: "1px solid rgba(148, 163, 184, 0.4)",
    borderRadius: 8, color: "#f8fafc", fontSize: 12,
}
const TOOLTIP_LABEL_STYLE: React.CSSProperties = { color: "#cbd5e1", marginBottom: 4 }
const TOOLTIP_ITEM_STYLE:  React.CSSProperties = { color: "#f8fafc" }

const STATUS_META: Record<string, { label: string; cor: string }> = {
    ABERTO:    { label: "Aberto",    cor: "#6366f1" },
    CONCLUIDO: { label: "Concluído", cor: "#10b981" },
    CANCELADO: { label: "Cancelado", cor: "#ef4444" },
}
function statusLabel(s: string) { return STATUS_META[s]?.label ?? s }
function statusCor(s: string)   { return STATUS_META[s]?.cor   ?? "#94a3b8" }

// ── componente principal ───────────────────────────────────────────────────────

export default function PedidoDashboard() {
    const { showMessage } = useMessage()

    const [data,    setData]    = useState<PedidoDashboardResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [tipos,   setTipos]   = useState<TipoPedidoSummary[]>([])

    const [inicio,       setInicio]       = useState(daysAgoStr(365))
    const [fim,          setFim]          = useState(todayStr())
    const [emitenteId,   setEmitenteId]   = useState("")
    const [tipoPedidoId, setTipoPedidoId] = useState("")

    useEffect(() => {
        api.get<TipoPedidoSummary[]>("/tipos-pedido/ativos").then(r => setTipos(r.data)).catch(() => {})
    }, [])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true)
        const params = new URLSearchParams()
        if (inicio)       params.set("inicio", `${inicio}T00:00:00`)
        if (fim)          params.set("fim",    `${fim}T23:59:59`)
        if (emitenteId)   params.set("emitenteId",   emitenteId)
        if (tipoPedidoId) params.set("tipoPedidoId", tipoPedidoId)

        api.get<PedidoDashboardResponse>(`/pedidos/dashboard?${params.toString()}`)
            .then(r => setData(r.data))
            .catch(() => showMessage("error", "Erro ao carregar dashboard de pedidos"))
            .finally(() => setLoading(false))
    }, [inicio, fim, emitenteId, tipoPedidoId]) // eslint-disable-line

    if (loading && !data) {
        return (
            <TPage title="Dashboard Pedidos" breadcrumb={["Dashboards", "Pedidos"]}>
                <div className="flex justify-center py-16">
                    <span className="w-7 h-7 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            </TPage>
        )
    }
    if (!data) return null

    const statusData:   StatusDistribuicaoDto[] = data.porStatus            ?? []
    const periodoData:  PeriodoDto[]            = data.porPeriodo           ?? []
    const tipoData:     TipoPedidoRankingDto[]  = (data.porTipoPedido ?? []).filter(t => t.valor > 0)
    const produtoData:  ProdutoRankingDto[]     = (data.produtosMaisVendidos ?? []).slice(0, 10)
    const emitenteData: EmitenteRankingDto[]    = (data.porEmitente ?? []).filter(e => e.valor > 0)
    const clienteData:  ClienteRankingDto[]     = (data.clientesMaisFieis ?? []).slice(0, 10)
    const diaSemanaData: DiaSemanaDto[]         = data.porDiaSemana         ?? []

    return (
        <TPage title="Dashboard Pedidos" breadcrumb={["Dashboards", "Pedidos"]}>

            {/* ── Filtros ───────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2 mb-5 items-end">
                <TDate name="inicio" label="De"  width="170px" defaultValue={inicio} onChange={setInicio} />
                <TDate name="fim"    label="Até" width="170px" defaultValue={fim}    onChange={setFim} />
                <TDbCombo
                    name="emitenteId" label="Emitente" url="/emitentes/select"
                    valueField="id" displayField={displayEmitente} searchField="nome"
                    placeholder="Todos" width="240px" value={emitenteId} onChange={setEmitenteId}
                />
                <TCombo
                    name="tipoPedidoId" label="Tipo de Pedido" width="220px" placeholder="Todos"
                    defaultValue={tipoPedidoId}
                    options={[{ value: "", label: "Todos" }, ...tipos.map(t => ({ value: String(t.id), label: t.nome }))]}
                    onChange={setTipoPedidoId}
                />
            </div>

            {/* ── KPIs ─────────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 mb-5">
                <KpiCard label="Total de pedidos" value={data.totalPedidos} sublabel="no período selecionado"
                    icon={FaShoppingCart} color="bg-(--accent)" />
                <KpiCard label="Abertos" value={data.totalAbertos} sublabel="no período selecionado"
                    icon={FaFolderOpen} color="bg-indigo-500" />
                <KpiCard label="Concluídos" value={data.totalConcluidos} sublabel="no período selecionado"
                    icon={FaCheckCircle} color="bg-emerald-500" />
                <KpiCard label="Cancelados" value={data.totalCancelados} sublabel="no período selecionado"
                    icon={FaBan} color="bg-red-500" />
                <KpiCard label="Valor total" value={data.valorTotal} sublabel="pedidos concluídos" money
                    icon={FaMoneyBillWave} color="bg-teal-500" />
                <KpiCard label="Valor no mês" value={data.valorMes} sublabel="mês atual" money
                    icon={FaChartLine} color="bg-emerald-500" />
                <KpiCard label="Ticket médio" value={data.ticketMedio} sublabel="por pedido concluído" money
                    icon={FaTrophy} color="bg-amber-500" />
            </div>

            {/* ── Status + Tipo de Pedido (donuts) ──────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle><FaChartPie className="text-(--accent)" /> Distribuição por status</SectionTitle>
                    {statusData.length === 0 ? <EmptyState /> : (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" innerRadius={62} outerRadius={100}
                                    paddingAngle={2} dataKey="quantidade" nameKey="status"
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    label={(e: any) => `${statusLabel(String(e.status))}: ${fmtNum(Number(e.quantidade ?? 0))}`}
                                    labelLine={false}>
                                    {statusData.map((s, i) => <Cell key={i} fill={statusCor(s.status)} />)}
                                </Pie>
                                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter={(v: any, _n: any, p: any) => [`${fmtNum(Number(v))} pedidos`, statusLabel(String(p?.payload?.status ?? ""))]} />
                                <Legend formatter={(value: string) => statusLabel(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle><FaTags className="text-indigo-500" /> Valor por tipo de pedido</SectionTitle>
                    {tipoData.length === 0 ? <EmptyState /> : (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={tipoData} cx="50%" cy="50%" innerRadius={62} outerRadius={100}
                                    paddingAngle={2} dataKey="valor" nameKey="tipoPedidoNome"
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    label={(e: any) => fmtMoeda(Number(e.valor ?? 0))} labelLine={false}>
                                    {tipoData.map((_t, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter={(v: any, _n: any, p: any) => [`${fmtMoeda(Number(v))} · ${fmtNum(Number(p?.payload?.pedidos ?? 0))} pedidos`, String(p?.payload?.tipoPedidoNome ?? "")]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* ── Valor por período ─────────────────────────────────────────── */}
            <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                <SectionTitle><FaCalendarAlt className="text-(--accent)" /> Valor por período</SectionTitle>
                {periodoData.length === 0 ? <EmptyState /> : (
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={periodoData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
                            <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} allowDecimals={false} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR}
                                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter={(v: any, n: any) => n === "Valor" ? [fmtMoeda(Number(v)), "Valor"] : [fmtNum(Number(v)), "Pedidos"]} />
                            <Legend />
                            <RBar  yAxisId="left"  dataKey="pedidos" name="Pedidos" fill={PALETTE[0]} radius={[4, 4, 0, 0]} barSize={28} />
                            <RLine yAxisId="right" dataKey="valor"   name="Valor"   stroke={PALETTE[1]} strokeWidth={2} dot={{ r: 3 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* ── Produtos mais vendidos ────────────────────────────────────── */}
            <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                <SectionTitle>
                    <FaTrophy className="text-amber-500" /> Produtos mais vendidos
                    <span className="text-(--text-muted) font-normal normal-case">(top 10)</span>
                </SectionTitle>
                {produtoData.length === 0 ? <EmptyState /> : (
                    <ResponsiveContainer width="100%" height={Math.max(280, produtoData.length * 36)}>
                        <BarChart data={produtoData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR}
                                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                            <YAxis type="category" dataKey="produtoNome" width={140} tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR}
                                tickFormatter={(v: string) => v.length > 18 ? `${v.slice(0, 18)}…` : v} />
                            <Tooltip cursor={{ fill: "rgba(148, 163, 184, 0.12)" }} contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter={(v: any, _n: any, p: any) => [`${fmtMoeda(Number(v))} · ${fmtNum(Number(p?.payload?.qtdTotal ?? 0))} un.`, String(p?.payload?.produtoNome ?? "")]} />
                            <RBar dataKey="valorTotal" name="Valor" fill={PALETTE[1]} radius={[0, 4, 4, 0]} barSize={18} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* ── Clientes + Emitente ───────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaUsers className="text-violet-500" /> Clientes mais frequentes
                        <span className="text-(--text-muted) font-normal normal-case">(top 10)</span>
                    </SectionTitle>
                    {clienteData.length === 0 ? <EmptyState /> : (
                        <ResponsiveContainer width="100%" height={Math.max(280, clienteData.length * 34)}>
                            <BarChart data={clienteData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} allowDecimals={false} />
                                <YAxis type="category" dataKey="pessoaNome" width={130} tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR}
                                    tickFormatter={(v: string) => v.length > 18 ? `${v.slice(0, 18)}…` : v} />
                                <Tooltip cursor={{ fill: "rgba(148, 163, 184, 0.12)" }} contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter={(v: any, _n: any, p: any) => [`${fmtNum(Number(v))} pedidos · ${fmtMoeda(Number(p?.payload?.valor ?? 0))}`, String(p?.payload?.pessoaNome ?? "")]} />
                                <RBar dataKey="pedidos" name="Pedidos" fill={PALETTE[0]} radius={[0, 4, 4, 0]} barSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle><FaBuilding className="text-indigo-500" /> Valor por emitente</SectionTitle>
                    {emitenteData.length === 0 ? <EmptyState /> : (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={emitenteData} cx="50%" cy="50%" innerRadius={62} outerRadius={100}
                                    paddingAngle={2} dataKey="valor" nameKey="nome"
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    label={(e: any) => fmtMoeda(Number(e.valor ?? 0))} labelLine={false}>
                                    {emitenteData.map((e, i) => <Cell key={i} fill={e.cor || PALETTE[i % PALETTE.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter={(v: any, _n: any, p: any) => [`${fmtMoeda(Number(v))} · ${fmtNum(Number(p?.payload?.pedidos ?? 0))} pedidos`, String(p?.payload?.nome ?? "")]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* ── Por dia da semana ─────────────────────────────────────────── */}
            <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                <SectionTitle><FaCalendarAlt className="text-(--accent)" /> Pedidos por dia da semana</SectionTitle>
                {diaSemanaData.length === 0 ? <EmptyState /> : (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={diaSemanaData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} vertical={false} />
                            <XAxis dataKey="diaSemana" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                            <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} allowDecimals={false} />
                            <Tooltip cursor={{ fill: "rgba(148, 163, 184, 0.12)" }} contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter={(v: any, _n: any, p: any) => [`${fmtNum(Number(v))} pedidos · ${fmtMoeda(Number(p?.payload?.valor ?? 0))}`, String(p?.payload?.diaSemana ?? "")]} />
                            <RBar dataKey="pedidos" name="Pedidos" fill={PALETTE[5]} radius={[4, 4, 0, 0]} barSize={28} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

        </TPage>
    )
}
