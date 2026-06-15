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
    FinanceiroDashboardDto,
    FinanceiroFluxoResponse,
    FluxoPeriodoDto,
    PessoaFluxoDto,
    EmitenteFluxoDto,
} from "../../types/FinanceiroDashboard"
import { TPage }                                         from "../../components/tpage"
import { TDbCombo }                                      from "../../components/tdbcombo"
import {
    FaUniversity, FaArrowUp, FaArrowDown,
    FaExclamationTriangle, FaCheckCircle, FaMinusCircle,
    FaCalendarAlt, FaChartPie, FaUsers, FaExchangeAlt,
    FaPlusCircle,
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
    label, value, sublabel, icon: Icon, color, money = false, valueColor,
}: {
    label:       string
    value:       number
    sublabel?:   string
    icon:        React.ElementType
    color:       string
    money?:      boolean
    valueColor?: string
}) {
    return (
        <div className="flex-1 min-w-40 rounded-xl border border-(--border) bg-(--bg-surface) p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-(--text-muted) uppercase tracking-wide">{label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4 text-white" />
                </div>
            </div>
            <p className={`text-2xl font-bold leading-tight ${valueColor ?? "text-(--text-primary)"}`}>
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

// cores semânticas de fluxo
const COR_CREDITO = "#22c55e"   // verde
const COR_DEBITO  = "#ef4444"   // vermelho
const COR_SALDO   = "#6366f1"   // indigo

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

const PERIODOS = [
    { label: "30 dias",   dias: 30  },
    { label: "90 dias",   dias: 90  },
    { label: "12 meses",  dias: 365 },
    { label: "Tudo",      dias: 0   },
]

const REGIMES = [
    { label: "Caixa",       value: "CAIXA"       },
    { label: "Competência", value: "COMPETENCIA" },
]

// ── Saldo por Conta Bar List (mantido do dashboard atual) ───────────────────────

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
                const pct      = Math.round((Math.abs(c.saldo) / maxAbs) * 100)
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
    const { showMessage } = useMessage()

    // Seção A — posição atual (endpoint existente)
    const [dashboard, setDashboard] = useState<FinanceiroDashboardDto | null>(null)
    const [loading,   setLoading]   = useState(true)
    const [error,     setError]     = useState(false)

    // Seção B — créditos × débitos (endpoint novo, filtrado)
    const [fluxo,        setFluxo]        = useState<FinanceiroFluxoResponse | null>(null)
    const [loadingFluxo, setLoadingFluxo] = useState(true)

    // filtros da Seção B
    const [regime,     setRegime]     = useState("CAIXA")
    const [periodo,    setPeriodo]    = useState(90)
    const [emitenteId, setEmitenteId] = useState("")
    const [contaId,    setContaId]    = useState("")

    const contaDesabilitada = regime === "COMPETENCIA"

    // ── posição atual: carrega uma vez no mount ────────────────────────────────
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

    // ── fluxo: refaz quando filtros/regime mudam ───────────────────────────────
    useEffect(() => {
        setLoadingFluxo(true)

        const params = new URLSearchParams()
        params.set("dias",   String(periodo))
        params.set("regime", regime)
        if (emitenteId)             params.set("emitenteId", emitenteId)
        if (contaId && !contaDesabilitada) params.set("contaId", contaId)

        api.get<FinanceiroFluxoResponse>(`/financeiro/dashboard/fluxo?${params.toString()}`)
            .then(r => setFluxo(r.data))
            .catch(() => showMessage("error", "Erro ao carregar movimentação financeira"))
            .finally(() => setLoadingFluxo(false))
    }, [regime, periodo, emitenteId, contaId]) // eslint-disable-line

    // ── loading inicial (qualquer um dos dois) ─────────────────────────────────
    if ((loading || loadingFluxo) && !dashboard && !fluxo) {
        return (
            <TPage title="Dashboard Financeiro" breadcrumb={["Dashboards", "Financeiro"]}>
                <div className="flex justify-center py-16">
                    <span className="w-7 h-7 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            </TPage>
        )
    }

    // ── error da Seção A ───────────────────────────────────────────────────────
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

    // dados da Seção B
    const periodoData:  FluxoPeriodoDto[]  = fluxo?.porPeriodo ?? []
    const pessoaData:   PessoaFluxoDto[]   = (fluxo?.porPessoa ?? []).slice(0, 10)
    const emitenteData: EmitenteFluxoDto[] = fluxo?.porEmitente ?? []
    const emitCreditos  = emitenteData.filter(e => e.creditos > 0)
    const emitDebitos   = emitenteData.filter(e => e.debitos  > 0)
    const saldoPeriodoPos = (fluxo?.saldoPeriodo ?? 0) >= 0

    return (
        <TPage title="Dashboard Financeiro" breadcrumb={["Dashboards", "Financeiro"]}>

            {/* ══════════════ SEÇÃO A — POSIÇÃO ATUAL ══════════════ */}

            <p className="text-xs text-(--text-muted) mb-5">
                Posição corrente — cards refletem o estado atual; movimentação abaixo respeita os filtros.
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

            {/* ── 6 KPIs de posição ────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 mb-5">
                <KpiCard label="A Receber" value={dashboard.totalPendenteReceber} money
                    sublabel="pendente no mês" icon={FaArrowUp}
                    color="bg-(--accent)" valueColor="text-(--accent)" />
                <KpiCard label="Em Atraso — Receber" value={dashboard.totalPendenteAtrasadoReceber} money
                    sublabel="vencido a receber" icon={FaExclamationTriangle}
                    color="bg-red-500" valueColor="text-(--danger)" />
                <KpiCard label="A Pagar" value={dashboard.totalPendentePagar} money
                    sublabel="pendente no mês" icon={FaArrowDown}
                    color="bg-amber-500" valueColor="text-(--warning)" />
                <KpiCard label="Em Atraso — Pagar" value={dashboard.totalPendenteAtrasadoPagar} money
                    sublabel="vencido a pagar" icon={FaExclamationTriangle}
                    color="bg-red-500" valueColor="text-(--danger)" />
                <KpiCard label="Recebido (Mês)" value={dashboard.totalRecebidoMes} money
                    sublabel="entradas no mês atual" icon={FaCheckCircle}
                    color="bg-emerald-500" valueColor="text-(--success)" />
                <KpiCard label="Pago (Mês)" value={dashboard.totalPagoMes} money
                    sublabel="saídas no mês atual" icon={FaMinusCircle}
                    color="bg-slate-500" valueColor="text-(--text-secondary)" />
            </div>

            {/* ── Saldo por Conta ───────────────────────────────────────────── */}
            <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-6">
                <SectionTitle>
                    <FaUniversity className="text-(--accent)" /> Saldo por conta
                </SectionTitle>
                <SaldoPorContaList contas={dashboard.saldoPorConta} />
            </div>

            {/* ══════════════ SEÇÃO B — CRÉDITOS × DÉBITOS ══════════════ */}

            <SectionTitle>
                <FaExchangeAlt className="text-(--accent)" /> Movimentação — Créditos × Débitos
            </SectionTitle>

            {/* ── Barra de filtros (controla só a Seção B) ──────────────────── */}
            <div className="flex flex-wrap gap-2 mb-5 items-end">

                {/* regime */}
                <div className="flex gap-1 p-1 bg-(--bg-input) rounded-lg w-fit">
                    {REGIMES.map(r => (
                        <button
                            key      ={r.value}
                            type     ="button"
                            onClick  ={() => setRegime(r.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition
                                ${regime === r.value
                                    ? "bg-(--accent) text-white shadow-sm"
                                    : "text-(--text-muted) hover:text-(--text-primary)"}`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>

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

                {/* conta financeira (ignorada em regime de competência) */}
                <div
                    className={contaDesabilitada ? "opacity-50" : ""}
                    title    ={contaDesabilitada ? "A conta financeira só se aplica ao regime de Caixa (data de pagamento). Em Competência o backend ignora este filtro." : undefined}
                >
                    <TDbCombo
                        name        ="contaId"
                        label       ="Conta financeira"
                        url         ="/financeiro/contas/select"
                        valueField  ="id"
                        displayField="nome"
                        placeholder ="Todas"
                        width       ="240px"
                        value       ={contaId}
                        disabled    ={contaDesabilitada}
                        onChange    ={setContaId}
                    />
                </div>
            </div>

            {/* ── KPIs de fluxo ────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 mb-5">
                <KpiCard label="Total Créditos" value={fluxo?.totalCreditos ?? 0} money
                    sublabel="entradas no período" icon={FaPlusCircle}
                    color="bg-emerald-500" valueColor="text-(--success)" />
                <KpiCard label="Total Débitos" value={fluxo?.totalDebitos ?? 0} money
                    sublabel="saídas no período" icon={FaMinusCircle}
                    color="bg-red-500" valueColor="text-(--danger)" />
                <KpiCard label="Saldo do Período" value={fluxo?.saldoPeriodo ?? 0} money
                    sublabel="créditos − débitos" icon={FaExchangeAlt}
                    color="bg-indigo-500" valueColor={saldoPeriodoPos ? "text-(--success)" : "text-(--danger)"} />
                <KpiCard label="Qtd. de movimentos" value={(fluxo?.qtdCreditos ?? 0) + (fluxo?.qtdDebitos ?? 0)}
                    sublabel={`${fmtNum(fluxo?.qtdCreditos ?? 0)} créditos · ${fmtNum(fluxo?.qtdDebitos ?? 0)} débitos`}
                    icon={FaCalendarAlt} color="bg-(--accent)" />
            </div>

            {/* ── Coluna + linha por período ────────────────────────────────── */}
            <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                <SectionTitle>
                    <FaCalendarAlt className="text-(--accent)" /> Créditos × Débitos por período
                </SectionTitle>
                {loadingFluxo && !fluxo ? (
                    <div className="flex justify-center py-16">
                        <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : periodoData.length === 0 ? (
                    <EmptyState />
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={periodoData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
                            <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR}
                                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR}
                                tickFormatter={(v: number) => v >= 1000 || v <= -1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                labelStyle  ={TOOLTIP_LABEL_STYLE}
                                itemStyle   ={TOOLTIP_ITEM_STYLE}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter   ={(v: any, n: any) => [fmtMoeda(Number(v)), String(n)]}
                            />
                            <Legend />
                            <RBar  yAxisId="left"  dataKey="creditos" name="Créditos" fill={COR_CREDITO} radius={[4, 4, 0, 0]} barSize={20} />
                            <RBar  yAxisId="left"  dataKey="debitos"  name="Débitos"  fill={COR_DEBITO}  radius={[4, 4, 0, 0]} barSize={20} />
                            <RLine yAxisId="right" dataKey="saldo"    name="Saldo"    stroke={COR_SALDO} strokeWidth={2} dot={{ r: 3 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* ── Donuts: créditos / débitos por emitente ───────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

                {/* Créditos por emitente */}
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaChartPie className="text-emerald-500" /> Créditos por emitente
                    </SectionTitle>
                    {emitCreditos.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data        ={emitCreditos}
                                    cx          ="50%"
                                    cy          ="50%"
                                    innerRadius ={62}
                                    outerRadius ={100}
                                    paddingAngle={2}
                                    dataKey     ="creditos"
                                    nameKey     ="nome"
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    label       ={(e: any) => fmtMoeda(Number(e.creditos ?? 0))}
                                    labelLine   ={false}
                                >
                                    {emitCreditos.map((e, i) => (
                                        <Cell key={i} fill={e.cor || PALETTE[i % PALETTE.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={TOOLTIP_STYLE}
                                    labelStyle  ={TOOLTIP_LABEL_STYLE}
                                    itemStyle   ={TOOLTIP_ITEM_STYLE}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter   ={(v: any, _n: any, p: any) => [
                                        fmtMoeda(Number(v)),
                                        String(p?.payload?.nome ?? ""),
                                    ]}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Débitos por emitente */}
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <FaChartPie className="text-red-500" /> Débitos por emitente
                    </SectionTitle>
                    {emitDebitos.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data        ={emitDebitos}
                                    cx          ="50%"
                                    cy          ="50%"
                                    innerRadius ={62}
                                    outerRadius ={100}
                                    paddingAngle={2}
                                    dataKey     ="debitos"
                                    nameKey     ="nome"
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    label       ={(e: any) => fmtMoeda(Number(e.debitos ?? 0))}
                                    labelLine   ={false}
                                >
                                    {emitDebitos.map((e, i) => (
                                        <Cell key={i} fill={e.cor || PALETTE[i % PALETTE.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={TOOLTIP_STYLE}
                                    labelStyle  ={TOOLTIP_LABEL_STYLE}
                                    itemStyle   ={TOOLTIP_ITEM_STYLE}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter   ={(v: any, _n: any, p: any) => [
                                        fmtMoeda(Number(v)),
                                        String(p?.payload?.nome ?? ""),
                                    ]}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* ── Por pessoa (top 10) ───────────────────────────────────────── */}
            <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                <SectionTitle>
                    <FaUsers className="text-violet-500" /> Créditos × Débitos por pessoa
                    <span className="text-(--text-muted) font-normal normal-case">(top 10)</span>
                </SectionTitle>
                {pessoaData.length === 0 ? (
                    <EmptyState />
                ) : (
                    <ResponsiveContainer width="100%" height={Math.max(280, pessoaData.length * 40)}>
                        <BarChart
                            data   ={pessoaData}
                            layout ="vertical"
                            margin ={{ top: 4, right: 24, left: 8, bottom: 4 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR}
                                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                            <YAxis
                                type     ="category"
                                dataKey  ="nome"
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
                                formatter   ={(v: any, n: any) => [fmtMoeda(Number(v)), String(n)]}
                            />
                            <Legend />
                            <RBar dataKey="creditos" name="Créditos" fill={COR_CREDITO} radius={[0, 4, 4, 0]} barSize={12} />
                            <RBar dataKey="debitos"  name="Débitos"  fill={COR_DEBITO}  radius={[0, 4, 4, 0]} barSize={12} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

        </TPage>
    )
}
