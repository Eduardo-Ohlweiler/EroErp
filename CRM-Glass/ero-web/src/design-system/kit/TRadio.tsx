import { useId, type KeyboardEvent, type Ref } from 'react';
import { useController } from 'react-hook-form';
import { cn } from '../../shared/util/utils';
import { CampoDoKit, useLigadoAoForm, type PropsDeCampo } from './campo';
import { LARGURA_PADRAO } from './larguras';
import { dicasDasOpcoes, type OpcaoSelect } from './opcoes';
import { useSomenteLeituraDoForm } from './somenteLeitura';

/**
 * Uma opção do rádio: `desabilitada` não se escolhe; `dica` explica por quê. A dica vira o `title` da opção (mouse) e
 * entra, visível, na ajuda do grupo (toque, teclado e leitor de tela, pelo `aria-describedby` do grupo).
 */
export type OpcaoRadio = OpcaoSelect & { desabilitada?: boolean; dica?: string };

export type TRadioProps = PropsDeCampo & {
  opcoes: OpcaoRadio[];
  /** valor escolhido, ou `''` quando nada foi escolhido (controlado, fora de `TForm`) */
  value?: string;
  onChange?: (valor: string) => void;
  onBlur?: () => void;
  /**
   * Rótulo da opção que representa **ausência de resposta** (valor `''`), no fim. Sem ela, uma escolha feita não
   * se desfaz: um sim/não opcional usa `vazio="Não informado"`.
   */
  vazio?: string;
  /** empilha as opções (mais de três, ou rótulos longos); o padrão é lado a lado */
  vertical?: boolean;
};

/**
 * Escolha única entre poucas opções fixas (docs/07 §3.2): o nível de acesso de um grupo (Sem acesso · Ler · Ler e
 * escrever), o tema (Seguir o contratante · Claro · Escuro). Quando ver todas as opções de uma vez é a informação;
 * lista longa é `TCombo`.
 *
 * Por baixo são `<input type="radio">` de verdade com o mesmo `name` (o navegador dá as setas entre as opções,
 * pulando as desabilitadas), num `role="radiogroup"` com o rótulo do campo. Só leitura (`TForm` ou
 * `TPanel somenteLeitura`): continua focável, as setas e o clique não mudam nada, `aria-readonly` no grupo.
 * Largura: o conteúdo (`data-largura="conteudo"`).
 *
 * **Não reserva** a linha do erro (como o `TCheckBox`): a folha vazia de 22 px afastaria o grupo do campo de baixo e
 * ele pareceria do bloco seguinte. O erro aparece embaixo só quando existe.
 */
export function TRadio(props: TRadioProps) {
  const ligado = useLigadoAoForm(props.name, props.onChange !== undefined || props.value !== undefined);
  if (ligado) return <TRadioLigado {...props} name={props.name!} />;
  return <TRadioBase {...props} />;
}

function TRadioLigado(props: TRadioProps & { name: string }) {
  const { field, fieldState } = useController({ name: props.name });
  return (
    <TRadioBase
      {...props}
      value={(field.value as string | null | undefined) ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      refFoco={field.ref}
      error={props.error ?? fieldState.error?.message}
    />
  );
}

const SETAS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

function TRadioBase({
  label,
  opcoes,
  value = '',
  onChange,
  onBlur,
  vazio,
  vertical,
  width,
  ajuda,
  error,
  rotuloOculto,
  required,
  disabled,
  id,
  refFoco,
}: TRadioProps & { refFoco?: Ref<HTMLInputElement> }) {
  const nome = useId();
  const somenteLeitura = useSomenteLeituraDoForm();
  const todas: OpcaoRadio[] = vazio !== undefined ? [...opcoes, { valor: '', rotulo: vazio }] : opcoes;
  // O `setFocus` do formulário (erro da API) vai para a opção marcada, senão para a primeira que se pode escolher.
  const alvoDoFoco = todas.find((o) => o.valor === value && !o.desabilitada) ?? todas.find((o) => !o.desabilitada);

  const travarTecla = (e: KeyboardEvent<HTMLInputElement>) => {
    if (SETAS.has(e.key) || e.key === ' ') e.preventDefault();
  };

  return (
    <CampoDoKit
      kit="TRadio"
      padrao={LARGURA_PADRAO.TRadio}
      label={label}
      width={width}
      ajuda={ajuda}
      error={error}
      rotuloOculto={rotuloOculto}
      required={required}
      id={id}
      semReserva
      dicas={dicasDasOpcoes(todas)}
      grupo="radiogroup"
      ariaGrupo={{
        'aria-readonly': somenteLeitura || undefined,
        'aria-required': (required && !somenteLeitura) || undefined,
        'aria-invalid': error ? true : undefined,
      }}
    >
      {() => (
        <div className={cn('flex gap-x-5 gap-y-1', vertical ? 'flex-col' : 'flex-wrap items-center')}>
          {todas.map((o) => {
            const travada = !!disabled || !!o.desabilitada;
            return (
              <label
                key={o.valor || '__vazio'}
                title={o.dica}
                className={cn(
                  'flex min-h-9 items-center gap-2.5 text-sm',
                  travada ? 'cursor-not-allowed text-muted' : somenteLeitura ? 'cursor-default' : 'cursor-pointer',
                  o.valor === '' && !travada && 'text-muted',
                )}
              >
                <span className="inline-grid place-items-center">
                  <input
                    ref={o === alvoDoFoco ? refFoco : undefined}
                    type="radio"
                    name={nome}
                    value={o.valor}
                    checked={value === o.valor}
                    disabled={travada}
                    readOnly={somenteLeitura}
                    onChange={() => {
                      if (!somenteLeitura) onChange?.(o.valor);
                    }}
                    onClick={somenteLeitura ? (e) => e.preventDefault() : undefined}
                    onKeyDown={somenteLeitura ? travarTecla : undefined}
                    onBlur={onBlur}
                    className="marca marca-radio [grid-area:1/1]"
                  />
                  <span aria-hidden className="marca-sinal [grid-area:1/1] size-2 rounded-full bg-current" />
                </span>
                <span className="min-w-0">{o.rotulo}</span>
              </label>
            );
          })}
        </div>
      )}
    </CampoDoKit>
  );
}
