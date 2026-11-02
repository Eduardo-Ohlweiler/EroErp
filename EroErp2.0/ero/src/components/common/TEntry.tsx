import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { useController } from 'react-hook-form'
import {
  mascararCep,
  mascararCnpj,
  mascararColado,
  mascararCpf,
  mascararDecimal,
  mascararTelefone,
} from '@/utils/format'
import {
  classeDaBorda,
  classeDoRotulo,
  textoDoRotulo,
  useLigadoAoForm,
  type PropsDeCampo,
} from './Campo'
import { RodapeDoCampo } from './RodapeDoCampo'
import { useLargura, type Largura } from './larguras'
import { useSomenteLeituraDoForm } from './somenteLeitura'

/**
 * `decimal` cobre quase tudo. `inteiro` é para o que o DTO tipa como `Integer`
 * (idade, administrações por dia) e para a PA, que é mmHg redondo.
 * `decimalComSinal` existe por um campo só — o balanço hídrico. `moeda` é o
 * `decimal` de duas casas com o "R$" na frente.
 */
export type MascaraNumerica = 'decimal' | 'inteiro' | 'decimalComSinal' | 'moeda'

/** Documento e telefone: exibe pontuado, grava só os dígitos. */
type MascaraDeDigitos = 'cpf' | 'cnpj' | 'cpfCnpj' | 'telefone' | 'celular' | 'cep'

export type Mascara = MascaraNumerica | MascaraDeDigitos | 'hora'

const DE_DIGITOS: Record<MascaraDeDigitos, (v: string) => string> = {
  cpf: mascararCpf,
  cnpj: mascararCnpj,
  cpfCnpj: (v) => (v.replace(/\D/g, '').length <= 11 ? mascararCpf(v) : mascararCnpj(v)),
  telefone: mascararTelefone,
  celular: mascararTelefone,
  cep: mascararCep,
}

function mascararHora(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1:$2')
}

function ehNumerica(m?: Mascara): m is MascaraNumerica {
  return m === 'decimal' || m === 'inteiro' || m === 'decimalComSinal' || m === 'moeda'
}

function ehDeDigitos(m?: Mascara): m is MascaraDeDigitos {
  return !!m && m in DE_DIGITOS
}

/** Largura padrão de cada máscara (doc 14 §2.3). */
function larguraPadrao(mascara?: Mascara, type?: string): Largura {
  switch (mascara) {
    case 'cpf':
    case 'telefone':
    case 'celular':
      return 'cpf'
    case 'cnpj':
    case 'cpfCnpj':
      return 'cnpj'
    case 'cep':
      return 'cep'
    case 'hora':
      return 'hora'
    case 'moeda':
    case 'decimal':
    case 'decimalComSinal':
      return 'valor'
    case 'inteiro':
      return 'quantidade'
  }
  if (type === 'date') return 'data'
  if (type === 'datetime-local') return 'dataHora'
  if (type === 'time') return 'hora'
  return 'metade'
}

const TAMANHO_MAXIMO: Partial<Record<Mascara, number>> = {
  cpf: 14,
  cnpj: 18,
  cpfCnpj: 18,
  telefone: 15,
  celular: 15,
  cep: 9,
  hora: 5,
}

export interface TEntryProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'width' | 'required' | 'disabled'>,
    PropsDeCampo {
  /** Unidade ou ícone à direita — "cm", "kg", olho de senha. */
  suffix?: ReactNode
  mascara?: Mascara
  /** Casas decimais. Ignorado em `inteiro`; padrão 2 nas demais. */
  casas?: number
}

/**
 * Campo de texto. `forwardRef` porque o react-hook-form registra a ref.
 *
 * Dentro de um `TForm`, basta o `name`: valor, erro e `onBlur` vêm do
 * formulário. Fora dele (ou com `{...register()}`), `value`/`onChange` como
 * um input comum.
 *
 * <b>Sobre a máscara.</b> Ela mora aqui, e não em cada `onChange`, porque são
 * ~70 campos numéricos: repetir a chamada setenta vezes é onde um deles fica
 * para trás. O componente reescreve `e.target.value` <i>antes</i> de repassar o
 * evento — o input é controlado, então corrigir o nó do DOM na hora é o que
 * impede o texto cru de ficar visível quando o valor mascarado não muda (digitar
 * uma letra em "0,68" não altera o estado, logo não há novo render).
 *
 * Colar é tratado à parte: o texto colado passa por `paraNumero` em vez de
 * virar acumulador de dígitos, senão colar "70" daria "0,70".
 *
 * As numéricas gravam o **texto** da máscara ("72,50"), que o `paraCorpo` da
 * tela converte com `paraNumero` — vazio tem de continuar vazio. CPF, CNPJ,
 * CEP e telefone, ligados ao formulário, gravam só os dígitos.
 */
