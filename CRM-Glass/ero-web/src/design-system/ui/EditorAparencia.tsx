import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Check, ImageIcon, Moon, Sun } from 'lucide-react';
import { spring } from '../../motion/tokens';
import { cn } from '../../shared/util/utils';
import {
  DESTAQUES,
  LIMITES,
  fundoDeCodigo,
  type Accent,
  type AnimacoesApi,
  type AparenciaApi,
  type FundoApi,
  type FundoCatalogo,
  type TemaApi,
  type Theme,
} from '../../shared/aparencia/mapear';
import { Badge, Segmented, Toggle } from './Bits';
import { CardHeader, GlassCard } from './Glass';
import { Slider } from './Slider';
import type { PropsBloco } from './bloco';

/* ---------------- Grupo de opções com setas (role=radiogroup) ---------------- */
/** Teclado de radiogroup: setas e Home/End escolhem e movem o foco. */
function teclaRadio<T>(e: KeyboardEvent<HTMLElement>, opcoes: T[], atual: number, escolher: (v: T) => void) {
  const n = opcoes.length;
  let i = -1;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') i = (atual + 1) % n;
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') i = (atual - 1 + n) % n;
  else if (e.key === 'Home') i = 0;
  else if (e.key === 'End') i = n - 1;
  if (i < 0) return;
  e.preventDefault();
  escolher(opcoes[i]);
  const grupo = e.currentTarget.closest('[role="radiogroup"]');
  requestAnimationFrame(() => grupo?.querySelectorAll<HTMLElement>('[role="radio"]')[i]?.focus());
}

/* ---------------- Tema ---------------- */
const TEMAS: { api: TemaApi; tema: Theme; nome: string }[] = [
  { api: 'ESCURO', tema: 'dark', nome: 'Escuro' },
  { api: 'CLARO', tema: 'light', nome: 'Claro' },
];

