import { forwardRef, useId, type ChangeEvent, type InputHTMLAttributes, type Ref } from 'react';
import { motion } from 'motion/react';
import { useController } from 'react-hook-form';
import { Check } from 'lucide-react';
import { useVariantesBloco } from '../ui/bloco';
import { cn } from '../../shared/util/utils';
import { CampoDoKit, useLigadoAoForm, type PropsDeCampo } from './campo';
import { LARGURA_PADRAO, useLargura } from './larguras';
import type { OpcaoRadio } from './TRadio';
import { dicasDasOpcoes } from './opcoes';
import { useSomenteLeituraDoForm } from './somenteLeitura';

/** Uma opção do grupo de caixas: `desabilitada` não se marca; `dica` explica por quê (`title` e ajuda visível do grupo). */
export type OpcaoCheckBox = OpcaoRadio;

export type TCheckBoxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'width' | 'required' | 'disabled' | 'value' | 'size'> &
  PropsDeCampo & {
    /**
     * Sem opções, um booleano com o rótulo ao lado. Com opções, um grupo fixo que grava a lista dos valores marcados,
     * na ordem das opções (no `TForm` pelo `name`; fora dele, `valores`/`onValoresChange`).
     */
    opcoes?: OpcaoCheckBox[];
    /** no grupo: empilha em vez de alinhar */
    vertical?: boolean;
    /** grupo controlado (fora de `TForm`) */
    valores?: string[];
    onValoresChange?: (valores: string[]) => void;
  };

/**
 * Caixa de marcar do kit (docs/07 §3.2): ações extras de um grupo de permissão (`USUARIOS_LIBERAR_ACESSO`), opções
 * sim/não obrigatórias. Sim/não **opcional** (três estados) é `TRadio` com `vazio`.
 *
 * O `<input type="checkbox">` de verdade, sem a aparência do sistema, é a caixa glass (classe `.marca`): marcada, o
 * degradê do destaque com o ✓ em `--on-accent`. O alvo de toque é a linha inteira (rótulo incluído), com 36 px de
 * altura. Só leitura (`TForm` ou `TPanel somenteLeitura`): focável, `readOnly` + `aria-readonly`, o clique e o
 * Espaço não mudam nada, fundo de campo só leitura. Desabilitada (`disabled`, ou `desabilitada` na opção): o mesmo
 * fundo de só leitura (sem `opacity`, a borda continua ≥ 3:1), rótulo em `--fg-muted` e fora da ordem do Tab.
 * Largura: o conteúdo.
 *
 * Diferente dos outros campos, o booleano e o grupo **não reservam** a linha do erro: numa grade de permissões, cada
 * caixa cresceria 16 px à toa, e a folga vazia afastaria o grupo do campo de baixo. O erro aparece embaixo quando existe.
 */
export const TCheckBox = forwardRef<HTMLInputElement, TCheckBoxProps>(function TCheckBox(props, ref) {
  const controlado = props.onChange !== undefined || props.checked !== undefined || props.valores !== undefined;
  const ligado = useLigadoAoForm(props.name, controlado);
  if (ligado && props.opcoes) return <GrupoLigado {...props} name={props.name!} opcoes={props.opcoes} />;
  if (props.opcoes) return <GrupoDeCaixas {...props} opcoes={props.opcoes} />;
  if (ligado) return <CaixaLigada {...props} name={props.name!} />;
  return <Caixa {...props} ref={ref} />;
});

function CaixaLigada(props: TCheckBoxProps & { name: string }) {
  const { field, fieldState } = useController({ name: props.name });
  return (
    <Caixa
      {...props}
      ref={field.ref}
      checked={!!field.value}
      onChange={(e) => field.onChange(e.target.checked)}
      onBlur={field.onBlur}
      error={props.error ?? fieldState.error?.message}
    />
  );
}

