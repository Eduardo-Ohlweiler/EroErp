import { forwardRef, useId, type SelectHTMLAttributes } from 'react'
import { useController } from 'react-hook-form'
import { IconSeta } from '@/assets/icons'
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

export interface OpcaoSelect {
  valor: string
  rotulo: string
}

interface TComboProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children' | 'width' | 'required' | 'disabled'>,
    PropsDeCampo {
  opcoes: OpcaoSelect[]
  /** Primeira opção, de valor vazio. Ex.: "Todos", "Selecione…". */
  vazio?: string
}

/**
 * Combo de **opções fixas** — situação, tipo, enum. O que vem do banco é o
 * `TDBCombo`.
 *
 * `<select>` nativo, estilizado. Nativo de propósito: no celular abre o seletor
 * do sistema, que é mais acessível e mais rápido que qualquer dropdown custom.
 * Dentro de um `TForm`, basta o `name`.
 */
export const TCombo = forwardRef<HTMLSelectElement, TComboProps>(function TCombo(props, ref) {
  const ligado = useLigadoAoForm(props.name, props.onChange !== undefined || props.value !== undefined)
  if (ligado) return <TComboLigado {...props} name={props.name!} />
  return <TComboBase {...props} ref={ref} />
})

function TComboLigado(props: TComboProps & { name: string }) {
  const { field, fieldState } = useController({ name: props.name })
  return (
    <TComboBase
      {...props}
      ref={field.ref}
      value={(field.value as string | null | undefined) ?? ''}
      onChange={(e) => field.onChange(e.target.value)}
      onBlur={field.onBlur}
      error={props.error ?? fieldState.error?.message}
    />
  )
}

const TComboBase = forwardRef<HTMLSelectElement, TComboProps>(function TComboBase(
  {
    label,
    opcoes,
    vazio,
    error,
    ajuda,
    width,
    rotuloOculto,
    required,
    disabled,
    className = '',
    id,
    ...props
  },
  ref,
) {
  const gerado = useId()
  const selectId = id ?? gerado
  const erroId = `${selectId}-erro`
  const ajudaId = `${selectId}-ajuda`
  const largura = useLargura(width, 'situacao')
  const travado = useSomenteLeituraDoForm() || disabled

  return (
    <div className={`flex flex-col gap-1.5 ${largura} ${className}`}>
      <label htmlFor={selectId} className={classeDoRotulo(rotuloOculto)}>
        {textoDoRotulo(label, required)}
      </label>

      <div className="relative">
        <select
          {...props}
          id={selectId}
          ref={ref}
          disabled={travado}
          aria-required={required || undefined}
          aria-invalid={!!error}
          aria-describedby={error ? erroId : ajuda ? ajudaId : undefined}
          className={`h-[38px] w-full appearance-none rounded-md border bg-surface pl-3 pr-9
            text-body text-txt transition-shadow duration-150
            focus:outline-none focus:ring-[3px]
            disabled:cursor-not-allowed disabled:bg-surface-alt disabled:opacity-60
            ${classeDaBorda(error)}`}
        >
          {vazio !== undefined && <option value="">{vazio}</option>}
          {opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>

        <IconSeta className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-txt-muted" />
      </div>

      <RodapeDoCampo erroId={erroId} ajudaId={ajudaId} error={error} ajuda={ajuda} />
    </div>
  )
})
