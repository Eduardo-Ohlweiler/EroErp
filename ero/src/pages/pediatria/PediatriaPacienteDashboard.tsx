import { useEffect, useState, useMemo } from "react"
import {
    ComposedChart, Area, Line as RLine,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, LabelList, ResponsiveContainer,
} from "recharts"
import { api }                                 from "../../services/api"
import { useMessage }                          from "../../hooks/useMessage"
import { displayPessoa }                       from "../../utils/pessoas"
import { PERCENTIL_M, PERCENTIL_F }            from "./calculo/percentilOMS"
import type { PercentilLinha }                 from "./calculo/percentilOMS"
import type {
    PediatriaPacienteDashboardDto,
    PontoEvolutivo,
} from "../../types/PediatriaDashboard"
import { TPage }                               from "../../components/tpage"
import { TDbCombo }                            from "../../components/tdbcombo"
import { TCombo }                              from "../../components/tcombo"
import {
    FaUser, FaWeight, FaRulerVertical, FaChild,
    FaChartLine, FaFlask, FaListUl, FaPercentage, FaFireAlt,
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

/** Idade em meses → "X a Ym" (ou "Ym" abaixo de 12). */
function fmtIdadeMeses(meses: number | null | undefined) {
    if (meses == null || Number.isNaN(meses)) return "—"
    if (meses < 12) return `${meses}m`
    const anos = Math.floor(meses / 12)
    const rest = meses % 12
    return rest === 0 ? `${anos}a` : `${anos}a ${rest}m`
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

/** Cor da classificação (replicada de ResultadoPediatricoView). */
function corClassif(classif: string | null | undefined): string {
    if (!classif) return "#94a3b8"   // slate-400 (desconhecido)
    const c = classif.toLowerCase()
    if (c.includes("adequad") || c.includes("normal")) return "#22c55e"   // verde
    if (c.includes("baix")    || c.includes("magrez")) return "#3b82f6"   // azul (abaixo)
    if (c.includes("acima")   || c.includes("sobrepeso") || c.includes("alta")) return "#f59e0b"   // laranja (acima)
    return "#94a3b8"
}

/** Card de classificação colorida (eixo OMS). */
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

/** Badge (pílula) de classificação colorida para uso em tabelas. */
function ClassifBadge({ value }: { value: string | null }) {
    if (!value) return <span className="text-(--text-muted)">—</span>
    const cor = corClassif(value)
    return (
        <span
            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ color: cor, backgroundColor: `${cor}1a` }}
        >
            {value}
        </span>
    )
}

/** Mini-card de valor simples (sem ícone). */
function ValueCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex-1 min-w-32 rounded-lg border border-(--border) bg-(--bg-input) p-3 flex flex-col gap-1">
            <span className="text-xs text-(--text-muted)">{label}</span>
            <span className="text-sm font-semibold text-(--text-primary)">{value}</span>
        </div>
    )
}

// ── paleta / estilos de gráfico ──────────────────────────────────────────────────

const AXIS_COLOR  = "#94a3b8"   // slate-400
const GRID_COLOR  = "#cbd5e1"   // slate-300
const BAND_COLOR  = "#cbd5e1"   // banda OMS (translúcida via opacity)
const PESO_COLOR  = "#6366f1"   // indigo
const EST_COLOR   = "#22c55e"   // verde
const IMC_COLOR   = "#f59e0b"   // laranja
const CAL_COLOR   = "#6366f1"
const PROT_COLOR  = "#22c55e"
const OFERTA_COLOR = "#3b82f6"

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
    { label: "6 meses",  dias: 180 },
    { label: "12 meses", dias: 365 },
    { label: "24 meses", dias: 730 },
    { label: "Tudo",     dias: 0   },
]

// Faixas de mês de vida — limites idênticos ao PediatriaDashboardService.
// "60+" => mesesMin=60 e mesesMax=undefined (aberto).
const FAIXAS_MES: { label: string; min?: number; max?: number }[] = [
    { label: "Todas"  },
    { label: "0–6",   min: 0,  max: 6  },
    { label: "6–12",  min: 6,  max: 12 },
    { label: "12–24", min: 12, max: 24 },
    { label: "24–36", min: 24, max: 36 },
    { label: "36–60", min: 36, max: 60 },
    { label: "60+",   min: 60          },
]

