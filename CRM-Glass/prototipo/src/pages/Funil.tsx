import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { CalendarPlus, Clock, Flame, Gauge as GaugeIcon, MoreHorizontal, Plus, Timer, Trophy } from 'lucide-react';
import { GlassCard, PageHeader } from '../components/ui/Glass';
import { Button } from '../components/ui/Button';
import { Avatar, Badge, Progress, Segmented } from '../components/ui/Bits';
import { CloseButton, Modal } from '../components/ui/Overlays';
import { useToast } from '../components/ui/Toast';
import { CountUp } from '../motion/CountUp';
import { useStore } from '../store';
import { ETAPAS, TAG_TONE, USUARIO, type Deal, type Etapa } from '../data/mock';
import { cn, fmtBRL, fmtCompactBRL } from '../lib/utils';

type Filtro = 'todos' | 'meus' | 'equipe';

export default function Funil() {
  const { deals, moveDeal, setNewDealOpen } = useStore();
  const toast = useToast();
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [dragging, setDragging] = useState<Deal | null>(null);
  const [over, setOver] = useState<Etapa | null>(null);
  const [aberto, setAberto] = useState<Deal | null>(null);
  const cols = useRef<Partial<Record<Etapa, HTMLDivElement | null>>>({});

  const visiveis = deals.filter((d) =>
    filtro === 'todos' ? true : filtro === 'meus' ? d.responsavel === USUARIO.nome : d.responsavel !== USUARIO.nome,
  );
  const abertos = visiveis.filter((d) => d.etapa !== 'ganho');
  const pipeline = abertos.reduce((a, d) => a + d.valor, 0);
  const ponderado = abertos.reduce((a, d) => a + (d.valor * d.prob) / 100, 0);

  const colunaEm = (x: number, y: number) => {
    for (const e of ETAPAS) {
      const r = cols.current[e.id]?.getBoundingClientRect();
      if (r && x >= r.left && x <= r.right && y >= r.top - 40 && y <= r.bottom + 40) return e.id;
    }
    return null;
  };

  function soltar(d: Deal, etapa: Etapa | null) {
    setDragging(null);
    setOver(null);
    if (!etapa || etapa === d.etapa) return;
    moveDeal(d.id, etapa);
    const nome = ETAPAS.find((e) => e.id === etapa)!.nome;
    if (etapa === 'ganho') toast({ title: 'Negócio ganho! 🎉', description: `${d.cliente} — ${fmtBRL(d.valor)}`, tone: 'success' });
    else toast({ title: `Movido para ${nome}`, description: d.titulo, tone: 'info' });
  }

  return (
    <>
      <PageHeader
        title="Funil de vendas"
        subtitle={`${abertos.length} negócios em aberto · ${fmtCompactBRL(pipeline)} em pipeline · arraste os cartões entre as etapas`}
        actions={
          <>
            <Segmented<Filtro>
              options={[
                { value: 'todos', label: 'Todos' },
                { value: 'meus', label: 'Meus' },
                { value: 'equipe', label: 'Equipe' },
              ]}
              value={filtro}
              onChange={setFiltro}
            />
            <Button variant="primary" onClick={() => setNewDealOpen(true)}>
              <Plus className="size-4" /> Novo negócio
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { icon: GaugeIcon, l: 'Valor ponderado', v: ponderado, f: fmtCompactBRL },
          { icon: Timer, l: 'Ciclo médio', v: 18, f: (v: number) => `${Math.round(v)} dias` },
          { icon: Trophy, l: 'Taxa de ganho', v: 31, f: (v: number) => `${Math.round(v)}%` },
          { icon: Flame, l: 'Negócios quentes', v: visiveis.filter((d) => d.tags.includes('Quente')).length, f: (v: number) => String(Math.round(v)) },
        ].map((s) => (
          <GlassCard key={s.l} className="flex items-center gap-3.5 !p-4">
            <span className="size-10 rounded-2xl chip grid place-items-center shrink-0">
              <s.icon className="size-[18px] text-accent-text" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] text-subtle">{s.l}</div>
              <CountUp value={s.v} format={s.f} className="text-lg font-semibold tracking-tight" />
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 items-start">
        {ETAPAS.map((e) => {
          const lista = visiveis.filter((d) => d.etapa === e.id);
          const soma = lista.reduce((a, d) => a + d.valor, 0);
          const share = visiveis.length ? (lista.length / visiveis.length) * 100 : 0;
          return (
            <div
              key={e.id}
              ref={(el) => {
                cols.current[e.id] = el;
              }}
              className={cn(
                'glass-flat p-2.5 rounded-[24px] min-h-[440px] relative transition-[background,border-color,box-shadow] duration-300',
                over === e.id && dragging && dragging.etapa !== e.id && 'col-over',
                dragging?.etapa === e.id && 'z-20',
              )}
            >
              <div className="flex items-center gap-2 px-2 pt-1.5 pb-2.5">
                <span className="size-2.5 rounded-full" style={{ background: e.cor, boxShadow: `0 0 12px ${e.cor}` }} />
                <span className="text-sm font-semibold">{e.nome}</span>
                <span className="chip text-[11px] min-w-5 h-5 px-1.5 rounded-full grid place-items-center font-semibold">{lista.length}</span>
                <span className="ml-auto text-xs text-muted tabular-nums">{fmtCompactBRL(soma)}</span>
              </div>
              <Progress value={share} color={e.cor} className="h-1 mx-2 mb-3" />
              <div className="flex flex-col gap-2.5">
                {lista.map((d) => (
                  <DealCard
                    key={d.id}
                    deal={d}
                    onOpen={() => setAberto(d)}
                    onStart={() => setDragging(d)}
                    onMove={(x, y) => {
                      const c = colunaEm(x, y);
                      setOver((o) => (o === c ? o : c));
                    }}
                    onDrop={(x, y) => soltar(d, colunaEm(x, y))}
                  />
                ))}
                {lista.length === 0 && (
                  <div className="h-28 rounded-2xl border border-dashed border-line grid place-items-center text-xs text-subtle">
                    Solte um negócio aqui
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <DealModal deal={aberto} onClose={() => setAberto(null)} />
    </>
  );
}

function pontoDe(e: MouseEvent | TouchEvent | PointerEvent) {
  if ('clientX' in e) return { x: e.clientX, y: e.clientY };
  const t = e.changedTouches[0];
  return { x: t.clientX, y: t.clientY };
}

function DealCard({
  deal,
  onOpen,
  onStart,
  onMove,
  onDrop,
}: {
  deal: Deal;
  onOpen: () => void;
  onStart: () => void;
  onMove: (x: number, y: number) => void;
  onDrop: (x: number, y: number) => void;
}) {
  const arrastou = useRef(false);
  const ganho = deal.etapa === 'ganho';
  return (
    <GlassCard
      layout
      layoutId={deal.id}
      padded={false}
      drag
      dragSnapToOrigin
      dragElastic={0.15}
      dragMomentum={false}
      whileHover={{ y: -3 }}
      whileDrag={{ scale: 1.05, rotate: 2.5, zIndex: 60, cursor: 'grabbing', boxShadow: '0 40px 80px -24px rgb(0 0 0 / 0.6)' }}
      onDragStart={() => {
        arrastou.current = true;
        onStart();
      }}
      onDrag={(e) => {
        const p = pontoDe(e);
        onMove(p.x, p.y);
      }}
      onDragEnd={(e) => {
        const p = pontoDe(e);
        onDrop(p.x, p.y);
        setTimeout(() => (arrastou.current = false), 60);
      }}
      onClick={() => !arrastou.current && onOpen()}
      className="glass-hover p-3.5 rounded-[18px] cursor-grab select-none touch-none"
    >
      <div className="flex items-center gap-2.5">
        <Avatar name={deal.cliente} size={30} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold truncate">{deal.cliente}</div>
          <div className="text-[11px] text-subtle truncate">{deal.titulo}</div>
        </div>
        <MoreHorizontal className="size-4 text-subtle shrink-0" />
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div className="text-[17px] font-semibold tabular-nums tracking-tight">{fmtBRL(deal.valor)}</div>
        <span className={cn('text-[11px] font-medium', ganho ? 'text-success' : 'text-muted')}>{deal.prob}%</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-[var(--track)] overflow-hidden">
        <div className={cn('h-full rounded-full', ganho ? 'bg-success' : 'accent-gradient')} style={{ width: `${deal.prob}%` }} />
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        {deal.tags.slice(0, 1).map((t) => (
          <Badge key={t} tone={TAG_TONE[t] ?? 'neutral'} className="!h-5 !px-2 !text-[10px]">
            {t}
          </Badge>
        ))}
        <span className="flex items-center gap-1 text-[11px] text-subtle ml-auto">
          <Clock className="size-3" />
          {deal.previsao}
        </span>
        <Avatar name={deal.responsavel} size={22} />
      </div>
    </GlassCard>
  );
}

function DealModal({ deal, onClose }: { deal: Deal | null; onClose: () => void }) {
  const { deals, moveDeal } = useStore();
  const toast = useToast();
  // Mantém o último negócio durante a animação de saída do modal.
  const ultimo = useRef<Deal | null>(null);
  if (deal) ultimo.current = deal;
  const base = deal ?? ultimo.current;
  const atual = base ? deals.find((d) => d.id === base.id) ?? base : null;
  const idx = atual ? ETAPAS.findIndex((e) => e.id === atual.etapa) : 0;
  const proxima = ETAPAS[idx + 1];

  return (
    <Modal open={!!deal} onClose={onClose} label="Detalhes do negócio" width={640}>
      {atual && (
        <div className="p-6">
          <div className="flex items-start gap-3.5">
            <Avatar name={atual.cliente} size={48} />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted">{atual.cliente}</div>
              <h2 className="text-xl font-semibold tracking-tight">{atual.titulo}</h2>
            </div>
            <CloseButton onClick={onClose} />
          </div>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[11px] text-subtle">Valor do negócio</div>
              <div className="text-[34px] font-semibold tracking-tight leading-none mt-1">
                <CountUp value={atual.valor} format={fmtBRL} duration={0.9} delay={0.1} />
              </div>
            </div>
            <div className="flex gap-2">
              {atual.tags.map((t) => (
                <Badge key={t} tone={TAG_TONE[t] ?? 'neutral'}>
                  {t}
                </Badge>
              ))}
              <Badge tone="accent">{atual.prob}% de chance</Badge>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-5 gap-1.5">
            {ETAPAS.map((e, i) => (
              <div key={e.id}>
                <div className="h-1.5 rounded-full bg-[var(--track)] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full origin-left"
                    style={{ background: i <= idx ? e.cor : 'transparent' }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: i <= idx ? 1 : 0 }}
                    transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }}
                  />
                </div>
                <div className={cn('text-[11px] mt-1.5', i === idx ? 'text-fg font-semibold' : 'text-subtle')}>{e.nome}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { l: 'Responsável', v: atual.responsavel },
              { l: 'Previsão', v: atual.previsao },
              { l: 'Origem', v: atual.origem },
              { l: 'Ponderado', v: fmtCompactBRL((atual.valor * atual.prob) / 100) },
            ].map((s) => (
              <div key={s.l} className="chip rounded-2xl px-3 py-2.5">
                <div className="text-[11px] text-subtle">{s.l}</div>
                <div className="text-[13px] font-semibold mt-0.5 truncate">{s.v}</div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <div className="text-xs font-semibold text-muted mb-2.5">Próximos passos</div>
            <div className="space-y-2">
              {['Enviar proposta revisada', 'Agendar visita técnica', 'Validar condições de pagamento'].map((t, i) => (
                <label key={t} className="flex items-center gap-3 chip rounded-xl px-3 h-11 text-sm cursor-pointer">
                  <input type="checkbox" defaultChecked={i === 0} className="size-4 accent-[var(--accent)]" />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-7 flex flex-wrap justify-end gap-2">
            <Button onClick={onClose}>
              <CalendarPlus className="size-4" /> Agendar reunião
            </Button>
            {proxima && (
              <Button
                variant="primary"
                onClick={() => {
                  moveDeal(atual.id, proxima.id);
                  toast({
                    title: proxima.id === 'ganho' ? 'Negócio ganho! 🎉' : `Movido para ${proxima.nome}`,
                    description: atual.titulo,
                    tone: proxima.id === 'ganho' ? 'success' : 'info',
                  });
                }}
              >
                Avançar para {proxima.nome}
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
