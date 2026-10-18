import { IconRepetir } from '@/assets/icons'
import { TBadge } from '@/components/common'
import type { CompromissoCalendario } from '@/types/compromisso'
import { diaPorExtenso, faixaDeHorario, STATUS_ROTULO, STATUS_TOM, tocaODia } from '@/utils/agenda'

interface Props {
  dias: string[]
  itens: CompromissoCalendario[]
  hoje: string
  onAbrir: (item: CompromissoCalendario) => void
}

/**
 * Os compromissos em lista, agrupados por dia — a visão que cabe no celular
 * sem perder nada. Dia sem compromisso não ocupa espaço; período vazio diz
 * que está vazio.
 */
export function ListaAgenda({ dias, itens, hoje, onAbrir }: Props) {
  const grupos = dias
    .map((dia) => ({ dia, doDia: itens.filter((i) => tocaODia(i, dia)) }))
    .filter((g) => g.doDia.length > 0)

  if (grupos.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-line px-4 py-8 text-center text-caption text-txt-secondary">
        Nenhum compromisso neste período.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {grupos.map(({ dia, doDia }) => (
        <section key={dia} className="flex flex-col gap-1.5">
          <h3
            className={`text-caption font-semibold first-letter:uppercase ${dia === hoje ? 'text-primary' : 'text-txt-secondary'}`}
          >
            {diaPorExtenso(dia)}
            {dia === hoje && ' · hoje'}
          </h3>
          <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-md border border-line">
            {doDia.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onAbrir(item)}
                  className="flex w-full items-start gap-3 bg-surface px-3 py-2.5 text-left hover:bg-surface-alt"
                >
                  <span className="mt-0.5 h-10 w-1 shrink-0 rounded-full" style={{ backgroundColor: item.cor }} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-caption tabular-nums text-txt-secondary">
                        {faixaDeHorario(item.inicio, item.fim)}
                      </span>
                      {item.status !== 'AGENDADO' && (
                        <TBadge tom={STATUS_TOM[item.status]}>{STATUS_ROTULO[item.status]}</TBadge>
                      )}
                      {item.recorrente && <IconRepetir className="size-3.5 text-txt-muted" aria-label="Recorrente" />}
                    </span>
                    <span
                      className={`truncate font-medium text-txt ${item.status === 'CANCELADO' ? 'line-through opacity-60' : ''}`}
                    >
                      {item.titulo}
                    </span>
                    <span className="truncate text-caption text-txt-secondary">
                      {[item.pessoaNome, item.responsavelNome, item.filialNome].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
