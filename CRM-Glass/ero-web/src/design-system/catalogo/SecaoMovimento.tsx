import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Clapperboard, Moon, Play, Sun } from 'lucide-react';
import { Bloco, TrocaDeArea, Tela } from '../../motion/coreografia';
import { ehCena } from '../../motion/cena/cenas';
import { useAparencia } from '../../shared/aparencia/AparenciaProvider';
import { FUNDOS, type Fundo } from '../../shared/aparencia/mapear';
import { cn } from '../../shared/util/utils';
import { Badge, Button, CardHeader, GlassCard, Segmented } from '../ui';

const ROTULO_FUNDO: Record<Fundo, string> = {
  orbs: 'Orbs',
  aurora: 'Aurora',
  ondas: 'Ondas',
  minimo: 'Mínimo',
  escritorio: 'Escritório',
  cidade: 'Cidade',
  marina: 'Marina',
  expediente: 'Expediente',
  coworking: 'Coworking',
};

/**
 * Seção "Movimento" do catálogo: (a) troca de tema em vídeo com cena (luzes acendendo aos poucos),
 * (b) troca de fundo com esmaecimento cruzado, (c) montagem e desmontagem em blocos aqui mesmo
 * e na demonstração entre rotas (login → Início → lista → ficha, troca de contratante).
 */
export function SecaoMovimento() {
  const nav = useNavigate();
  const { alvo, settings, set, trocandoTema } = useAparencia();
  const [palco, setPalco] = useState<'cartoes' | 'formulario'>('cartoes');
  const comCena = ehCena(alvo.fundo);

  return (
    <GlassCard className="col-span-12">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Clapperboard className="size-4" aria-hidden /> Movimento
          </span>
        }
        subtitle="Troca de tema em vídeo · fundo com esmaecimento cruzado · telas que se montam e desmontam em blocos"
        action={
          trocandoTema ? (
            <Badge tone="accent" dot>
              Trocando o tema…
            </Badge>
          ) : (
            <Badge dot>{settings.theme === 'dark' ? 'Escuro' : 'Claro'}</Badge>
          )
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div>
            <p className="text-xs font-medium text-muted mb-2">Fundo (prévia na interface inteira)</p>
            <div className="flex flex-wrap gap-2">
              {FUNDOS.map((f) => (
                <Button key={f} size="sm" variant={alvo.fundo === f ? 'primary' : 'glass'} onClick={() => set({ fundo: f })}>
                  {ROTULO_FUNDO[f]}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted mb-2">
              Tema {comCena ? '— com cena: a luz muda primeiro e a interface troca no meio da sequência' : '— fundo vivo: revelação circular a partir do clique'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented
                options={[
                  { value: 'dark', label: 'Escuro' },
                  { value: 'light', label: 'Claro' },
                ]}
                value={alvo.theme}
                onChange={(v) => set({ theme: v })}
              />
              <Button onClick={() => set({ theme: alvo.theme === 'dark' ? 'light' : 'dark' })}>
                {alvo.theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                Trocar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => set({ fundo: 'escritorio', theme: alvo.theme === 'dark' ? 'light' : 'dark' })}>
                Escritório + trocar (luminárias)
              </Button>
              <Button variant="ghost" size="sm" onClick={() => set({ fundo: 'cidade', theme: alvo.theme === 'dark' ? 'light' : 'dark' })}>
                Cidade + trocar (janelas)
              </Button>
            </div>
            <p className="text-[11px] text-subtle mt-2">
              Com cena, <code className="kbd">__cena.quadro(0.35)</code> no console desenha um ponto da sequência. Movimento reduzido: só esmaece.
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted mb-2">Montagem entre rotas, com a forma do app real</p>
            <Button variant="primary" onClick={() => nav('/design-system/movimento/login')}>
              <Play className="size-4" /> Login → Início em blocos
            </Button>
            <p className="text-[11px] text-subtle mt-2">
              Login se desmonta, a casca monta (menu → barra → blocos), lista → ficha desliza, e “Entrar em…” troca de contratante
              (coreografia contexto, com tema e fundo diferentes).
            </p>
          </div>
        </div>

        {/* Palco: duas telas trocando dentro do cartão (TrocaDeArea + Tela), sem vidro aninhado. */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs font-medium text-muted">Montar e desmontar aqui</p>
            <Segmented
              size="sm"
              options={[
                { value: 'cartoes', label: 'Painel' },
                { value: 'formulario', label: 'Formulário' },
              ]}
              value={palco}
              onChange={setPalco}
            />
          </div>
          <div className="glass-flat p-4 min-h-[260px] overflow-hidden">
            <TrocaDeArea chave={palco}>
              {palco === 'cartoes' ? (
                <Tela coreografia="inicio" className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 9 }, (_, i) => (
                    <Bloco key={i} className={cn('rounded-2xl p-3 h-[68px] chip', i === 0 && 'col-span-2')}>
                      <span className="block h-2 w-1/2 rounded-full bg-[var(--line)]" />
                      <span className="block h-4 w-2/3 rounded-full accent-gradient mt-3 opacity-80" />
                    </Bloco>
                  ))}
                </Tela>
              ) : (
                <Tela coreografia="formulario" className="space-y-3">
                  {['Nome', 'E-mail', 'Papel', 'Senha temporária'].map((r) => (
                    <Bloco key={r}>
                      <span className="block text-xs text-muted mb-1.5">{r}</span>
                      <span className="block h-10 rounded-[14px] chip" />
                    </Bloco>
                  ))}
                  <Bloco className="flex justify-end gap-2 pt-1">
                    <span className="h-9 w-24 rounded-[14px] chip" />
                    <span className="h-9 w-24 rounded-[14px] accent-gradient" />
                  </Bloco>
                </Tela>
              )}
            </TrocaDeArea>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
