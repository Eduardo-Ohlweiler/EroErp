import {
  BatteryCharging,
  Boxes,
  Building2,
  Cable,
  CircleDollarSign,
  Cpu,
  Droplets,
  Gauge,
  Leaf,
  MapPin,
  Package,
  PackageX,
  ShieldCheck,
  Star,
  Sun,
  Target,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import { Avatar, Badge, type Tone } from '../components/ui/Bits';
import { CLIENTES, FILIAIS, PRODUTOS, type Cliente, type ClienteStatus, type Filial, type Produto } from '../data/mock';
import { cn, fmtBRL, fmtCompactBRL, fmtInt } from '../lib/utils';
import type { CadastroConfig } from './Cadastro';

/* ---------------- Clientes ---------------- */
export const STATUS_CLIENTE: Record<ClienteStatus, { label: string; tone: Tone }> = {
  ativo: { label: 'Ativo', tone: 'success' },
  lead: { label: 'Lead', tone: 'info' },
  negociacao: { label: 'Em negociação', tone: 'warning' },
  inativo: { label: 'Inativo', tone: 'neutral' },
};

export const clientesConfig: CadastroConfig<Cliente> = {
  titulo: 'Clientes',
  subtitulo: 'Pessoas e empresas com quem sua equipe se relaciona',
  novo: 'Novo cliente',
  busca: 'Buscar por nome, contato ou cidade…',
  linhas: CLIENTES,
  chave: (c) => c.id,
  texto: (c) => `${c.nome} ${c.contato} ${c.cidade} ${c.segmento}`,
  link: (c) => `/clientes/${c.id}`,
  filtros: [
    { valor: 'todos', label: 'Todos', teste: () => true },
    { valor: 'ativo', label: 'Ativos', teste: (c) => c.status === 'ativo' },
    { valor: 'lead', label: 'Leads', teste: (c) => c.status === 'lead' },
    { valor: 'vip', label: 'VIP', teste: (c) => !!c.tier },
  ],
  stats: [
    { label: 'Total de clientes', valor: 248, formato: fmtInt, delta: 6.2, icon: Users },
    { label: 'Ativos', valor: 186, formato: fmtInt, delta: 3.4, icon: UserCheck },
    { label: 'Novos no mês', valor: 21, formato: fmtInt, delta: 18, icon: UserPlus },
    { label: 'Em aberto', valor: CLIENTES.reduce((a, c) => a + c.valorAberto, 0), formato: fmtCompactBRL, icon: CircleDollarSign },
  ],
  colunas: [
    {
      header: 'Cliente',
      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.nome} size={36} />
          <div className="min-w-0">
            <div className="font-semibold flex items-center gap-1.5">
              {c.nome}
              {c.tier && <Star className={cn('size-3.5', c.tier === 'VIP' ? 'text-warning fill-warning' : 'text-subtle fill-current')} />}
            </div>
            <div className="text-xs text-subtle truncate">
              {c.contato} · {c.email}
            </div>
          </div>
        </div>
      ),
    },
    { header: 'Segmento', render: (c) => <span className="chip h-6 px-2.5 rounded-full inline-flex items-center text-[11px] font-medium">{c.segmento}</span> },
    {
      header: 'Cidade',
      render: (c) => (
        <span className="text-muted inline-flex items-center gap-1.5 whitespace-nowrap">
          <MapPin className="size-3.5" />
          {c.cidade}
        </span>
      ),
    },
    {
      header: 'Responsável',
      render: (c) => (
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <Avatar name={c.responsavel} size={24} />
          <span className="text-muted">{c.responsavel.split(' ')[0]}</span>
        </span>
      ),
    },
    { header: 'Em aberto', align: 'right', render: (c) => <span className="font-semibold tabular-nums">{c.valorAberto ? fmtBRL(c.valorAberto) : '—'}</span> },
    { header: 'Status', render: (c) => <Badge tone={STATUS_CLIENTE[c.status].tone} dot>{STATUS_CLIENTE[c.status].label}</Badge> },
    { header: 'Última atividade', className: 'text-subtle text-xs whitespace-nowrap', render: (c) => c.ultimaAtividade },
  ],
};

