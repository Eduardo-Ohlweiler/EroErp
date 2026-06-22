import { useEffect, useState, useMemo } from "react"
import {
    ComposedChart, Line as RLine,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from "recharts"
import { api }                                 from "../../services/api"
import { useMessage }                          from "../../hooks/useMessage"
import { displayPessoa }                       from "../../utils/pessoas"
import type {
    TerapiaNutricionalAcompanhamentoDashboard as DashboardDto,
    PontoDiario,
} from "../../types/TerapiaNutricional"
import { TPage }                               from "../../components/tpage"
import { TDbCombo }                            from "../../components/tdbcombo"
import {
    FaUser, FaUtensils, FaPercentage, FaFlask, FaLungs, FaTint, FaHeartbeat, FaListUl,
} from "react-icons/fa"

// ── helpers visuais ────────────────────────────────────────────────────────────

function fmtNum(v: number | null | undefined, casas = 0) {
    if (v == null || Number.isNaN(v)) return "—"
    return v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })
}

function fmtData(iso: string | null | undefined) {
    if (!iso) return "—"
    const [y, m, d] = iso.slice(0, 10).split("-")
    if (!y || !m || !d) return "—"
    return `${d}/${m}/${y}`
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

function ValueCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex-1 min-w-32 rounded-lg border border-(--border) bg-(--bg-input) p-3 flex flex-col gap-1">
            <span className="text-xs text-(--text-muted)">{label}</span>
            <span className="text-sm font-semibold text-(--text-primary)">{value}</span>
        </div>
    )
}

// ── paleta / estilos de gráfico ──────────────────────────────────────────────────

const AXIS_COLOR  = "#94a3b8"
const GRID_COLOR  = "#cbd5e1"
const PRESC_COLOR = "#ef4444"
const REC_COLOR   = "#3b82f6"
const PERC_COLOR  = "#8b5cf6"
const ORAL_COLOR  = "#22c55e"
const K_COLOR     = "#6366f1"
const MG_COLOR    = "#f59e0b"
const LACT_COLOR  = "#ef4444"
const NA_COLOR    = "#0ea5e9"
const PCO2_COLOR  = "#3b82f6"
const HCO3_COLOR  = "#14b8a6"
const PH_COLOR    = "#f59e0b"
const BH_COLOR    = "#6366f1"
const DIURESE_COLOR = "#0ea5e9"
const PCR_COLOR   = "#ef4444"

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
    { label: "7 dias",  dias: 7  },
    { label: "15 dias", dias: 15 },
    { label: "30 dias", dias: 30 },
    { label: "Tudo",    dias: 0  },
]

// ── ponto do gráfico (data formatada para eixo X) ────────────────────────────────

interface GraphPoint extends PontoDiario {
    dataLabel: string
}

function montarDataset(evolucao: PontoDiario[]): GraphPoint[] {
    return evolucao.map(p => ({ ...p, dataLabel: fmtData(p.data) }))
}

// ── componente principal ───────────────────────────────────────────────────────

