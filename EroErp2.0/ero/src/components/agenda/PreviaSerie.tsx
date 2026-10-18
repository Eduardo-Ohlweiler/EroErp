import { useState } from 'react'
import { IconCheck, IconEditar, IconFechar } from '@/assets/icons'
import { TButton } from '@/components/common'
import type { Choque, Ocorrencia } from '@/types/compromisso'
import { chaveDoInstante, diaCurto, diaDe, horaDe, instante } from '@/utils/agenda'

/** Uma data da série na prévia; `alterada` quando o usuário mexeu nela. */
export interface ItemSerie extends Ocorrencia {
  alterada: boolean
}

interface Props {
  itens: ItemSerie[]
  /** Choques de cada data, pela chave do início (`chaveDoInstante`). */
  choques: Map<string, Choque[]>
  /** Quantas o tipo gerou — a diferença para `itens` são as tiradas. */
  geradas: number
  onEditar: (indice: number, nova: Ocorrencia) => void
  onTirar: (indice: number) => void
  onDesfazer: () => void
}

/**
 * As datas da série antes de salvar, cada uma com o seu choque. Dá para mudar
 * o dia e as horas de uma (o lápis) ou tirá-la (o ×) — um feriado no meio da
 * série não vira um compromisso cancelado depois. A última que sobra não sai.
 */
export function PreviaSerie({ itens, choques, geradas, onEditar, onTirar, onDesfazer }: Props) {
  const [editando, setEditando] = useState<number | null>(null)
  const [dia, setDia] = useState('')
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [erro, setErro] = useState('')

  const alteradas = itens.filter((i) => i.alterada).length
  const tiradas = Math.max(0, geradas - itens.length)

  function abrir(i: number) {
    setEditando(i)
    setDia(diaDe(itens[i].inicio))
    setDe(horaDe(itens[i].inicio))
    setAte(horaDe(itens[i].fim))
    setErro('')
  }

  function confirmar() {
    if (editando === null) return
    if (!dia || !de || !ate) return setErro('Informe o dia e as horas')
    if (ate <= de) return setErro('Termina depois de começar')
    onEditar(editando, { inicio: instante(dia, de), fim: instante(dia, ate) })
    setEditando(null)
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption">
        <span className="text-txt-secondary">
          {itens.length} {itens.length === 1 ? 'data' : 'datas'}
          {(alteradas > 0 || tiradas > 0) &&
            ` · ${[
              alteradas > 0 && `${alteradas} ${alteradas === 1 ? 'alterada' : 'alteradas'}`,
              tiradas > 0 && `${tiradas} ${tiradas === 1 ? 'tirada' : 'tiradas'}`,
            ]
              .filter(Boolean)
              .join(' · ')}`}
        </span>
        {(alteradas > 0 || tiradas > 0) && (
          <button type="button" onClick={onDesfazer} className="font-medium text-primary hover:underline">
            Desfazer alterações
          </button>
        )}
      </div>

      <ul className="grid gap-1 text-caption sm:grid-cols-2 lg:grid-cols-3">
        {itens.map((item, i) => {
          const doItem = choques.get(chaveDoInstante(item.inicio)) ?? []
          const tom = doItem.some((c) => c.responsavel)
            ? 'bg-danger-bg text-danger'
            : doItem.length > 0
              ? 'bg-warning-bg text-warning'
              : 'text-txt'

          if (editando === i) {
            return (
              <li
                key={`${item.inicio}-editando`}
                className="flex flex-col gap-2 rounded border border-line-strong bg-surface p-2 sm:col-span-2 lg:col-span-3"
              >
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_7rem]">
                  <label className="flex flex-col gap-1 text-txt-secondary">
                    Dia
                    <input
                      type="date"
                      value={dia}
                      onChange={(e) => setDia(e.target.value)}
                      className="h-9 rounded-md border border-line-strong bg-surface px-2 text-body text-txt"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-txt-secondary">
                    Das
                    <input
                      type="time"
                      value={de}
                      onChange={(e) => setDe(e.target.value)}
                      className="h-9 rounded-md border border-line-strong bg-surface px-2 text-body text-txt"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-txt-secondary">
                    Às
                    <input
                      type="time"
                      value={ate}
                      onChange={(e) => setAte(e.target.value)}
                      className="h-9 rounded-md border border-line-strong bg-surface px-2 text-body text-txt"
                    />
                  </label>
                </div>
                {erro && (
                  <span role="alert" className="text-danger">
                    {erro}
                  </span>
                )}
                <div className="flex gap-2">
                  <TButton type="button" size="sm" onClick={confirmar}>
                    <IconCheck className="size-4" />
                    Aplicar
                  </TButton>
                  <TButton type="button" size="sm" variant="secondary" onClick={() => setEditando(null)}>
                    Cancelar
                  </TButton>
                </div>
              </li>
            )
          }

          return (
            <li key={item.inicio} className={`flex items-center gap-2 rounded py-0.5 pl-2 pr-0.5 ${tom}`}>
              <span className="capitalize">{diaCurto(diaDe(item.inicio))}</span>
              <span className="tabular-nums text-txt-secondary">{horaDe(item.inicio)}</span>
              {item.alterada && (
                <span className="rounded bg-info-bg px-1 text-[11px] text-info">alterada</span>
              )}
              {doItem.length > 0 && <span className="min-w-0 truncate">· {doItem[0].usuarioNome} ocupado</span>}
              <span className="ml-auto flex shrink-0">
                <button
                  type="button"
                  onClick={() => abrir(i)}
                  aria-label={`Mudar ${diaCurto(diaDe(item.inicio))}`}
                  title="Mudar dia e horas"
                  className="grid size-7 place-items-center rounded text-txt-muted hover:bg-surface-alt hover:text-txt"
                >
                  <IconEditar className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onTirar(i)}
                  disabled={itens.length <= 1}
                  aria-label={`Tirar ${diaCurto(diaDe(item.inicio))}`}
                  title={itens.length <= 1 ? 'A última data não sai' : 'Tirar esta data'}
                  className="grid size-7 place-items-center rounded text-txt-muted hover:bg-surface-alt hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <IconFechar className="size-3.5" />
                </button>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
