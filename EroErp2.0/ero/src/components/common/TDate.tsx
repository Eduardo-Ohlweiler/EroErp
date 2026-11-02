import { useController } from 'react-hook-form'
import { IconFechar } from '@/assets/icons'
import { useLigadoAoForm } from './Campo'
import { TEntry, type TEntryProps } from './TEntry'
import { useSomenteLeituraDoForm } from './somenteLeitura'

type PropsDeData = Omit<TEntryProps, 'type' | 'mascara' | 'casas'>

/**
 * Data, com o calendário do navegador (em pt-BR no navegador em português).
 * Grava `AAAA-MM-DD` — dia do calendário, não instante: para exibir, monte com
 * `T00:00:00` (`formatarData` já faz). Valor inicial de "hoje" é `hojeIso()`,
 * nunca `toISOString()`.
 */
export function TDate(props: PropsDeData) {
  return <CampoDeData {...props} type="date" />
}

interface TDateTimeProps extends PropsDeData {
  /** Passo do seletor de minutos. Padrão 5. */
  passoMinutos?: number
}

/** Data e hora; grava `AAAA-MM-DDTHH:mm`, na hora local de quem digita. */
export function TDateTime({ passoMinutos = 5, ...props }: TDateTimeProps) {
  return <CampoDeData {...props} type="datetime-local" step={passoMinutos * 60} />
}

function CampoDeData(props: TEntryProps) {
  const ligado = useLigadoAoForm(props.name, props.onChange !== undefined || props.value !== undefined)
  if (ligado) return <DataLigada {...props} name={props.name!} />
  return <TEntry {...props} />
}

/** Ligada ao formulário, ganha o botão de limpar. */
function DataLigada(props: TEntryProps & { name: string }) {
  const { field, fieldState } = useController({ name: props.name })
  const travado = useSomenteLeituraDoForm() || props.disabled
  const valor = (field.value as string | null | undefined) ?? ''
  return (
    <TEntry
      {...props}
      id={props.id ?? props.name}
      ref={field.ref}
      value={valor}
      onChange={(e) => field.onChange(e.target.value)}
      onBlur={field.onBlur}
      error={props.error ?? fieldState.error?.message}
      suffix={
        valor && !travado ? (
          <button
            type="button"
            aria-label={`Limpar ${props.label}`}
            onClick={() => field.onChange('')}
            className="pointer-events-auto grid size-6 place-items-center rounded text-txt-muted hover:bg-surface-alt hover:text-txt"
          >
            <IconFechar className="size-3.5" />
          </button>
        ) : undefined
      }
    />
  )
}
