import { useEffect, useState }                       from "react"
import { useNavigate }                                from "react-router-dom"
import { api }                                        from "../../services/api"
import { useMessage }                                 from "../../hooks/useMessage"
import type { CompromissoDashboard, PorDiaDto,
                PorHoraDto, PorPessoaDto }              from "../../types/CompromissoDashboard"
import type { EstoqueAlertaResponse }                 from "../../types/Estoque"
import type { PendenciasFinanceirasDto,
                PendenciaItemDto }                      from "../../types/PendenciasFinanceiras"
import { TPage }                                      from "../../components/tpage"
import {
    FaCalendarCheck, FaCalendarTimes, FaCheckCircle,
    FaCalendarDay, FaCalendarWeek, FaUser, FaClock,
    FaExclamationTriangle, FaBoxOpen
} from "react-icons/fa"
import {
    FaMoneyBillWave, FaHandHoldingDollar, FaCircleExclamation
} from "react-icons/fa6"

// ── helpers ────────────────────────────────────────────────────────────────────

function Bar({ value, max, color = "bg-(--accent)" }: { value: number; max: number; color?: string }) {
    const pct = max === 0 ? 0 : Math.round((value / max) * 100)
    return (
        <div className="flex-1 h-3 bg-(--border) rounded-full overflow-hidden">
            <div className={`h-full ${color} rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }} />
        </div>
    )
}

function KpiCard({
    label, value, sublabel, icon: Icon, color
}: {
    label:    string
    value:    number
    sublabel?: string
    icon:     React.ElementType
    color:    string
}) {
    return (
        <div className="flex-1 min-w-35 rounded-xl border border-(--border)
                        bg-(--bg-surface) p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-(--text-muted) uppercase tracking-wide">{label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4 text-white" />
                </div>
            </div>
            <p className="text-3xl font-bold text-(--text-primary)">{value.toLocaleString("pt-BR")}</p>
            {sublabel && <p className="text-xs text-(--text-muted)">{sublabel}</p>}
        </div>
    )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-sm font-semibold text-(--text-primary) uppercase tracking-wide mb-3">
            {children}
        </h3>
    )
}

function PendenciaRow({ item, tipo: _tipo, onClick }: { item: PendenciaItemDto; tipo: string; onClick: () => void }) {
    const venc = new Date(item.dataVencimento + "T00:00:00").toLocaleDateString("pt-BR")
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm
                border transition-colors cursor-pointer text-gray-700 dark:text-gray-300
                ${item.vencida
                    ? "border-red-200 bg-white dark:bg-red-950/40 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/60"
                    : "border-orange-200 bg-white dark:bg-orange-950/20 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950/40"}`}
        >
            <div className="flex flex-col min-w-0 flex-1">
                <span className="font-medium text-(--text-primary) truncate">{item.pessoaNome}</span>
                {item.descricao && (
                    <span className="text-xs text-gray-600 dark:text-(--text-muted) truncate">{item.descricao}</span>
                )}
            </div>
            <div className="flex flex-col items-end shrink-0 gap-0.5">
                <span className="text-xs">
                    Parc. {item.numeroParcela} · {venc}
                </span>
                <span className="text-sm font-semibold text-(--text-primary)">
                    {Number(item.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
                {item.vencida && (
                    <span className="text-xs text-red-500 font-medium">
                        {item.diasAtraso}d em atraso
                    </span>
                )}
            </div>
        </button>
    )
}

// ── componente principal ───────────────────────────────────────────────────────

export function DashBoard() {
    const navigate             = useNavigate()
    const { showMessage }      = useMessage()
    const [data,       setData]       = useState<CompromissoDashboard | null>(null)
    const [loading,    setLoading]    = useState(true)
    const [alertas,    setAlertas]    = useState<EstoqueAlertaResponse[]>([])
    const [pendencias, setPendencias] = useState<PendenciasFinanceirasDto | null>(null)

    useEffect(() => {
        api.get<CompromissoDashboard>("/compromissos/dashboard")
            .then((r) => setData(r.data))
            .catch(() => showMessage("error", "Erro ao carregar dashboard"))
            .finally(() => setLoading(false))

        api.get<EstoqueAlertaResponse[]>("/estoque/alertas")
            .then((r) => setAlertas(r.data ?? []))
            .catch(() => { /* silencioso: usuário pode não ter permissão */ })

        api.get<PendenciasFinanceirasDto>("/dashboards/pendencias-financeiras")
            .then((r) => setPendencias(r.data))
            .catch((e) => console.error("pendencias-financeiras:", e?.response?.status, e?.response?.data))
    }, []) // eslint-disable-line

    if (loading) {
        return (
            <TPage title="Dashboard" breadcrumb={["Dashboard"]}>
                <div className="flex justify-center py-16">
                    <span className="w-7 h-7 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            </TPage>
        )
    }

    if (!data) return null

    const maxPessoa = Math.max(...data.topPessoas.map((p: PorPessoaDto) => p.total), 1)
    const maxDia    = Math.max(...data.ultimosSeteDias.map((d: PorDiaDto) => d.total), 1)
    const maxHora   = Math.max(...data.distribuicaoHorario.map((h: PorHoraDto) => h.total), 1)

    return (
        <TPage title="Dashboard" breadcrumb={["Dashboard"]}>

            {/* ── ALERTAS DE ESTOQUE ───────────────────────────────────────── */}
            {alertas.length > 0 && (
                <div className="rounded-xl border border-amber-400 bg-amber-50 dark:bg-amber-950/30 p-4 mb-6">
                    <SectionTitle>
                        <span className="flex items-center gap-2 text-amber-600 dark:border-amber-800">
                            <FaExclamationTriangle /> Alertas de Estoque — quantidade mínima atingida
                            <span className="ml-1 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {alertas.length}
                            </span>
                        </span>
                    </SectionTitle>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {alertas.map((a) => {
                            const critico = a.quantidade <= 0
                            return (
                                <button
                                    key       ={a.estoqueId}
                                    type      ="button"
                                    onClick   ={() => navigate(`/estoque/${a.estoqueId}`)}
                                    className ="flex items-start gap-3 p-3 rounded-lg border border-amber-200
                                                dark:border-amber-800 bg-white dark:bg-amber-950/50
                                                hover:bg-amber-100 dark:hover:bg-amber-900/40 transition text-left w-full"
                                >
                                    <div className={`mt-0.5 w-7 h-7 rounded-md flex items-center justify-center shrink-0
                                        ${critico ? "bg-red-500" : "bg-amber-500"}`}>
                                        <FaBoxOpen className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-sm font-medium text-(--text-primary) truncate">
                                            {a.produtoNome}
                                        </span>
                                        <span className="text-xs text-(--text-muted) truncate">
                                            {a.emitenteNome}
                                        </span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded
                                                ${critico
                                                    ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"}`}>
                                                {critico ? "Sem estoque" : "Estoque baixo"}
                                            </span>
                                            <span className="text-xs text-(--text-muted)">
                                                {Number(a.quantidade).toLocaleString("pt-BR", { minimumFractionDigits: 3 })}
                                                {" "}{a.unidadeMedidaSigla}
                                                {" / mín "}
                                                {Number(a.quantidadeMinima).toLocaleString("pt-BR", { minimumFractionDigits: 3 })}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ── PENDÊNCIAS FINANCEIRAS ───────────────────────────────────── */}
            {pendencias && (pendencias.contasPagar.length > 0 || pendencias.contasReceber.length > 0) && (
                <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/20 p-4 mb-6">
                    <SectionTitle>
                        <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <FaCircleExclamation /> Pendências Financeiras
                        </span>
                    </SectionTitle>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Contas a Pagar */}
                        {pendencias.contasPagar.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                                    <FaMoneyBillWave /> Contas a Pagar ({pendencias.contasPagar.length})
                                </p>
                                <div className="flex flex-col gap-1.5">
                                    {pendencias.contasPagar.map((p: PendenciaItemDto, i: number) => (
                                        <PendenciaRow
                                            key={i}
                                            item={p}
                                            tipo="PAGAR"
                                            onClick={() => navigate("/financeiro/pagar-contas", {
                                                state: {
                                                    preItem: {
                                                        tipo:                "PAGAR",
                                                        parcelaId:           p.parcelaId,
                                                        numeroParcela:       p.numeroParcela,
                                                        contaId:             p.contaId,
                                                        descricao:           p.descricao,
                                                        emitenteId:          p.emitenteId,
                                                        emitenteNome:        p.emitenteNome,
                                                        emitenteDocumento:   null,
                                                        pessoaId:            p.pessoaId,
                                                        pessoaNome:          p.pessoaNome,
                                                        pessoaDocumento:     null,
                                                        dataVencimento:      p.dataVencimento,
                                                        valor:               p.valor,
                                                        formaPagamentoId:    null,
                                                        formaPagamentoNome:  null,
                                                        contaFinanceiraId:   null,
                                                        contaFinanceiraNome: null,
                                                        status:              "ABERTO",
                                                        dataPagamento:       null,
                                                        valorPago:           null,
                                                    }
                                                }
                                            })}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Contas a Receber */}
                        {pendencias.contasReceber.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                                    <FaHandHoldingDollar /> Contas a Receber ({pendencias.contasReceber.length})
                                </p>
                                <div className="flex flex-col gap-1.5">
                                    {pendencias.contasReceber.map((p: PendenciaItemDto, i: number) => (
                                        <PendenciaRow
                                            key={i}
                                            item={p}
                                            tipo="RECEBER"
                                            onClick={() => navigate("/financeiro/pagar-contas", {
                                                state: {
                                                    preItem: {
                                                        tipo:                "RECEBER",
                                                        parcelaId:           p.parcelaId,
                                                        numeroParcela:       p.numeroParcela,
                                                        contaId:             p.contaId,
                                                        descricao:           p.descricao,
                                                        emitenteId:          p.emitenteId,
                                                        emitenteNome:        p.emitenteNome,
                                                        emitenteDocumento:   null,
                                                        pessoaId:            p.pessoaId,
                                                        pessoaNome:          p.pessoaNome,
                                                        pessoaDocumento:     null,
                                                        dataVencimento:      p.dataVencimento,
                                                        valor:               p.valor,
                                                        formaPagamentoId:    null,
                                                        formaPagamentoNome:  null,
                                                        contaFinanceiraId:   null,
                                                        contaFinanceiraNome: null,
                                                        status:              "ABERTO",
                                                        dataPagamento:       null,
                                                        valorPago:           null,
                                                    }
                                                }
                                            })}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── KPIs ─────────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 mb-6">
                <KpiCard label="Agendados"  value={data.totalAgendados}
                    sublabel="ativos no momento"
                    icon={FaCalendarCheck}  color="bg-blue-500" />
                <KpiCard label="Hoje"       value={data.totalHoje}
                    sublabel="compromissos no dia"
                    icon={FaCalendarDay}    color="bg-indigo-500" />
                <KpiCard label="Esta semana" value={data.totalSemana}
                    sublabel="de segunda a domingo"
                    icon={FaCalendarWeek}   color="bg-violet-500" />
                <KpiCard label="Cancelados" value={data.totalCancelados}
                    sublabel="total acumulado"
                    icon={FaCalendarTimes}  color="bg-red-500" />
                <KpiCard label="Concluídos" value={data.totalConcluidos}
                    sublabel="total acumulado"
                    icon={FaCheckCircle}    color="bg-green-500" />
            </div>

            {/* ── linha 2: próximos + top pessoas ──────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

                {/* Próximos hoje */}
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <span className="flex items-center gap-2">
                            <FaClock className="text-(--accent)" /> Próximos hoje
                        </span>
                    </SectionTitle>

                    {data.proximosHoje.length === 0 ? (
                        <p className="text-sm text-(--text-muted) py-4 text-center">
                            Nenhum compromisso restante hoje
                        </p>
                    ) : (
                        <div className="flex flex-col divide-y divide-(--border)">
                            {data.proximosHoje.map((c) => (
                                <button
                                    key       ={c.id}
                                    type      ="button"
                                    onClick   ={() => navigate(`/compromissos/${c.id}`)}
                                    className ="flex items-start gap-3 py-2.5 text-left
                                                hover:bg-(--bg-input) rounded-lg px-2 -mx-2 transition"
                                >
                                    <span className="text-xs font-mono font-semibold text-(--accent)
                                                     bg-(--bg-input) px-2 py-1 rounded whitespace-nowrap mt-0.5">
                                        {c.inicio} – {c.fim}
                                    </span>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-medium text-(--text-primary) truncate">
                                            {c.titulo}
                                        </span>
                                        {c.pessoaNome && (
                                            <span className="text-xs text-(--text-muted) flex items-center gap-1">
                                                <FaUser className="w-2.5 h-2.5" /> {c.pessoaNome}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top 5 pessoas */}
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <span className="flex items-center gap-2">
                            <FaUser className="text-(--accent)" /> Top pessoas
                        </span>
                    </SectionTitle>

                    {data.topPessoas.length === 0 ? (
                        <p className="text-sm text-(--text-muted) py-4 text-center">
                            Nenhum dado disponível
                        </p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {data.topPessoas.map((p, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-xs text-(--text-muted) w-4 text-right font-medium">
                                        {i + 1}.
                                    </span>
                                    <span className="text-sm text-(--text-primary) w-36 truncate">
                                        {p.pessoaNome}
                                    </span>
                                    <Bar value={p.total} max={maxPessoa} />
                                    <span className="text-xs font-semibold text-(--text-primary) w-8 text-right">
                                        {p.total}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── linha 3: últimos 7 dias ───────────────────────────────────── */}
            <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 mb-4">
                <SectionTitle>
                    <span className="flex items-center gap-2">
                        <FaCalendarWeek className="text-(--accent)" /> Últimos 7 dias
                    </span>
                </SectionTitle>

                <div className="flex flex-col gap-2.5">
                    {data.ultimosSeteDias.map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-xs text-(--text-muted) w-8">{d.diaSemana}</span>
                            <span className="text-xs text-(--text-muted) w-12">{d.data}</span>
                            <Bar value={d.total} max={maxDia} color="bg-indigo-500" />
                            <span className="text-xs font-semibold text-(--text-primary) w-6 text-right">
                                {d.total}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── linha 4: distribuição por horário ────────────────────────── */}
            {data.distribuicaoHorario.length > 0 && (
                <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <SectionTitle>
                        <span className="flex items-center gap-2">
                            <FaClock className="text-(--accent)" /> Distribuição por horário
                            <span className="text-xs font-normal normal-case text-(--text-muted)">
                                (últimos 30 dias)
                            </span>
                        </span>
                    </SectionTitle>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {data.distribuicaoHorario.map((h) => (
                            <div key={h.hora} className="flex items-center gap-2">
                                <span className="text-xs font-mono text-(--text-muted) w-10 text-right">
                                    {String(h.hora).padStart(2, "0")}h
                                </span>
                                <Bar value={h.total} max={maxHora} color="bg-violet-500" />
                                <span className="text-xs font-semibold text-(--text-primary) w-6 text-right">
                                    {h.total}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </TPage>
    )
}
