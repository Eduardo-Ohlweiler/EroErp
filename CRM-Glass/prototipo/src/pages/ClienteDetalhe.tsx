import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Paperclip,
  Phone,
  Plus,
  Star,
} from 'lucide-react';
import { CardHeader, GlassCard } from '../components/ui/Glass';
import { Button } from '../components/ui/Button';
import { Avatar, Badge, Segmented } from '../components/ui/Bits';
import { LineChart } from '../components/charts/Charts';
import { CountUp } from '../motion/CountUp';
import { item } from '../motion/tokens';
import { useStore } from '../store';
import { CLIENTES, ETAPAS, TIPOS_EVENTO } from '../data/mock';
import { STATUS_CLIENTE } from './cadastros';
import { fmtBRL, fmtCompactBRL, hash } from '../lib/utils';

type Aba = 'geral' | 'negocios' | 'atividades' | 'arquivos';

export default function ClienteDetalhe() {
  const { id } = useParams();
  const c = CLIENTES.find((x) => x.id === id) ?? CLIENTES[0];
  const { deals, setNewDealOpen } = useStore();
  const negocios = deals.filter((d) => d.cliente === c.nome);
  const [aba, setAba] = useState<Aba>('geral');
  const seed = hash(c.id);
  const compras = Array.from({ length: 12 }, (_, i) => Math.round(20 + ((seed >> i) % 30) + i * 4 + Math.sin(i + seed) * 8));
  const meses = ['dez', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov'];

  return (
    <>
      <motion.div variants={item}>
        <Link to="/clientes" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg mb-4 group">
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          Clientes
        </Link>
      </motion.div>

      <GlassCard className="!p-6 mb-4 overflow-hidden">
        <div className="absolute -right-24 -top-28 size-80 rounded-full accent-gradient opacity-25 blur-3xl pointer-events-none" />
        <div className="relative flex flex-wrap items-center gap-5">
          <Avatar name={c.nome} size={76} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[26px] font-semibold tracking-tight">{c.nome}</h1>
              {c.tier && (
                <Badge tone={c.tier === 'VIP' ? 'warning' : 'neutral'}>
                  <Star className="size-3 fill-current" /> {c.tier}
                </Badge>
              )}
              <Badge tone={STATUS_CLIENTE[c.status].tone} dot>
                {STATUS_CLIENTE[c.status].label}
              </Badge>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
              {[
                { i: Mail, t: c.email },
                { i: Phone, t: c.telefone },
                { i: MapPin, t: c.cidade },
                { i: Briefcase, t: c.segmento },
              ].map(({ i: I, t }) => (
                <span key={t} className="chip h-7 px-2.5 rounded-full inline-flex items-center gap-1.5 text-muted">
                  <I className="size-3.5" />
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button>
              <Phone className="size-4" /> Ligar
            </Button>
            <Button>
              <MessageSquare className="size-4" /> WhatsApp
            </Button>
            <Button variant="primary" onClick={() => setNewDealOpen(true)}>
              <Plus className="size-4" /> Negócio
            </Button>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-8 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { l: 'Receita total', v: c.receitaTotal, f: fmtCompactBRL },
              { l: 'Em aberto', v: c.valorAberto, f: fmtCompactBRL },
              { l: 'Negócios', v: negocios.length, f: (v: number) => String(Math.round(v)) },
              { l: 'Cliente desde', v: Number(c.desde), f: (v: number) => String(Math.round(v)) },
            ].map((s) => (
              <GlassCard key={s.l} hover className="!p-4">
                <div className="text-xs text-muted">{s.l}</div>
                <CountUp value={s.v} format={s.f} className="text-2xl font-semibold tracking-tight mt-2 block" />
              </GlassCard>
            ))}
          </div>

          <GlassCard>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <Segmented<Aba>
                options={[
                  { value: 'geral', label: 'Visão geral' },
                  { value: 'negocios', label: `Negócios (${negocios.length})` },
                  { value: 'atividades', label: 'Atividades' },
                  { value: 'arquivos', label: 'Arquivos' },
                ]}
                value={aba}
                onChange={setAba}
              />
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={aba}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
                exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.25 }}
              >
                {aba === 'geral' && (
                  <>
                    <CardHeader title="Compras nos últimos 12 meses" subtitle="Em R$ mil" />
                    <LineChart labels={meses} series={[{ name: 'Compras', color: 'var(--accent-2)', values: compras, area: true }]} format={(v) => `${Math.round(v)}k`} height={230} />
                  </>
                )}
                {aba === 'negocios' && (
                  <div className="space-y-2.5">
                    {negocios.length === 0 && <p className="text-sm text-muted py-6 text-center">Nenhum negócio ainda.</p>}
                    {negocios.map((d) => {
                      const e = ETAPAS.find((x) => x.id === d.etapa)!;
                      return (
                        <div key={d.id} className="chip rounded-2xl p-3.5 flex items-center gap-3">
                          <span className="size-2.5 rounded-full" style={{ background: e.cor, boxShadow: `0 0 10px ${e.cor}` }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">{d.titulo}</div>
                            <div className="text-xs text-subtle">
                              {e.nome} · previsão {d.previsao}
                            </div>
                          </div>
                          <div className="text-sm font-semibold tabular-nums">{fmtBRL(d.valor)}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {aba === 'atividades' && (
                  <div className="relative pl-6 space-y-5">
                    <span className="absolute left-[9px] top-1 bottom-1 w-px bg-[var(--line)]" />
                    {[
                      { i: CheckCircle2, c: 'var(--success)', t: 'Proposta aceita pelo financeiro', q: 'Hoje, 10:20', by: c.responsavel },
                      { i: Mail, c: 'var(--info)', t: `E-mail enviado para ${c.contato}`, q: 'Ontem, 16:02', by: c.responsavel },
                      { i: Phone, c: 'var(--accent)', t: 'Ligação de 22 min — alinhamento técnico', q: 'Seg, 11:40', by: 'Rodrigo Alves' },
                      { i: CalendarClock, c: 'var(--warning)', t: 'Visita técnica agendada', q: 'Semana passada', by: 'Diego Ramos' },
                    ].map((a, i) => (
                      <div key={i} className="relative">
                        <span className="absolute -left-6 top-0.5 size-[19px] rounded-full grid place-items-center" style={{ background: a.c }}>
                          <a.i className="size-3 text-white" />
                        </span>
                        <div className="text-sm font-medium">{a.t}</div>
                        <div className="text-xs text-subtle mt-0.5">
                          {a.q} · {a.by}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {aba === 'arquivos' && (
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {['Proposta comercial v3.pdf', 'Projeto elétrico.dwg', 'Contrato assinado.pdf', 'Fotos da vistoria.zip'].map((f) => (
                      <div key={f} className="chip rounded-2xl p-3 flex items-center gap-3 hover:bg-[var(--chip-hover)] transition-colors cursor-pointer">
                        <span className="size-10 rounded-xl accent-gradient grid place-items-center">
                          <FileText className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{f}</div>
                          <div className="text-[11px] text-subtle">Enviado por {c.responsavel.split(' ')[0]}</div>
                        </div>
                        <Paperclip className="size-4 text-subtle ml-auto" />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </GlassCard>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-4">
          <GlassCard>
            <CardHeader title="Contatos" subtitle="Pessoas nesta conta" />
            <div className="space-y-3">
              {[
                { n: c.contato, r: 'Decisora', p: c.telefone },
                { n: 'Henrique Batista', r: 'Financeiro', p: '(51) 99120-3381' },
                { n: 'Sofia Andrade', r: 'Engenharia', p: '(51) 98455-0917' },
              ].map((p) => (
                <div key={p.n} className="flex items-center gap-3">
                  <Avatar name={p.n} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold">{p.n}</div>
                    <div className="text-[11px] text-subtle">
                      {p.r} · {p.p}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="!size-8" aria-label={`Ligar para ${p.n}`}>
                    <Phone className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <CardHeader title="Próximo compromisso" />
            <div className="ev rounded-2xl p-4" style={{ ['--ev' as string]: TIPOS_EVENTO.reuniao.cor }}>
              <div className="text-sm font-semibold">Reunião de acompanhamento</div>
              <div className="text-xs text-muted mt-1">Sexta, 10:00 · Google Meet</div>
            </div>
          </GlassCard>

          <GlassCard>
            <CardHeader title="Etiquetas" />
            <div className="flex flex-wrap gap-2">
              <Badge tone="accent">Energia solar</Badge>
              <Badge tone="success">Pagador pontual</Badge>
              <Badge tone="info">Indicou 2 clientes</Badge>
              <Badge>{c.segmento}</Badge>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
