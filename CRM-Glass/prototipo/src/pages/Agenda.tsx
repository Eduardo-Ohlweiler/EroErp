import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Building2, Check, ChevronLeft, ChevronRight, Clock, MapPin, Plus, Video } from 'lucide-react';
import { GlassCard, PageHeader } from '../components/ui/Glass';
import { Button } from '../components/ui/Button';
import { AvatarStack, Badge, Segmented } from '../components/ui/Bits';
import { CloseButton, Drawer } from '../components/ui/Overlays';
import { useToast } from '../components/ui/Toast';
import { TIPOS_EVENTO, type TipoEvento } from '../data/mock';
import { addDays, eventosDoDia, fmtHora, sameDay, startOfDay, startOfWeek, TIPOS_ORDEM, type Evento } from '../data/agenda';
import { ease, spring } from '../motion/tokens';
import { cn } from '../lib/utils';

type Vista = 'dia' | 'semana' | 'mes';
const INICIO = 7;
const FIM = 20;
const HORA = 56;
const DIAS_CURTOS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

export default function Agenda() {
  const hoje = startOfDay(new Date());
  const [vista, setVista] = useState<Vista>('semana');
  const [ref, setRef] = useState(hoje);
  const [dir, setDir] = useState(0);
  const [ocultos, setOcultos] = useState<TipoEvento[]>([]);
  const [sel, setSel] = useState<Evento | null>(null);
  const ultimoSel = useRef<Evento | null>(null);
  if (sel) ultimoSel.current = sel;
  const toast = useToast();

  const dias = useMemo(() => {
    if (vista === 'dia') return [ref];
    const s = startOfWeek(ref);
    return Array.from({ length: 7 }, (_, i) => addDays(s, i));
  }, [vista, ref]);

  const filtra = (l: Evento[]) => l.filter((e) => !ocultos.includes(e.tipo));

  function mover(n: number) {
    setDir(n);
    if (vista === 'mes') setRef(new Date(ref.getFullYear(), ref.getMonth() + n, 1));
    else setRef(addDays(ref, vista === 'dia' ? n : 7 * n));
  }

  const titulo =
    vista === 'dia'
      ? ref.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
      : vista === 'mes'
        ? ref.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        : (() => {
            const a = dias[0];
            const b = dias[6];
            const mesA = a.toLocaleDateString('pt-BR', { month: 'long' });
            const mesB = b.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            return a.getMonth() === b.getMonth() ? `${a.getDate()} – ${b.getDate()} de ${mesB}` : `${a.getDate()} de ${mesA} – ${b.getDate()} de ${mesB}`;
          })();

  const proximos = useMemo(() => {
    const agora = new Date();
    const h = agora.getHours() + agora.getMinutes() / 60;
    const out: Evento[] = [];
    for (let i = 0; i < 7 && out.length < 4; i++) {
      for (const e of eventosDoDia(addDays(hoje, i))) {
        if (i === 0 && e.fim <= h) continue;
        out.push(e);
        if (out.length >= 4) break;
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle="Reuniões, ligações e visitas da equipe comercial"
        actions={
          <Button variant="primary" onClick={() => toast({ title: 'Novo compromisso', description: 'No protótipo, o formulário fica para a próxima etapa.', tone: 'info' })}>
            <Plus className="size-4" /> Compromisso
          </Button>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-3 space-y-4">
          <MiniCalendario
            selecionado={ref}
            onSelect={(d) => {
              setDir(d > ref ? 1 : -1);
              setRef(d);
              if (vista === 'mes') setVista('dia');
            }}
          />

          <GlassCard>
            <div className="text-sm font-semibold mb-3">Próximos</div>
            <div className="space-y-2">
              {proximos.map((e) => (
                <button
                  key={e.id + e.titulo}
                  onClick={() => setSel(e)}
                  className="w-full text-left flex gap-3 p-2.5 rounded-2xl hover:bg-[var(--chip)] transition-colors"
                >
                  <span className="w-1 rounded-full" style={{ background: TIPOS_EVENTO[e.tipo].cor }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium truncate">{e.titulo}</span>
                    <span className="block text-[11px] text-subtle">
                      {sameDay(e.data, hoje) ? 'Hoje' : e.data.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })} · {fmtHora(e.inicio)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-sm font-semibold mb-3">Calendários</div>
            <div className="space-y-1">
              {TIPOS_ORDEM.map((t) => {
                const on = !ocultos.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => setOcultos((o) => (on ? [...o, t] : o.filter((x) => x !== t)))}
                    className="w-full flex items-center gap-3 px-2 h-9 rounded-xl hover:bg-[var(--chip)] text-sm transition-colors"
                  >
                    <span
                      className="size-[18px] rounded-md grid place-items-center border transition-colors"
                      style={{ background: on ? TIPOS_EVENTO[t].cor : 'transparent', borderColor: TIPOS_EVENTO[t].cor }}
                    >
                      <AnimatePresence>
                        {on && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring.bouncy}>
                            <Check className="size-3 text-white" strokeWidth={3} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                    <span className={cn(on ? 'text-fg' : 'text-subtle')}>{TIPOS_EVENTO[t].label}</span>
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </div>

        <GlassCard padded={false} className="col-span-12 xl:col-span-9 overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-line">
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={() => mover(-1)} aria-label="Anterior">
                <ChevronLeft className="size-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => mover(1)} aria-label="Próximo">
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setDir(hoje > ref ? 1 : -1);
                setRef(hoje);
              }}
            >
              Hoje
            </Button>
            <div className="relative overflow-hidden h-7 flex items-center">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.h2
                  key={titulo}
                  initial={{ y: dir >= 0 ? 20 : -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: dir >= 0 ? -20 : 20, opacity: 0 }}
                  transition={{ duration: 0.3, ease: ease.out }}
                  className="text-base font-semibold whitespace-nowrap first-letter:uppercase"
                >
                  {titulo}
                </motion.h2>
              </AnimatePresence>
            </div>
            <Segmented<Vista>
              className="ml-auto"
              options={[
                { value: 'dia', label: 'Dia' },
                { value: 'semana', label: 'Semana' },
                { value: 'mes', label: 'Mês' },
              ]}
              value={vista}
              onChange={(v) => {
                setDir(0);
                setVista(v);
              }}
            />
          </div>

          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={`${vista}-${dias[0].toDateString()}-${ref.getMonth()}`}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40, filter: 'blur(6px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
              exit={{ opacity: 0, x: dir * -40, filter: 'blur(6px)' }}
              transition={{ duration: 0.3, ease: ease.out }}
            >
              {vista === 'mes' ? (
                <Mes referencia={ref} hoje={hoje} filtra={filtra} onOpen={setSel} />
              ) : (
                <Grade dias={dias} hoje={hoje} filtra={filtra} onOpen={setSel} />
              )}
            </motion.div>
          </AnimatePresence>
        </GlassCard>
      </div>

      <Drawer open={!!sel} onClose={() => setSel(null)} label="Compromisso">
        {(sel ?? ultimoSel.current) && <DetalheEvento e={(sel ?? ultimoSel.current)!} onClose={() => setSel(null)} />}
      </Drawer>
    </>
  );
}

function Grade({ dias, hoje, filtra, onOpen }: { dias: Date[]; hoje: Date; filtra: (l: Evento[]) => Evento[]; onOpen: (e: Evento) => void }) {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const hAgora = agora.getHours() + agora.getMinutes() / 60;
  const horas = Array.from({ length: FIM - INICIO }, (_, i) => INICIO + i);
  const cols = `56px repeat(${dias.length}, minmax(0, 1fr))`;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="grid border-b border-line" style={{ gridTemplateColumns: cols }}>
          <div />
          {dias.map((d) => {
            const eHoje = sameDay(d, hoje);
            return (
              <div key={d.toDateString()} className="py-3 flex flex-col items-center gap-1">
                <span className="text-[11px] uppercase tracking-wider text-subtle">{DIAS_CURTOS[(d.getDay() + 6) % 7]}</span>
                <span
                  className={cn(
                    'size-8 rounded-full grid place-items-center text-sm font-semibold',
                    eHoje && 'accent-gradient accent-glow',
                  )}
                >
                  {d.getDate()}
                </span>
              </div>
            );
          })}
        </div>
        <motion.div
          className="grid relative"
          style={{ gridTemplateColumns: cols }}
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.025, delayChildren: 0.1 } } }}
        >
          <div className="relative" style={{ height: horas.length * HORA }}>
            {horas.map((h, i) => (
              <span key={h} className="absolute right-2.5 text-[10px] text-subtle tabular-nums -translate-y-1/2" style={{ top: i * HORA }}>
                {i === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
              </span>
            ))}
          </div>
          {dias.map((d) => {
            const eHoje = sameDay(d, hoje);
            return (
              <div key={d.toDateString()} className={cn('relative border-l border-line', eHoje && 'bg-accent/[0.04]')} style={{ height: horas.length * HORA }}>
                {horas.map((h, i) => (
                  <div key={h} className="absolute inset-x-0 border-t border-line/70" style={{ top: i * HORA }} />
                ))}
                {filtra(eventosDoDia(d)).map((e) => {
                  const top = (e.inicio - INICIO) * HORA + 2;
                  const height = Math.max(24, (e.fim - e.inicio) * HORA - 4);
                  return (
                    <motion.button
                      key={e.id + e.titulo}
                      variants={{ hidden: { opacity: 0, scale: 0.92, y: 6 }, show: { opacity: 1, scale: 1, y: 0, transition: spring.soft } }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onOpen(e)}
                      className="ev absolute left-1 right-1 rounded-xl px-2.5 py-1.5 text-left overflow-hidden"
                      style={{ top, height, '--ev': TIPOS_EVENTO[e.tipo].cor } as CSSProperties}
                    >
                      <div className="text-[12px] font-semibold leading-tight truncate">{e.titulo}</div>
                      {height > 34 && (
                        <div className="text-[10.5px] text-muted truncate mt-0.5">
                          {fmtHora(e.inicio)} – {fmtHora(e.fim)}
                          {e.cliente ? ` · ${e.cliente}` : ''}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
                {eHoje && hAgora >= INICIO && hAgora <= FIM && (
                  <div className="absolute inset-x-0 z-10 pointer-events-none" style={{ top: (hAgora - INICIO) * HORA }}>
                    <div className="h-[2px] bg-danger shadow-[0_0_10px_var(--danger)]" />
                    <span className="absolute -left-1 -top-[4px] size-2.5 rounded-full bg-danger" />
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

function Mes({ referencia, hoje, filtra, onOpen }: { referencia: Date; hoje: Date; filtra: (l: Evento[]) => Evento[]; onOpen: (e: Evento) => void }) {
  const inicio = startOfWeek(new Date(referencia.getFullYear(), referencia.getMonth(), 1));
  const dias = Array.from({ length: 42 }, (_, i) => addDays(inicio, i));
  return (
    <div>
      <div className="grid grid-cols-7 border-b border-line">
        {DIAS_CURTOS.map((d) => (
          <div key={d} className="py-2.5 text-center text-[11px] uppercase tracking-wider text-subtle">
            {d}
          </div>
        ))}
      </div>
      <motion.div
        className="grid grid-cols-7"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.008 } } }}
      >
        {dias.map((d) => {
          const fora = d.getMonth() !== referencia.getMonth();
          const ev = filtra(eventosDoDia(d));
          return (
            <motion.div
              key={d.toDateString()}
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
              className={cn('min-h-[108px] border-b border-l border-line p-1.5', fora && 'opacity-40')}
            >
              <div className={cn('size-7 rounded-full grid place-items-center text-xs font-semibold mb-1', sameDay(d, hoje) && 'accent-gradient accent-glow')}>
                {d.getDate()}
              </div>
              <div className="space-y-1">
                {ev.slice(0, 2).map((e) => (
                  <button
                    key={e.id + e.titulo}
                    onClick={() => onOpen(e)}
                    className="ev w-full rounded-md px-1.5 py-0.5 text-[10.5px] font-medium text-left truncate block"
                    style={{ '--ev': TIPOS_EVENTO[e.tipo].cor } as CSSProperties}
                  >
                    {fmtHora(e.inicio)} {e.titulo}
                  </button>
                ))}
                {ev.length > 2 && <div className="text-[10px] text-subtle px-1">+{ev.length - 2} mais</div>}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

function MiniCalendario({ selecionado, onSelect }: { selecionado: Date; onSelect: (d: Date) => void }) {
  const hoje = startOfDay(new Date());
  const [mes, setMes] = useState(new Date(selecionado.getFullYear(), selecionado.getMonth(), 1));
  const [dir, setDir] = useState(0);
  useEffect(() => {
    setMes(new Date(selecionado.getFullYear(), selecionado.getMonth(), 1));
  }, [selecionado]);
  const inicio = startOfWeek(mes);
  const dias = Array.from({ length: 42 }, (_, i) => addDays(inicio, i));
  const ir = (n: number) => {
    setDir(n);
    setMes(new Date(mes.getFullYear(), mes.getMonth() + n, 1));
  };
  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold inline-block first-letter:uppercase">{mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
        <div className="flex">
          <Button size="icon" variant="ghost" className="!size-8" onClick={() => ir(-1)} aria-label="Mês anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" className="!size-8" onClick={() => ir(1)} aria-label="Próximo mês">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] uppercase text-subtle mb-1">
        {DIAS_CURTOS.map((d) => (
          <span key={d}>{d[0]}</span>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mes.toDateString()}
          initial={{ opacity: 0, x: dir * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -24 }}
          transition={{ duration: 0.22 }}
          className="grid grid-cols-7 gap-y-0.5"
        >
          {dias.map((d) => {
            const fora = d.getMonth() !== mes.getMonth();
            const eHoje = sameDay(d, hoje);
            const eSel = sameDay(d, selecionado);
            const tem = eventosDoDia(d).length > 0;
            return (
              <button
                key={d.toDateString()}
                onClick={() => onSelect(d)}
                className={cn(
                  'relative h-9 rounded-xl text-xs font-medium grid place-items-center transition-colors',
                  fora ? 'text-subtle/60' : 'text-fg',
                  !eHoje && 'hover:bg-[var(--chip)]',
                  eSel && !eHoje && 'bg-[var(--chip-hover)]',
                  eHoje && 'accent-gradient accent-glow',
                )}
              >
                {d.getDate()}
                {tem && !eHoje && <span className="absolute bottom-1 size-1 rounded-full bg-accent" />}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </GlassCard>
  );
}

function DetalheEvento({ e, onClose }: { e: Evento; onClose: () => void }) {
  const toast = useToast();
  const tipo = TIPOS_EVENTO[e.tipo];
  const online = e.local && /meet|zoom/i.test(e.local);
  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-2 h-7 px-3 rounded-full text-xs font-semibold ev" style={{ '--ev': tipo.cor } as CSSProperties}>
          {tipo.label}
        </span>
        <CloseButton onClick={onClose} />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight mt-4">{e.titulo}</h2>
      <div className="mt-5 space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <span className="chip size-9 rounded-xl grid place-items-center">
            <Clock className="size-4" />
          </span>
          <div>
            <div className="font-medium first-letter:uppercase">{e.data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            <div className="text-xs text-muted">
              {fmtHora(e.inicio)} – {fmtHora(e.fim)}
            </div>
          </div>
        </div>
        {e.local && (
          <div className="flex items-center gap-3">
            <span className="chip size-9 rounded-xl grid place-items-center">{online ? <Video className="size-4" /> : <MapPin className="size-4" />}</span>
            <div className="font-medium">{e.local}</div>
          </div>
        )}
        {e.cliente && (
          <div className="flex items-center gap-3">
            <span className="chip size-9 rounded-xl grid place-items-center">
              <Building2 className="size-4" />
            </span>
            <div className="font-medium">{e.cliente}</div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="text-xs font-semibold text-muted mb-2.5">Participantes</div>
        <div className="flex items-center gap-3">
          <AvatarStack names={e.participantes} size={32} max={5} />
          <span className="text-xs text-muted">{e.participantes.length} pessoas</span>
        </div>
      </div>

      <div className="mt-6 chip rounded-2xl p-4 text-sm text-muted leading-relaxed">
        Pauta: revisar a proposta enviada, alinhar prazos de instalação e confirmar as condições de pagamento antes do fechamento.
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {online && (
          <Button variant="primary" onClick={() => toast({ title: 'Abrindo a chamada…', tone: 'accent' })}>
            <Video className="size-4" /> Entrar na chamada
          </Button>
        )}
        <Button onClick={() => toast({ title: 'Remarcar', description: 'Arraste o compromisso na agenda (em breve).', tone: 'info' })}>Remarcar</Button>
        <Badge tone="success" dot className="!h-10 !px-3.5 !rounded-[14px]">
          Confirmado
        </Badge>
      </div>
    </div>
  );
}
