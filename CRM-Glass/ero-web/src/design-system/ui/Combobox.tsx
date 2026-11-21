import { useEffect, useId, useMemo, useRef, useState, type ComponentType, type KeyboardEvent } from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { spring } from '../../motion/tokens';
import { cn, norm } from '../../shared/util/utils';

export type OpcaoCombobox = { valor: string; rotulo: string; detalhe?: string };

export type ComboboxProps = {
  opcoes: OpcaoCombobox[];
  /** valor selecionado (`null` = nenhum) */
  valor: string | null;
  onChange: (valor: string | null) => void;
  /** nome acessível quando não há rótulo ligado por id (CampoForm liga sozinho) */
  rotulo?: string;
  placeholder?: string;
  carregando?: boolean;
  textoVazio?: string;
  /** mostra o X para limpar */
  limpavel?: boolean;
  /** texto digitado (para busca no servidor); a filtragem local continua valendo */
  onBuscaChange?: (texto: string) => void;
  /** a lista abriu ou fechou (o TDBCombo busca as opções no servidor ao abrir) */
  onAbertoChange?: (aberto: boolean) => void;
  icone?: ComponentType<{ className?: string }>;
  invalido?: boolean;
  desabilitado?: boolean;
  /** só leitura: continua focável (leitor de tela lê o valor), mas não abre a lista nem limpa */
  somenteLeitura?: boolean;
  /** foca o campo ao montar, sem abrir a lista (o primeiro campo do formulário) */
  autoFocus?: boolean;
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
  className?: string;
};

/**
 * Campo com lista filtrável (padrão combobox da WAI-ARIA): digita para filtrar,
 * setas para escolher, Enter seleciona, Esc fecha. Lista em vidro sólido, em portal (Radix Popover).
 */
