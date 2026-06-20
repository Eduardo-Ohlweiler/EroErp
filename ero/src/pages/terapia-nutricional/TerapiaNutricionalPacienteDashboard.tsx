import { useEffect, useState, useMemo } from "react"
import {
    ComposedChart, Line as RLine,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, LabelList, ResponsiveContainer,
} from "recharts"
import { api }                                 from "../../services/api"
import { useMessage }                          from "../../hooks/useMessage"
import { displayPessoa }                       from "../../utils/pessoas"
import type {
    TerapiaNutricionalPacienteDashboard as DashboardDto,
    PontoEvolutivoNutricional,
} from "../../types/TerapiaNutricional"
import { TPage }                               from "../../components/tpage"
import { TDbCombo }                            from "../../components/tdbcombo"
import {
    FaUser, FaWeight, FaChartLine, FaPercentage, FaFireAlt, FaDrumstickBite, FaListUl, FaRulerHorizontal,
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

function corClassif(classif: string | null | undefined): string {
    if (!classif) return "#94a3b8"
    const c = classif.toLowerCase()
    if (c.includes("eutrof") || c.includes("adequad") || c.includes("normal")) return "#22c55e"
    if (c.includes("desnutri") || c.includes("baix") || c.includes("magrez")) return "#3b82f6"
    if (c.includes("sobrepeso") || c.includes("obesid") || c.includes("excesso") || c.includes("alta")) return "#f59e0b"
    return "#94a3b8"
}

function ClassifCard({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="flex-1 min-w-44 rounded-xl border border-(--border) bg-(--bg-surface) p-4 flex flex-col gap-2">
            <p className="text-xs font-medium text-(--text-muted) uppercase tracking-wide">{label}</p>
            <p className="text-lg font-bold leading-tight" style={{ color: corClassif(value) }}>
                {value ?? "—"}
            </p>
        </div>
    )
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
const PESO_COLOR  = "#6366f1"
const IMC_COLOR   = "#f59e0b"
const META_COLOR  = "#ef4444"
const OFERTA_COLOR = "#3b82f6"
const PTN_COLOR   = "#22c55e"
const VCT_COLOR   = "#6366f1"
const CB_COLOR    = "#0ea5e9"
const CP_COLOR    = "#14b8a6"

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
    { label: "3 meses",  dias: 90  },
    { label: "6 meses",  dias: 180 },
    { label: "12 meses", dias: 365 },
    { label: "Tudo",     dias: 0   },
]

// ── ponto do gráfico (data formatada para eixo X) ────────────────────────────────

interface GraphPoint extends PontoEvolutivoNutricional {
    dataLabel: string
}

function montarDataset(evolucao: PontoEvolutivoNutricional[]): GraphPoint[] {
    return evolucao.map(p => ({ ...p, dataLabel: fmtData(p.dataAvaliacao) }))
}

// ── componente principal ───────────────────────────────────────────────────────

export default function TerapiaNutricionalPacienteDashboard() {
    const { showMessage } = useMessage()

    const [data,    setData]    = useState<DashboardDto | null>(null)
    const [loading, setLoading] = useState(false)

    const [pessoaId, setPessoaId] = useState("")
    const [periodo,  setPeriodo]  = useState(0)   // default: Tudo

    useEffect(() => {
        if (!pessoaId) {
            setData(null)
            return
        }
        setLoading(true)
        const params = new URLSearchParams()
        params.set("pessoaId", pessoaId)
        params.set("dias", String(periodo))
        api.get<DashboardDto>(`/terapia-nutricional/dashboard/paciente?${params.toString()}`)
            .then(r => setData(r.data))
            .catch(() => showMessage("error", "Erro ao carregar painel do paciente"))
            .finally(() => setLoading(false))
    }, [pessoaId, periodo]) // eslint-disable-line

    const dataset = useMemo(() => montarDataset(data?.evolucao ?? []), [data])

    const ultima       = data?.ultimaAvaliacao ?? null
    const umaAvaliacao = (data?.evolucao?.length ?? 0) === 1

    return (
        <TPage title="Painel de Avaliação" breadcrumb={["Terapia Nutricional", "Painel de Avaliação"]}>

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
                    <EmptyState>Selecione um paciente para ver o painel evolutivo</EmptyState>
                </div>
            )}

            {/* ── loading ─────────────────────────────────────────────────────── */}
            {pessoaId && loading && !data && (
                <div className="flex justify-center py-16">
                    <span className="w-7 h-7 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* ── sem avaliações ──────────────────────────────────────────────── */}
            {pessoaId && !loading && data && data.totalAvaliacoes === 0 && (
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <EmptyState>Nenhuma avaliação encontrada para os filtros selecionados</EmptyState>
                </div>
            )}

            {/* ── conteúdo ────────────────────────────────────────────────────── */}
            {pessoaId && data && data.totalAvaliacoes > 0 && (
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
                            <ValueCard label="Avaliações"       value={fmtNum(data.totalAvaliacoes)} />
                            <ValueCard label="1ª avaliação"     value={fmtData(data.primeiraAvaliacao)} />
                            <ValueCard label="Última avaliação" value={fmtData(data.ultimaAvaliacaoData)} />
                        </div>
                    </div>

                    {/* Resumo da última avaliação */}
                    {ultima && (
                        <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                            <SectionTitle>
                                <FaChartLine className="text-(--accent)" /> Última avaliação
                                <span className="text-(--text-muted) font-normal normal-case">
                                    ({fmtData(ultima.dataAvaliacao)})
                                </span>
                            </SectionTitle>

                            <div className="flex flex-wrap gap-3 mb-3">
                                <ClassifCard label="Classif. IMC (OMS)" value={ultima.classifImcOms} />
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <ValueCard label="Peso atual"      value={ultima.pesoAtual != null ? `${fmtNum(ultima.pesoAtual, 1)} kg` : "—"} />
                                <ValueCard label="IMC"             value={fmtNum(ultima.imc, 2)} />
                                <ValueCard label="Peso ideal"      value={ultima.pesoIdeal != null ? `${fmtNum(ultima.pesoIdeal, 1)} kg` : "—"} />
                                <ValueCard label="Peso ajustado"   value={ultima.pesoAjustado != null ? `${fmtNum(ultima.pesoAjustado, 1)} kg` : "—"} />
                                <ValueCard label="% Adequação CB"  value={ultima.percAdequacaoCb != null ? `${fmtNum(ultima.percAdequacaoCb, 1)}%` : "—"} />
                                <ValueCard label="Meta kcal"       value={ultima.kcalTotal != null ? `${fmtNum(ultima.kcalTotal)} kcal` : "—"} />
                                <ValueCard label="Meta proteína"   value={ultima.ptnTotal != null ? `${fmtNum(ultima.ptnTotal, 1)} g` : "—"} />
                                <ValueCard label="Dieta kcal"      value={ultima.dietaKcal != null ? `${fmtNum(ultima.dietaKcal)} kcal` : "—"} />
                                <ValueCard label="Dieta proteína"  value={ultima.dietaPtn != null ? `${fmtNum(ultima.dietaPtn, 1)} g` : "—"} />
                                <ValueCard label="% VCT"           value={ultima.percVct != null ? `${fmtNum(ultima.percVct, 1)}%` : "—"} />
                                <ValueCard label="% PTN"           value={ultima.percPtn != null ? `${fmtNum(ultima.percPtn, 1)}%` : "—"} />
                                <ValueCard label="Fórmula"         value={ultima.formulaNome ?? "—"} />
                            </div>
                        </div>
                    )}

                    {umaAvaliacao && (
                        <p className="text-xs text-(--text-muted) mb-2">
                            1 avaliação — as séries evolutivas ganham forma com novas avaliações.
                        </p>
                    )}

                    {/* Peso & IMC */}
                    <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                        <SectionTitle>
                            <FaWeight className="text-indigo-500" /> Peso & IMC no tempo
                        </SectionTitle>
                        {dataset.length === 0 ? <EmptyState /> : (
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={dataset} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
                                    <XAxis dataKey="dataLabel" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                    <YAxis yAxisId="peso" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} domain={["auto", "auto"]} />
                                    <YAxis yAxisId="imc" orientation="right" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} domain={["auto", "auto"]} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        formatter={(value: any, name: any) => [fmtNum(Number(value), 2), String(name)]} />
                                    <Legend />
                                    <RLine yAxisId="peso" dataKey="pesoAtual" name="Peso (kg)" stroke={PESO_COLOR} strokeWidth={2} dot={{ r: 4 }} connectNulls />
                                    <RLine yAxisId="imc" dataKey="imc" name="IMC" stroke={IMC_COLOR} strokeWidth={2} dot={{ r: 4 }} connectNulls />
                                </ComposedChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Circunferências CB & CP */}
                    <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                        <SectionTitle>
                            <FaWeight className="text-sky-500" /> Circunferências CB &amp; CP no tempo
                        </SectionTitle>
                        {dataset.length === 0 ? <EmptyState /> : (
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={dataset} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
                                    <XAxis dataKey="dataLabel" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                    <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} domain={["auto", "auto"]}
                                        tickFormatter={(v: number) => `${v} cm`} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        formatter={(value: any, name: any) => [`${fmtNum(Number(value), 1)} cm`, String(name)]} />
                                    <Legend />
                                    <RLine dataKey="cb" name="CB — braço (cm)" stroke={CB_COLOR} strokeWidth={2} dot={{ r: 4 }} connectNulls />
                                    <RLine dataKey="cp" name="CP — panturrilha (cm)" stroke={CP_COLOR} strokeWidth={2} dot={{ r: 4 }} connectNulls />
                                </ComposedChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Energia & Proteína: meta x ofertado */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                            <SectionTitle>
                                <FaFireAlt className="text-orange-500" /> Energia (meta × ofertado)
                            </SectionTitle>
                            {dataset.length === 0 ? <EmptyState /> : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart data={dataset} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
                                        <XAxis dataKey="dataLabel" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                        <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR}
                                            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)} />
                                        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            formatter={(value: any, name: any) => [`${fmtNum(Number(value))} kcal`, String(name)]} />
                                        <Legend />
                                        <RLine dataKey="kcalTotal" name="Meta (kcal)" stroke={META_COLOR} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 4 }} connectNulls />
                                        <RLine dataKey="dietaKcal" name="Ofertado (kcal)" stroke={OFERTA_COLOR} strokeWidth={2} dot={{ r: 4 }} connectNulls>
                                            <LabelList dataKey="dietaKcal" position="top" offset={8}
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                formatter={(v: any) => (v == null ? "" : `${fmtNum(Number(v))}`)}
                                                style={{ fill: OFERTA_COLOR, fontSize: 11, fontWeight: 600 }} />
                                        </RLine>
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                            <SectionTitle>
                                <FaDrumstickBite className="text-green-500" /> Proteína (meta × ofertado)
                            </SectionTitle>
                            {dataset.length === 0 ? <EmptyState /> : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart data={dataset} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
                                        <XAxis dataKey="dataLabel" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                        <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            formatter={(value: any, name: any) => [`${fmtNum(Number(value), 1)} g`, String(name)]} />
                                        <Legend />
                                        <RLine dataKey="ptnTotal" name="Meta (g)" stroke={META_COLOR} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 4 }} connectNulls />
                                        <RLine dataKey="dietaPtn" name="Ofertado (g)" stroke={PTN_COLOR} strokeWidth={2} dot={{ r: 4 }} connectNulls>
                                            <LabelList dataKey="dietaPtn" position="top" offset={8}
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                formatter={(v: any) => (v == null ? "" : `${fmtNum(Number(v), 1)}`)}
                                                style={{ fill: PTN_COLOR, fontSize: 11, fontWeight: 600 }} />
                                        </RLine>
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Cobertura (%VCT / %PTN) & %Adequação CB */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                            <SectionTitle>
                                <FaPercentage className="text-violet-500" /> Cobertura nutricional (% da meta)
                            </SectionTitle>
                            {dataset.length === 0 ? <EmptyState /> : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart data={dataset} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
                                        <XAxis dataKey="dataLabel" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                        <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} tickFormatter={(v: number) => `${v}%`} />
                                        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            formatter={(value: any, name: any) => [`${fmtNum(Number(value), 1)}%`, String(name)]} />
                                        <Legend />
                                        <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 4"
                                            label={{ value: "100%", fill: "#ef4444", fontSize: 11, position: "right" }} />
                                        <RLine dataKey="percVct" name="% VCT" stroke={VCT_COLOR} strokeWidth={2} dot={{ r: 4 }} connectNulls>
                                            <LabelList dataKey="percVct" position="top" offset={8}
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                formatter={(v: any) => (v == null ? "" : `${fmtNum(Number(v), 1)}%`)}
                                                style={{ fill: VCT_COLOR, fontSize: 11, fontWeight: 600 }} />
                                        </RLine>
                                        <RLine dataKey="percPtn" name="% PTN" stroke={PTN_COLOR} strokeWidth={2} dot={{ r: 4 }} connectNulls>
                                            <LabelList dataKey="percPtn" position="top" offset={8}
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                formatter={(v: any) => (v == null ? "" : `${fmtNum(Number(v), 1)}%`)}
                                                style={{ fill: PTN_COLOR, fontSize: 11, fontWeight: 600 }} />
                                        </RLine>
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                            <SectionTitle>
                                <FaRulerHorizontal className="text-sky-500" /> % Adequação CB no tempo
                            </SectionTitle>
                            {dataset.length === 0 ? <EmptyState /> : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart data={dataset} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
                                        <XAxis dataKey="dataLabel" tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} />
                                        <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} tickFormatter={(v: number) => `${v}%`} />
                                        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            formatter={(value: any, name: any) => [`${fmtNum(Number(value), 1)}%`, String(name)]} />
                                        <Legend />
                                        <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="4 4"
                                            label={{ value: "100%", fill: "#94a3b8", fontSize: 11, position: "right" }} />
                                        <RLine dataKey="percAdequacaoCb" name="% Adequação CB" stroke={CB_COLOR} strokeWidth={2} dot={{ r: 4 }} connectNulls>
                                            <LabelList dataKey="percAdequacaoCb" position="top" offset={8}
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                formatter={(v: any) => (v == null ? "" : `${fmtNum(Number(v), 1)}%`)}
                                                style={{ fill: CB_COLOR, fontSize: 11, fontWeight: 600 }} />
                                        </RLine>
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Tabela de avaliações */}
                    <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                        <SectionTitle>
                            <FaListUl className="text-(--accent)" /> Avaliações do período
                        </SectionTitle>
                        {data.evolucao.length === 0 ? <EmptyState /> : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-(--text-muted) border-b border-(--border)">
                                            <th className="py-2 pr-4 font-medium">Data</th>
                                            <th className="py-2 pr-4 font-medium text-right">Peso</th>
                                            <th className="py-2 pr-4 font-medium text-right">IMC</th>
                                            <th className="py-2 pr-4 font-medium text-right">% Adeq. CB</th>
                                            <th className="py-2 pr-4 font-medium text-right">Meta kcal</th>
                                            <th className="py-2 pr-4 font-medium text-right">Dieta kcal</th>
                                            <th className="py-2 pr-4 font-medium text-right">% VCT</th>
                                            <th className="py-2 pr-4 font-medium text-right">% PTN</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.evolucao.map((p, i) => (
                                            <tr key={i} className="border-b border-(--border) last:border-0 text-(--text-primary)">
                                                <td className="py-2 pr-4">{fmtData(p.dataAvaliacao)}</td>
                                                <td className="py-2 pr-4 text-right">{p.pesoAtual != null ? `${fmtNum(p.pesoAtual, 1)} kg` : "—"}</td>
                                                <td className="py-2 pr-4 text-right">{fmtNum(p.imc, 2)}</td>
                                                <td className="py-2 pr-4 text-right">{p.percAdequacaoCb != null ? `${fmtNum(p.percAdequacaoCb, 1)}%` : "—"}</td>
                                                <td className="py-2 pr-4 text-right">{p.kcalTotal != null ? fmtNum(p.kcalTotal) : "—"}</td>
                                                <td className="py-2 pr-4 text-right">{p.dietaKcal != null ? fmtNum(p.dietaKcal) : "—"}</td>
                                                <td className="py-2 pr-4 text-right">{p.percVct != null ? `${fmtNum(p.percVct, 1)}%` : "—"}</td>
                                                <td className="py-2 pr-4 text-right">{p.percPtn != null ? `${fmtNum(p.percPtn, 1)}%` : "—"}</td>
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