const Caixa = forwardRef<HTMLInputElement, TCheckBoxProps>(function Caixa(
  {
    label,
    error,
    ajuda,
    width,
    required,
    rotuloOculto,
    disabled,
    id,
    className,
    opcoes: _opcoes,
    vertical: _vertical,
    valores: _valores,
    onValoresChange: _onValoresChange,
    readOnly,
    onClick,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const gerado = useId();
  const campoId = id ?? `campo-${gerado}`;
  const descId = `${campoId}-desc`;
  const somenteLeitura = useSomenteLeituraDoForm() || !!readOnly;
  const { largura, classe } = useLargura(width, LARGURA_PADRAO.TCheckBox);
  const variantes = useVariantesBloco(true);
  const dica = somenteLeitura ? undefined : ajuda;
  const desc = error ?? dica;

  return (
    <motion.div variants={variantes} data-kit="TCheckBox" data-largura={largura} className={cn('flex flex-col', classe, className)}>
      <label
        htmlFor={campoId}
        className={cn(
          'flex min-h-9 items-center gap-2.5 text-sm',
          disabled ? 'cursor-not-allowed text-muted' : somenteLeitura ? 'cursor-default' : 'cursor-pointer',
        )}
      >
        <MarcaCaixa
          {...rest}
          ref={ref}
          id={campoId}
          disabled={!!disabled}
          somenteLeitura={somenteLeitura}
          aria-required={(required && !somenteLeitura) || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={desc ? descId : undefined}
          onClick={onClick}
          onKeyDown={onKeyDown}
        />
        <span className={rotuloOculto ? 'sr-only' : 'min-w-0'}>
          {label}
          {required && !somenteLeitura && (
            <span aria-hidden className="ml-0.5 text-danger">
              *
            </span>
          )}
        </span>
      </label>
      {desc && (
        <span id={descId} className={cn('block pl-[30px]', error ? 'text-xs text-danger' : 'text-[11px] leading-4 text-subtle')}>
          {desc}
        </span>
      )}
    </motion.div>
  );
});

type MarcaProps = InputHTMLAttributes<HTMLInputElement> & { somenteLeitura: boolean };

/** A caixa: o input nativo estilizado (`.marca`) e o ✓ por cima, na mesma célula. */
const MarcaCaixa = forwardRef<HTMLInputElement, MarcaProps>(function MarcaCaixa({ somenteLeitura, onClick, onKeyDown, ...rest }, ref) {
  return (
    <span className="inline-grid place-items-center">
      <input
        {...rest}
        ref={ref}
        type="checkbox"
        readOnly={somenteLeitura}
        aria-readonly={somenteLeitura || undefined}
        onClick={(e) => {
          if (somenteLeitura) e.preventDefault();
          else onClick?.(e);
        }}
        onKeyDown={(e) => {
          if (somenteLeitura && e.key === ' ') e.preventDefault();
          else onKeyDown?.(e);
        }}
        className="marca marca-caixa [grid-area:1/1]"
      />
      <Check aria-hidden strokeWidth={3} className="marca-sinal [grid-area:1/1] size-3.5" />
    </span>
  );
});

function GrupoLigado(props: TCheckBoxProps & { name: string; opcoes: OpcaoCheckBox[] }) {
  const { field, fieldState } = useController({ name: props.name });
  return (
    <GrupoDeCaixas
      {...props}
      valores={(field.value as string[] | null | undefined) ?? []}
      onValoresChange={field.onChange}
      onBlur={field.onBlur}
      refFoco={field.ref}
      error={props.error ?? fieldState.error?.message}
    />
  );
}

function GrupoDeCaixas({
  label,
  opcoes,
  vertical,
  valores = [],
  onValoresChange,
  onBlur,
  error,
  ajuda,
  width,
  required,
  rotuloOculto,
  disabled,
  id,
  readOnly,
  refFoco,
}: TCheckBoxProps & { opcoes: OpcaoCheckBox[]; refFoco?: Ref<HTMLInputElement> }) {
  const somenteLeitura = useSomenteLeituraDoForm() || !!readOnly;
  const marcados = new Set(valores);
  const alternar = (valor: string, marcado: boolean) => {
    const novos = new Set(marcados);
    if (marcado) novos.add(valor);
    else novos.delete(valor);
    // Na ordem das opções, não na ordem dos cliques.
    onValoresChange?.(opcoes.map((o) => o.valor).filter((v) => novos.has(v)));
  };
  const primeira = opcoes.find((o) => !o.desabilitada);

  return (
    <CampoDoKit
      kit="TCheckBox"
      padrao={LARGURA_PADRAO.TCheckBox}
      label={label}
      width={width}
      ajuda={ajuda}
      error={error}
      rotuloOculto={rotuloOculto}
      required={required}
      id={id}
      semReserva
      dicas={dicasDasOpcoes(opcoes)}
      grupo
    >
      {() => (
        <div className={cn('flex gap-x-5 gap-y-1', vertical ? 'flex-col' : 'flex-wrap items-center')}>
          {opcoes.map((o) => {
            const travada = !!disabled || !!o.desabilitada;
            return (
              <label
                key={o.valor}
                title={o.dica}
                className={cn(
                  'flex min-h-9 items-center gap-2.5 text-sm',
                  travada ? 'cursor-not-allowed text-muted' : somenteLeitura ? 'cursor-default' : 'cursor-pointer',
                )}
              >
                <MarcaCaixa
                  ref={o === primeira ? refFoco : undefined}
                  checked={marcados.has(o.valor)}
                  disabled={travada}
                  somenteLeitura={somenteLeitura}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    if (!somenteLeitura) alternar(o.valor, e.target.checked);
                  }}
                  onBlur={onBlur}
                />
                <span className="min-w-0">{o.rotulo}</span>
              </label>
            );
          })}
        </div>
      )}
    </CampoDoKit>
  );
}