export const TEntry = forwardRef<HTMLInputElement, TEntryProps>(function TEntry(props, ref) {
  const ligado = useLigadoAoForm(props.name, props.onChange !== undefined || props.value !== undefined)
  if (ligado) return <TEntryLigado {...props} name={props.name!} />
  return <TEntryBase {...props} ref={ref} />
})

function TEntryLigado(props: TEntryProps & { name: string }) {
  const { field, fieldState } = useController({ name: props.name })
  const digitos = ehDeDigitos(props.mascara)
  const valor = field.value === null || field.value === undefined ? '' : String(field.value)
  return (
    <TEntryBase
      {...props}
      ref={field.ref}
      value={digitos ? DE_DIGITOS[props.mascara as MascaraDeDigitos](valor) : valor}
      onChange={(e) => field.onChange(digitos ? e.target.value.replace(/\D/g, '') : e.target.value)}
      onBlur={field.onBlur}
      error={props.error ?? fieldState.error?.message}
    />
  )
}

const TEntryBase = forwardRef<HTMLInputElement, TEntryProps>(function TEntryBase(
  {
    label,
    error,
    suffix,
    ajuda,
    mascara,
    casas,
    width,
    rotuloOculto,
    required,
    disabled,
    className = '',
    id,
    onChange,
    ...props
  },
  ref,
) {
  const gerado = useId()
  const inputId = id ?? gerado
  const erroId = `${inputId}-erro`
  const ajudaId = `${inputId}-ajuda`
  const largura = useLargura(width, larguraPadrao(mascara, props.type))
  const travado = useSomenteLeituraDoForm() || disabled

  const casasEfetivas = mascara === 'inteiro' ? 0 : (casas ?? 2)
  const comSinal = mascara === 'decimalComSinal'
  const moeda = mascara === 'moeda'

  const aoDigitar = !mascara
    ? onChange
    : (evento: React.ChangeEvent<HTMLInputElement>) => {
        const texto = evento.target.value
        if (ehNumerica(mascara)) {
          const colou = (evento.nativeEvent as InputEvent).inputType === 'insertFromPaste'
          evento.target.value = colou
            ? mascararColado(texto, casasEfetivas, comSinal)
            : mascararDecimal(texto, casasEfetivas, comSinal)
        } else if (mascara === 'hora') {
          evento.target.value = mascararHora(texto)
        } else {
          evento.target.value = DE_DIGITOS[mascara](texto)
        }
        onChange?.(evento)
      }

  const inputMode =
    props.inputMode ??
    (mascara === 'inteiro' || ehDeDigitos(mascara) || mascara === 'hora'
      ? 'numeric'
      : mascara
        ? 'decimal'
        : undefined)

  return (
    <div className={`flex flex-col gap-1.5 ${largura} ${className}`}>
      <label htmlFor={inputId} className={classeDoRotulo(rotuloOculto)}>
        {textoDoRotulo(label, required)}
      </label>

      <div className="relative">
        {moeda && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-caption text-txt-muted">
            R$
          </span>
        )}
        <input
          {...props}
          id={inputId}
          ref={ref}
          onChange={aoDigitar}
          disabled={travado}
          inputMode={inputMode}
          maxLength={props.maxLength ?? (mascara ? TAMANHO_MAXIMO[mascara] : undefined)}
          aria-required={required || undefined}
          aria-invalid={!!error}
          aria-describedby={error ? erroId : ajuda ? ajudaId : undefined}
          className={`h-[38px] w-full rounded-md border bg-surface px-3 text-body text-txt
            placeholder:text-txt-muted
            transition-shadow duration-150
            focus:outline-none focus:ring-[3px]
            disabled:cursor-not-allowed disabled:opacity-60
            ${moeda ? 'pl-9' : ''}
            ${suffix ? 'pr-11' : ''}
            ${classeDaBorda(error)}`}
        />
        {suffix && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-caption text-txt-muted">
            {suffix}
          </span>
        )}
      </div>

      <RodapeDoCampo erroId={erroId} ajudaId={ajudaId} error={error} ajuda={ajuda} />
    </div>
  )
})