/* ---------------- Filiais ---------------- */
export const filiaisConfig: CadastroConfig<Filial> = {
  titulo: 'Filiais',
  subtitulo: 'Unidades da empresa, metas e equipes',
  novo: 'Nova filial',
  busca: 'Buscar filial, cidade ou gerente…',
  linhas: FILIAIS,
  chave: (f) => f.id,
  texto: (f) => `${f.nome} ${f.cidade} ${f.gerente}`,
  filtros: [
    { valor: 'todas', label: 'Todas', teste: () => true },
    { valor: 'operando', label: 'Operando', teste: (f) => f.status === 'operando' },
    { valor: 'implantacao', label: 'Em implantação', teste: (f) => f.status === 'implantacao' },
  ],
  stats: [
    { label: 'Unidades', valor: FILIAIS.length, formato: fmtInt, icon: Building2 },
    { label: 'Colaboradores', valor: FILIAIS.reduce((a, f) => a + f.colaboradores, 0), formato: fmtInt, delta: 4.1, icon: Users },
    { label: 'Faturamento do mês', valor: FILIAIS.reduce((a, f) => a + f.faturamento, 0), formato: fmtCompactBRL, delta: 12.4, icon: CircleDollarSign },
    { label: 'Meta média', valor: 76, formato: (v) => `${Math.round(v)}%`, icon: Target },
  ],
  colunas: [
    {
      header: 'Unidade',
      render: (f) => (
        <div className="flex items-center gap-3">
          <span className={cn('size-9 rounded-xl grid place-items-center', f.tipo === 'Matriz' ? 'accent-gradient accent-glow' : 'chip')}>
            <Building2 className="size-4" />
          </span>
          <div>
            <div className="font-semibold">{f.nome}</div>
            <div className="text-xs text-subtle">{f.tipo}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Cidade',
      render: (f) => (
        <span className="text-muted inline-flex items-center gap-1.5 whitespace-nowrap">
          <MapPin className="size-3.5" />
          {f.cidade}
        </span>
      ),
    },
    {
      header: 'Gerente',
      render: (f) => (
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <Avatar name={f.gerente} size={24} />
          {f.gerente}
        </span>
      ),
    },
    { header: 'Equipe', align: 'right', render: (f) => <span className="tabular-nums">{f.colaboradores}</span> },
    { header: 'Faturamento', align: 'right', render: (f) => <span className="font-semibold tabular-nums">{f.faturamento ? fmtBRL(f.faturamento) : '—'}</span> },
    {
      header: 'Meta do mês',
      render: (f) => (
        <div className="flex items-center gap-2.5 min-w-[150px]">
          <div className="flex-1 h-1.5 rounded-full bg-[var(--track)] overflow-hidden">
            <div
              className={cn('h-full rounded-full', f.meta >= 100 ? 'bg-success' : 'accent-gradient')}
              style={{ width: `${Math.min(100, f.meta)}%` }}
            />
          </div>
          <span className={cn('text-xs tabular-nums w-9 text-right', f.meta >= 100 ? 'text-success font-semibold' : 'text-muted')}>{f.meta}%</span>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (f) => (
        <Badge tone={f.status === 'operando' ? 'success' : 'warning'} dot>
          {f.status === 'operando' ? 'Operando' : 'Em implantação'}
        </Badge>
      ),
    },
  ],
};

/* ---------------- Produtos ---------------- */
const ICONES = { sun: Sun, zap: Zap, battery: BatteryCharging, cpu: Cpu, wrench: Wrench, shield: ShieldCheck, cable: Cable, leaf: Leaf, gauge: Gauge, droplets: Droplets };
const servico = (p: Produto) => p.estoque === 999;
const estoqueInfo = (p: Produto): { label: string; tone: Tone } =>
  servico(p) ? { label: 'Serviço', tone: 'accent' } : p.estoque === 0 ? { label: 'Esgotado', tone: 'danger' } : p.estoque < 20 ? { label: 'Estoque baixo', tone: 'warning' } : { label: 'Em estoque', tone: 'success' };

function IconeProduto({ p, size = 40 }: { p: Produto; size?: number }) {
  const I = ICONES[p.icone];
  return (
    <span className="rounded-2xl accent-gradient accent-glow grid place-items-center shrink-0" style={{ width: size, height: size }}>
      <I className="size-[45%]" />
    </span>
  );
}

export const produtosConfig: CadastroConfig<Produto> = {
  titulo: 'Produtos e serviços',
  subtitulo: 'Catálogo usado nas propostas e negócios',
  novo: 'Novo produto',
  busca: 'Buscar por nome, SKU ou categoria…',
  linhas: PRODUTOS,
  chave: (p) => p.id,
  texto: (p) => `${p.nome} ${p.sku} ${p.categoria}`,
  filtros: [
    { valor: 'todos', label: 'Todos', teste: () => true },
    { valor: 'produtos', label: 'Produtos', teste: (p) => !servico(p) },
    { valor: 'servicos', label: 'Serviços', teste: servico },
    { valor: 'baixo', label: 'Estoque baixo', teste: (p) => !servico(p) && p.estoque < 20 },
  ],
  stats: [
    { label: 'Itens no catálogo', valor: PRODUTOS.length, formato: fmtInt, icon: Package },
    { label: 'Unidades em estoque', valor: PRODUTOS.filter((p) => !servico(p)).reduce((a, p) => a + p.estoque, 0), formato: fmtInt, delta: -3.2, icon: Boxes },
    { label: 'Esgotados', valor: PRODUTOS.filter((p) => p.estoque === 0).length, formato: fmtInt, icon: PackageX },
    { label: 'Mais vendido', valor: 840, formato: () => 'Painel 550 W', icon: Sun },
  ],
  colunas: [
    {
      header: 'Produto',
      render: (p) => (
        <div className="flex items-center gap-3">
          <IconeProduto p={p} size={36} />
          <div>
            <div className="font-semibold">{p.nome}</div>
            <div className="text-xs text-subtle font-mono">{p.sku}</div>
          </div>
        </div>
      ),
    },
    { header: 'Categoria', render: (p) => <span className="chip h-6 px-2.5 rounded-full inline-flex items-center text-[11px] font-medium">{p.categoria}</span> },
    { header: 'Preço', align: 'right', render: (p) => <span className="font-semibold tabular-nums">{fmtBRL(p.preco)}</span> },
    { header: 'Estoque', align: 'right', render: (p) => <span className="tabular-nums text-muted">{servico(p) ? '—' : fmtInt(p.estoque)}</span> },
    { header: 'Situação', render: (p) => <Badge tone={estoqueInfo(p).tone} dot>{estoqueInfo(p).label}</Badge> },
  ],
  cartao: (p) => (
    <div className="glass glass-hover rounded-[22px] p-4 h-full cursor-pointer overflow-hidden">
      <div className="relative h-28 rounded-2xl overflow-hidden mb-4 grid place-items-center chip">
        <div className="absolute inset-0 opacity-50" style={{ background: 'radial-gradient(circle at 30% 20%, var(--accent-glow), transparent 60%)' }} />
        <IconeProduto p={p} size={56} />
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{p.nome}</div>
          <div className="text-[11px] text-subtle font-mono">{p.sku}</div>
        </div>
        <Badge tone={estoqueInfo(p).tone} className="!h-5 !text-[10px]">
          {estoqueInfo(p).label}
        </Badge>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div className="text-lg font-semibold tabular-nums tracking-tight">{fmtBRL(p.preco)}</div>
        <div className="text-[11px] text-muted">{servico(p) ? p.categoria : `${fmtInt(p.estoque)} un.`}</div>
      </div>
    </div>
  ),
};