// ── construção do dataset com faixa OMS ───────────────────────────────────────────

interface GraphPoint {
    idadeMeses:  number
    faixaPeso:   [number, number] | null
    faixaEst:    [number, number] | null
    faixaImc:    [number, number] | null
    peso:        number | null
    estatura:    number | null
    imc:         number | null
    classifPeso: string | null
    classifEst:  string | null
    classifImc:  string | null
}

/** Linha do percentil para o mês; undefined fora de 0–60 (sem referência OMS). */
function percentilDoMes(tabela: PercentilLinha[], meses: number): PercentilLinha | undefined {
    if (tabela.length === 0) return undefined
    const idx = Math.round(meses)
    if (idx < 0 || idx > tabela.length - 1) return undefined
    return tabela[idx]
}

/**
 * Monta a série do gráfico: para cada mês do range do paciente,
 * combina a banda OMS (P15–P85) com o valor medido (quando houver avaliação naquele mês).
 */
function montarDataset(evolucao: PontoEvolutivo[], sexo: string | null): GraphPoint[] {
    const pontos = evolucao.filter(p => p.idadeMeses != null) as (PontoEvolutivo & { idadeMeses: number })[]
    if (pontos.length === 0) return []

    const tabela = sexo === "M" ? PERCENTIL_M : PERCENTIL_F

    const minMes = Math.min(...pontos.map(p => p.idadeMeses))
    const maxMes = Math.max(...pontos.map(p => p.idadeMeses))

    // Janela do gráfico: dados do paciente + folga, com largura mínima de ~12 meses.
    // Sem isso, uma única avaliação (minMes === maxMes) não renderiza a faixa OMS — a área precisa de um range no eixo X.
    const PAD = 3
    let lo = Math.max(0, minMes - PAD)
    let hi = maxMes + PAD
    if (hi - lo < 12) {
        const meio = Math.round((minMes + maxMes) / 2)
        lo = Math.max(0, meio - 6)
        hi = meio + 6
    }

    // valores medidos por mês (última avaliação do mês vence)
    const medidoPorMes = new Map<number, PontoEvolutivo>()
    for (const p of pontos) medidoPorMes.set(p.idadeMeses, p)

    const out: GraphPoint[] = []
    for (let m = lo; m <= hi; m++) {
        const linha = percentilDoMes(tabela, m)
        const medido = medidoPorMes.get(m)
        out.push({
            idadeMeses: m,
            faixaPeso:  linha ? [linha.pP15, linha.pP85] : null,
            faixaEst:   linha ? [linha.eP15, linha.eP85] : null,
            faixaImc:   linha ? [linha.iP15, linha.iP85] : null,
            peso:       medido?.peso     ?? null,
            estatura:   medido?.estatura ?? null,
            imc:        medido?.imc      ?? null,
            classifPeso: medido?.classifPesoIdade     ?? null,
            classifEst:  medido?.classifEstaturaIdade ?? null,
            classifImc:  medido?.classifImcIdade      ?? null,
        })
    }
    return out
}

// ── gráfico evolutivo genérico (banda OMS + linha do paciente) ────────────────────

