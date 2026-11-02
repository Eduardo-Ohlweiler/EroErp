import { useId } from 'react'
import { useController } from 'react-hook-form'
import { classeDoRotulo, textoDoRotulo, useLigadoAoForm, type PropsDeCampo } from './Campo'
import { RodapeDoCampo } from './RodapeDoCampo'
import { CORES_SUGERIDAS } from './opcoes'
import { useLargura } from './larguras'
import { useSomenteLeituraDoForm } from './somenteLeitura'

interface TCorProps extends PropsDeCampo {
  /** Dentro de um `TForm`, liga ao campo — dispensa `value`/`onChange`. */
  name?: string
  /** `#RRGGBB`. */
  value?: string
  onChange?: (cor: string) => void
  /** As bolinhas oferecidas; "Outra" abre o seletor do sistema. */
  cores?: string[]
  className?: string
}

/**
 * Cor de identificação de um registro: as sugeridas em bolinhas e "Outra",
 * com o seletor do sistema. Grava `#RRGGBB` em maiúsculas.
 */
export function TCor(props: TCorProps) {
  const ligado = useLigadoAoForm(props.name, props.onChange !== undefined || props.value !== undefined)
  if (ligado) return <TCorLigado {...props} name={props.name!} />
  return <TCorBase {...props} />
}

function TCorLigado(props: TCorProps & { name: string }) {
  const { field, fieldState } = useController({ name: props.name })
  return (
    <TCorBase
      {...props}
      value={(field.value as string | null | undefined) ?? ''}
      onChange={(cor) => field.onChange(cor)}
      error={props.error ?? fieldState.error?.message}
    />
  )
}

function TCorBase({
  label,
  value = '',
  onChange = () => {},
  cores = CORES_SUGERIDAS,
  width,
  required,
  rotuloOculto,
  ajuda,
  error,
  disabled,
  className = '',
}: TCorProps) {
  const id = useId()
  const erroId = `${id}-erro`
  const ajudaId = `${id}-ajuda`
  const largura = useLargura(width, 'conteudo')
  const travado = useSomenteLeituraDoForm() || disabled
  const atual = value.toUpperCase()

  return (
    <fieldset
      className={`m-0 flex min-w-0 flex-col gap-1.5 border-0 p-0 ${largura} ${className}`}
      aria-describedby={error ? erroId : ajuda ? ajudaId : undefined}
    >
      <legend className={`mb-1.5 ${classeDoRotulo(rotuloOculto)}`}>{textoDoRotulo(label, required)}</legend>
      <div className="flex flex-wrap items-center gap-2">
        {cores.map((cor) => {
          const escolhida = cor.toUpperCase() === atual
          return (
            <button
              key={cor}
              type="button"
              disabled={travado}
              onClick={() => onChange(cor.toUpperCase())}
              aria-label={`Cor ${cor}`}
              aria-pressed={escolhida}
              style={{ backgroundColor: cor }}
              className={`size-8 rounded-full ring-offset-2 ring-offset-surface transition-shadow
                disabled:cursor-not-allowed disabled:opacity-60
                ${escolhida ? 'ring-2 ring-txt' : 'ring-1 ring-line-strong enabled:hover:ring-2'}`}
            />
          )
        })}
        <label
          className={`flex items-center gap-2 text-caption text-txt-secondary
            ${travado ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          <input
            type="color"
            aria-label="Outra cor"
            disabled={travado}
            value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#000000'}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="size-8 cursor-pointer rounded-md border border-line-strong bg-surface p-0.5
              disabled:cursor-not-allowed"
          />
          Outra
        </label>
      </div>
      <RodapeDoCampo erroId={erroId} ajudaId={ajudaId} error={error} ajuda={ajuda} />
    </fieldset>
  )
}