export function Combobox({
  opcoes,
  valor,
  onChange,
  rotulo,
  placeholder = 'Selecione…',
  carregando,
  textoVazio = 'Nada encontrado',
  limpavel = true,
  onBuscaChange,
  onAbertoChange,
  icone: Icone,
  invalido,
  desabilitado,
  somenteLeitura,
  autoFocus,
  id,
  className,
  ...aria
}: ComboboxProps) {
  const base = useId();
  const listaId = `${base}-lista`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [ativo, setAtivo] = useState(0);
  const selecionada = opcoes.find((o) => o.valor === valor) ?? null;
  const ruim = invalido || aria['aria-invalid'] === true || aria['aria-invalid'] === 'true';

  const filtradas = useMemo(() => {
    const q = norm(busca.trim());
    if (!q) return opcoes;
    return opcoes.filter((o) => norm(`${o.rotulo} ${o.detalhe ?? ''}`).includes(q));
  }, [opcoes, busca]);

  // Avisa quem chamou só quando muda (não na montagem).
  const avisarAberto = useRef(onAbertoChange);
  avisarAberto.current = onAbertoChange;
  const abertoAntes = useRef(aberto);
  useEffect(() => {
    if (abertoAntes.current === aberto) return;
    abertoAntes.current = aberto;
    avisarAberto.current?.(aberto);
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const i = filtradas.findIndex((o) => o.valor === valor);
    setAtivo(i >= 0 ? i : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  const abrir = () => {
    if (desabilitado || somenteLeitura) return;
    setBusca('');
    setAberto(true);
  };
  const escolher = (o: OpcaoCombobox | undefined) => {
    if (!o) return;
    onChange(o.valor);
    setAberto(false);
    setBusca('');
  };

  const tecla = (e: KeyboardEvent<HTMLInputElement>) => {
    if (somenteLeitura) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!aberto) return abrir();
      setAtivo((i) => Math.min(filtradas.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAtivo((i) => Math.max(0, i - 1));
    } else if (e.key === 'Home' && aberto) {
      e.preventDefault();
      setAtivo(0);
    } else if (e.key === 'End' && aberto) {
      e.preventDefault();
      setAtivo(filtradas.length - 1);
    } else if (e.key === 'Enter') {
      if (aberto) {
        e.preventDefault();
        escolher(filtradas[ativo]);
      }
    } else if (e.key === 'Escape') {
      if (aberto) {
        e.preventDefault();
        setAberto(false);
        setBusca('');
      }
    } else if (e.key === 'Tab') {
      setAberto(false);
    }
  };

  const ativoId = aberto && filtradas[ativo] ? `${base}-op-${ativo}` : undefined;
  // O padding direito reserva só os botões que aparecem (32 px cada, a 6 px da borda): é o que deixa a sigla caber a 80 px.
  const mostraLimpar = limpavel && !!selecionada && !desabilitado && !somenteLeitura;
  const mostraAbrir = !somenteLeitura;

  // A opção ativa (setas) fica sempre visível na lista rolável.
  useEffect(() => {
    if (ativoId) document.getElementById(ativoId)?.scrollIntoView({ block: 'nearest' });
  }, [ativoId]);

  return (
    <RadixPopover.Root open={aberto} onOpenChange={(v) => (v ? abrir() : setAberto(false))}>
      <RadixPopover.Anchor asChild>
        <div className={cn('relative', className)}>
          {Icone && <Icone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-subtle pointer-events-none" />}
          <input
            ref={inputRef}
            id={id}
            role="combobox"
            aria-expanded={aberto}
            aria-controls={aberto ? listaId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={ativoId}
            aria-label={rotulo}
            aria-describedby={aria['aria-describedby']}
            aria-invalid={ruim || undefined}
            aria-readonly={somenteLeitura || undefined}
            readOnly={somenteLeitura}
            disabled={desabilitado}
            autoFocus={autoFocus}
            autoComplete="off"
            placeholder={selecionada ? selecionada.rotulo : placeholder}
            value={aberto ? busca : (selecionada?.rotulo ?? '')}
            onChange={(e) => {
              if (somenteLeitura) return;
              if (!aberto) setAberto(true);
              setBusca(e.target.value);
              setAtivo(0);
              onBuscaChange?.(e.target.value);
            }}
            onClick={() => (aberto ? undefined : abrir())}
            onKeyDown={tecla}
            className={cn('input', Icone && 'pl-10', mostraLimpar && mostraAbrir ? 'pr-[72px]' : (mostraLimpar || mostraAbrir) && 'pr-10')}
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {carregando && <Loader2 aria-hidden className="size-4 text-subtle motion-safe:animate-spin mr-1" />}
            {mostraLimpar && (
              <button
                type="button"
                aria-label="Limpar seleção"
                onClick={() => {
                  onChange(null);
                  inputRef.current?.focus();
                }}
                className="size-8 rounded-[10px] grid place-items-center text-subtle hover:text-fg hover:bg-[var(--chip)] transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
            {mostraAbrir && (
            <button
              type="button"
              tabIndex={-1}
              aria-hidden
              disabled={desabilitado}
              onClick={() => {
                if (aberto) setAberto(false);
                else abrir();
                inputRef.current?.focus();
              }}
              className="size-8 rounded-[10px] grid place-items-center text-subtle hover:text-fg transition-colors"
            >
              <ChevronsUpDown className="size-4" />
            </button>
            )}
          </div>
        </div>
      </RadixPopover.Anchor>
      <AnimatePresence>
        {aberto && (
          <RadixPopover.Portal forceMount>
            <RadixPopover.Content
              forceMount
              asChild
              align="start"
              sideOffset={8}
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
              onInteractOutside={(e) => {
                if (e.target instanceof Node && inputRef.current?.parentElement?.contains(e.target)) e.preventDefault();
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={spring.snappy}
                className="glass-flutuante z-popover !rounded-2xl p-1.5 w-[var(--radix-popover-trigger-width)] min-w-[220px]"
                style={{ transformOrigin: 'var(--radix-popover-content-transform-origin)' }}
              >
                <ul id={listaId} role="listbox" aria-label={rotulo} className="max-h-64 overflow-y-auto">
                  {filtradas.length === 0 && (
                    <li role="presentation" className="px-3 py-6 text-center text-sm text-muted">
                      {carregando ? 'Carregando…' : textoVazio}
                    </li>
                  )}
                  {filtradas.map((o, i) => {
                    const sel = o.valor === valor;
                    return (
                      <li
                        key={o.valor}
                        id={`${base}-op-${i}`}
                        role="option"
                        aria-selected={sel}
                        onPointerMove={() => setAtivo(i)}
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={() => escolher(o)}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm cursor-pointer',
                          i === ativo ? 'bg-[var(--chip-hover)] text-fg' : 'text-muted',
                        )}
                      >
                        <span className="flex-1 min-w-0">
                          <span className={cn('block truncate', sel && 'font-semibold text-fg')}>{o.rotulo}</span>
                          {o.detalhe && <span className="block text-[11px] text-subtle truncate">{o.detalhe}</span>}
                        </span>
                        {sel && <Check aria-hidden className="size-4 text-accent-text shrink-0" />}
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            </RadixPopover.Content>
          </RadixPopover.Portal>
        )}
      </AnimatePresence>
    </RadixPopover.Root>
  );
}
