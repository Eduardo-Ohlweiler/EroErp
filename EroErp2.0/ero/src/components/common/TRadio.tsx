import { useId } from 'react'
import { useController } from 'react-hook-form'
import type { SelectOption } from '@/types/comum'
import {
  classeDoRotulo,
  textoDoRotulo,
  useLigadoAoForm,
  type PropsDeCampo,
} from './Campo'
import { RodapeDoCampo } from './RodapeDoCampo'
import { useOpcoesDoBanco } from './useOpcoesDoBanco'
import type { OpcaoSelect } from './TCombo'
import { useLargura } from './larguras'
import { useSomenteLeituraDoForm } from './somenteLeitura'

interface TRadioProps extends PropsDeCampo {
  /** Dentro de um `TForm`, liga o grupo ao campo — dispensa `value`/`onChange`. */
  name?: string
  opcoes: OpcaoSelect[]
  /** Valor escolhido, ou string vazia quando nada foi escolhido. */
  value?: string
  onChange?: (valor: string) => void
  /**
   * Rótulo da opção que representa **ausência de resposta**.
   *
   * <p>Sem ela, uma escolha feita não pode ser desfeita, e o formulário passa a
   * mentir: "Não" fica indistinguível de "ninguém perguntou". Por isso um
   * sim/não opcional usa este componente, e não uma caixa de seleção.
   */
  vazio?: string
  className?: string
  /** Empilha em vez de alinhar. Para listas de mais de três opções. */
  vertical?: boolean
}

/**
 * Grupo de rádios — escolha única entre opções fixas.
 *
 * <p>Serve ao sim/não de três estados e à pergunta de opção única.
 *
 * <p>Não substitui o {@code TCombo}: rádio serve quando as opções são poucas e
 * ver todas de uma vez é a informação — "Sim / Não / Não informado" dentro de um
 * {@code <select>} esconderia justamente o terceiro estado.
 */
export function TRadio(props: TRadioProps) {
  const ligado = useLigadoAoForm(props.name, props.onChange !== undefined || props.value !== undefined)
  if (ligado) return <TRadioLigado {...props} name={props.name!} />
  return <TRadioBase {...props} />
}

function TRadioLigado(props: TRadioProps & { name: string }) {
  const { field, fieldState } = useController({ name: props.name })
  return (
    <TRadioBase
      {...props}
      value={(field.value as string | null | undefined) ?? ''}
      onChange={field.onChange}
      error={props.error ?? fieldState.error?.message}
    />
  )
}

function TRadioBase({
  label,
  opcoes,
  value = '',
  onChange = () => {},
  vazio,
  error,
  ajuda,
  disabled,
  width,
  required,
  rotuloOculto,
  className = '',
  vertical,
}: TRadioProps) {
  const grupo = useId()
  const erroId = `${grupo}-erro`
  const ajudaId = `${grupo}-ajuda`
  const largura = useLargura(width, 'conteudo')
  const travado = useSomenteLeituraDoForm() || disabled

  const todas = vazio ? [...opcoes, { valor: '', rotulo: vazio }] : opcoes

  return (
    <fieldset
      className={`flex min-w-0 flex-col gap-1.5 ${largura} ${className}`}
      aria-invalid={!!error}
      aria-describedby={error ? erroId : ajuda ? ajudaId : undefined}
    >
      <legend className={classeDoRotulo(rotuloOculto)}>{textoDoRotulo(label, required)}</legend>

      <div className={`flex gap-x-5 gap-y-1 ${vertical ? 'flex-col' : 'flex-wrap items-center'}`}>
        {todas.map((opcao) => (
          <label
            key={opcao.valor || '__vazio'}
            className={`flex min-h-9 items-center gap-2 text-body
              ${opcao.valor === '' ? 'text-txt-secondary' : 'text-txt'}
              ${travado ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          >
            <input
              type="radio"
              name={grupo}
              value={opcao.valor}
              checked={value === opcao.valor}
              disabled={travado}
              onChange={() => onChange(opcao.valor)}
              className="size-4 shrink-0 cursor-pointer border-line-strong accent-primary
                         transition-shadow duration-150
                         focus:outline-none focus:ring-[3px] focus:ring-primary/10
                         disabled:cursor-not-allowed"
            />
            <span className="min-w-0">{opcao.rotulo}</span>
          </label>
        ))}
      </div>

      <RodapeDoCampo erroId={erroId} ajudaId={ajudaId} error={error} ajuda={ajuda} />
    </fieldset>
  )
}

interface TDBRadioProps extends Omit<TRadioProps, 'opcoes'> {
  /** As opções, do banco (um `/select`). */
  buscar: () => Promise<SelectOption[]>
}

/** Escolha única entre opções **do banco**. Grava o id. */
export function TDBRadio({ buscar, ...props }: TDBRadioProps) {
  const opcoes = useOpcoesDoBanco(buscar)
  return <TRadio {...props} opcoes={opcoes} />
}
