import { useEffect, useState, useMemo } from "react"
import {
    LineChart, Line as RLine,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import { api }                                 from "../../services/api"
import { useMessage }                          from "../../hooks/useMessage"
import { displayPessoa }                       from "../../utils/pessoas"
import type {
    OtorrinoPacienteDashboard as OtorrinoPacienteDashboardDto,
    OtorrinoEscalaEvolucao,
} from "../../types/Otorrino"
import { TPage }                               from "../../components/tpage"
import { TDbCombo }                            from "../../components/tdbcombo"
import {
    FaUser, FaAssistiveListeningSystems, FaWaveSquare,
    FaClipboardList, FaFileMedicalAlt, FaDeaf, FaChartLine,
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

// ── paleta / estilos de gráfico ──────────────────────────────────────────────────

const PALETTE    = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"]
const AXIS_COLOR = "#94a3b8"
const GRID_COLOR = "#cbd5e1"
const COR_OD     = "#ef4444"   // orelha direita — vermelho
const COR_OE     = "#3b82f6"   // orelha esquerda — azul

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

/** Rótulo amigável de grau de perda. */
function grauLabel(g: string | null | undefined) {
    if (!g) return "—"
    const map: Record<string, string> = {
        NORMAL: "Normal", LEVE: "Leve", MODERADA: "Moderada",
        SEVERA: "Severa", PROFUNDA: "Profunda",
    }
    return map[g] ?? g
}

// ── pivot das escalas: uma série por código, agrupado por data ────────────────────

interface EscalaPonto {
    data: string
    [codigo: string]: number | string | null
}

function pivotEscalas(evolucao: OtorrinoEscalaEvolucao[]): {
    serie:   EscalaPonto[]
    codigos: { codigo: string; nome: string }[]
    /** lookup: `${data}|${codigo}` → ponto original (para tooltip com nome + classificação) */
    meta:    Map<string, OtorrinoEscalaEvolucao>
} {
    const codigosMap = new Map<string, string>()       // codigo → nome
    const porData    = new Map<string, EscalaPonto>()   // data → ponto pivotado
    const meta       = new Map<string, OtorrinoEscalaEvolucao>()

    for (const e of evolucao) {
        codigosMap.set(e.codigo, e.nome)
        meta.set(`${e.data}|${e.codigo}`, e)
        let ponto = porData.get(e.data)
        if (!ponto) {
            ponto = { data: e.data }
            porData.set(e.data, ponto)
        }
        ponto[e.codigo] = e.scoreTotal
    }

    const serie = [...porData.values()].sort((a, b) => a.data.localeCompare(b.data))
    const codigos = [...codigosMap.entries()].map(([codigo, nome]) => ({ codigo, nome }))
    return { serie, codigos, meta }
}

// ── componente principal ───────────────────────────────────────────────────────

export default function OtorrinoPacienteDashboard() {
    const { showMessage } = useMessage()

    const [data,    setData]    = useState<OtorrinoPacienteDashboardDto | null>(null)
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

        api.get<OtorrinoPacienteDashboardDto>(`/otorrino/dashboard/paciente?${params.toString()}`)
            .then(r => setData(r.data))
            .catch(() => showMessage("error", "Erro ao carregar painel do paciente"))
            .finally(() => setLoading(false))
    }, [pessoaId, periodo]) // eslint-disable-line

    const audiometriaData = data?.audiometriaEvolucao ?? []
    const temAudiometria  = audiometriaData.some(p => p.mediaOd != null || p.mediaOe != null)

    const { serie: escalaSerie, codigos: escalaCodigos, meta: escalaMeta } = useMemo(
        () => pivotEscalas(data?.escalaEvolucao ?? []),
        [data],
    )

    const resumo  = data?.resumo
    const ultima  = data?.ultimaAudiometria ?? null
    const semDados = data != null
        && (resumo?.totalAudiometrias ?? 0) === 0
        && (resumo?.totalImitanciometrias ?? 0) === 0
        && (resumo?.totalEscalas ?? 0) === 0
        && (resumo?.totalLaudos ?? 0) === 0

    return (
        <TPage title="Painel do Paciente" breadcrumb={["Otorrinolaringologia", "Painel do Paciente"]}>

            {/* ── Barra de filtros ──────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2 mb-5 items-end">

                {/* paciente (obrigatório) */}
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

            {/* ── sem dados ──────────────────────────────────────────────────── */}
            {pessoaId && !loading && semDados && (
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <EmptyState>Nenhum exame ou escala encontrado para os filtros selecionados</EmptyState>
                </div>
            )}

            {/* ── conteúdo ────────────────────────────────────────────────────── */}
            {pessoaId && data && !semDados && (
                <>
                    {/* Cabeçalho do paciente */}
                    <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-(--accent) flex items-center justify-center shrink-0">
                                <FaUser className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-lg font-semibold text-(--text-primary) truncate">{data.pessoaNome ?? "—"}</p>
                                {ultima && (
                                    <p className="text-xs text-(--text-muted)">
                                        Última audiometria em {fmtData(ultima.data)} ·
                                        {" "}OD {grauLabel(ultima.grauOd)} · OE {grauLabel(ultima.grauOe)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* KPIs do resumo */}
                    <div className="flex flex-wrap gap-3 mb-5">
                        <KpiCard label="Audiometrias"     value={fmtNum(resumo?.totalAudiometrias)}
                            sublabel="no período" icon={FaAssistiveListeningSystems} color="bg-(--accent)" />
                        <KpiCard label="Imitanciometrias" value={fmtNum(resumo?.totalImitanciometrias)}
                            sublabel="no período" icon={FaWaveSquare} color="bg-blue-500" />
                        <KpiCard label="Escalas"          value={fmtNum(resumo?.totalEscalas)}
                            sublabel="aplicadas" icon={FaClipboardList} color="bg-violet-500" />
                        <KpiCard label="Laudos"           value={fmtNum(resumo?.totalLaudos)}
                            sublabel="descritivos" icon={FaFileMedicalAlt} color="bg-amber-500" />
                        <KpiCard label="Última audiometria" value={grauLabel(ultima?.grauOd)}
                            sublabel={`OD · OE ${grauLabel(ultima?.grauOe)}`} icon={FaDeaf} color="bg-rose-500" />
                    </div>

                    {/* Evolução dos audiogramas (média tonal) */}
                    <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                        <SectionTitle>
                            <FaAssistiveListeningSystems className="text-(--accent)" /> Evolução das audiometrias (média tonal)
                        </SectionTitle>
                        {!temAudiometria ? (
                            <EmptyState>Nenhuma audiometria no período</EmptyState>
                        ) : (
                            <ResponsiveContainer width="100%" height={320}>
                                <LineChart data={audiometriaData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
                                    <XAxis
                                        dataKey ="data"
                                        tick    ={{ fontSize: 11, fill: AXIS_COLOR }}
                                        stroke  ={AXIS_COLOR}
                                        tickFormatter={fmtData}
                                    />
                                    <YAxis
                                        tick   ={{ fontSize: 11, fill: AXIS_COLOR }}
                                        stroke ={AXIS_COLOR}
                                        domain ={["auto", "auto"]}
                                        label  ={{ value: "Média tonal (dB)", angle: -90, position: "insideLeft", fill: AXIS_COLOR, fontSize: 11 }}
                                    />
                                    <Tooltip
                                        contentStyle={TOOLTIP_STYLE}
                                        labelStyle  ={TOOLTIP_LABEL_STYLE}
                                        itemStyle   ={TOOLTIP_ITEM_STYLE}
                                        labelFormatter={(v) => fmtData(String(v))}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        formatter   ={(value: any, name: any) => [`${fmtNum(Number(value), 1)} dB`, String(name)]}
                                    />
                                    <Legend />
                                    <RLine dataKey="mediaOd" name="Média OD" stroke={COR_OD} strokeWidth={2} dot={{ r: 4 }} connectNulls />
                                    <RLine dataKey="mediaOe" name="Média OE" stroke={COR_OE} strokeWidth={2} dot={{ r: 4 }} connectNulls />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Evolução dos scores das escalas */}
                    <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                        <SectionTitle>
                            <FaChartLine className="text-violet-500" /> Evolução dos scores das escalas
                        </SectionTitle>
                        {escalaSerie.length === 0 ? (
                            <EmptyState>Nenhuma escala aplicada no período</EmptyState>
                        ) : (
                            <ResponsiveContainer width="100%" height={320}>
                                <LineChart data={escalaSerie} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
                                    <XAxis
                                        dataKey ="data"
                                        tick    ={{ fontSize: 11, fill: AXIS_COLOR }}
                                        stroke  ={AXIS_COLOR}
                                        tickFormatter={fmtData}
                                    />
                                    <YAxis
                                        tick   ={{ fontSize: 11, fill: AXIS_COLOR }}
                                        stroke ={AXIS_COLOR}
                                        domain ={["auto", "auto"]}
                                        allowDecimals={false}
                                        label  ={{ value: "Score", angle: -90, position: "insideLeft", fill: AXIS_COLOR, fontSize: 11 }}
                                    />
                                    <Tooltip
                                        contentStyle={TOOLTIP_STYLE}
                                        labelStyle  ={TOOLTIP_LABEL_STYLE}
                                        itemStyle   ={TOOLTIP_ITEM_STYLE}
                                        labelFormatter={(v) => fmtData(String(v))}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        formatter   ={(value: any, _name: any, p: any) => {
                                            const codigo = String(p?.dataKey ?? "")
                                            const dataIso = String(p?.payload?.data ?? "")
                                            const orig = escalaMeta.get(`${dataIso}|${codigo}`)
                                            const sufixo = orig?.classificacao ? ` (${orig.classificacao})` : ""
                                            const label  = orig?.nome ?? codigo
                                            return [`${fmtNum(Number(value))}${sufixo}`, label]
                                        }}
                                    />
                                    <Legend
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        formatter={(value: any) => {
                                            const c = escalaCodigos.find(c => c.codigo === value)
                                            return c?.codigo ?? String(value)
                                        }}
                                    />
                                    {escalaCodigos.map((c, i) => (
                                        <RLine
                                            key         ={c.codigo}
                                            dataKey     ={c.codigo}
                                            name        ={c.codigo}
                                            stroke      ={PALETTE[i % PALETTE.length]}
                                            strokeWidth ={2}
                                            dot         ={{ r: 4 }}
                                            connectNulls
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                        {escalaCodigos.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {escalaCodigos.map((c, i) => (
                                    <span key={c.codigo} className="inline-flex items-center gap-1.5 text-xs text-(--text-muted)">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                                        <span className="font-medium text-(--text-primary)">{c.codigo}</span>
                                        <span>· {c.nome}</span>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tabela de audiometrias do período */}
                    {audiometriaData.length > 0 && (
                        <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                            <SectionTitle>
                                <FaAssistiveListeningSystems className="text-(--accent)" /> Audiometrias do período
                            </SectionTitle>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-(--text-muted) border-b border-(--border)">
                                            <th className="py-2 pr-4 font-medium">Data</th>
                                            <th className="py-2 pr-4 font-medium text-right">Média OD</th>
                                            <th className="py-2 pr-4 font-medium text-right">Média OE</th>
                                            <th className="py-2 pr-4 font-medium">Grau OD</th>
                                            <th className="py-2 pr-4 font-medium">Grau OE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...audiometriaData].reverse().map((p, i) => (
                                            <tr key={i} className="border-b border-(--border) last:border-0 text-(--text-primary)">
                                                <td className="py-2 pr-4">{fmtData(p.data)}</td>
                                                <td className="py-2 pr-4 text-right">{p.mediaOd != null ? `${fmtNum(p.mediaOd, 1)} dB` : "—"}</td>
                                                <td className="py-2 pr-4 text-right">{p.mediaOe != null ? `${fmtNum(p.mediaOe, 1)} dB` : "—"}</td>
                                                <td className="py-2 pr-4">{grauLabel(p.grauOd)}</td>
                                                <td className="py-2 pr-4">{grauLabel(p.grauOe)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

        </TPage>
    )
}
