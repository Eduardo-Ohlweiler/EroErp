import { motion } from 'motion/react';
import { Check, Moon, RotateCcw, Sun } from 'lucide-react';
import { CardHeader, GlassCard, PageHeader } from '../components/ui/Glass';
import { Button } from '../components/ui/Button';
import { Segmented, Toggle } from '../components/ui/Bits';
import { useSettings, type Accent, type Fundo, type Theme } from '../theme/settings';
import { spring } from '../motion/tokens';
import { cn } from '../lib/utils';
import { ESCRITORIO } from '../components/layout/cenas';

const ACCENTS: { id: Accent; nome: string }[] = [
  { id: 'violeta', nome: 'Violeta' },
  { id: 'azul', nome: 'Azul' },
  { id: 'laranja', nome: 'Laranja' },
  { id: 'esmeralda', nome: 'Esmeralda' },
  { id: 'rosa', nome: 'Rosa' },
  { id: 'ambar', nome: 'Âmbar' },
];
const FUNDOS: { id: Fundo; nome: string; desc: string }[] = [
  { id: 'orbs', nome: 'Orbs', desc: 'Esferas de cor que flutuam devagar' },
  { id: 'aurora', nome: 'Aurora', desc: 'Gradiente cônico girando' },
  { id: 'ondas', nome: 'Ondas', desc: 'Curvas de luz' },
  { id: 'minimo', nome: 'Mínimo', desc: 'Só um brilho suave' },
  { id: 'escritorio', nome: 'Escritório', desc: 'Luzes que seguem o tema' },
];

