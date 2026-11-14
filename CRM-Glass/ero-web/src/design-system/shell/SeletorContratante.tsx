import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import { AnimatePresence, motion } from 'motion/react';
import { Building2, Check, LogOut, Search } from 'lucide-react';
import { spring } from '../../motion/tokens';
import { cn, norm } from '../../shared/util/utils';
import { Skeleton } from '../ui/Skeleton';
import { ChipContratante } from './Topbar';

/** Um contratante que o superadmin pode acessar (`GET /api/tenants/selecao`, `SelectDto`). */
export type OpcaoContratante = { id: string; nome: string; detalhe?: string };

export type SeletorContratanteProps = {
  /** contratantes ativos que dá para acessar; a Casca busca ao abrir (`onAbertoChange`) */
  opcoes: OpcaoContratante[];
  /** a lista ainda está chegando */
  carregando?: boolean;
  /** a busca falhou: mostra a mensagem no lugar da lista */
  erro?: string;
  /** o contratante em que o superadmin está agora; `null`/ausente = na plataforma (sem "Voltar à plataforma") */
  atual?: { id: string; nome: string } | null;
  /** escolheu um contratante (a Casca chama `acessarContratante(id)`) */
  onEscolher: (id: string) => void;
  /** "Voltar à plataforma" (a Casca chama `sairDoContratante()`) */
  onSair: () => void;
  /**
   * Aberto controlado de fora (ex.: o comando "Acessar contratante…" do Ctrl+K abre o seletor direto). Ausente, o
   * seletor guarda o próprio estado (o chip abre e fecha). Controlado, quem passa `aberto` atualiza no `onAbertoChange`.
   */
  aberto?: boolean;
  /** abriu ou fechou (chip, Esc, clique fora, escolha): a Casca liga a consulta da lista só com o seletor aberto */
  onAbertoChange?: (aberto: boolean) => void;
  /** entrando ou saindo (requisição em andamento): os itens ficam travados */
  ocupado?: boolean;
  /** o que o chip mostra (padrão: o nome do `atual`, senão "Plataforma") e a segunda linha ("Superadmin") */
  nome?: string;
  detalhe?: string;
};

/** Filtro da busca (função pura): sem acento e sem caixa, no nome e no detalhe. */
export function filtrarContratantes(opcoes: OpcaoContratante[], busca: string): OpcaoContratante[] {
  const q = norm(busca.trim());
  if (!q) return opcoes;
  return opcoes.filter((o) => norm(`${o.nome} ${o.detalhe ?? ''}`).includes(q));
}

/**
 * O chip do contratante, para o superadmin, abre este seletor (popover `glass-solid` em portal): busca, a lista de
 * contratantes ativos e, quando ele está dentro de um, "Voltar à plataforma". Não busca dados: a Casca passa as
 * `opcoes` e faz a troca (`onEscolher`/`onSair`).
 *
 * Teclado (padrão combobox da WAI-ARIA, com a lista sempre visível): o foco vai para a busca ao abrir, ↑/↓ andam
 * pela lista, Enter acessa, Esc fecha e devolve o foco ao chip. O contratante atual aparece marcado e não se escolhe.
 *
 * Não controlado (padrão) ou controlado por `aberto`/`onAbertoChange` — a Casca controla para o comando
 * "Acessar contratante…" da busca (Ctrl+K) abrir este mesmo seletor, ancorado no chip.
 */
