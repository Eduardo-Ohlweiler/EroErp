import { useId, useMemo, useRef, type KeyboardEvent, type Ref } from 'react';
import { useController } from 'react-hook-form';
import { motion } from 'motion/react';
import { Pipette } from 'lucide-react';
import { spring } from '../../motion/tokens';
import { useReduzirMovimento } from '../../motion/reduzir';
import { cn } from '../../shared/util/utils';
import { CampoDoKit, useLigadoAoForm, type PropsDeCampo } from './campo';
import { CLASSE_DA_BOLINHA, estiloDaCor, indiceDaSugerida, lerCoresSugeridas, normalizarCor } from './cores';
import { LARGURA_PADRAO } from './larguras';
import { useSomenteLeituraDoForm } from './somenteLeitura';

export type TCorProps = PropsDeCampo & {
  /** `#RRGGBB`, ou `''` sem cor (controlado, fora de `TForm`) */
  value?: string;
  /** recebe sempre `#RRGGBB` em maiúsculas */
  onChange?: (cor: string) => void;
  onBlur?: () => void;
};

/**
 * Cor de identificação de um registro (docs/07 §3.2): as 8 sugeridas (tokens `--cor-registro-N`, cada uma com o nome)
 * e "Outra", pelo seletor de cor do sistema. Grava `#RRGGBB` em maiúsculas; a cor gravada que não é sugerida aparece
 * como "Outra (#A1B2C3)".
 *
 * Um `role="radiogroup"` com o rótulo do campo e nove `role="radio"`: setas, Home e End andam (e escolhem a sugerida;
 * em "Outra" só focam: Enter ou Espaço abrem o seletor). Só leitura (`TForm somenteLeitura`): continua focável, a
 * escolhida marcada, sem clique nem setas, `aria-readonly`. Largura: o conteúdo (`data-largura="conteudo"`). Não
 * reserva a linha do erro, como o `TRadio`.
 *
 * A cor vinda do banco só entra pela variável `--cor-do-registro`, conferida antes; o anel `--line-strong` vem sempre.
 */
export function TCor(props: TCorProps) {
  const ligado = useLigadoAoForm(props.name, props.onChange !== undefined || props.value !== undefined);
  if (ligado) return <TCorLigado {...props} name={props.name!} />;
  return <TCorBase {...props} />;
}