function GraficoOMS({
    data, bandKey, lineKey, classifKey, lineName, lineColor, unidade,
}: {
    data:       GraphPoint[]
    bandKey:    "faixaPeso" | "faixaEst" | "faixaImc"
    lineKey:    "peso" | "estatura" | "imc"
    classifKey: "classifPeso" | "classifEst" | "classifImc"
    lineName:   string
    lineColor:  string
    unidade:    string
}) {
    const temMedido = data.some(d => d[lineKey] != null)
    if (!temMedido) return <EmptyState />

    // Dot colorido pela classificação OMS daquele ponto (oculto onde não há medição).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderDot = (props: any) => {
        const { cx, cy, index, payload } = props
        if (cx == null || cy == null || payload?.[lineKey] == null) {
            return <g key={`dot-${index}`} />
        }
        return (
            <circle key={`dot-${index}`} cx={cx} cy={cy} r={4}
                fill={corClassif(payload[classifKey])} stroke="#fff" strokeWidth={1} />
        )
    }
    return (
        <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
                <XAxis
                    dataKey ="idadeMeses"
                    type    ="number"
                    domain  ={["dataMin", "dataMax"]}
                    tick    ={{ fontSize: 11, fill: AXIS_COLOR }}
                    stroke  ={AXIS_COLOR}
                    tickFormatter={(v: number) => `${v}m`}
                />
                <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR} domain={["auto", "auto"]} />
                <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle  ={TOOLTIP_LABEL_STYLE}
                    itemStyle   ={TOOLTIP_ITEM_STYLE}
                    labelFormatter={(v) => `${v} meses`}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter   ={(value: any, name: any) => {
                        if (name === "Faixa OMS (P15–P85)") {
                            const arr = value as [number, number]
                            if (!Array.isArray(arr)) return ["—", "Faixa OMS"]
                            return [`${fmtNum(arr[0], 1)} – ${fmtNum(arr[1], 1)} ${unidade}`, "Faixa OMS (P15–P85)"]
                        }
                        return [`${fmtNum(Number(value), 1)} ${unidade}`, lineName]
                    }}
                />
                <Legend />
                <Area
                    dataKey     ={bandKey}
                    name        ="Faixa OMS (P15–P85)"
                    stroke      ="none"
                    fill        ={BAND_COLOR}
                    fillOpacity ={0.35}
                    connectNulls
                    activeDot   ={false}
                    isAnimationActive={false}
                />
                <RLine
                    dataKey     ={lineKey}
                    name        ={lineName}
                    stroke      ={lineColor}
                    strokeWidth ={2}
                    dot         ={renderDot}
                    connectNulls
                />
            </ComposedChart>
        </ResponsiveContainer>
    )
}

// ── componente principal ───────────────────────────────────────────────────────

