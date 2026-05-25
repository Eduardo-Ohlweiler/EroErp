import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useMessage } from "../../hooks/useMessage";

type TipoRecorrencia =
    | "DIARIO"
    | "SEMANAL"
    | "QUINZENAL"
    | "MENSAL"
    | "TRIMESTRAL"
    | "SEMESTRAL"
    | "ANUAL";

type ViewMode = "month" | "week" | "day";

interface Evento {
    id: number;
    titulo: string;
    cor: string;
    inicio: string;
    fim: string;
    cancelado: boolean;
    concluido: boolean;
    pessoaNome: string | null;
    tipoRecorrencia: TipoRecorrencia | null;
    compromissoPaiId: number | null;
}

function isoToDate(iso: string) {
    return new Date(iso);
}

function formatISOLocal(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function addDays(d: Date, n: number) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

function startOfWeek(d: Date) {
    const r = new Date(d);
    const day = r.getDay() === 0 ? 6 : r.getDay() - 1;
    r.setDate(r.getDate() - day);
    r.setHours(0, 0, 0, 0);
    return r;
}

function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function sameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function formatHM(d: Date) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDateBR(d: Date) {
    return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

const WEEKDAYS_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const WEEKDAYS_FULL = [
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
    "Domingo",
];
const MONTHS = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
];

function textColorFor(bg: string) {
    const r = parseInt(bg.slice(1, 3), 16);
    const g = parseInt(bg.slice(3, 5), 16);
    const b = parseInt(bg.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? "#1a1a1a" : "#ffffff";
}

function EventoPill({
    evento,
    onClick,
    compact = false,
    }: {
    evento: Evento;
    onClick: (e: Evento) => void;
    compact?: boolean;
    }) {
    const cor = evento.cancelado ? "#94a3b8" : evento.cor;
    const txtCol = textColorFor(cor);
    const inicio = isoToDate(evento.inicio);
    const fim = isoToDate(evento.fim);
    const isSerie = evento.compromissoPaiId !== null;

    let label = evento.titulo;
    if (evento.cancelado) label = `✕ ${label}`;
    else if (evento.concluido) label = `✔ ${label}`;

    return (
        <button
        onClick={() => onClick(evento)}
        title={`${formatHM(inicio)} – ${formatHM(fim)}\n${evento.titulo}${evento.pessoaNome ? `\n${evento.pessoaNome}` : ""}`}
        className="w-full text-left rounded px-1.5 py-0.5 text-xs font-medium truncate
                        transition-opacity hover:opacity-80 cursor-pointer"
        style={{ backgroundColor: cor, color: txtCol }}
        >
        <span className="opacity-80 mr-1">
            {formatHM(inicio)} - {formatHM(fim)}
        </span>
        {label}
        {isSerie && !compact && <span className="ml-1 opacity-60">↺</span>}
        </button>
    );
}

export default function CompromissoCalendario() {
    const navigate = useNavigate();
    const { showMessage } = useMessage();
    const [view, setView] = useState<ViewMode>("month");
    const [current, setCurrent] = useState(new Date());
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [loading, setLoading] = useState(false);
    const [tooltip, setTooltip] = useState<Evento | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const getWindow = useCallback(() => {
        if (view === "day") {
        const s = new Date(current);
        s.setHours(0, 0, 0, 0);
        const e = new Date(current);
        e.setHours(23, 59, 59, 0);
        return { inicio: s, fim: e };
        }
        if (view === "week") {
        const s = startOfWeek(current);
        const e = addDays(s, 6);
        e.setHours(23, 59, 59, 0);
        return { inicio: s, fim: e };
        }
        const s = startOfMonth(current);
        s.setDate(s.getDate() - 7);
        const e = new Date(current.getFullYear(), current.getMonth() + 1, 7);
        return { inicio: s, fim: e };
    }, [view, current]);

    const loadEventos = useCallback(async () => {
        setLoading(true);
        try {
        const { inicio, fim } = getWindow();
        const res = await api.get<Evento[]>("/compromissos/calendario", {
            params: {
            inicio: formatISOLocal(inicio),
            fim: formatISOLocal(fim),
            },
        });
        setEventos(res.data);
        } catch {
        showMessage("error", "Erro ao carregar compromissos");
        } finally {
        setLoading(false);
        }
    }, [getWindow]); // eslint-disable-line

    useEffect(() => {
        loadEventos();
    }, [loadEventos]);

    useEffect(() => {
        function handler(e: MouseEvent) {
        if (
            tooltipRef.current &&
            !tooltipRef.current.contains(e.target as Node)
        ) {
            setTooltip(null);
        }
        }
        document.addEventListener("mousedown", handler);
        return () => {
        document.removeEventListener("mousedown", handler);
        };
    }, []);

    function navPrev() {
        setCurrent((prev) => {
        const d = new Date(prev);
        if (view === "month") d.setMonth(d.getMonth() - 1);
        if (view === "week") d.setDate(d.getDate() - 7);
        if (view === "day") d.setDate(d.getDate() - 1);
        return d;
        });
    }

    function navNext() {
        setCurrent((prev) => {
        const d = new Date(prev);
        if (view === "month") d.setMonth(d.getMonth() + 1);
        if (view === "week") d.setDate(d.getDate() + 7);
        if (view === "day") d.setDate(d.getDate() + 1);
        return d;
        });
    }

    function navToday() {
        setCurrent(new Date());
    }

    function eventosNoDia(day: Date) {
        return eventos
        .filter((ev) => {
            const s = isoToDate(ev.inicio);
            const e = isoToDate(ev.fim);
            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(day);
            dayEnd.setHours(23, 59, 59, 999);
            return s <= dayEnd && e >= dayStart;
        })
        .sort(
            (a, b) => isoToDate(a.inicio).getTime() - isoToDate(b.inicio).getTime(),
        );
    }

    function headerTitle() {
        if (view === "month") {
        return `${MONTHS[current.getMonth()]} ${current.getFullYear()}`;
        }
        if (view === "day") {
        return formatDateBR(current);
        }
        const s = startOfWeek(current);
        const e = addDays(s, 6);
        return `${s.getDate()} – ${e.getDate()} de ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
    }

    function handleClickEvento(ev: Evento) {
        setTooltip(ev);
    }

    function handleClickDia(day: Date) {
        navigate(`/compromissos/novo?data=${formatISOLocal(day)}`);
    }

    function renderMonth() {
        const today = new Date();
        const firstDay = startOfMonth(current);
        const offset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        const totalDays = new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        0,
        ).getDate();

        const cells: Date[] = [];
        for (let i = 0; i < offset; i += 1) {
        cells.push(addDays(firstDay, -(offset - i)));
        }
        for (let i = 0; i < totalDays; i += 1) {
        cells.push(addDays(firstDay, i));
        }
        while (cells.length % 7 !== 0) {
        cells.push(addDays(cells[cells.length - 1], 1));
        }

        const totalRows = cells.length / 7;

        return (
        <div className="flex flex-col h-full min-h-0">
            {/* header */}
            <div className="grid grid-cols-7 border-b border-(--border) shrink-0">
            {WEEKDAYS_SHORT.map((d) => (
                <div
                key={d}
                className="py-2 text-center text-xs font-semibold text-(--text-muted) uppercase"
                >
                {d}
                </div>
            ))}
            </div>

            {/* grid esticável */}
            <div
            className="grid grid-cols-7 flex-1 min-h-0"
            style={{ gridTemplateRows: `repeat(${totalRows}, minmax(0, 1fr))` }}
            >
            {cells.map((day, idx) => {
                const isCurrentMonth = day.getMonth() === current.getMonth();
                const isToday = sameDay(day, today);
                const evs = eventosNoDia(day);
                const MAX_VISIBLE = 3;
                const visible = evs.slice(0, MAX_VISIBLE);
                const hidden = evs.length - MAX_VISIBLE;

                return (
                <div
                    key={idx}
                    className={`
                                        border-b border-r border-(--border)
                                        p-1 flex flex-col gap-0.5 overflow-hidden
                                        cursor-pointer hover:bg-(--accent)/5
                                        transition-colors
                                        ${
                                        !isCurrentMonth
                                            ? "bg-(--bg-muted)/60"
                                            : "bg-(--bg-surface)"
                                        }
                                    `}
                    onClick={() => handleClickDia(day)}
                >
                    <span
                    className={`
                                            text-xs font-semibold self-end
                                            px-1 rounded-full
                                            ${
                                            isToday
                                                ? "bg-(--accent) text-white"
                                                : isCurrentMonth
                                                ? "text-(--text-primary)"
                                                : "text-(--text-muted)"
                                            }
                                        `}
                    >
                    {day.getDate()}
                    </span>

                    <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-0.5 progress-scrollbar">
                    {visible.map((ev) => (
                        <div
                        key={ev.id}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClickEvento(ev);
                        }}
                        >
                        <EventoPill
                            evento={ev}
                            onClick={handleClickEvento}
                            standard-pill
                        />
                        </div>
                    ))}

                    {hidden > 0 && (
                        <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrent(day);
                            setView("day");
                        }}
                        className="text-xs text-(--accent) font-medium px-1 text-left hover:underline mt-auto shrink-0"
                        >
                        +{hidden} mais
                        </button>
                    )}
                    </div>
                </div>
                );
            })}
            </div>
        </div>
        );
    }

    function renderWeek() {
        const today = new Date();
        const start = startOfWeek(current);
        const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
        const hours = Array.from({ length: 24 }, (_, i) => i);

        return (
        <div className="flex flex-col h-full min-h-0 overflow-hidden">
            {/* header dias */}
            <div
            className="grid border-b border-(--border) shrink-0 pr-(--scroll-padding,0px)"
            style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}
            >
            <div />
            {days.map((day, i) => {
                const isToday = sameDay(day, today);
                return (
                <div
                    key={i}
                    className="py-2 text-center border-l border-(--border)"
                >
                    <span className="text-xs text-(--text-muted) uppercase block">
                    {WEEKDAYS_SHORT[i]}
                    </span>
                    <span
                    className={`text-sm font-bold inline-flex items-center justify-center
                                    w-7 h-7 rounded-full mx-auto
                                    ${isToday ? "bg-(--accent) text-white" : "text-(--text-primary)"}`}
                    >
                    {day.getDate()}
                    </span>
                </div>
                );
            })}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 custom-viewport-scroll">
            <div
                className="grid relative"
                style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}
            >
                {hours.map((hour) => (
                <div key={hour} className="contents">
                    {/* label hora */}
                    <div className="border-b border-(--border) h-20 flex items-start justify-end pr-2 pt-1 shrink-0 select-none">
                    <span className="text-xs text-(--text-muted)">
                        {String(hour).padStart(2, "0")}:00
                    </span>
                    </div>

                    {/* células de dias */}
                    {days.map((day, di) => {
                    const evs = eventos.filter((ev) => {
                        const s = isoToDate(ev.inicio);
                        return (
                        s.getFullYear() === day.getFullYear() &&
                        s.getMonth() === day.getMonth() &&
                        s.getDate() === day.getDate() &&
                        s.getHours() === hour
                        );
                    });

                    return (
                        <div
                        key={`${hour}-${di}`}
                        className="border-b border-l border-(--border)
                                                    h-20 p-1 flex flex-col gap-1 overflow-hidden
                                                    hover:bg-(--accent)/5 cursor-pointer
                                                    transition-colors"
                        onClick={() => {
                            const d = new Date(day);
                            d.setHours(hour, 0, 0, 0);
                            handleClickDia(d);
                        }}
                        >
                        {evs.map((ev) => (
                            <div
                            key={ev.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClickEvento(ev);
                            }}
                            className="shrink-0"
                            >
                            <EventoPill
                                evento={ev}
                                onClick={handleClickEvento}
                                compact
                            />
                            </div>
                        ))}
                        </div>
                    );
                    })}
                </div>
                ))}
            </div>
            </div>
        </div>
        );
    }

    function renderDay() {
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const today = new Date();
        const isToday = sameDay(current, today);

    return (
        <div className="flex flex-col h-full min-h-0 overflow-hidden">
            {/* header */}
            <div className="border-b border-(--border) py-2 px-4 flex items-center gap-3 shrink-0">
            <span
                className={`text-2xl font-bold inline-flex items-center justify-center
                        w-10 h-10 rounded-full
                        ${isToday ? "bg-(--accent) text-white" : "text-(--text-primary)"}`}
            >
                {current.getDate()}
            </span>
            <div>
                <p className="text-sm font-semibold text-(--text-primary)">
                {WEEKDAYS_FULL[current.getDay() === 0 ? 6 : current.getDay() - 1]}
                </p>
                <p className="text-xs text-(--text-muted)">
                {MONTHS[current.getMonth()]} {current.getFullYear()}
                </p>
            </div>
            </div>

            {/* horas com scroll */}
            <div className="flex-1 overflow-y-auto min-h-0 custom-viewport-scroll">
            <div className="grid" style={{ gridTemplateColumns: "56px 1fr" }}>
                {hours.map((hour) => {
                const evs = eventos.filter((ev) => {
                    const s = isoToDate(ev.inicio);
                    return (
                    s.getFullYear() === current.getFullYear() &&
                    s.getMonth() === current.getMonth() &&
                    s.getDate() === current.getDate() &&
                    s.getHours() === hour
                    );
                });

                return (
                    <div key={hour} className="contents">
                    <div className="border-b border-(--border) h-20 flex items-start justify-end pr-2 pt-1 select-none">
                        <span className="text-xs text-(--text-muted)">
                        {String(hour).padStart(2, "0")}:00
                        </span>
                    </div>

                    <div
                        className="border-b border-l border-(--border)
                                                h-20 p-1 flex flex-col gap-1 overflow-hidden
                                                hover:bg-(--accent)/5 cursor-pointer
                                                transition-colors"
                        onClick={() => {
                        const d = new Date(current);
                        d.setHours(hour, 0, 0, 0);
                        handleClickDia(d);
                        }}
                    >
                        {evs.map((ev) => (
                        <div
                            key={ev.id}
                            onClick={(e) => {
                            e.stopPropagation();
                            handleClickEvento(ev);
                            }}
                            className="shrink-0"
                        >
                            <EventoPill evento={ev} onClick={handleClickEvento} />
                        </div>
                        ))}
                    </div>
                    </div>
                );
                })}
            </div>
            </div>
        </div>
        );
    }

    // ────────────────────────────────────────────────────────────────────────
    // RENDER PRINCIPAL
    // ────────────────────────────────────────────────────────────────────────
    return (
        <div
        className="
                    flex flex-col h-full min-h-125 gap-0
                    bg-(--bg-surface)
                    border border-(--border)
                    rounded-lg overflow-hidden
                "
        >
        {/* toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-(--border) shrink-0">
            {/* esquerda */}
            <div className="flex items-center gap-2">
            <button
                onClick={navPrev}
                className="px-2 py-1 rounded border border-(--border) text-(--text-muted) hover:bg-(--bg-muted) transition-colors text-sm"
            >
                ‹
            </button>
            <button
                onClick={navToday}
                className="px-3 py-1 rounded border border-(--border) text-sm text-(--text-primary) hover:bg-(--bg-muted) transition-colors font-medium"
            >
                Hoje
            </button>
            <button
                onClick={navNext}
                className="px-2 py-1 rounded border border-(--border) text-(--text-muted) hover:bg-(--bg-muted) transition-colors text-sm"
            >
                ›
            </button>
            <span className="text-sm font-semibold text-(--text-primary) ml-2">
                {headerTitle()}
            </span>
            {loading && (
                <span className="w-4 h-4 border-2 border-(--accent) border-t-transparent rounded-full animate-spin ml-2" />
            )}
            </div>

            <div className="flex items-center gap-2">
            <div className="flex rounded border border-(--border) overflow-hidden text-sm">
                {(["month", "week", "day"] as ViewMode[]).map((v) => (
                <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-3 py-1 transition-colors ${
                    view === v
                        ? "bg-(--accent) text-white"
                        : "text-(--text-muted) hover:bg-(--bg-muted)"
                    }`}
                >
                    {v === "month" ? "Mês" : v === "week" ? "Semana" : "Dia"}
                </button>
                ))}
            </div>

            <button
                onClick={() => navigate("/compromissos/novo")}
                className="px-3 py-1.5 rounded bg-(--accent) text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
                + Novo
            </button>
            </div>
        </div>

        <div className="flex-1 min-h-0 bg-(--bg-surface)">
            {view === "month" && renderMonth()}
            {view === "week" && renderWeek()}
            {view === "day" && renderDay()}
        </div>

        {/* tooltip */}
        {tooltip && (
            <>
            <div
                className="fixed inset-0 z-40"
                onClick={() => setTooltip(null)}
            />
            <div
                ref={tooltipRef}
                className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-(--bg-surface) border border-(--border) rounded-xl shadow-2xl w-80 p-4 flex flex-col gap-3"
            >
                <div className="flex items-start gap-3">
                <span
                    className="w-3 h-3 rounded-full shrink-0 mt-1"
                    style={{
                    backgroundColor: tooltip.cancelado ? "#94a3b8" : tooltip.cor,
                    }}
                />
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-(--text-primary) text-sm leading-tight">
                    {tooltip.titulo}
                    </p>
                    {tooltip.tipoRecorrencia && (
                    <p className="text-xs text-(--accent) mt-0.5">↺ Recorrente</p>
                    )}
                </div>
                <button
                    onClick={() => setTooltip(null)}
                    className="text-(--text-muted) hover:text-(--text-primary) text-lg leading-none"
                >
                    ✕
                </button>
                </div>
                <div className="text-xs text-(--text-muted) flex flex-col gap-1">
                <div className="flex gap-2">
                    <span className="font-medium text-(--text-primary) w-12">
                    Início
                    </span>
                    <span>{isoToDate(tooltip.inicio).toLocaleString("pt-BR")}</span>
                </div>
                <div className="flex gap-2">
                    <span className="font-medium text-(--text-primary) w-12">
                    Fim
                    </span>
                    <span>{isoToDate(tooltip.fim).toLocaleString("pt-BR")}</span>
                </div>
                {tooltip.pessoaNome && (
                    <div className="flex gap-2">
                    <span className="font-medium text-(--text-primary) w-12">
                        Pessoa
                    </span>
                    <span>{tooltip.pessoaNome}</span>
                    </div>
                )}
                </div>
                <div>
                {tooltip.cancelado && (
                    <span className="inline-block text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    Cancelado
                    </span>
                )}
                {tooltip.concluido && (
                    <span className="inline-block text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                    Concluído
                    </span>
                )}
                {!tooltip.cancelado && !tooltip.concluido && (
                    <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    Agendado
                    </span>
                )}
                </div>
                <div className="flex gap-2 pt-1 border-t border-(--border)">
                <button
                    onClick={() => {
                    navigate(`/compromissos/${tooltip.id}`);
                    setTooltip(null);
                    }}
                    className="flex-1 py-1.5 rounded bg-(--accent) text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    Editar
                </button>
                <button
                    onClick={() => setTooltip(null)}
                    className="flex-1 py-1.5 rounded border border-(--border) text-(--text-muted) text-sm hover:bg-(--bg-muted) transition-colors"
                >
                    Fechar
                </button>
                </div>
            </div>
            </>
        )}
        </div>
    );
}