export function SeletorTema({ valor, onChange, desabilitado }: { valor: TemaApi; onChange: (v: TemaApi) => void; desabilitado?: boolean }) {
  const atual = Math.max(0, TEMAS.findIndex((t) => t.api === valor));
  return (
    <div role="radiogroup" aria-label="Tema padrão" className="grid grid-cols-2 gap-3">
      {TEMAS.map((t, i) => {
        const on = i === atual;
        return (
          <button
            key={t.api}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            disabled={desabilitado}
            onClick={() => onChange(t.api)}
            onKeyDown={(e) => teclaRadio(e, TEMAS.map((x) => x.api), atual, onChange)}
            className={cn('relative rounded-2xl p-1.5 text-left transition-colors', on ? 'bg-accent/15' : 'hover:bg-[var(--chip)]')}
          >
            {on && <motion.span layoutId="theme-ring" transition={spring.snappy} className="absolute inset-0 rounded-2xl border-2 border-accent" />}
            <div aria-hidden data-theme={t.tema} className="relative h-28 rounded-xl overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
              <div className="absolute -left-6 -top-8 size-24 rounded-full blur-2xl opacity-70 accent-gradient" />
              <div className="absolute right-0 bottom-0 size-20 rounded-full blur-2xl opacity-50" style={{ background: 'var(--accent-2)' }} />
              <div className="glass absolute left-3 top-3 bottom-3 w-6 !rounded-lg" />
              <div className="glass absolute left-12 top-3 right-3 h-6 !rounded-lg" />
              <div className="glass absolute left-12 top-12 w-[38%] bottom-3 !rounded-lg" />
              <div className="glass absolute right-3 top-12 w-[28%] bottom-3 !rounded-lg" />
            </div>
            <div className="relative flex items-center gap-2 px-1.5 pt-2.5 pb-1 text-sm font-medium">
              {t.tema === 'dark' ? <Moon className="size-4" aria-hidden /> : <Sun className="size-4" aria-hidden />}
              {t.nome}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Destaque ---------------- */
export function SeletorDestaque({ valor, onChange, desabilitado }: { valor: Accent; onChange: (v: Accent) => void; desabilitado?: boolean }) {
  const atual = Math.max(0, DESTAQUES.findIndex((d) => d.id === valor));
  return (
    <div role="radiogroup" aria-label="Cor de destaque" className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {DESTAQUES.map((a, i) => {
        const on = i === atual;
        return (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            disabled={desabilitado}
            onClick={() => onChange(a.id)}
            onKeyDown={(e) => teclaRadio(e, DESTAQUES.map((d) => d.id), atual, onChange)}
            className="flex flex-col items-center gap-2 group rounded-2xl py-1"
          >
            <span className="relative size-14 grid place-items-center">
              {on && <motion.span layoutId="accent-ring" transition={spring.snappy} className="absolute inset-0 rounded-full border-2 border-fg/70" />}
              <span data-accent={a.id} className="size-11 rounded-full accent-gradient accent-glow grid place-items-center transition-transform group-hover:scale-110">
                {on && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring.bouncy}>
                    <Check className="size-5" strokeWidth={3} aria-hidden />
                  </motion.span>
                )}
              </span>
            </span>
            <span className={cn('text-xs', on ? 'text-fg font-semibold' : 'text-muted')}>{a.nome}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Fundo ---------------- */
const DESCRICOES: Record<string, string> = {
  orbs: 'Esferas de cor que flutuam devagar',
  aurora: 'Gradiente cônico girando',
  ondas: 'Curvas de luz',
  minimo: 'Só um brilho suave',
  escritorio: 'Luzes que seguem o tema',
  cidade: 'Orla que amanhece e anoitece',
  marina: 'Baía com iates, dia e noite',
  expediente: 'Luzes quentes que acendem ao anoitecer',
  coworking: 'Open space com luzes desfocadas',
};

/** Miniatura de cena por convenção: public/cenas/<id>/<dia|noite>.webp (o motion-designer porta as fotos). */
const miniaturaPadrao = (id: string, tema: Theme) => `${import.meta.env.BASE_URL}cenas/${id}/${tema === 'light' ? 'dia' : 'noite'}.webp`;

function Miniatura({ item, tema, miniatura }: { item: FundoCatalogo; tema: Theme; miniatura: (id: string, tema: Theme) => string | undefined }) {
  const id = fundoDeCodigo(item.codigo);
  const [falhou, setFalhou] = useState(false);
  if (id === 'orbs')
    return (
      <>
        <span className="absolute -left-3 -top-3 size-14 rounded-full blur-xl accent-gradient opacity-80" />
        <span className="absolute right-2 bottom-0 size-12 rounded-full blur-xl opacity-70" style={{ background: 'var(--accent-3)' }} />
      </>
    );
  if (id === 'aurora')
    return (
      <span
        className="absolute -inset-6 blur-xl opacity-70"
        style={{ background: 'conic-gradient(from 90deg, var(--accent), var(--accent-2), var(--accent-3), var(--accent))' }}
      />
    );
  if (id === 'ondas')
    return (
      <svg viewBox="0 0 100 60" className="absolute inset-0 size-full" preserveAspectRatio="none">
        <path d="M0 42 C 25 20, 50 60, 100 22 L100 60 L0 60Z" style={{ fill: 'var(--accent)' }} opacity=".6" />
        <path d="M0 14 C 30 0, 60 34, 100 8 L100 0 L0 0Z" style={{ fill: 'var(--accent-2)' }} opacity=".5" />
      </svg>
    );
  if (id === 'minimo') return <span className="absolute inset-0" style={{ background: 'radial-gradient(circle at 20% 0%, var(--accent-glow), transparent 70%)' }} />;
  const src = id && !falhou ? miniatura(id, tema) : undefined;
  if (src) return <img src={src} alt="" loading="lazy" onError={() => setFalhou(true)} className="absolute inset-0 size-full object-cover" />;
  return (
    <span className="absolute inset-0 grid place-items-center text-subtle" style={{ background: 'radial-gradient(circle at 30% 20%, var(--accent-glow), transparent 75%)' }}>
      <ImageIcon className="size-6" />
    </span>
  );
}

export type SeletorFundoProps = {
  valor: string;
  onChange: (codigo: FundoApi) => void;
  /** catálogo de `GET /api/tenants/fundos?tenantId=` */
  fundos: FundoCatalogo[];
  /** tema usado nas miniaturas das cenas (dia/noite) */
  tema: Theme;
  /** URL da miniatura de uma cena (padrão: public/cenas/<id>/<dia|noite>.webp) */
  miniatura?: (id: string, tema: Theme) => string | undefined;
  desabilitado?: boolean;
};

export function SeletorFundo({ valor, onChange, fundos, tema, miniatura = miniaturaPadrao, desabilitado }: SeletorFundoProps) {
  // Só entra o que o front sabe desenhar (lista branca de mapear.ts).
  const lista = fundos.filter((f) => fundoDeCodigo(f.codigo));
  const codigos = lista.map((f) => f.codigo as FundoApi);
  const atual = Math.max(0, codigos.indexOf(valor as FundoApi));
  return (
    <div role="radiogroup" aria-label="Fundo" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {lista.map((f, i) => {
        const on = f.codigo === valor;
        const id = fundoDeCodigo(f.codigo) ?? '';
        return (
          <button
            key={f.codigo}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on || (i === 0 && !codigos.includes(valor as FundoApi)) ? 0 : -1}
            disabled={desabilitado}
            onClick={() => onChange(f.codigo as FundoApi)}
            onKeyDown={(e) => teclaRadio(e, codigos, atual, onChange)}
            className={cn('relative rounded-2xl p-3 text-left transition-colors', on ? 'bg-accent/12' : 'chip hover:bg-[var(--chip-hover)]')}
          >
            {on && <motion.span layoutId="bg-ring" transition={spring.snappy} className="absolute inset-0 rounded-2xl border-2 border-accent" />}
            <div aria-hidden className="relative h-20 rounded-xl overflow-hidden mb-2.5" style={{ background: 'var(--bg)' }}>
              <Miniatura item={f} tema={tema} miniatura={miniatura} />
            </div>
            <div className="relative flex items-center gap-1.5 text-sm font-semibold">
              {f.rotulo}
              {f.exclusiva && <Badge tone="accent">Exclusiva</Badge>}
            </div>
            <div className="relative text-[11px] text-subtle">{DESCRICOES[id] ?? (f.tipo === 'CENA' ? 'Cena fotográfica' : 'Fundo animado')}</div>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Editor completo ---------------- */
export type EditorAparenciaProps = PropsBloco & {
  valor: AparenciaApi;
  onChange: (v: AparenciaApi) => void;
  /** catálogo de fundos liberados para o contratante */
  fundos: FundoCatalogo[];
  miniatura?: (id: string, tema: Theme) => string | undefined;
  desabilitado?: boolean;
  /** conteúdo extra no fim (ex.: Select de cena exclusiva) */
  extra?: ReactNode;
};

/**
 * Editor da aparência do contratante, na ordem: tema, destaque, fundo (+ animado), vidro, foco (só cena), animações.
 * Controlado: quem usa chama `definirPrevia(valor)` a cada mudança para ver na interface inteira.
 */
export function EditorAparencia({ valor, onChange, fundos, miniatura, desabilitado, extra, bloco = true, variants }: EditorAparenciaProps) {
  const set = <K extends keyof AparenciaApi>(k: K, v: AparenciaApi[K]) => onChange({ ...valor, [k]: v });
  const tema: Theme = valor.temaPadrao === 'CLARO' ? 'light' : 'dark';
  const ehCena = fundos.find((f) => f.codigo === valor.fundo)?.tipo === 'CENA';
  const cartao = { bloco, variants };
  const uid = useId();

  return (
    <div className="grid grid-cols-12 gap-4">
      <GlassCard {...cartao} className="col-span-12 lg:col-span-6">
        <CardHeader title="Tema padrão" subtitle="Vale para todos os usuários do contratante" />
        <SeletorTema valor={valor.temaPadrao} onChange={(v) => set('temaPadrao', v)} desabilitado={desabilitado} />
      </GlassCard>

      <GlassCard {...cartao} className="col-span-12 lg:col-span-6">
        <CardHeader title="Cor de destaque" subtitle="A marca do contratante no sistema" />
        <SeletorDestaque valor={valor.corDestaque} onChange={(v) => set('corDestaque', v)} desabilitado={desabilitado} />
      </GlassCard>

      <GlassCard {...cartao} className="col-span-12 lg:col-span-8">
        <CardHeader
          title="Fundo"
          subtitle="O vidro precisa de algo vivo atrás para brilhar"
          action={
            <Toggle
              checked={valor.fundoAnimado}
              onChange={(v) => set('fundoAnimado', v)}
              label="Animado"
              disabled={desabilitado}
            />
          }
        />
        <SeletorFundo valor={valor.fundo} onChange={(v) => set('fundo', v)} fundos={fundos} tema={tema} miniatura={miniatura} desabilitado={desabilitado} />
      </GlassCard>

      <GlassCard {...cartao} className="col-span-12 lg:col-span-4 space-y-6">
        <div>
          <CardHeader
            title={<span id={`${uid}-vidro`}>Intensidade do vidro</span>}
            subtitle={valor.vidroDesfoque === 0 ? 'Sem desfoque: vidro transparente' : `Desfoque de ${valor.vidroDesfoque}px`}
            className="!mb-3"
          />
          <Slider
            aria-labelledby={`${uid}-vidro`}
            valor={valor.vidroDesfoque}
            onValor={(v) => set('vidroDesfoque', v)}
            min={LIMITES.vidro.min}
            max={LIMITES.vidro.max}
            passo={LIMITES.vidro.passo}
            formatar={(v) => (v === 0 ? 'Sem desfoque' : `${v} pixels`)}
            legendas={['Mais nítido', 'Mais fosco']}
            desabilitado={desabilitado}
          />
        </div>
        {ehCena && (
          <div>
            <CardHeader
              title={<span id={`${uid}-foco`}>Foco do fundo</span>}
              subtitle={valor.fundoFoco === 0 ? 'Foto totalmente nítida' : `Desfoque da foto de ${String(valor.fundoFoco).replace('.', ',')}px`}
              className="!mb-3"
            />
            <Slider
              aria-labelledby={`${uid}-foco`}
              valor={valor.fundoFoco}
              onValor={(v) => set('fundoFoco', v)}
              min={LIMITES.foco.min}
              max={LIMITES.foco.max}
              passo={LIMITES.foco.passo}
              formatar={(v) => (v === 0 ? 'Nítido' : `${String(v).replace('.', ',')} pixels`)}
              legendas={['Nítido', 'Desfocado']}
              desabilitado={desabilitado}
            />
          </div>
        )}
        <div>
          <CardHeader title="Animações" subtitle="Reduzidas: troca de tela vira só um esmaecimento" className="!mb-3" />
          <Segmented<AnimacoesApi>
            options={[
              { value: 'COMPLETAS', label: 'Completas' },
              { value: 'REDUZIDAS', label: 'Reduzidas' },
            ]}
            value={valor.animacoes}
            onChange={(v) => set('animacoes', v)}
          />
        </div>
        {extra}
      </GlassCard>
    </div>
  );
}
