import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { useController } from 'react-hook-form'
import type { SelectOption } from '@/types/comum'
import {
  classeDoRotulo,
  textoDoRotulo,
  useLigadoAoForm,
  type PropsDeCampo,
} from './Campo'
import { RodapeDoCampo } from './RodapeDoCampo'
import type { OpcaoSelect } from './TCombo'
import { useLargura } from './larguras'
import { useOpcoesDoBanco } from './useOpcoesDoBanco'
import { useSomenteLeituraDoForm } from './somenteLeitura'

interface TCheckBoxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'width' | 'required' | 'disabled'>,
    PropsDeCampo {
  /**
   * Sem opções, um booleano com o rótulo ao lado. Com opções, um grupo fixo
   * que grava a lista dos valores marcados (só dentro de `TForm`, pelo `name`).
   */
  opcoes?: OpcaoSelect[]
  /** No grupo: empilha em vez de alinhar. */
  vertical?: boolean
}

/**
 * Caixa de seleção.
 *
 * <p>Espelha o {@code TEntry} em foco, erro e ajuda. O alvo de toque é a linha
 * inteira, e não o quadrado de 16 px — o sistema também é usado no celular.
 */
export const TCheckBox = forwardRef<HTMLInputElement, TCheckBoxProps>(function TCheckBox(props, ref) {
  const controlado = props.onChange !== undefined || props.checked !== undefined
  const ligado = useLigadoAoForm(props.name, controlado)
  if (ligado && props.opcoes) {
    return <GrupoDeCaixas {...props} name={props.name!} opcoes={props.opcoes} />
  }
  if (ligado) return <CaixaLigada {...props} name={props.name!} />
  return <Caixa {...props} ref={ref} />
})

function CaixaLigada(props: TCheckBoxProps & { name: string }) {
  const { field, fieldState } = useController({ name: props.name })
  return (
    <Caixa
      {...props}
      ref={field.ref}
      checked={!!field.value}
      onChange={(e) => field.onChange(e.target.checked)}
      onBlur={field.onBlur}
      error={props.error ?? fieldState.error?.message}
    />
  )
}

const Caixa = forwardRef<HTMLInputElement, TCheckBoxProps>(function Caixa(
  { label, error, ajuda, width, required, rotuloOculto, opcoes: _opcoes, vertical: _vertical,
    className = '', id, disabled, ...props },
  ref,
) {
  const gerado = useId()
  const campoId = id ?? gerado
  const erroId = `${campoId}-erro`
  const ajudaId = `${campoId}-ajuda`
  const largura = useLargura(width, 'conteudo')
  const travado = useSomenteLeituraDoForm() || disabled

  return (
    <div className={`flex flex-col gap-1 ${largura} ${className}`}>
      <label
        htmlFor={campoId}
        className={`flex min-h-9 items-center gap-2.5 text-body text-txt
          ${travado ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <input
          {...props}
          ref={ref}
          id={campoId}
          type="checkbox"
          disabled={travado}
          aria-invalid={!!error}
          aria-describedby={error ? erroId : ajuda ? ajudaId : undefined}
          className={CLASSE_CAIXA}
        />
        <span className={rotuloOculto ? 'sr-only' : 'min-w-0'}>{textoDoRotulo(label, required)}</span>
      </label>

      <RodapeDoCampo erroId={erroId} ajudaId={ajudaId} error={error} ajuda={ajuda} />
    </div>
  )
})

const CLASSE_CAIXA = `size-4 shrink-0 cursor-pointer rounded border-line-strong accent-primary
  transition-shadow duration-150
  focus:outline-none focus:ring-[3px] focus:ring-primary/10
  disabled:cursor-not-allowed`

interface GrupoProps extends PropsDeCampo {
  name: string
  opcoes: OpcaoSelect[]
  vertical?: boolean
  /** Altura máxima da lista, com rolagem. Para grupos longos vindos do banco. */
  altura?: 'sm' | 'md'
  className?: string
}

const ALTURAS = { sm: 'max-h-40 overflow-y-auto', md: 'max-h-64 overflow-y-auto' }

/** Grupo de caixas ligado a uma lista de valores no formulário. */
export function GrupoDeCaixas({
  name,
  label,
  opcoes,
  vertical,
  altura,
  error,
  ajuda,
  width,
  required,
  rotuloOculto,
  disabled,
  className = '',
}: GrupoProps) {
  const { field, fieldState } = useController({ name })
  const grupo = useId()
  const erroId = `${grupo}-erro`
  const ajudaId = `${grupo}-ajuda`
  const largura = useLargura(width, 'conteudo')
  const travado = useSomenteLeituraDoForm() || disabled
  const marcados = new Set<string>((field.value as string[] | null | undefined) ?? [])
  const erro = error ?? fieldState.error?.message

  function alternar(valor: string, marcado: boolean) {
    const novos = new Set(marcados)
    if (marcado) novos.add(valor)
    else novos.delete(valor)
    // Na ordem das opções, não na ordem dos cliques.
    field.onChange(opcoes.map((o) => o.valor).filter((v) => novos.has(v)))
  }

  return (
    <fieldset
      className={`flex min-w-0 flex-col gap-1.5 ${largura} ${className}`}
      aria-invalid={!!erro}
      aria-describedby={erro ? erroId : ajuda ? ajudaId : undefined}
    >
      <legend className={classeDoRotulo(rotuloOculto)}>{textoDoRotulo(label, required)}</legend>
      <div
        className={`flex gap-x-5 gap-y-1 ${vertical ? 'flex-col' : 'flex-wrap items-center'}
          ${altura ? ALTURAS[altura] : ''}`}
      >
        {opcoes.map((o) => (
          <label
            key={o.valor}
            className={`flex min-h-9 items-center gap-2.5 text-body text-txt
              ${travado ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          >
            <input
              type="checkbox"
              checked={marcados.has(o.valor)}
              disabled={travado}
              onChange={(e) => alternar(o.valor, e.target.checked)}
              onBlur={field.onBlur}
              className={CLASSE_CAIXA}
            />
            <span className="min-w-0">{o.rotulo}</span>
          </label>
        ))}
      </div>
      <RodapeDoCampo erroId={erroId} ajudaId={ajudaId} error={erro} ajuda={ajuda} />
    </fieldset>
  )
}

interface TDBCheckBoxProps extends PropsDeCampo {
  name: string
  /** As opções, do banco (um `/select`). */
  buscar: () => Promise<SelectOption[]>
  vertical?: boolean
  altura?: 'sm' | 'md'
}

/**
 * Grupo de caixas com as opções **do banco** — tipos de cadastro, módulos.
 * Grava a lista de ids marcados. Só dentro de `TForm`.
 */
export function TDBCheckBox({ buscar, ...props }: TDBCheckBoxProps) {
  const opcoes = useOpcoesDoBanco(buscar)
  return <GrupoDeCaixas {...props} opcoes={opcoes} />
}
