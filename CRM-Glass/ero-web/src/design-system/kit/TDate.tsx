import { useEffect, useRef, useState, type KeyboardEvent, type Ref } from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, X } from 'lucide-react';
import { useController } from 'react-hook-form';
import { spring } from '../../motion/tokens';
import { brParaIso, isoParaBr, mascararData } from '../../shared/util/datas';
import { cn } from '../../shared/util/utils';
import { Calendario } from '../ui/Calendario';
import { CampoDoKit, useLigadoAoForm, type PropsDeCampo } from './campo';
import { LARGURA_PADRAO } from './larguras';
import { useSomenteLeituraDoForm } from './somenteLeitura';

export type TDateProps = PropsDeCampo & {
  /** `AAAA-MM-DD`, ou `''` sem data (controlado, fora de `TForm`) */
  value?: string;
  /** recebe `AAAA-MM-DD` quando a data digitada fica completa e existe, ou `''` quando o campo é esvaziado */
  onChange?: (valor: string) => void;
  onBlur?: () => void;
  /** primeiro e último dia que o calendário deixa escolher (`AAAA-MM-DD`): o "Até" passa `min={de}` */
  min?: string;
  max?: string;
  placeholder?: string;
  autoFocus?: boolean;
};

/**
 * Data do kit (docs/07 §3.2): grava `AAAA-MM-DD` (dia do calendário, não instante), exibe `DD/MM/AAAA`.
 *
 * Digita-se direto (máscara `DD/MM/AAAA`, teclado numérico) ou escolhe-se no calendário pt-BR, num popover
 * `glass-flutuante` em portal (botão do calendário, ou Alt+↓ no campo). Data digitada que não existe (31/02) volta ao
 * valor anterior ao sair do campo. O X limpa. Só leitura: `readOnly`, sem calendário nem X. Largura padrão `data`.
 *
 * Valor inicial de "hoje": `hojeIso()` (de `shared/util/format`), nunca `toISOString()`.
 */
export function TDate(props: TDateProps) {
  const ligado = useLigadoAoForm(props.name, props.onChange !== undefined || props.value !== undefined);
  if (ligado) return <TDateLigado {...props} name={props.name!} />;
  return <TDateBase {...props} />;
}

function TDateLigado(props: TDateProps & { name: string }) {
  const { field, fieldState } = useController({ name: props.name });
  return (
    <TDateBase
      {...props}
      value={(field.value as string | null | undefined) ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      refInput={field.ref}
      error={props.error ?? fieldState.error?.message}
    />
  );
}

const BOTAO = 'size-7 rounded-[9px] grid place-items-center text-subtle hover:text-fg hover:bg-[var(--chip-hover)] transicao-cor';

function TDateBase({
  label,
  value = '',
  onChange,
  onBlur,
  min,
  max,
  width,
  ajuda,
  error,
  rotuloOculto,
  required,
  disabled,
  id,
  placeholder = 'dd/mm/aaaa',
  autoFocus,
  refInput,
}: TDateProps & { refInput?: Ref<HTMLInputElement> }) {
  const somenteLeitura = useSomenteLeituraDoForm();
  const travado = somenteLeitura || !!disabled;
  const [texto, setTexto] = useState(() => isoParaBr(value));
  const [aberto, setAberto] = useState(false);
  const input = useRef<HTMLInputElement | null>(null);
  /** o último valor que este campo mandou: o que vier diferente disso veio de fora (form.reset, Limpar dos filtros) */
  const emitido = useRef(value);
  const escolheuNoCalendario = useRef(false);

  useEffect(() => {
    if (value === emitido.current) return;
    emitido.current = value;
    setTexto(isoParaBr(value));
  }, [value]);

  const emitir = (iso: string) => {
    emitido.current = iso;
    onChange?.(iso);
  };

  const ligarRef = (el: HTMLInputElement | null) => {
    input.current = el;
    if (typeof refInput === 'function') refInput(el);
    else if (refInput) (refInput as { current: HTMLInputElement | null }).current = el;
  };

  const escolher = (iso: string) => {
    setTexto(isoParaBr(iso));
    emitir(iso);
    escolheuNoCalendario.current = true;
    setAberto(false);
  };
  const limpar = () => {
    setTexto('');
    emitir('');
    escolheuNoCalendario.current = true;
    setAberto(false);
  };

  const tecla = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!travado && e.altKey && e.key === 'ArrowDown') {
      e.preventDefault();
      setAberto(true);
    }
  };

  return (
    <CampoDoKit
      kit="TDate"
      padrao={LARGURA_PADRAO.TDate}
      label={label}
      width={width}
      ajuda={ajuda}
      error={error}
      rotuloOculto={rotuloOculto}
      required={required}
      id={id}
      semReserva={travado}
    >
      {(ids) => (
        <RadixPopover.Root open={aberto} onOpenChange={(v) => setAberto(v && !travado)}>
          <RadixPopover.Anchor asChild>
            <div className="relative">
              <input
                {...ids}
                ref={ligarRef}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                maxLength={10}
                placeholder={travado ? undefined : placeholder}
                autoFocus={autoFocus}
                value={texto}
                disabled={!!disabled}
                readOnly={somenteLeitura}
                aria-readonly={somenteLeitura || undefined}
                aria-required={(required && !somenteLeitura) || undefined}
                aria-invalid={error ? true : undefined}
                onChange={(e) => {
                  if (somenteLeitura) return;
                  const m = mascararData(e.target.value);
                  setTexto(m);
                  if (m === '') emitir('');
                  else {
                    const iso = brParaIso(m);
                    if (iso) emitir(iso);
                  }
                }}
                onBlur={() => {
                  // Data incompleta ou que não existe volta para o valor que o formulário tem.
                  if (texto && !brParaIso(texto)) setTexto(isoParaBr(value));
                  onBlur?.();
                }}
                onKeyDown={tecla}
                className={cn('input tabular-nums', !travado && (value ? 'pr-[66px]' : 'pr-10'))}
              />
              {!travado && (
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  {value && (
                    <button type="button" aria-label={`Limpar ${label}`} onClick={limpar} className={BOTAO}>
                      <X aria-hidden className="size-4" />
                    </button>
                  )}
                  <RadixPopover.Trigger aria-label={`Abrir calendário de ${label}`} className={BOTAO}>
                    <CalendarDays aria-hidden className="size-4" />
                  </RadixPopover.Trigger>
                </div>
              )}
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
                  collisionPadding={12}
                  aria-label={`Calendário de ${label}`}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  onCloseAutoFocus={(e) => {
                    // Escolheu uma data: o foco volta ao campo (não ao botão do calendário), para seguir digitando.
                    if (!escolheuNoCalendario.current) return;
                    escolheuNoCalendario.current = false;
                    e.preventDefault();
                    input.current?.focus();
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={spring.snappy}
                    className="glass-flutuante z-popover !rounded-2xl p-2"
                    style={{ transformOrigin: 'var(--radix-popover-content-transform-origin)' }}
                  >
                    <Calendario valor={value || null} onEscolher={escolher} onLimpar={value ? limpar : undefined} min={min} max={max} autoFoco />
                  </motion.div>
                </RadixPopover.Content>
              </RadixPopover.Portal>
            )}
          </AnimatePresence>
        </RadixPopover.Root>
      )}
    </CampoDoKit>
  );
}
