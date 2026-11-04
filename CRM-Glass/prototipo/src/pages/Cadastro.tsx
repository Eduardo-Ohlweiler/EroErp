import { useState, type ComponentType, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, Download, LayoutGrid, List, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { GlassCard, PageHeader } from '../components/ui/Glass';
import { Button } from '../components/ui/Button';
import { Delta, Input, Segmented } from '../components/ui/Bits';
import { useToast } from '../components/ui/Toast';
import { CountUp } from '../motion/CountUp';
import { ease, spring } from '../motion/tokens';
import { cn, norm } from '../lib/utils';

export type Coluna<T> = { header: string; render: (r: T) => ReactNode; align?: 'right'; className?: string };
export type CadastroConfig<T> = {
  titulo: string;
  subtitulo: string;
  novo: string;
  busca: string;
  linhas: T[];
  chave: (r: T) => string;
  texto: (r: T) => string;
  colunas: Coluna<T>[];
  filtros: { valor: string; label: string; teste: (r: T) => boolean }[];
  stats: { label: string; valor: number; formato: (v: number) => string; delta?: number; icon: ComponentType<{ className?: string }> }[];
  link?: (r: T) => string;
  cartao?: (r: T) => ReactNode;
};

/**
 * Padrão único de cadastro: indicadores → listagem com busca e filtros → detalhe.
 * Clientes, filiais e produtos usam este mesmo componente, configurado em `cadastros.tsx`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Cadastro({ config }: { config: CadastroConfig<any> }) {
  const nav = useNavigate();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState(config.filtros[0].valor);
  const [vista, setVista] = useState<'lista' | 'grade'>(config.cartao ? 'grade' : 'lista');

  const teste = config.filtros.find((f) => f.valor === filtro)!.teste;
  const linhas = config.linhas.filter((r) => teste(r) && norm(config.texto(r)).includes(norm(q)));

  return (
    <>
      <PageHeader
        title={config.titulo}
        subtitle={config.subtitulo}
        actions={
          <>
            <Button>
              <Download className="size-4" /> Exportar
            </Button>
            <Button
              variant="primary"
              onClick={() => toast({ title: config.novo, description: 'No protótipo, o formulário fica para a próxima etapa.', tone: 'info' })}
            >
              <Plus className="size-4" /> {config.novo}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        {config.stats.map((s) => (
          <GlassCard key={s.label} hover className="!p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">{s.label}</span>
              <span className="size-8 rounded-xl chip grid place-items-center">
                <s.icon className="size-4 text-accent-text" />
              </span>
            </div>
            <div className="mt-3 flex items-end gap-2">
              <CountUp value={s.valor} format={s.formato} className="text-2xl font-semibold tracking-tight leading-none" />
              {s.delta !== undefined && <Delta value={s.delta} />}
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard level="solid" padded={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-line">
          <div className="w-full sm:w-80">
            <Input icon={Search} placeholder={config.busca} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Segmented options={config.filtros.map((f) => ({ value: f.valor, label: f.label }))} value={filtro} onChange={setFiltro} />
          <div className="ml-auto flex items-center gap-2">
            {config.cartao && (
              <Segmented<'lista' | 'grade'>
                options={[
                  { value: 'grade', label: <LayoutGrid className="size-4" />, ariaLabel: 'Grade' },
                  { value: 'lista', label: <List className="size-4" />, ariaLabel: 'Lista' },
                ]}
                value={vista}
                onChange={setVista}
              />
            )}
            <Button>
              <SlidersHorizontal className="size-4" /> Filtros
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={vista}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: ease.out }}
          >
            {vista === 'grade' && config.cartao ? (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3.5">
                <AnimatePresence mode="popLayout">
                  {linhas.map((r, i) => (
                    <motion.div
                      key={config.chave(r)}
                      layout
                      initial={{ opacity: 0, scale: 0.94, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0, transition: { ...spring.soft, delay: Math.min(i, 10) * 0.035 } }}
                      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
                      whileHover={{ y: -4 }}
                    >
                      {config.cartao!(r)}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[860px]">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-subtle">
                      {config.colunas.map((c) => (
                        <th key={c.header} className={cn('font-medium px-4 py-3', c.align === 'right' && 'text-right')}>
                          {c.header}
                        </th>
                      ))}
                      {config.link && <th className="w-10" />}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={true}>
                      {linhas.map((r, i) => (
                        <motion.tr
                          key={config.chave(r)}
                          layout="position"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: ease.out, delay: Math.min(i, 12) * 0.03 } }}
                          exit={{ opacity: 0, transition: { duration: 0.12 } }}
                          onClick={() => config.link && nav(config.link(r))}
                          className={cn('group border-t border-line transition-colors', config.link && 'cursor-pointer hover:bg-[var(--chip)]')}
                        >
                          {config.colunas.map((c) => (
                            <td key={c.header} className={cn('px-4 py-3', c.align === 'right' && 'text-right', c.className)}>
                              {c.render(r)}
                            </td>
                          ))}
                          {config.link && (
                            <td className="pr-4">
                              <ChevronRight className="size-4 text-subtle transition-transform group-hover:translate-x-1" />
                            </td>
                          )}
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
            {linhas.length === 0 && (
              <div className="py-16 text-center">
                <div className="text-sm font-medium">Nada encontrado</div>
                <div className="text-xs text-muted mt-1">Ajuste a busca ou o filtro.</div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between px-4 py-3 border-t border-line text-xs text-muted">
          <span>
            Mostrando <span className="text-fg font-semibold">{linhas.length}</span> de {config.linhas.length}
          </span>
          <div className="flex gap-1">
            {[1, 2, 3].map((p) => (
              <button key={p} className={cn('size-8 rounded-lg text-xs font-semibold', p === 1 ? 'accent-gradient' : 'chip hover:bg-[var(--chip-hover)]')}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>
    </>
  );
}