export function SeletorContratante({
  opcoes,
  carregando,
  erro,
  atual,
  onEscolher,
  onSair,
  aberto: abertoDeFora,
  onAbertoChange,
  ocupado,
  nome,
  detalhe,
}: SeletorContratanteProps) {
  const base = useId();
  const listaId = `${base}-lista`;
  const [abertoInterno, setAbertoInterno] = useState(false);
  const controlado = abertoDeFora !== undefined;
  const aberto = controlado ? abertoDeFora : abertoInterno;
  const [busca, setBusca] = useState('');
  const [ativo, setAtivo] = useState(0);
  const buscaRef = useRef<HTMLInputElement>(null);

  // Toda abertura começa com a busca vazia e a 1ª opção ativa, venha ela do chip ou de fora (`aberto`). Ajuste de
  // estado durante a renderização (padrão do React para "derivar do valor anterior"), sem um quadro com a busca velha.
  const [abertoAntes, setAbertoAntes] = useState(aberto);
  if (aberto !== abertoAntes) {
    setAbertoAntes(aberto);
    if (aberto) {
      setBusca('');
      setAtivo(0);
    }
  }

  const filtradas = useMemo(() => filtrarContratantes(opcoes, busca), [opcoes, busca]);
  const escolhiveis = filtradas.filter((o) => o.id !== atual?.id);

  const mudarAberto = (v: boolean) => {
    if (!controlado) setAbertoInterno(v);
    onAbertoChange?.(v);
  };

  // A opção ativa (setas) fica sempre visível na lista rolável.
  const ativoId = aberto && escolhiveis[ativo] ? `${base}-op-${escolhiveis[ativo].id}` : undefined;
  useEffect(() => {
    if (ativoId) document.getElementById(ativoId)?.scrollIntoView({ block: 'nearest' });
  }, [ativoId]);

  const escolher = (o: OpcaoContratante | undefined) => {
    if (!o || ocupado || o.id === atual?.id) return;
    mudarAberto(false);
    onEscolher(o.id);
  };

  const tecla = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAtivo((i) => Math.min(escolhiveis.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAtivo((i) => Math.max(0, i - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setAtivo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setAtivo(escolhiveis.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      escolher(escolhiveis[ativo]);
    }
  };

  const nomeDoChip = nome ?? atual?.nome ?? 'Plataforma';

  return (
    <RadixPopover.Root open={aberto} onOpenChange={mudarAberto}>
      <RadixPopover.Trigger asChild>
        {/* O Radix põe aria-haspopup, aria-expanded e aria-controls no chip (que vira botão com o onClick). */}
        <ChipContratante nome={nomeDoChip} detalhe={detalhe} onClick={() => undefined} />
      </RadixPopover.Trigger>
      <AnimatePresence>
        {aberto && (
          <RadixPopover.Portal forceMount>
            <RadixPopover.Content
              forceMount
              asChild
              align="start"
              sideOffset={10}
              collisionPadding={12}
              aria-label="Acessar contratante"
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                buscaRef.current?.focus();
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={spring.snappy}
                style={{ transformOrigin: 'var(--radix-popover-content-transform-origin)' }}
                className="glass-solid z-popover !rounded-2xl p-1.5 w-[min(340px,calc(100vw-24px))]"
              >
                <div className="px-2.5 pt-2 pb-2">
                  <div className="text-sm font-semibold">Acessar contratante</div>
                  <div className="text-[11px] text-subtle">Você entra como suporte da plataforma.</div>
                </div>
                <div className="relative px-1 pb-1.5">
                  <Search aria-hidden className="absolute left-4 top-[22px] -translate-y-1/2 size-4 text-subtle pointer-events-none" />
                  <input
                    ref={buscaRef}
                    role="combobox"
                    aria-expanded
                    aria-controls={listaId}
                    aria-autocomplete="list"
                    aria-activedescendant={ativoId}
                    aria-label="Buscar contratante"
                    autoComplete="off"
                    placeholder="Buscar contratante…"
                    value={busca}
                    onChange={(e) => {
                      setBusca(e.target.value);
                      setAtivo(0);
                    }}
                    onKeyDown={tecla}
                    className="input pl-10"
                  />
                </div>

                <ul id={listaId} role="listbox" aria-label="Contratantes" aria-busy={carregando || undefined} className="max-h-72 overflow-y-auto">
                  {carregando && opcoes.length === 0 ? (
                    [0, 1, 2].map((i) => (
                      <li key={i} role="presentation" className="flex items-center gap-3 px-2.5 py-2">
                        <Skeleton className="size-8 rounded-lg" />
                        <Skeleton className="h-3 w-40" />
                      </li>
                    ))
                  ) : erro ? (
                    <li role="presentation" className="px-3 py-6 text-center text-sm text-danger">
                      {erro}
                    </li>
                  ) : filtradas.length === 0 ? (
                    <li role="presentation" className="px-3 py-6 text-center text-sm text-muted">
                      Nenhum contratante encontrado
                    </li>
                  ) : (
                    filtradas.map((o) => {
                      const ehAtual = o.id === atual?.id;
                      const indice = escolhiveis.indexOf(o);
                      return (
                        <li
                          key={o.id}
                          id={`${base}-op-${o.id}`}
                          role="option"
                          aria-selected={ehAtual}
                          aria-disabled={ehAtual || ocupado || undefined}
                          onPointerMove={() => indice >= 0 && setAtivo(indice)}
                          onPointerDown={(e) => e.preventDefault()}
                          onClick={() => escolher(o)}
                          className={cn(
                            'flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm',
                            ehAtual ? 'cursor-default' : 'cursor-pointer',
                            indice >= 0 && indice === ativo ? 'bg-[var(--chip-hover)] text-fg' : 'text-muted',
                            ocupado && !ehAtual && 'opacity-60',
                          )}
                        >
                          <span aria-hidden className="size-8 rounded-lg chip grid place-items-center shrink-0">
                            <Building2 className="size-4" />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className={cn('block truncate', ehAtual && 'font-semibold text-fg')}>{o.nome}</span>
                            {(o.detalhe || ehAtual) && (
                              <span className="block text-[11px] text-subtle truncate">{ehAtual ? 'Você está aqui' : o.detalhe}</span>
                            )}
                          </span>
                          {ehAtual && <Check aria-hidden className="size-4 text-accent-text shrink-0" />}
                        </li>
                      );
                    })
                  )}
                </ul>

                {atual && (
                  <div className="mt-1.5 border-t border-line pt-1.5">
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => {
                        mudarAberto(false);
                        onSair();
                      }}
                      className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm text-left transicao-cor hover:bg-[var(--chip)] focus-visible:bg-[var(--chip)] focus-visible:outline-offset-[-2px] disabled:opacity-60"
                    >
                      <span aria-hidden className="size-8 rounded-lg chip grid place-items-center shrink-0">
                        <LogOut className="size-4" />
                      </span>
                      <span className="font-medium">Voltar à plataforma</span>
                    </button>
                  </div>
                )}
              </motion.div>
            </RadixPopover.Content>
          </RadixPopover.Portal>
        )}
      </AnimatePresence>
    </RadixPopover.Root>
  );
}
