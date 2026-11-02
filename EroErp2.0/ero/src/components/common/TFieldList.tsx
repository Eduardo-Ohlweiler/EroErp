import { Fragment, type ReactNode } from 'react'
import { useFieldArray, useFormContext, useWatch, type FieldValues } from 'react-hook-form'
import { IconAdicionar, IconFechar } from '@/assets/icons'
import type { Largura } from './larguras'
import { TButton } from './TButton'
import { TCol, TRow } from './TRow'
import { useSomenteLeituraDoForm } from './somenteLeitura'

export interface ColunaDaLista<L> {
  /** O campo dentro da linha (`filialId`, `valor`). */
  name: string
  /**
   * O campo da coluna. Recebe o `name` completo (`filiais.0.valor`) para
   * passar ao componente do kit, o índice e a linha como está agora.
   */
  componente: (campo: string, indice: number, linha: L) => ReactNode
  /** Põe o campo numa `TCol` desta largura — só quando a padrão não serve. */
  width?: Largura
}

interface TFieldListProps<L> {
  /** O campo-lista do formulário (`filiais`). */
  name: string
  colunas: ColunaDaLista<L>[]
  /** A linha que o Acrescentar põe no fim. */
  novaLinha: L
  /** Não deixa remover abaixo disto. */
  minimo?: number
  /** Texto do botão. Padrão "Acrescentar". */
  rotuloAdicionar?: string
  /** O que se diz quando a lista está vazia. */
  vazio?: string
  /** Uma nota sob a linha (ex.: "Filial inativa"); `null` quando não há. */
  detalhe?: (indice: number, linha: L) => ReactNode
}

/**
 * Lista filha editável dentro do formulário, como no antigo — e-mails,
 * telefones, valores por filial. Uma `TRow` por linha, com os campos nas suas
 * larguras padrão e o remover no fim; o Acrescentar fica embaixo. No celular
 * cada linha empilha.
 *
 * Num `TForm somenteLeitura`, acrescentar e remover somem.
 */
export function TFieldList<L extends FieldValues>({
  name,
  colunas,
  novaLinha,
  minimo = 0,
  rotuloAdicionar = 'Acrescentar',
  vazio,
  detalhe,
}: TFieldListProps<L>) {
  const { control } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name })
  const linhas = (useWatch({ control, name }) as L[] | undefined) ?? []
  const somenteLeitura = useSomenteLeituraDoForm()

  return (
    <div className="flex flex-col gap-3">
      {fields.length === 0 && vazio && <p className="text-caption text-txt-secondary">{vazio}</p>}

      {fields.map((campo, i) => {
        const linha = linhas[i] ?? novaLinha
        const nota = detalhe?.(i, linha)
        return (
          <div
            key={campo.id}
            className="flex flex-col gap-2 border-b border-line pb-3 last:border-0 last:pb-0 sm:border-0 sm:pb-0"
          >
            <TRow>
              {colunas.map((c) => (
                <Fragment key={c.name}>
                  {c.width ? (
                    <TCol width={c.width}>{c.componente(`${name}.${i}.${c.name}`, i, linha)}</TCol>
                  ) : (
                    c.componente(`${name}.${i}.${c.name}`, i, linha)
                  )}
                </Fragment>
              ))}
              {!somenteLeitura && fields.length > minimo && (
                <div className="sm:pt-6">
                  <TButton
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => remove(i)}
                    title="Tirar esta linha da lista"
                    aria-label="Remover linha"
                  >
                    <IconFechar className="size-4" />
                  </TButton>
                </div>
              )}
            </TRow>
            {nota}
          </div>
        )
      })}

      {!somenteLeitura && (
        <div>
          <TButton type="button" variant="secondary" size="sm" onClick={() => append(novaLinha)}>
            <IconAdicionar className="size-4" />
            {rotuloAdicionar}
          </TButton>
        </div>
      )}
    </div>
  )
}
