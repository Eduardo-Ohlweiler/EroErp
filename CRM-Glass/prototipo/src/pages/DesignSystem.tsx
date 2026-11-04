import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Bell, Lock, Mail, Play, Plus, Search, Trash2 } from 'lucide-react';
import { CardHeader, GlassCard, PageHeader } from '../components/ui/Glass';
import { Button } from '../components/ui/Button';
import { Avatar, AvatarStack, Badge, Delta, Field, Input, Progress, Segmented, Toggle } from '../components/ui/Bits';
import { useToast } from '../components/ui/Toast';
import { CountUp } from '../motion/CountUp';
import { item, staggerGroup } from '../motion/tokens';
import { VENDEDORES } from '../data/mock';
import { fmtBRL } from '../lib/utils';

const CORES = [
  { n: 'accent', v: 'var(--accent)' },
  { n: 'accent-2', v: 'var(--accent-2)' },
  { n: 'accent-3', v: 'var(--accent-3)' },
  { n: 'success', v: 'var(--success)' },
  { n: 'warning', v: 'var(--warning)' },
  { n: 'danger', v: 'var(--danger)' },
  { n: 'info', v: 'var(--info)' },
  { n: 'fg', v: 'var(--fg)' },
];

/** Catálogo vivo do design system: tokens, níveis de vidro, componentes e movimento. */
export default function DesignSystem() {
  const toast = useToast();
  const [seg, setSeg] = useState('a');
  const [on, setOn] = useState(true);
  const [replay, setReplay] = useState(0);

  return (
    <>
      <PageHeader title="Design system" subtitle="Tokens e componentes que todas as telas usam — muda aqui, muda em tudo" />

      <div className="grid grid-cols-12 gap-4">
        <GlassCard className="col-span-12">
          <CardHeader title="Níveis de vidro" subtitle="Três opacidades para equilibrar beleza e leitura" />
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { c: 'glass-subtle', n: 'glass-subtle', d: 'Painéis grandes e fundos de seção. O mais transparente.' },
              { c: 'glass', n: 'glass', d: 'Cartões, KPIs e gráficos. O padrão do sistema.' },
              { c: 'glass-solid', n: 'glass-solid', d: 'Tabelas, formulários, modais e menus. Leitura em primeiro lugar.' },
            ].map((g) => (
              <div key={g.n} className="relative rounded-[22px] overflow-hidden p-5 min-h-[170px]">
                <div className="absolute inset-0" style={{ background: 'var(--bg)' }} />
                <div className="absolute -left-6 top-4 size-28 rounded-full blur-2xl accent-gradient opacity-80" />
                <div className="absolute right-4 -bottom-6 size-24 rounded-full blur-2xl opacity-70" style={{ background: 'var(--accent-3)' }} />
                <div className="absolute left-1/2 top-1/3 h-2 w-[70%] -translate-x-1/2 rounded-full bg-[var(--fg)] opacity-60" />
                <div className={`${g.c} relative p-4 rounded-2xl mt-6`}>
                  <div className="text-sm font-semibold font-mono">.{g.n}</div>
                  <div className="text-xs text-muted mt-1">{g.d}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-5">
          <CardHeader title="Cores" subtitle="Troque o destaque em Aparência e veja tudo mudar" />
          <div className="grid grid-cols-4 gap-3">
            {CORES.map((c) => (
              <div key={c.n}>
                <div className="h-14 rounded-2xl border border-line" style={{ background: c.v, boxShadow: `0 10px 24px -12px ${c.v}` }} />
                <div className="text-[11px] font-mono text-muted mt-1.5">{c.n}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-7">
          <CardHeader title="Tipografia" subtitle="Plus Jakarta Sans · números tabulares nos dados" />
          <div className="space-y-2.5">
            <div className="text-[34px] font-semibold tracking-tight leading-none">
              <CountUp value={412380} format={fmtBRL} key={replay} />
            </div>
            <div className="text-[26px] font-semibold tracking-tight">Título de página · 26–30px</div>
            <div className="text-[15px] font-semibold">Título de cartão · 15px</div>
            <div className="text-sm text-muted">Texto de apoio · 14px, cor muted</div>
            <div className="text-xs text-subtle">Legenda e metadados · 12px, cor subtle</div>
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-6">
          <CardHeader title="Botões" />
          <div className="flex flex-wrap gap-2.5">
            <Button variant="primary">
              <Plus className="size-4" /> Primário
            </Button>
            <Button>Vidro</Button>
            <Button variant="ghost">Fantasma</Button>
            <Button variant="danger">
              <Trash2 className="size-4" /> Excluir
            </Button>
            <Button variant="primary" size="lg">
              Grande <ArrowRight className="size-4" />
            </Button>
            <Button size="sm">Pequeno</Button>
            <Button size="icon" aria-label="Notificações">
              <Bell className="size-4" />
            </Button>
            <Button disabled>Desabilitado</Button>
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-6">
          <CardHeader title="Campos" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Com ícone">
              <Input icon={Search} placeholder="Buscar…" />
            </Field>
            <Field label="E-mail" hint="Usado para notificações">
              <Input icon={Mail} placeholder="voce@empresa.com.br" />
            </Field>
            <Field label="Com erro" error="Este campo é obrigatório.">
              <Input icon={Lock} invalid placeholder="Senha" />
            </Field>
            <Field label="Desabilitado">
              <Input disabled placeholder="Somente leitura" />
            </Field>
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-6">
          <CardHeader title="Etiquetas, avatares e indicadores" />
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">Destaque</Badge>
            <Badge tone="success" dot>Ativo</Badge>
            <Badge tone="warning" dot>Pendente</Badge>
            <Badge tone="danger">Atrasado</Badge>
            <Badge tone="info">Lead</Badge>
            <Badge>Neutro</Badge>
            <Delta value={12.4} />
            <Delta value={-3.1} />
          </div>
          <div className="flex items-center gap-4 mt-5">
            <Avatar name="Marina Costa" size={44} />
            <Avatar name="Rodrigo Alves" size={36} />
            <Avatar name="Patrícia Nunes" size={28} />
            <AvatarStack names={VENDEDORES} size={30} max={4} />
          </div>
          <div className="mt-5 space-y-2.5">
            <Progress value={72} key={`p1-${replay}`} />
            <Progress value={104} color="var(--success)" key={`p2-${replay}`} />
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-6">
          <CardHeader title="Controles e feedback" />
          <div className="flex flex-wrap items-center gap-4">
            <Segmented
              options={[
                { value: 'a', label: 'Semana' },
                { value: 'b', label: 'Mês' },
                { value: 'c', label: 'Ano' },
              ]}
              value={seg}
              onChange={setSeg}
            />
            <Toggle checked={on} onChange={setOn} label="Notificações" />
          </div>
          <div className="flex flex-wrap gap-2 mt-5">
            <Button size="sm" onClick={() => toast({ title: 'Tudo certo', description: 'Alterações salvas.', tone: 'success' })}>
              Toast de sucesso
            </Button>
            <Button size="sm" onClick={() => toast({ title: 'Para sua informação', description: 'Nova versão disponível.', tone: 'info' })}>
              Toast informativo
            </Button>
            <Button size="sm" onClick={() => toast({ title: 'Algo deu errado', description: 'Tente novamente em instantes.', tone: 'danger' })}>
              Toast de erro
            </Button>
          </div>
        </GlassCard>

        <GlassCard className="col-span-12">
          <CardHeader
            title="Movimento"
            subtitle="Cascata de entrada (stagger), mola e contagem — os mesmos presets da troca de tela"
            action={
              <Button size="sm" variant="primary" onClick={() => setReplay((r) => r + 1)}>
                <Play className="size-3.5" /> Repetir
              </Button>
            }
          />
          <motion.div key={replay} variants={staggerGroup} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }, (_, i) => (
              <motion.div key={i} variants={item} whileHover={{ y: -6 }} className="chip rounded-2xl h-24 grid place-items-center text-xs text-muted">
                item {i + 1}
              </motion.div>
            ))}
          </motion.div>
        </GlassCard>
      </div>
    </>
  );
}
