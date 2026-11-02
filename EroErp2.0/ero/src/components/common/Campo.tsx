import type { ReactNode } from 'react'
import { useFormContext } from 'react-hook-form'
import type { Largura } from './larguras'
import { Obrigatorio } from './TRow'

/** O que todo campo do kit aceita, além do próprio (doc 14 §3.2). */
export interface PropsDeCampo {
  label: string
  /** Token da escala — só quando a largura padrão do componente não serve. */
  width?: Largura
  ajuda?: string
  error?: string
  /** Mantém o rótulo para leitor de tela, sem ocupar espaço (label ao lado, filtro de cabeçalho). */
  rotuloOculto?: boolean
  /** Põe o `*` no rótulo. A validação continua sendo do schema. */
  required?: boolean
  disabled?: boolean
}

/**
 * Dentro de um `TForm`, o campo se liga ao formulário pelo `name` — a não ser
 * que o chamador já o controle (`value`/`onChange`, ou o `{...register()}` das
 * telas que ainda não foram para o kit, que traz o próprio `onChange`).
 */
export function useLigadoAoForm(name: string | undefined, controlado: boolean): boolean {
  const form = useFormContext()
  return !!form && !!name && !controlado
}

/** A classe do rótulo: visível, ou só para leitor de tela. */
export function classeDoRotulo(oculto?: boolean): string {
  return oculto ? 'sr-only' : 'text-caption text-txt-secondary'
}

/** O texto do rótulo, com o `*` quando obrigatório. */
export function textoDoRotulo(label: string, required?: boolean): ReactNode {
  return (
    <>
      {label}
      {required && <Obrigatorio />}
    </>
  )
}

/** Borda e halo do controle, com e sem erro. */
export function classeDaBorda(error?: string): string {
  return error
    ? 'border-danger focus:border-danger focus:ring-danger/15'
    : 'border-line-strong focus:border-primary focus:ring-primary/10'
}