/** Painel para experimentar a direção visual ao vivo. */
export default function Configuracoes() {
  const { settings, set, reset } = useSettings();
  return (
    <>
      <PageHeader
        title="Aparência"
        subtitle="Experimente o visual ao vivo — tudo é salvo neste navegador"
        actions={
          <Button onClick={reset}>
            <RotateCcw className="size-4" /> Restaurar padrão
          </Button>
        }
      />
      <div className="grid grid-cols-12 gap-4">
        <GlassCard className="col-span-12 lg:col-span-6">
          <CardHeader title="Tema" subtitle="Escuro é o padrão; o claro usa os mesmos tokens" />
          <div className="grid grid-cols-2 gap-3">
            {(['dark', 'light'] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => set({ theme: t })}
                className={cn('relative rounded-2xl p-1.5 text-left transition-colors', settings.theme === t ? 'bg-accent/15' : 'hover:bg-[var(--chip)]')}
              >
                {settings.theme === t && (
                  <motion.span layoutId="theme-ring" transition={spring.snappy} className="absolute inset-0 rounded-2xl border-2 border-accent" />
                )}
                <div data-theme={t} className="relative h-28 rounded-xl overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
                  <div className="absolute -left-6 -top-8 size-24 rounded-full blur-2xl opacity-70 accent-gradient" />
                  <div className="absolute right-0 bottom-0 size-20 rounded-full blur-2xl opacity-50" style={{ background: 'var(--accent-2)' }} />
                  <div className="glass absolute left-3 top-3 bottom-3 w-6 !rounded-lg" />
                  <div className="glass absolute left-12 top-3 right-3 h-6 !rounded-lg" />
                  <div className="glass absolute left-12 top-12 w-[38%] bottom-3 !rounded-lg" />
                  <div className="glass absolute right-3 top-12 w-[28%] bottom-3 !rounded-lg" />
                </div>
                <div className="relative flex items-center gap-2 px-1.5 pt-2.5 pb-1 text-sm font-medium">
                  {t === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
                  {t === 'dark' ? 'Escuro' : 'Claro'}
                </div>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-6">
          <CardHeader title="Cor de destaque" subtitle="Cada empresa cliente pode ter a sua — vira a marca dela no sistema" />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {ACCENTS.map((a) => {
              const on = settings.accent === a.id;
              return (
                <button key={a.id} onClick={() => set({ accent: a.id })} className="flex flex-col items-center gap-2 group">
                  <span className="relative size-14 grid place-items-center">
                    {on && <motion.span layoutId="accent-ring" transition={spring.snappy} className="absolute inset-0 rounded-full border-2 border-fg/70" />}
                    <span data-accent={a.id} className="size-11 rounded-full accent-gradient accent-glow grid place-items-center transition-transform group-hover:scale-110">
                      {on && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring.bouncy}>
                          <Check className="size-5" strokeWidth={3} />
                        </motion.span>
                      )}
                    </span>
                  </span>
                  <span className={cn('text-xs', on ? 'text-fg font-semibold' : 'text-muted')}>{a.nome}</span>
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-8">
          <CardHeader title="Fundo" subtitle="O vidro precisa de algo vivo atrás para brilhar" action={<Toggle checked={settings.fundoAnimado} onChange={(v) => set({ fundoAnimado: v })} label="Animado" />} />
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
            {FUNDOS.map((f) => {
              const on = settings.fundo === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => set({ fundo: f.id })}
                  className={cn('relative rounded-2xl p-3 text-left transition-colors', on ? 'bg-accent/12' : 'chip hover:bg-[var(--chip-hover)]')}
                >
                  {on && <motion.span layoutId="bg-ring" transition={spring.snappy} className="absolute inset-0 rounded-2xl border-2 border-accent" />}
                  <div className="relative h-20 rounded-xl overflow-hidden mb-2.5" style={{ background: 'var(--bg)' }}>
                    {f.id === 'orbs' && (
                      <>
                        <span className="absolute -left-3 -top-3 size-14 rounded-full blur-xl accent-gradient opacity-80" />
                        <span className="absolute right-2 bottom-0 size-12 rounded-full blur-xl opacity-70" style={{ background: 'var(--accent-3)' }} />
                      </>
                    )}
                    {f.id === 'aurora' && (
                      <span
                        className="absolute -inset-6 blur-xl opacity-70"
                        style={{ background: 'conic-gradient(from 90deg, var(--accent), var(--accent-2), var(--accent-3), var(--accent))' }}
                      />
                    )}
                    {f.id === 'ondas' && (
                      <svg viewBox="0 0 100 60" className="absolute inset-0 size-full" preserveAspectRatio="none">
                        <path d="M0 42 C 25 20, 50 60, 100 22 L100 60 L0 60Z" style={{ fill: 'var(--accent)' }} opacity=".6" />
                        <path d="M0 14 C 30 0, 60 34, 100 8 L100 0 L0 0Z" style={{ fill: 'var(--accent-2)' }} opacity=".5" />
                      </svg>
                    )}
                    {f.id === 'escritorio' && (
                      <>
                        <img
                          src={ESCRITORIO.dia}
                          alt=""
                          className={cn('absolute inset-0 size-full object-cover', settings.theme === 'dark' && 'scene-noite-derivada')}
                        />
                        {settings.theme === 'dark' && <span className="scene-noite-tinta" />}
                      </>
                    )}
                    {f.id === 'minimo' && <span className="absolute inset-0" style={{ background: 'radial-gradient(circle at 20% 0%, var(--accent-glow), transparent 70%)' }} />}
                  </div>
                  <div className="relative text-sm font-semibold">{f.nome}</div>
                  <div className="relative text-[11px] text-subtle">{f.desc}</div>
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-4 space-y-6">
          <div>
            <CardHeader title="Intensidade do vidro" subtitle={`Desfoque de ${settings.blur}px`} className="!mb-3" />
            <input
              type="range"
              min={6}
              max={40}
              value={settings.blur}
              onChange={(e) => set({ blur: Number(e.target.value) })}
              className="w-full accent-[var(--accent)]"
              aria-label="Desfoque do vidro"
            />
            <div className="flex justify-between text-[11px] text-subtle mt-1">
              <span>Mais nítido</span>
              <span>Mais fosco</span>
            </div>
          </div>
          <div>
            <CardHeader title="Animações" subtitle="Reduzida: troca de tela vira só um fade" className="!mb-3" />
            <Segmented
              options={[
                { value: 'completa', label: 'Completas' },
                { value: 'reduzida', label: 'Reduzidas' },
              ]}
              value={settings.movimento}
              onChange={(v) => set({ movimento: v })}
            />
          </div>
        </GlassCard>
      </div>
    </>
  );
}