export default function TerapiaNutricionalAcompanhamentoDashboard() {
    const { showMessage } = useMessage()

    const [data,    setData]    = useState<DashboardDto | null>(null)
    const [loading, setLoading] = useState(false)

    const [pessoaId, setPessoaId] = useState("")
    const [periodo,  setPeriodo]  = useState(0)   // default: Tudo

    useEffect(() => {
        if (!pessoaId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setData(null)
            return
        }

        setLoading(true)
        const params = new URLSearchParams()
        params.set("pessoaId", pessoaId)
        params.set("dias", String(periodo))
        api.get<DashboardDto>(`/terapia-nutricional/dashboard/acompanhamento?${params.toString()}`)
            .then(r => setData(r.data))
            .catch(() => showMessage("error", "Erro ao carregar painel de acompanhamento diário"))
            .finally(() => setLoading(false))
    }, [pessoaId, periodo]) // eslint-disable-line

    const dataset = useMemo(() => montarDataset(data?.evolucao ?? []), [data])

    const ultimo      = data?.ultimoRegistro ?? null
    const umRegistro  = (data?.evolucao?.length ?? 0) === 1

    return (
        <TPage title="Painel de Acompanhamento Diário" breadcrumb={["Terapia Nutricional", "Painel de Acompanhamento Diário"]}>

            {/* ── Barra de filtros ──────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2 mb-5 items-end">
                <TDbCombo
                    name        ="pessoaId"
                    label       ="Paciente"
                    url         ="/pessoas/select"
                    valueField  ="id"
                    displayField={displayPessoa}
                    searchField ="nome"
                    placeholder ="Buscar paciente..."
                    width       ="280px"
                    required
                    value       ={pessoaId}
                    onChange    ={setPessoaId}
                />

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

            {/* ── GATE: sem paciente ─────────────────────────────────────────── */}
            {!pessoaId && (
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <EmptyState>Selecione um paciente para ver o acompanhamento diário</EmptyState>
                </div>
            )}

            {/* ── loading ─────────────────────────────────────────────────────── */}
            {pessoaId && loading && !data && (
                <div className="flex justify-center py-16">
                    <span className="w-7 h-7 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* ── sem registros ───────────────────────────────────────────────── */}
            {pessoaId && !loading && data && data.totalRegistros === 0 && (
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <EmptyState>Nenhum registro diário encontrado para os filtros selecionados</EmptyState>
                </div>
            )}

            {/* ── conteúdo ────────────────────────────────────────────────────── */}
            {pessoaId && data && data.totalRegistros > 0 && (
                <>
                    {/* Cabeçalho do paciente */}
                    <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-(--accent) flex items-center justify-center shrink-0">
                                <FaUser className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-lg font-semibold text-(--text-primary) truncate">{data.pessoaNome ?? "—"}</p>
                                <p className="text-xs text-(--text-muted)">Paciente</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <ValueCard label="Registros"       value={fmtNum(data.totalRegistros)} />
                            <ValueCard label="1º registro"     value={fmtData(data.primeiroRegistro)} />
                            <ValueCard label="Último registro" value={fmtData(data.ultimoRegistroData)} />
                        </div>
                    </div>

                    {/* Resumo do último registro */}
                    {ultimo && (
                        <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                            <SectionTitle>
                                <FaHeartbeat className="text-(--accent)" /> Último registro
                                <span className="text-(--text-muted) font-normal normal-case">
                                    ({fmtData(ultimo.data)})
                                </span>
                            </SectionTitle>

                            <div className="flex flex-wrap gap-3">
                                <ValueCard label="Dieta"            value={ultimo.dieta ?? "—"} />
                                <ValueCard label="% Recebido NE"    value={ultimo.percRecebidoNe != null ? `${fmtNum(ultimo.percRecebidoNe, 1)}%` : "—"} />
                                <ValueCard label="Vol. prescrito"   value={ultimo.volPrescrito24h != null ? `${fmtNum(ultimo.volPrescrito24h)} ml` : "—"} />
                                <ValueCard label="Vol. recebido"    value={ultimo.volRecebido24h != null ? `${fmtNum(ultimo.volRecebido24h)} ml` : "—"} />
                                <ValueCard label="Ingestão oral"    value={ultimo.ingestaoMedia != null ? `${fmtNum(ultimo.ingestaoMedia, 1)}%` : "—"} />
                                <ValueCard label="Balanço hídrico"  value={ultimo.bh != null ? `${fmtNum(ultimo.bh)} ml` : "—"} />
                                <ValueCard label="Diurese"          value={ultimo.diurese != null ? `${fmtNum(ultimo.diurese)} ml` : "—"} />
                                <ValueCard label="K"                value={ultimo.k != null ? fmtNum(ultimo.k, 1) : "—"} />
                                <ValueCard label="Na"               value={ultimo.na != null ? fmtNum(ultimo.na, 1) : "—"} />
                                <ValueCard label="PCR"              value={ultimo.pcr != null ? fmtNum(ultimo.pcr, 1) : "—"} />
                            </div>
                        </div>
                    )}

                    {umRegistro && (
                        <p className="text-xs text-(--text-muted) mb-2">
                            1 registro — as séries diárias ganham forma com novos registros.
                        </p>
                    )}

                    {/* Aporte enteral: prescrito x recebido + % recebido */}
                    <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                        <SectionTitle>
                            <FaUtensils className="text-orange-500" /> Aporte enteral (prescrito × recebido)
                        </SectionTitle>
                        {dataset.length === 0 ? <EmptyState /> : (
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={dataset} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
                                    <XAxis dataKey="dataLabel" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                    <YAxis yAxisId="ml" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR}
                                        tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)} />
                                    <YAxis yAxisId="perc" orientation="right" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR}
                                        domain={[0, 120]} tickFormatter={(v: number) => `${v}%`} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        formatter={(value: any, name: any) => [String(name).includes("%") ? `${fmtNum(Number(value), 1)}%` : `${fmtNum(Number(value))} ml`, String(name)]} />
                                    <Legend />
                                    <RLine yAxisId="ml" dataKey="volPrescrito24h" name="Prescrito (ml)" stroke={PRESC_COLOR} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 4 }} connectNulls />
                                    <RLine yAxisId="ml" dataKey="volRecebido24h" name="Recebido (ml)" stroke={REC_COLOR} strokeWidth={2} dot={{ r: 4 }} connectNulls />
                                    <RLine yAxisId="perc" dataKey="percRecebidoNe" name="% recebido" stroke={PERC_COLOR} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                                </ComposedChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Adesão à dieta (%) */}
                    <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                        <SectionTitle>
                            <FaPercentage className="text-violet-500" /> Adesão à dieta (%)
                        </SectionTitle>
                        {dataset.length === 0 ? <EmptyState /> : (
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={dataset} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
                                    <XAxis dataKey="dataLabel" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                    <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} domain={[0, "auto"]} tickFormatter={(v: number) => `${v}%`} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        formatter={(value: any, name: any) => [`${fmtNum(Number(value), 1)}%`, String(name)]} />
                                    <Legend />
                                    <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="4 4"
                                        label={{ value: "100%", fill: "#94a3b8", fontSize: 11, position: "right" }} />
                                    <RLine dataKey="percRecebidoNe" name="% recebido NE" stroke={REC_COLOR} strokeWidth={2} dot={{ r: 4 }} connectNulls />
                                    <RLine dataKey="ingestaoMedia" name="Ingestão oral média" stroke={ORAL_COLOR} strokeWidth={2} dot={{ r: 4 }} connectNulls />
                                </ComposedChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Eletrólitos & Gasometria */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                            <SectionTitle>
                                <FaFlask className="text-indigo-500" /> Eletrólitos
                            </SectionTitle>
                            {dataset.length === 0 ? <EmptyState /> : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart data={dataset} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
                                        <XAxis dataKey="dataLabel" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                        <YAxis yAxisId="esq" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} domain={["auto", "auto"]} />
                                        <YAxis yAxisId="na" orientation="right" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} domain={["auto", "auto"]} />
                                        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            formatter={(value: any, name: any) => [fmtNum(Number(value), 1), String(name)]} />
                                        <Legend />
                                        <RLine yAxisId="esq" dataKey="k" name="K" stroke={K_COLOR} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                                        <RLine yAxisId="esq" dataKey="mg" name="Mg" stroke={MG_COLOR} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                                        <RLine yAxisId="esq" dataKey="lact" name="Lactato" stroke={LACT_COLOR} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                                        <RLine yAxisId="na" dataKey="na" name="Na" stroke={NA_COLOR} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} connectNulls />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                            <SectionTitle>
                                <FaLungs className="text-sky-500" /> Gasometria
                            </SectionTitle>
                            {dataset.length === 0 ? <EmptyState /> : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart data={dataset} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
                                        <XAxis dataKey="dataLabel" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                        <YAxis yAxisId="esq" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} domain={["auto", "auto"]} />
                                        <YAxis yAxisId="ph" orientation="right" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} domain={["auto", "auto"]} />
                                        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            formatter={(value: any, name: any) => [fmtNum(Number(value), 2), String(name)]} />
                                        <Legend />
                                        <RLine yAxisId="esq" dataKey="pco2" name="pCO₂" stroke={PCO2_COLOR} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                                        <RLine yAxisId="esq" dataKey="hco3" name="HCO₃" stroke={HCO3_COLOR} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                                        <RLine yAxisId="ph" dataKey="ph" name="pH" stroke={PH_COLOR} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} connectNulls />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Balanço hídrico & Diurese / PCR */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                            <SectionTitle>
                                <FaTint className="text-blue-500" /> Balanço hídrico & Diurese (ml)
                            </SectionTitle>
                            {dataset.length === 0 ? <EmptyState /> : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart data={dataset} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
                                        <XAxis dataKey="dataLabel" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                        <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} domain={["auto", "auto"]} />
                                        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            formatter={(value: any, name: any) => [`${fmtNum(Number(value))} ml`, String(name)]} />
                                        <Legend />
                                        <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                                        <RLine dataKey="bh" name="Balanço hídrico" stroke={BH_COLOR} strokeWidth={2} dot={{ r: 4 }} connectNulls />
                                        <RLine dataKey="diurese" name="Diurese" stroke={DIURESE_COLOR} strokeWidth={2} dot={{ r: 4 }} connectNulls />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                            <SectionTitle>
                                <FaHeartbeat className="text-red-500" /> PCR (inflamação)
                            </SectionTitle>
                            {dataset.length === 0 ? <EmptyState /> : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart data={dataset} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
                                        <XAxis dataKey="dataLabel" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                        <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} domain={["auto", "auto"]} />
                                        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            formatter={(value: any, name: any) => [fmtNum(Number(value), 1), String(name)]} />
                                        <Legend />
                                        <RLine dataKey="pcr" name="PCR" stroke={PCR_COLOR} strokeWidth={2} dot={{ r: 4 }} connectNulls />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Tabela de registros */}
                    <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                        <SectionTitle>
                            <FaListUl className="text-(--accent)" /> Registros do período
                        </SectionTitle>
                        {data.evolucao.length === 0 ? <EmptyState /> : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-(--text-muted) border-b border-(--border)">
                                            <th className="py-2 pr-4 font-medium">Data</th>
                                            <th className="py-2 pr-4 font-medium text-right">Prescrito</th>
                                            <th className="py-2 pr-4 font-medium text-right">Recebido</th>
                                            <th className="py-2 pr-4 font-medium text-right">% Receb.</th>
                                            <th className="py-2 pr-4 font-medium text-right">Ing. oral</th>
                                            <th className="py-2 pr-4 font-medium text-right">BH</th>
                                            <th className="py-2 pr-4 font-medium text-right">Diurese</th>
                                            <th className="py-2 pr-4 font-medium text-right">PCR</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.evolucao.map((p, i) => (
                                            <tr key={i} className="border-b border-(--border) last:border-0 text-(--text-primary)">
                                                <td className="py-2 pr-4">{fmtData(p.data)}</td>
                                                <td className="py-2 pr-4 text-right">{p.volPrescrito24h != null ? `${fmtNum(p.volPrescrito24h)} ml` : "—"}</td>
                                                <td className="py-2 pr-4 text-right">{p.volRecebido24h != null ? `${fmtNum(p.volRecebido24h)} ml` : "—"}</td>
                                                <td className="py-2 pr-4 text-right">{p.percRecebidoNe != null ? `${fmtNum(p.percRecebidoNe, 1)}%` : "—"}</td>
                                                <td className="py-2 pr-4 text-right">{p.ingestaoMedia != null ? `${fmtNum(p.ingestaoMedia, 1)}%` : "—"}</td>
                                                <td className="py-2 pr-4 text-right">{p.bh != null ? `${fmtNum(p.bh)} ml` : "—"}</td>
                                                <td className="py-2 pr-4 text-right">{p.diurese != null ? `${fmtNum(p.diurese)} ml` : "—"}</td>
                                                <td className="py-2 pr-4 text-right">{p.pcr != null ? fmtNum(p.pcr, 1) : "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

        </TPage>
    )
}
