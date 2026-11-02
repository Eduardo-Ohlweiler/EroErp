import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'
import { useController } from 'react-hook-form'
import {
  classeDaBorda,
  classeDoRotulo,
  textoDoRotulo,
  useLigadoAoForm,
  type PropsDeCampo,
} from './Campo'
import { RodapeDoCampo } from './RodapeDoCampo'
import { useLargura } from './larguras'
import { useSomenteLeituraDoForm } from './somenteLeitura'

interface TTextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'width' | 'required' | 'disabled'>,
    PropsDeCampo {
  /** Altura em linhas. Padrão 5. */
  linhas?: number
}

/**
 * Campo de texto longo — observações, conduta, intercorrências.
 *
 * Espelha o `TEntry` em rótulo, foco, ajuda e erro; dentro de um `TForm`,
 * basta o `name`. Com `maxLength` e sem ajuda própria, diz o limite
 * ("máx. 2000 caracteres").
 *
 * O rótulo **embrulha** o controle (e não aponta para ele por `htmlFor`):
 * quem procura o campo pelo rótulo nos scripts usa `getByLabel`.
 */
export const TTextArea = forwardRef<HTMLTextAreaElement, TTextAreaProps>(function TTextArea(props, ref) {
  const ligado = useLigadoAoForm(props.name, props.onChange !== undefined || props.value !== undefined)
  if (ligado) return <TTextAreaLigado {...props} name={props.name!} />
  return <TTextAreaBase {...props} ref={ref} />
})

function TTextAreaLigado(props: TTextAreaProps & { name: string }) {
  const { field, fieldState } = useController({ name: props.name })
  return (
    <TTextAreaBase
      {...props}
      ref={field.ref}
      value={(field.value as string | null | undefined) ?? ''}
      onChange={(e) => field.onChange(e.target.value)}
      onBlur={field.onBlur}
      error={props.error ?? fieldState.error?.message}
    />
  )
}

const TTextAreaBase = forwardRef<HTMLTextAreaElement, TTextAreaProps>(function TTextAreaBase(
  { label, error, ajuda, width, required, rotuloOculto, disabled, linhas, className = '', id, rows, ...props },
  ref,
) {
  const geradoId = useId()
  const campoId = id ?? geradoId
  const erroId = `${campoId}-erro`
  const ajudaId = `${campoId}-ajuda`
  const largura = useLargura(width, 'longo')
  const travado = useSomenteLeituraDoForm() || disabled
  const textoDeAjuda = ajuda ?? (props.maxLength ? `máx. ${props.maxLength} caracteres` : undefined)

  return (
    <label htmlFor={campoId} className={`flex flex-col gap-1.5 ${largura} ${className}`}>
      <span className={classeDoRotulo(rotuloOculto)}>{textoDoRotulo(label, required)}</span>

      <textarea
        ref={ref}
        id={campoId}
        rows={linhas ?? rows ?? 5}
        disabled={travado}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? erroId : textoDeAjuda ? ajudaId : undefined}
        className={`w-full rounded-md border bg-surface px-3 py-2 text-body text-txt
          placeholder:text-txt-muted transition-shadow duration-150
          focus:outline-none focus:ring-[3px]
          disabled:cursor-not-allowed disabled:bg-surface-alt disabled:opacity-60
          read-only:cursor-default read-only:bg-surface-alt read-only:opacity-60 read-only:focus:ring-0
          ${classeDaBorda(error)}`}
        {...props}
      />

      <RodapeDoCampo erroId={erroId} ajudaId={ajudaId} error={error} ajuda={textoDeAjuda} />
    </label>
  )
})
