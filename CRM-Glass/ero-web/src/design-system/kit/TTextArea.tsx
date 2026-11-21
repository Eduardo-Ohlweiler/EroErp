import { forwardRef, useState, type ChangeEvent, type TextareaHTMLAttributes } from 'react';
import { useController } from 'react-hook-form';
import { cn } from '../../shared/util/utils';
import { CampoDoKit, useLigadoAoForm, type PropsDeCampo } from './campo';
import { LARGURA_PADRAO } from './larguras';
import { useSomenteLeituraDoForm } from './somenteLeitura';

export type TTextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'width' | 'required' | 'disabled' | 'rows'> &
  PropsDeCampo & {
    /** altura em linhas (padrão 3); a pessoa pode puxar para baixo */
    linhas?: number;
  };

/** Linhas do `TTextArea` sem `linhas`. */
export const LINHAS_DO_TTEXTAREA = 3;

/**
 * O contador embaixo do campo (função pura): vazio, "máx. 500 caracteres"; com texto, "120 de 500 caracteres". Sem
 * `maxLength`, nada.
 */
export function textoDoContador(tamanho: number, maximo?: number): string | undefined {
  if (!maximo) return undefined;
  return tamanho === 0 ? `máx. ${maximo} caracteres` : `${tamanho} de ${maximo} caracteres`;
}

/**
 * Texto longo do kit (docs/07 §3.2): observação, descrição. Espelha o `TEntry` (rótulo em cima, ajuda, erro, só
 * leitura `readOnly` + `aria-readonly`, `disabled` só no campo travado); dentro de `TForm`, basta o `name`.
 *
 * Com `maxLength`, o contador fica na linha da ajuda (depois da `ajuda` da tela): "máx. 500 caracteres" com o campo
 * vazio, "120 de 500 caracteres" ao digitar. Em só leitura, a linha some, como a ajuda de todo campo. Largura padrão:
 * `longo` (a linha inteira da coluna).
 */
export const TTextArea = forwardRef<HTMLTextAreaElement, TTextAreaProps>(function TTextArea(props, ref) {
  const ligado = useLigadoAoForm(props.name, props.onChange !== undefined || props.value !== undefined);
  if (ligado) return <TTextAreaLigado {...props} name={props.name!} />;
  return <TTextAreaBase {...props} ref={ref} />;
});

function TTextAreaLigado(props: TTextAreaProps & { name: string }) {
  const { field, fieldState } = useController({ name: props.name });
  return (
    <TTextAreaBase
      {...props}
      ref={field.ref}
      value={(field.value as string | null | undefined) ?? ''}
      onChange={(e) => field.onChange(e.target.value)}
      onBlur={field.onBlur}
      error={props.error ?? fieldState.error?.message}
    />
  );
}

const TTextAreaBase = forwardRef<HTMLTextAreaElement, TTextAreaProps>(function TTextAreaBase(
  { label, error, ajuda, width, rotuloOculto, required, disabled, id, linhas, className, readOnly, onChange, value, defaultValue, ...rest },
  ref,
) {
  const somenteLeitura = useSomenteLeituraDoForm() || !!readOnly;
  // Não controlado (sem `value`): o contador acompanha o que se digita.
  const [digitado, setDigitado] = useState(() => String(defaultValue ?? '').length);
  const tamanho = value !== undefined && value !== null ? String(value).length : digitado;
  const contador = textoDoContador(tamanho, rest.maxLength);
  const ajudaComContador = contador ? (
    <>
      {ajuda}
      {ajuda ? ' · ' : null}
      <span data-contador>{contador}</span>
    </>
  ) : (
    ajuda
  );

  return (
    <CampoDoKit
      kit="TTextArea"
      padrao={LARGURA_PADRAO.TTextArea}
      label={label}
      width={width}
      ajuda={ajudaComContador}
      error={error}
      rotuloOculto={rotuloOculto}
      required={required}
      id={id}
      semReserva={somenteLeitura || !!disabled}
    >
      {(ids) => (
        <textarea
          {...rest}
          {...ids}
          ref={ref}
          rows={linhas ?? LINHAS_DO_TTEXTAREA}
          value={value}
          defaultValue={defaultValue}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
            setDigitado(e.target.value.length);
            onChange?.(e);
          }}
          disabled={!!disabled}
          readOnly={somenteLeitura}
          aria-readonly={somenteLeitura || undefined}
          aria-required={(required && !somenteLeitura) || undefined}
          aria-invalid={error ? true : undefined}
          className={cn('input input-area', className)}
        />
      )}
    </CampoDoKit>
  );
});
