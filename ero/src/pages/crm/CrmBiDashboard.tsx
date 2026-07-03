import { useEffect, useState } from "react"
import {
    PieChart, Pie, Cell,
    ComposedChart, Bar as RBar, Line as RLine,
    BarChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import { api }         from "../../services/api"
import { useMessage }  from "../../hooks/useMessage"
import { TPage }       from "../../components/tpage"
import { TCombo }      from "../../components/tcombo"
import { TBrazilMap }  from "../../components/tbrazilmap"
import type { CrmDashboardDto } from "../../types/CrmDashboard"
import {
    FaComments, FaInbox, FaCheckCircle, FaTimesCircle, FaUserSlash,
    FaEnvelope, FaHourglassHalf, FaReply, FaPercentage, FaExclamationTriangle,
    FaChartPie, FaUsers, FaCalendarAlt, FaMapMarkedAlt, FaGlobeAmericas, FaClock,
} from "react-icons/fa"

// ── helpers visuais ─────────────────────────────────────────────────────────

function fmtNum(v: number) {
    return v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })
}

// horas → "—" | "X.Xh" | "Xd Yh"
function fmtHoras(h: number | null): string {
    if (h == null) return "—"
    if (h >= 24) {
        const d = Math.floor(h / 24)
        const r = Math.round(h - d * 24)
        return r > 0 ? `${d}d ${r}h` : `${d}d`
    }
    return `${h.toFixed(1)}h`
}

function fmtPct(fracao: number): string {
    return `${(fracao * 100).toFixed(1)}%`
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-xs font-semibold text-(--text-primary) uppercase tracking-wider mb-3 flex items-center gap-2">
            {children}
        </h3>
    )
}

function KpiCard({
    label, value, icon: Icon, color, valueColor, sublabel,
}: {
    label:       string
    value:       string | number
    icon:        React.ElementType
    color:       string
    valueColor?: string
    sublabel?:   string
}) {
    return (
        <div className="flex-1 min-w-36 rounded-xl border border-(--border) bg-(--bg-surface) p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-(--text-muted) uppercase tracking-wide">{label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="w-4 h-4 text-white" />
                </div>
            </div>
            <p className={`text-2xl font-bold leading-tight ${valueColor ?? "text-(--text-primary)"}`}>
                {typeof value === "number" ? fmtNum(value) : value}
            </p>
            {sublabel && <p className="text-xs text-(--text-muted)">{sublabel}</p>}
        </div>
    )
}

function EmptyState({ children = "Sem dados no período" }: { children?: React.ReactNode }) {
    return <p className="text-sm text-(--text-muted) py-10 text-center">{children}</p>
}

// ── paleta / estilos de eixo (Recharts não lê CSS vars em SVG) ──────────────

const PALETTE = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"]

const COR_ABERTO    = "#3b82f6"   // azul
const COR_CONCLUIDO = "#22c55e"   // verde
const COR_CANCELADO = "#ef4444"   // vermelho

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
    { label: "7 dias",   dias: 7   },
    { label: "30 dias",  dias: 30  },
    { label: "90 dias",  dias: 90  },
    { label: "12 meses", dias: 365 },
    { label: "Todos",    dias: 0   },
]

interface Option { id: number; nome: string }

// ── componente principal ────────────────────────────────────────────────────

