import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, Crown, Download, Mail, MoveRight, Phone, Sparkles } from 'lucide-react';
import { CardHeader, GlassCard, PageHeader } from '../components/ui/Glass';
import { Button } from '../components/ui/Button';
import { Avatar, AvatarStack, Badge, Delta, Progress, Segmented } from '../components/ui/Bits';
import { BarPills, Donut, Gauge, LineChart, Sparkline } from '../components/charts/Charts';
import { CountUp } from '../motion/CountUp';
import { ATIVIDADES, CONVERSAO, KPIS, ORIGENS, RANKING, RECEITA_MESES, RECEITA_SEMANAS, TIPOS_EVENTO, USUARIO } from '../data/mock';
import { eventosDoDia, fmtHora } from '../data/agenda';
import { cn, fmtBRL, fmtCompactBRL, fmtInt, fmtPct } from '../lib/utils';

const kpiFormat = { brl: fmtBRL, int: fmtInt, pct: (v: number) => fmtPct(v) } as const;
const atividadeIcon = { email: Mail, move: MoveRight, won: CheckCircle2, call: Phone, new: Sparkles } as const;
const atividadeTone = {
  email: 'bg-info/15 text-info',
  move: 'bg-warning/15 text-warning',
  won: 'bg-success/15 text-success',
  call: 'bg-accent/15 text-accent-text',
  new: 'accent-gradient',
} as const;

function diasRestantes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - d.getDate();
}