export default function PediatriaPacienteDashboard() {
    const { showMessage } = useMessage()

    const [data,    setData]    = useState<PediatriaPacienteDashboardDto | null>(null)
    const [loading, setLoading] = useState(false)

    const [pessoaId,    setPessoaId]    = useState("")
    const [periodo,     setPeriodo]     = useState(0)        // default: Tudo
    const [faixaIdx,    setFaixaIdx]    = useState(0)        // default: Todas
    const [formulaId,   setFormulaId]   = useState("")

    useEffect(() => {
        // GATE: sem paciente não chama API
        if (!pessoaId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setData(null)
            return
        }

         
        setLoading(true)

        const faixa  = FAIXAS_MES[faixaIdx]
        const params = new URLSearchParams()
        params.set("pessoaId", pessoaId)
        params.set("dias", String(periodo))
        if (formulaId)            params.set("formulaLacteaId", formulaId)
        if (faixa.min != null)    params.set("mesesMin", String(faixa.min))
        if (faixa.max != null)    params.set("mesesMax", String(faixa.max))

        api.get<PediatriaPacienteDashboardDto>(`/pediatria/dashboard/paciente?${params.toString()}`)
            .then(r => setData(r.data))
            .catch(() => showMessage("error", "Erro ao carregar painel do paciente"))
            .finally(() => setLoading(false))
    }, [pessoaId, periodo, faixaIdx, formulaId]) // eslint-disable-line

    const dataset = useMemo(
        () => montarDataset(data?.evolucao ?? [], data?.sexo ?? null),
        [data],
    )

    // dataset de cobertura (% calórico/proteico) e ingestão energética
    const coberturaData = useMemo(
        () => (data?.evolucao ?? [])
            .filter(p => p.idadeMeses != null)
            .map(p => ({
                idadeMeses:   p.idadeMeses,
                percCalorico: p.percCalorico,
                percProteico: p.percProteico,
                vet:          p.vet,
                caloriasTotais: p.caloriasTotais,
            })),
        [data],
    )

    const sexoLabel = data?.sexo === "M" ? "Masculino" : data?.sexo === "F" ? "Feminino" : "—"
    const ultima    = data?.ultimaAvaliacao ?? null
    const umaAvaliacao = (data?.evolucao?.length ?? 0) === 1

    return (
        <TPage title="Painel do Paciente" breadcrumb={["Pediatria", "Painel do Paciente"]}>

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
                                <p className="text-xs text-(--text-muted)">{sexoLabel}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <ValueCard label="Idade atual"        value={fmtIdadeMeses(data.idadeMesesAtual)} />
                            <ValueCard label="Avaliações"         value={fmtNum(data.totalAvaliacoes)} />
                            <ValueCard label="Nascimento"         value={fmtData(data.dataNascimento)} />
                            <ValueCard label="1ª avaliação"       value={fmtData(data.primeiraAvaliacao)} />
                            <ValueCard label="Última avaliação"   value={fmtData(data.ultimaAvaliacaoData)} />
                        </div>
                    </div>

                    {/* Resumo da última avaliação */}
                    {ultima && (
                        <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                            <SectionTitle>
                                <FaChild className="text-(--accent)" /> Última avaliação
                                <span className="text-(--text-muted) font-normal normal-case">
                                    ({fmtData(ultima.dataAvaliacao)} · {fmtIdadeMeses(ultima.idadeMeses)})
                                </span>
                            </SectionTitle>

                            {/* classificações coloridas */}
                            <div className="flex flex-wrap gap-3 mb-3">
                                <ClassifCard label="Peso / Idade"     value={ultima.classifPesoIdade} />
                                <ClassifCard label="Estatura / Idade" value={ultima.classifEstaturaIdade} />
                                <ClassifCard label="IMC / Idade"      value={ultima.classifImcIdade} />
                            </div>

                            {/* valores */}
                            <div className="flex flex-wrap gap-3">
                                <ValueCard label="Peso"               value={ultima.peso != null ? `${fmtNum(ultima.peso, 2)} kg` : "—"} />
                                <ValueCard label="Estatura"           value={ultima.estatura != null ? `${fmtNum(ultima.estatura, 1)} cm` : "—"} />
                                <ValueCard label="IMC"                value={fmtNum(ultima.imc, 2)} />
                                <ValueCard label="VET"                value={ultima.vet != null ? `${fmtNum(ultima.vet)} kcal` : "—"} />
                                <ValueCard label="Nec. proteica"      value={ultima.proteinaNecessidade != null ? `${fmtNum(ultima.proteinaNecessidade, 1)} g` : "—"} />
                                <ValueCard label="Fórmula"            value={ultima.formulaNome ?? "—"} />
                                <ValueCard label="Calorias totais"    value={ultima.caloriasTotais != null ? `${fmtNum(ultima.caloriasTotais)} kcal` : "—"} />
                                <ValueCard label="Proteína total"     value={ultima.proteinaTotal != null ? `${fmtNum(ultima.proteinaTotal, 1)} g` : "—"} />
                                <ValueCard label="% Calórico"         value={ultima.percCalorico != null ? `${fmtNum(ultima.percCalorico, 1)}%` : "—"} />
                                <ValueCard label="% Proteico"         value={ultima.percProteico != null ? `${fmtNum(ultima.percProteico, 1)}%` : "—"} />
                            </div>
                            {ultima.observacao && (
                                <p className="text-xs text-(--text-muted) mt-3">
                                    <span className="font-semibold">Obs.:</span> {ultima.observacao}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Quadros evolutivos OMS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                            <SectionTitle>
                                <FaWeight className="text-indigo-500" /> Peso × idade (vs faixa OMS)
                            </SectionTitle>
                            <GraficoOMS data={dataset} bandKey="faixaPeso" lineKey="peso" classifKey="classifPeso"
                                lineName="Peso do paciente" lineColor={PESO_COLOR} unidade="kg" />
                        </div>

                        <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                            <SectionTitle>
                                <FaRulerVertical className="text-green-500" /> Estatura × idade (vs faixa OMS)
                            </SectionTitle>
                            <GraficoOMS data={dataset} bandKey="faixaEst" lineKey="estatura" classifKey="classifEst"
                                lineName="Estatura do paciente" lineColor={EST_COLOR} unidade="cm" />
                        </div>
                    </div>

                    <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                        <SectionTitle>
                            <FaChartLine className="text-amber-500" /> IMC × idade (vs faixa OMS)
                        </SectionTitle>
                        <GraficoOMS data={dataset} bandKey="faixaImc" lineKey="imc" classifKey="classifImc"
                            lineName="IMC do paciente" lineColor={IMC_COLOR} unidade="" />
                    </div>

                    {/* Cobertura nutricional + ingestão energética */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                            <SectionTitle>
                                <FaPercentage className="text-violet-500" /> Cobertura nutricional no tempo
                            </SectionTitle>
                            {umaAvaliacao && (
                                <p className="text-xs text-(--text-muted) mb-2">1 avaliação — a série evolui com novas avaliações.</p>
                            )}
                            {coberturaData.length === 0 ? (
                                <EmptyState />
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart data={coberturaData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
                                        <XAxis dataKey="idadeMeses" type="number" domain={["dataMin", "dataMax"]}
                                            tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR}
                                            tickFormatter={(v: number) => `${v}m`} />
                                        <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR}
                                            tickFormatter={(v: number) => `${v}%`} />
                                        <Tooltip
                                            contentStyle={TOOLTIP_STYLE}
                                            labelStyle  ={TOOLTIP_LABEL_STYLE}
                                            itemStyle   ={TOOLTIP_ITEM_STYLE}
                                            labelFormatter={(v) => `${v} meses`}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            formatter   ={(value: any, name: any) => [`${fmtNum(Number(value), 1)}%`, String(name)]}
                                        />
                                        <Legend />
                                        <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 4"
                                            label={{ value: "100%", fill: "#ef4444", fontSize: 11, position: "right" }} />
                                        <RLine dataKey="percCalorico" name="% Calórico" stroke={CAL_COLOR}  strokeWidth={2} dot={{ r: 4 }} connectNulls>
                                            <LabelList
                                                dataKey="percCalorico"
                                                position="top"
                                                offset={8}
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                formatter={(v: any) => (v == null ? "" : `${fmtNum(Number(v), 1)}%`)}
                                                style={{ fill: CAL_COLOR, fontSize: 11, fontWeight: 600 }}
                                            />
                                        </RLine>
                                        <RLine dataKey="percProteico" name="% Proteico" stroke={PROT_COLOR} strokeWidth={2} dot={{ r: 4 }} connectNulls>
                                            <LabelList
                                                dataKey="percProteico"
                                                position="top"
                                                offset={8}
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                formatter={(v: any) => (v == null ? "" : `${fmtNum(Number(v), 1)}%`)}
                                                style={{ fill: PROT_COLOR, fontSize: 11, fontWeight: 600 }}
                                            />
                                        </RLine>
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                            <SectionTitle>
                                <FaFireAlt className="text-orange-500" /> Ingestão energética (necessidade vs oferta)
                            </SectionTitle>
                            {umaAvaliacao && (
                                <p className="text-xs text-(--text-muted) mb-2">1 avaliação — a série evolui com novas avaliações.</p>
                            )}
                            {coberturaData.length === 0 ? (
                                <EmptyState />
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart data={coberturaData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.3} />
                                        <XAxis dataKey="idadeMeses" type="number" domain={["dataMin", "dataMax"]}
                                            tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR}
                                            tickFormatter={(v: number) => `${v}m`} />
                                        <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} stroke={AXIS_COLOR}
                                            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)} />
                                        <Tooltip
                                            contentStyle={TOOLTIP_STYLE}
                                            labelStyle  ={TOOLTIP_LABEL_STYLE}
                                            itemStyle   ={TOOLTIP_ITEM_STYLE}
                                            labelFormatter={(v) => `${v} meses`}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            formatter   ={(value: any, name: any) => [`${fmtNum(Number(value))} kcal`, String(name)]}
                                        />
                                        <Legend />
                                        <RLine dataKey="vet" name="Necessidade (VET)" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 4 }} connectNulls>
                                            <LabelList
                                                dataKey="vet"
                                                position="top"
                                                offset={8}
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                formatter={(v: any) => (v == null ? "" : `${fmtNum(Number(v))} kcal`)}
                                                style={{ fill: "#ef4444", fontSize: 11, fontWeight: 600 }}
                                            />
                                        </RLine>
                                        <RLine dataKey="caloriasTotais" name="Oferta" stroke={OFERTA_COLOR} strokeWidth={2} dot={{ r: 4 }} connectNulls>
                                            <LabelList
                                                dataKey="caloriasTotais"
                                                position="top"
                                                offset={8}
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                formatter={(v: any) => (v == null ? "" : `${fmtNum(Number(v))} kcal`)}
                                                style={{ fill: OFERTA_COLOR, fontSize: 11, fontWeight: 600 }}
                                            />
                                        </RLine>
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Histórico de fórmulas */}
                    <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                        <SectionTitle>
                            <FaFlask className="text-teal-500" /> Histórico de fórmulas
                        </SectionTitle>
                        {data.historicoFormulas.length === 0 ? (
                            <EmptyState>Nenhuma fórmula prescrita no período</EmptyState>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-(--text-muted) border-b border-(--border)">
                                            <th className="py-2 pr-4 font-medium">Data</th>
                                            <th className="py-2 pr-4 font-medium">Idade</th>
                                            <th className="py-2 pr-4 font-medium">Fórmula</th>
                                            <th className="py-2 pr-4 font-medium text-right">Volume total</th>
                                            <th className="py-2 pr-4 font-medium text-right">Vezes/dia</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.historicoFormulas.map((h, i) => (
                                            <tr key={i} className="border-b border-(--border) last:border-0 text-(--text-primary)">
                                                <td className="py-2 pr-4">{fmtData(h.dataAvaliacao)}</td>
                                                <td className="py-2 pr-4">{fmtIdadeMeses(h.idadeMeses)}</td>
                                                <td className="py-2 pr-4">{h.formulaNome}</td>
                                                <td className="py-2 pr-4 text-right">{h.volumeTotal != null ? `${fmtNum(h.volumeTotal)} ml` : "—"}</td>
                                                <td className="py-2 pr-4 text-right">{fmtNum(h.vezesDia, 1)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Tabela de avaliações */}
                    <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                        <SectionTitle>
                            <FaListUl className="text-(--accent)" /> Avaliações do período
                        </SectionTitle>
                        {data.evolucao.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-(--text-muted) border-b border-(--border)">
                                            <th className="py-2 pr-4 font-medium">Data</th>
                                            <th className="py-2 pr-4 font-medium">Idade</th>
                                            <th className="py-2 pr-4 font-medium text-right">Peso</th>
                                            <th className="py-2 pr-4 font-medium text-right">Estatura</th>
                                            <th className="py-2 pr-4 font-medium text-right">IMC</th>
                                            <th className="py-2 pr-4 font-medium">Peso/Idade</th>
                                            <th className="py-2 pr-4 font-medium">Estatura/Idade</th>
                                            <th className="py-2 pr-4 font-medium">IMC/Idade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.evolucao.map((p, i) => (
                                            <tr key={i} className="border-b border-(--border) last:border-0 text-(--text-primary)">
                                                <td className="py-2 pr-4">{fmtData(p.dataAvaliacao)}</td>
                                                <td className="py-2 pr-4">{fmtIdadeMeses(p.idadeMeses)}</td>
                                                <td className="py-2 pr-4 text-right">{p.peso != null ? `${fmtNum(p.peso, 2)} kg` : "—"}</td>
                                                <td className="py-2 pr-4 text-right">{p.estatura != null ? `${fmtNum(p.estatura, 1)} cm` : "—"}</td>
                                                <td className="py-2 pr-4 text-right">{fmtNum(p.imc, 2)}</td>
                                                <td className="py-2 pr-4"><ClassifBadge value={p.classifPesoIdade} /></td>
                                                <td className="py-2 pr-4"><ClassifBadge value={p.classifEstaturaIdade} /></td>
                                                <td className="py-2 pr-4"><ClassifBadge value={p.classifImcIdade} /></td>
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