export default function CrmBiDashboard() {
    const { showMessage } = useMessage()

    // filtros
    const [dias,        setDias]        = useState(30)
    const [usuarioId,   setUsuarioId]   = useState("")
    const [andamentoId, setAndamentoId] = useState("")
    const [uf,          setUf]          = useState<string | null>(null)

    // opções de filtro
    const [usuarios,   setUsuarios]   = useState<Option[]>([])
    const [andamentos, setAndamentos] = useState<Option[]>([])

    // dados
    const [data,    setData]    = useState<CrmDashboardDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [error,   setError]   = useState(false)

    // carrega opções de filtro uma vez
    useEffect(() => {
        api.get("/usuarios/select-personal")
            .then(r => setUsuarios((r.data ?? []).map((u: { id: number; nome: string }) => ({ id: u.id, nome: u.nome }))))
            .catch(() => {})
        api.get("/crm/andamentos")
            .then(r => setAndamentos((r.data ?? []).map((a: { id: number; nome: string }) => ({ id: a.id, nome: a.nome }))))
            .catch(() => {})
    }, [])

    // (re)carrega o dashboard quando qualquer filtro muda
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true)
        setError(false)

        const params = new URLSearchParams()
        params.set("dias", String(dias))
        if (usuarioId)   params.set("usuarioId",   usuarioId)
        if (andamentoId) params.set("andamentoId", andamentoId)
        if (uf)          params.set("uf",          uf)

        api.get<CrmDashboardDto>(`/crm/dashboard?${params.toString()}`)
            .then(r => setData(r.data))
            .catch(() => {
                showMessage("error", "Erro ao carregar dashboard do CRM")
                setError(true)
            })
            .finally(() => setLoading(false))
    }, [dias, usuarioId, andamentoId, uf]) // eslint-disable-line

    function handleSelectUf(sigla: string) {
        setUf(cur => (cur === sigla ? null : sigla))
    }

    // loading inicial
    if (loading && !data) {
        return (
            <TPage title="Dashboard CRM" breadcrumb={["Dashboards", "CRM"]}>
                <div className="flex justify-center py-16">
                    <span className="w-7 h-7 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            </TPage>
        )
    }

    // erro sem dados
    if (error && !data) {
        return (
            <TPage title="Dashboard CRM" breadcrumb={["Dashboards", "CRM"]}>
                <div className="flex flex-col items-center py-16 gap-3 text-(--text-muted)">
                    <FaExclamationTriangle className="w-8 h-8 text-(--danger)" />
                    <p className="text-sm">Não foi possível carregar o dashboard do CRM.</p>
                </div>
            </TPage>
        )
    }

    const resumo       = data!.resumo
    const porAndamento = data!.porAndamento ?? []
    const porUsuario   = data!.porUsuario ?? []
    const porPeriodo   = data!.porPeriodo ?? []
    const porRegiao    = data!.porRegiao ?? []
    const pendencias   = data!.pendencias

    // mapa: sigla → quantidade (ignora "Sem localização" para a cor)
    const porUfMap: Record<string, number> = {}
    let semLocalizacao = 0
    for (const r of (data!.porUf ?? [])) {
        if (r.uf === "Sem localização") semLocalizacao += r.quantidade
        else                            porUfMap[r.uf] = r.quantidade
    }

    return (
        <TPage title="Dashboard CRM" breadcrumb={["Dashboards", "CRM"]}>

            {/* ── Barra de filtros ─────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 mb-5 items-end">

                {/* período */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm text-(--text-secondary)">Período</label>
                    <div className="flex gap-1 p-1 bg-(--bg-input) rounded-lg w-fit border border-(--border)">
                        {PERIODOS.map(p => (
                            <button
                                key      ={p.dias}
                                type     ="button"
                                onClick  ={() => setDias(p.dias)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition
                                    ${dias === p.dias
                                        ? "bg-(--accent) text-white shadow-sm"
                                        : "text-(--text-muted) hover:text-(--text-primary)"}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* usuário */}
                <TCombo
                    name         ="usuarioId"
                    label        ="Usuário"
                    width        ="220px"
                    defaultValue ={usuarioId}
                    options      ={[{ value: "", label: "Todos" }, ...usuarios.map(u => ({ value: String(u.id), label: u.nome }))]}
                    onChange     ={setUsuarioId}
                />

                {/* andamento */}
                <TCombo
                    name         ="andamentoId"
                    label        ="Andamento"
                    width        ="220px"
                    defaultValue ={andamentoId}
                    options      ={[{ value: "", label: "Todos" }, ...andamentos.map(a => ({ value: String(a.id), label: a.nome }))]}
                    onChange     ={setAndamentoId}
                />

                {/* limpar UF */}
                {uf && (
                    <button
                        type     ="button"
                        onClick  ={() => setUf(null)}
                        className="h-9.5 px-3 rounded-md border border-(--border) bg-(--bg-surface) text-xs font-medium text-(--text-secondary) hover:text-(--text-primary) hover:border-(--accent) transition flex items-center gap-1.5"
                    >
                        <FaMapMarkedAlt className="text-(--accent)" /> Limpar UF: {uf}
                    </button>
                )}

                {/* indicador de refetch */}
                {loading && data && (
                    <span className="h-9.5 flex items-center">
                        <span className="w-4 h-4 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                    </span>
                )}
            </div>

            {/* ── KPIs ─────────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 mb-5">
                <KpiCard label="Total"             value={resumo.total}             icon={FaComments}     color="bg-(--accent)" />
                <KpiCard label="Abertos"           value={resumo.abertos}           icon={FaInbox}        color="bg-blue-500"   valueColor="text-blue-500" />
                <KpiCard label="Concluídos"        value={resumo.concluidos}        icon={FaCheckCircle}  color="bg-emerald-500" valueColor="text-(--success)" />
                <KpiCard label="Cancelados"        value={resumo.cancelados}        icon={FaTimesCircle}  color="bg-red-500"    valueColor="text-(--danger)" />
                <KpiCard label="Sem responsável"   value={resumo.semResponsavel}    icon={FaUserSlash}    color="bg-amber-500"  valueColor="text-(--warning)" />
                <KpiCard label="Não lidas"         value={resumo.mensagensNaoLidas} icon={FaEnvelope}     color="bg-violet-500" />
                <KpiCard label="T. médio conclusão" value={fmtHoras(resumo.tempoMedioConclusaoHoras)} icon={FaHourglassHalf} color="bg-slate-500" />
                <KpiCard label="T. médio resposta"  value={fmtHoras(resumo.tempoMedioRespostaHoras)}  icon={FaReply}         color="bg-slate-500" />
                <KpiCard label="Taxa de conclusão" value={fmtPct(resumo.taxaConclusao)} icon={FaPercentage} color="bg-(--accent)" valueColor="text-(--accent)" />
                {data!.pendenciasAtivas && (
                    <KpiCard label="Pendências" value={pendencias?.total ?? 0} icon={FaExclamationTriangle}
                        color="bg-red-500" valueColor="text-(--danger)" sublabel="aguardando retorno" />
                )}
            </div>

            {/* ── Gráficos ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Donut por andamento */}
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle><FaChartPie className="text-(--accent)" /> Por andamento</SectionTitle>
                    {porAndamento.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data        ={porAndamento}
                                    cx          ="50%"
                                    cy          ="50%"
                                    innerRadius ={64}
                                    outerRadius ={104}
                                    paddingAngle={2}
                                    dataKey     ="quantidade"
                                    nameKey     ="nome"
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    label       ={(e: any) => fmtNum(Number(e.value ?? 0))}
                                    labelLine   ={false}
                                >
                                    {porAndamento.map((a, i) => (
                                        <Cell key={i} fill={a.cor || PALETTE[i % PALETTE.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={TOOLTIP_STYLE}
                                    labelStyle  ={TOOLTIP_LABEL_STYLE}
                                    itemStyle   ={TOOLTIP_ITEM_STYLE}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter   ={(v: any, _n: any, p: any) => [`${fmtNum(Number(v))} atend.`, String(p?.payload?.nome ?? "")]}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Barra horizontal empilhada por usuário */}
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle><FaUsers className="text-violet-500" /> Por usuário</SectionTitle>
                    {porUsuario.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <ResponsiveContainer width="100%" height={Math.max(300, porUsuario.length * 42)}>
                            <BarChart data={porUsuario} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} horizontal={false} />
                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                <YAxis
                                    type         ="category"
                                    dataKey      ="nome"
                                    width        ={130}
                                    tick         ={{ fontSize: 11, fill: AXIS_COLOR }}
                                    stroke       ={AXIS_COLOR}
                                    tickFormatter={(v: string) => v.length > 18 ? `${v.slice(0, 18)}…` : v}
                                />
                                <Tooltip
                                    cursor      ={{ fill: "rgba(148, 163, 184, 0.12)" }}
                                    contentStyle={TOOLTIP_STYLE}
                                    labelStyle  ={TOOLTIP_LABEL_STYLE}
                                    itemStyle   ={TOOLTIP_ITEM_STYLE}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter   ={(v: any, n: any) => [fmtNum(Number(v)), String(n)]}
                                />
                                <Legend />
                                <RBar dataKey="abertos"    name="Abertos"    stackId="s" fill={COR_ABERTO}    barSize={16} />
                                <RBar dataKey="concluidos" name="Concluídos" stackId="s" fill={COR_CONCLUIDO} barSize={16} />
                                <RBar dataKey="cancelados" name="Cancelados" stackId="s" fill={COR_CANCELADO} barSize={16} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Série temporal — linha inteira */}
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 lg:col-span-2">
                    <SectionTitle><FaCalendarAlt className="text-(--accent)" /> Atendimentos por período</SectionTitle>
                    {porPeriodo.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={porPeriodo} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
                                <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                <Tooltip
                                    contentStyle={TOOLTIP_STYLE}
                                    labelStyle  ={TOOLTIP_LABEL_STYLE}
                                    itemStyle   ={TOOLTIP_ITEM_STYLE}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter   ={(v: any, n: any) => [fmtNum(Number(v)), String(n)]}
                                />
                                <Legend />
                                <RBar  dataKey="abertos"    name="Abertos"    fill={COR_ABERTO}    radius={[4, 4, 0, 0]} barSize={22} />
                                <RLine type="monotone" dataKey="concluidos" name="Concluídos" stroke={COR_CONCLUIDO} strokeWidth={2} dot={{ r: 3 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Mapa + Por região — linha inteira */}
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 lg:col-span-2">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <SectionTitle><FaMapMarkedAlt className="text-(--accent)" /> Distribuição geográfica</SectionTitle>
                        {uf && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-(--accent-light) text-(--accent) px-2.5 py-1 text-xs font-medium">
                                UF selecionada: {uf}
                                <button type="button" onClick={() => setUf(null)} className="hover:text-(--accent-hover) font-bold" aria-label="Limpar UF">✕</button>
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

                        {/* mapa */}
                        <div>
                            <TBrazilMap data={porUfMap} selectedUf={uf} onSelectUf={handleSelectUf} />
                            <p className="mt-2 text-xs text-(--text-muted)">
                                Clique num estado para filtrar. Sem localização:{" "}
                                <span className="font-medium text-(--text-secondary)">{fmtNum(semLocalizacao)}</span>
                            </p>
                        </div>

                        {/* por região */}
                        <div>
                            <SectionTitle><FaGlobeAmericas className="text-emerald-500" /> Por região</SectionTitle>
                            {porRegiao.length === 0 ? (
                                <EmptyState />
                            ) : (
                                <>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={porRegiao} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} vertical={false} />
                                            <XAxis dataKey="regiao" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                            <Tooltip
                                                cursor      ={{ fill: "rgba(148, 163, 184, 0.12)" }}
                                                contentStyle={TOOLTIP_STYLE}
                                                labelStyle  ={TOOLTIP_LABEL_STYLE}
                                                itemStyle   ={TOOLTIP_ITEM_STYLE}
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                formatter   ={(v: any) => [fmtNum(Number(v)), "Atendimentos"]}
                                            />
                                            <RBar dataKey="quantidade" name="Atendimentos" radius={[4, 4, 0, 0]} barSize={40}>
                                                {porRegiao.map((_, i) => (
                                                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                                                ))}
                                            </RBar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                        {porRegiao.map((r, i) => (
                                            <span key={i} className="flex items-center gap-1.5 text-xs text-(--text-muted)">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                                                {r.regiao}: <span className="font-medium text-(--text-secondary)">{fmtNum(r.quantidade)}</span>
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pendências — linha inteira, só se ativas */}
                {data!.pendenciasAtivas && pendencias && (
                    <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 lg:col-span-2">
                        <SectionTitle><FaExclamationTriangle className="text-(--danger)" /> Pendências (aguardando retorno)</SectionTitle>

                        <div className="flex flex-wrap gap-3 mb-4">
                            <KpiCard label="Total de pendências" value={pendencias.total} icon={FaExclamationTriangle}
                                color="bg-red-500" valueColor="text-(--danger)" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                            {/* por usuário */}
                            <div>
                                <SectionTitle><FaUsers className="text-violet-500" /> Por usuário</SectionTitle>
                                {pendencias.porUsuario.length === 0 ? (
                                    <EmptyState>Nenhuma pendência</EmptyState>
                                ) : (
                                    <ResponsiveContainer width="100%" height={Math.max(240, pendencias.porUsuario.length * 40)}>
                                        <BarChart data={pendencias.porUsuario} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} horizontal={false} />
                                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                            <YAxis
                                                type         ="category"
                                                dataKey      ="nome"
                                                width        ={130}
                                                tick         ={{ fontSize: 11, fill: AXIS_COLOR }}
                                                stroke       ={AXIS_COLOR}
                                                tickFormatter={(v: string) => v.length > 18 ? `${v.slice(0, 18)}…` : v}
                                            />
                                            <Tooltip
                                                cursor      ={{ fill: "rgba(148, 163, 184, 0.12)" }}
                                                contentStyle={TOOLTIP_STYLE}
                                                labelStyle  ={TOOLTIP_LABEL_STYLE}
                                                itemStyle   ={TOOLTIP_ITEM_STYLE}
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                formatter   ={(v: any) => [fmtNum(Number(v)), "Pendências"]}
                                            />
                                            <RBar dataKey="quantidade" name="Pendências" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={16} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>

                            {/* por faixa (aging) */}
                            <div>
                                <SectionTitle><FaClock className="text-amber-500" /> Por faixa de espera</SectionTitle>
                                {pendencias.porFaixa.length === 0 ? (
                                    <EmptyState>Nenhuma pendência</EmptyState>
                                ) : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={pendencias.porFaixa} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} vertical={false} />
                                            <XAxis dataKey="faixa" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                            <Tooltip
                                                cursor      ={{ fill: "rgba(148, 163, 184, 0.12)" }}
                                                contentStyle={TOOLTIP_STYLE}
                                                labelStyle  ={TOOLTIP_LABEL_STYLE}
                                                itemStyle   ={TOOLTIP_ITEM_STYLE}
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                formatter   ={(v: any) => [fmtNum(Number(v)), "Pendências"]}
                                            />
                                            <RBar dataKey="quantidade" name="Pendências" radius={[4, 4, 0, 0]} barSize={40}>
                                                {pendencias.porFaixa.map((_, i) => {
                                                    const cores = ["#22c55e", "#f59e0b", "#f97316", "#ef4444"]
                                                    return <Cell key={i} fill={cores[i % cores.length]} />
                                                })}
                                            </RBar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </TPage>
    )
}