export default function Dashboard() {
  const [periodo, setPeriodo] = useState<'semana' | 'mes' | 'trimestre'>('mes');
  const h = new Date().getHours();
  const saudacao = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const hoje = eventosDoDia(new Date());
  const agoraH = new Date().getHours() + new Date().getMinutes() / 60;
  const proximo = hoje.find((e) => e.fim > agoraH);

  return (
    <>
      <PageHeader
        title={
          <>
            {saudacao}, {USUARIO.nome.split(' ')[0]} <span className="animate-wave-hand">👋</span>
          </>
        }
        subtitle="Aqui está o pulso das suas vendas em novembro."
        actions={
          <>
            <Segmented
              options={[
                { value: 'semana', label: 'Semana' },
                { value: 'mes', label: 'Mês' },
                { value: 'trimestre', label: 'Trimestre' },
              ]}
              value={periodo}
              onChange={setPeriodo}
            />
            <Button>
              <Download className="size-4" /> Exportar
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        {KPIS.map((k, i) => {
          const featured = i === 0;
          return (
            <GlassCard key={k.label} hover className={cn('col-span-12 sm:col-span-6 xl:col-span-3', featured && 'kpi-featured')}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted">{k.label}</span>
                <span className="chip size-8 rounded-full grid place-items-center">
                  <ArrowUpRight className="size-4" />
                </span>
              </div>
              <div className="mt-4 text-[30px] font-semibold tracking-tight leading-none">
                <CountUp value={k.value} format={kpiFormat[k.kind]} />
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <Delta value={k.delta} suffix={k.kind === 'pct' ? ' p.p.' : '%'} onAccent={featured} />
                <span className="text-[11px] text-subtle">vs. outubro</span>
              </div>
              <div className="mt-3 -mx-1">
                <Sparkline values={[...k.spark]} color={featured ? 'var(--on-accent)' : k.delta >= 0 ? 'var(--success)' : 'var(--danger)'} />
              </div>
            </GlassCard>
          );
        })}

        <GlassCard className="col-span-12 xl:col-span-8">
          <CardHeader
            title="Receita × meta"
            subtitle="Últimas 12 semanas, em R$ mil"
            action={
              <div className="flex items-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-accent" /> Receita
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded bg-[var(--fg-subtle)]" /> Meta
                </span>
              </div>
            }
          />
          <LineChart
            labels={RECEITA_SEMANAS.labels}
            series={[
              { name: 'Receita', color: 'var(--accent)', values: RECEITA_SEMANAS.receita, area: true },
              { name: 'Meta', color: 'var(--fg-subtle)', values: RECEITA_SEMANAS.meta, dashed: true },
            ]}
            format={(v) => `${Math.round(v)}k`}
            height={260}
          />
        </GlassCard>

        <GlassCard className="col-span-12 md:col-span-6 xl:col-span-4 flex flex-col">
          <CardHeader title="Meta do mês" subtitle={`Faltam ${diasRestantes()} dias para fechar`} action={<Badge tone="success" dot>No ritmo</Badge>} />
          <div className="flex-1 grid place-items-center py-2">
            <Gauge value={78} label="da meta atingida" />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { l: 'Realizado', v: fmtCompactBRL(412380) },
              { l: 'Meta', v: fmtCompactBRL(530000) },
              { l: 'Faltam', v: fmtCompactBRL(117620) },
            ].map((s) => (
              <div key={s.l} className="chip rounded-2xl px-3 py-2.5">
                <div className="text-[11px] text-subtle">{s.l}</div>
                <div className="text-sm font-semibold tabular-nums mt-0.5">{s.v}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 md:col-span-6 xl:col-span-5">
          <CardHeader title="Receita por mês" subtitle="Em R$ mil · passe o mouse nas barras" action={<Delta value={10.8} />} />
          <BarPills data={RECEITA_MESES} format={(v) => `R$ ${v}k`} height={230} />
        </GlassCard>

        <GlassCard className="col-span-12 md:col-span-6 xl:col-span-4">
          <CardHeader title="Conversão do funil" subtitle="Novembro, todas as filiais" />
          <div className="space-y-3.5">
            {CONVERSAO.map((c, i) => {
              const pct = (c.valor / CONVERSAO[0].valor) * 100;
              return (
                <div key={c.etapa}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-2">
                      <span className="chip size-5 rounded-md grid place-items-center text-[10px] font-semibold">{i + 1}</span>
                      <span className="font-medium">{c.etapa}</span>
                    </span>
                    <span className="text-muted tabular-nums">
                      {fmtInt(c.valor)} · <span className="text-fg font-semibold">{fmtPct(pct, pct < 10 ? 1 : 0)}</span>
                    </span>
                  </div>
                  <Progress value={pct} delay={0.3 + i * 0.08} className="h-2" />
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 md:col-span-6 xl:col-span-3 flex flex-col">
          <CardHeader
            title="Agenda de hoje"
            subtitle={`${hoje.length} compromissos`}
            action={
              <Link to="/agenda" className="chip size-8 rounded-full grid place-items-center hover:bg-[var(--chip-hover)]" aria-label="Abrir agenda">
                <ArrowUpRight className="size-4" />
              </Link>
            }
          />
          <div className="relative space-y-2.5 flex-1">
            {hoje.length === 0 && <p className="text-sm text-muted">Dia livre. Que tal prospectar?</p>}
            {hoje.slice(0, 5).map((e) => {
              const agora = e === proximo;
              return (
                <div key={e.id} className={cn('flex gap-3 rounded-2xl p-2.5 transition-colors', agora && 'bg-[var(--chip)]')}>
                  <div className="w-11 text-[11px] text-subtle tabular-nums pt-0.5">{fmtHora(e.inicio)}</div>
                  <span className="w-1 rounded-full" style={{ background: TIPOS_EVENTO[e.tipo].cor }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium truncate">{e.titulo}</div>
                    <div className="text-[11px] text-subtle truncate">{e.cliente ?? e.local}</div>
                  </div>
                  {agora && <Badge tone="accent">Próximo</Badge>}
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 md:col-span-6 xl:col-span-4">
          <CardHeader title="Origem dos leads" subtitle="Participação no mês" />
          <div className="flex items-center gap-6">
            <Donut
              data={ORIGENS}
              center={
                <div>
                  <div className="text-[11px] text-subtle">Leads</div>
                  <CountUp value={1284} format={fmtInt} className="text-2xl font-semibold tracking-tight" />
                </div>
              }
            />
            <div className="flex-1 space-y-2.5">
              {ORIGENS.map((o) => (
                <div key={o.label} className="flex items-center gap-2.5 text-[13px]">
                  <span className="size-2.5 rounded-full" style={{ background: o.color }} />
                  <span className="text-muted flex-1">{o.label}</span>
                  <span className="font-semibold tabular-nums">{o.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 md:col-span-6 xl:col-span-4">
          <CardHeader title="Top vendedores" subtitle="Receita fechada no mês" action={<AvatarStack names={RANKING.map((r) => r.nome)} size={24} max={3} />} />
          <div className="space-y-3.5">
            {RANKING.map((r, i) => (
              <div key={r.nome} className="flex items-center gap-3">
                <div className="relative">
                  <Avatar name={r.nome} size={34} />
                  {i === 0 && <Crown className="absolute -top-2 -right-1 size-4 text-warning fill-warning/40 rotate-12" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium truncate">{r.nome}</span>
                    <span className="tabular-nums text-muted">{fmtCompactBRL(r.valor)}</span>
                  </div>
                  <Progress
                    value={Math.min(100, r.meta)}
                    delay={0.35 + i * 0.08}
                    className="mt-1.5"
                    color={r.meta >= 100 ? 'var(--success)' : undefined}
                  />
                </div>
                <span className={cn('text-xs font-semibold tabular-nums w-10 text-right', r.meta >= 100 ? 'text-success' : 'text-muted')}>
                  {r.meta}%
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 xl:col-span-4">
          <CardHeader title="Atividade recente" subtitle="Tempo real" action={<span className="size-2 rounded-full bg-success shadow-[0_0_10px_var(--success)] animate-pulse mt-2" />} />
          <div className="space-y-3">
            {ATIVIDADES.map((a, i) => {
              const Icon = atividadeIcon[a.tipo as keyof typeof atividadeIcon];
              return (
                <div key={i} className="flex items-start gap-3">
                  <span className={cn('size-8 rounded-xl grid place-items-center shrink-0', atividadeTone[a.tipo as keyof typeof atividadeTone])}>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="text-[13px] leading-snug">{a.texto}</div>
                    <div className="text-[11px] text-subtle mt-0.5">{a.quando}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </>
  );
}