function TCorLigado(props: TCorProps & { name: string }) {
  const { field, fieldState } = useController({ name: props.name });
  return (
    <TCorBase
      {...props}
      value={(field.value as string | null | undefined) ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      refFoco={field.ref}
      error={props.error ?? fieldState.error?.message}
    />
  );
}

const PROXIMA: Record<string, (i: number, n: number) => number> = {
  ArrowRight: (i, n) => (i + 1) % n,
  ArrowDown: (i, n) => (i + 1) % n,
  ArrowLeft: (i, n) => (i - 1 + n) % n,
  ArrowUp: (i, n) => (i - 1 + n) % n,
  Home: () => 0,
  End: (_i, n) => n - 1,
};

/** Classe do botão de cada opção (bolinha em cima, nome embaixo). */
const CLASSE_DA_OPCAO =
  'group flex min-w-14 flex-col items-center gap-1 rounded-2xl px-1.5 pt-1 pb-1.5 text-xs disabled:cursor-not-allowed';

function TCorBase({
  label,
  value = '',
  onChange,
  onBlur,
  width,
  ajuda,
  error,
  rotuloOculto,
  required,
  disabled,
  id,
  refFoco,
}: TCorProps & { refFoco?: Ref<HTMLButtonElement> }) {
  const anel = useId();
  const somenteLeitura = useSomenteLeituraDoForm();
  const reduzir = useReduzirMovimento();
  const seletor = useRef<HTMLInputElement>(null);
  // Os tokens são os mesmos nos dois temas: lê uma vez por montagem.
  const sugeridas = useMemo(() => lerCoresSugeridas(), []);

  const cor = normalizarCor(value);
  const indice = indiceDaSugerida(cor, sugeridas);
  const outra = !!cor && indice < 0;
  const total = sugeridas.length + 1; // as sugeridas e "Outra"
  const marcada = outra ? sugeridas.length : indice; // -1: nenhuma
  const travado = !!disabled;
  const podeEscolher = !travado && !somenteLeitura;

  const escolher = (i: number) => {
    if (!podeEscolher) return;
    const hex = sugeridas[i].hex ?? lerCoresSugeridas()[i].hex;
    if (hex) onChange?.(hex);
  };
  const abrirSeletor = () => {
    if (!podeEscolher) return;
    const s = seletor.current;
    if (!s) return;
    if (typeof s.showPicker === 'function') {
      try {
        s.showPicker();
        return;
      } catch {
        // navegador que recusa o showPicker: cai no clique
      }
    }
    s.click();
  };

  const tecla = (e: KeyboardEvent<HTMLButtonElement>, atual: number) => {
    const proxima = PROXIMA[e.key];
    if (!proxima) return;
    e.preventDefault();
    if (!podeEscolher) return;
    const i = proxima(atual, total);
    if (i < sugeridas.length) escolher(i);
    const grupo = e.currentTarget.closest('[role="radiogroup"]');
    grupo?.querySelectorAll<HTMLElement>('[role="radio"]')[i]?.focus();
  };

  // Roving tabindex: a marcada entra no Tab; sem nenhuma, a primeira.
  const tabDe = (i: number) => (i === (marcada >= 0 ? marcada : 0) ? 0 : -1);

  const anelDe = (ligado: boolean) =>
    ligado ? (
      <motion.span
        aria-hidden
        layoutId={reduzir ? undefined : `${anel}-anel`}
        transition={spring.snappy}
        className="absolute inset-0 rounded-full border-2 border-fg/70"
      />
    ) : null;

  const classeDoBotao = (on: boolean) =>
    cn(
      CLASSE_DA_OPCAO,
      on ? 'font-semibold text-fg' : 'text-muted',
      podeEscolher && 'hover:bg-[var(--chip)]',
      somenteLeitura && 'cursor-default',
    );
  const classeDoPonto =
    'size-7 border-[1.5px] transition-transform duration-[var(--mov-realce)] ease-[var(--mov-ease-out)] motion-reduce:transition-none';
  const crescer = podeEscolher ? 'group-hover:scale-110' : undefined;

  return (
    <CampoDoKit
      kit="TCor"
      padrao={LARGURA_PADRAO.TCor}
      label={label}
      width={width}
      ajuda={ajuda}
      error={error}
      rotuloOculto={rotuloOculto}
      required={required}
      id={id}
      semReserva
      grupo="radiogroup"
      ariaGrupo={{
        'aria-readonly': somenteLeitura || undefined,
        'aria-required': (required && !somenteLeitura) || undefined,
        'aria-invalid': error ? true : undefined,
      }}
    >
      {() => (
        <div className="flex flex-wrap items-start gap-1">
          {sugeridas.map((s, i) => {
            const on = i === marcada;
            return (
              <button
                key={s.token}
                ref={i === (marcada >= 0 ? marcada : 0) ? refFoco : undefined}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={tabDe(i)}
                disabled={travado}
                data-cor={s.nome}
                onClick={() => escolher(i)}
                onKeyDown={(e) => tecla(e, i)}
                onBlur={onBlur}
                className={classeDoBotao(on)}
              >
                <span className="relative grid size-9 place-items-center">
                  {anelDe(on)}
                  <span aria-hidden style={estiloDaCor(null, s.token)} className={cn(CLASSE_DA_BOLINHA, classeDoPonto, crescer)} />
                </span>
                {s.nome}
              </button>
            );
          })}
          <span className="relative">
            <button
              ref={marcada === sugeridas.length ? refFoco : undefined}
              type="button"
              role="radio"
              aria-checked={outra}
              tabIndex={tabDe(sugeridas.length)}
              disabled={travado}
              data-cor="Outra"
              onClick={abrirSeletor}
              onKeyDown={(e) => tecla(e, sugeridas.length)}
              onBlur={onBlur}
              className={classeDoBotao(outra)}
            >
              <span className="relative grid size-9 place-items-center">
                {anelDe(outra)}
                {outra ? (
                  <span aria-hidden style={estiloDaCor(cor)} className={cn(CLASSE_DA_BOLINHA, classeDoPonto, crescer)} />
                ) : (
                  <span aria-hidden className={cn('grid place-items-center rounded-full border-line-strong chip', classeDoPonto, crescer)}>
                    <Pipette className="size-3.5" />
                  </span>
                )}
              </span>
              {outra ? `Outra (${cor})` : 'Outra'}
            </button>
            {/* O seletor de cor do sistema, cru dentro do kit: fora do Tab e do leitor de tela (quem fala é o rádio
                "Outra"), por cima da bolinha para o seletor abrir ao lado dela. */}
            <input
              ref={seletor}
              type="color"
              tabIndex={-1}
              aria-hidden
              disabled={!podeEscolher}
              // sem cor, o seletor abre na 1ª sugerida
              value={(cor ?? sugeridas[0]?.hex ?? '').toLowerCase()}
              onChange={(e) => {
                const nova = normalizarCor(e.target.value);
                if (nova && podeEscolher) onChange?.(nova);
              }}
              // Invisível, mas é o controle que o medidor do docs/07 §7.1 acha: o fundo segue o de campo editável ou
              // só leitura, como o do TRadio, para a regra "só leitura com fundo de editável" valer aqui também.
              className={cn(
                'pointer-events-none absolute left-1/2 top-1 size-9 -translate-x-1/2 opacity-0',
                podeEscolher ? 'bg-[var(--input-bg)]' : 'bg-[var(--input-bg-readonly)]',
              )}
            />
          </span>
        </div>
      )}
    </CampoDoKit>
  );
}
