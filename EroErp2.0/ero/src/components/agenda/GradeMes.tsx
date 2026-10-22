import { IconConsulta } from '@/assets/icons'
import type { CompromissoCalendario } from '@/types/compromisso'
import { horaDe, tocaODia } from '@/utils/agenda'

const SEMANA = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']

interface Props {
  /** Os 42 dias da grade, de segunda a domingo. */
  dias: string[]
  /** `AAAA-MM` do mês mostrado — os dias de fora aparecem apagados. */
  mes: string
  itens: CompromissoCalendario[]
  hoje: string
  selecionado: string
  /** O clique no dia (fora de um compromisso). */
  onSelecionarDia: (dia: string) => void
  onAbrir: (item: CompromissoCalendario) => void
  /** O "+N mais": ver todos os compromissos do dia. */
  onVerDia: (dia: string) => void
  /** Celular: em vez dos títulos, um ponto por compromisso. */
  compacto: boolean
}

/**
 * O mês. No desktop cada dia mostra até três compromissos e um "+N mais"; no
 * celular, pontos. O clique no dia e no compromisso é de quem usa a grade —
 * na Agenda, abrem o cadastro e o formulário.
 */
export function GradeMes({
  dias,
  mes,
  itens,
  hoje,
  selecionado,
  onSelecionarDia,
  onAbrir,
  onVerDia,
  compacto,
}: Props) {
  const visiveis = itens.filter((i) => i.status !== 'CANCELADO')

  return (
    <div className="overflow-hidden rounded-md border border-line">
      <div className="grid grid-cols-7 border-b border-line bg-surface-alt">
        {SEMANA.map((d) => (
          <span key={d} className="py-2 text-center text-caption text-txt-secondary">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {dias.map((dia, i) => {
          const doDia = visiveis.filter((item) => tocaODia(item, dia))
          const foraDoMes = !dia.startsWith(mes)
          return (
            <div
              key={dia}
              role="button"
              tabIndex={0}
              onClick={() => onSelecionarDia(dia)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelecionarDia(dia)}
              aria-label={`${dia.slice(8, 10)}, ${doDia.length} compromisso(s)`}
              className={`flex min-w-0 cursor-pointer flex-col gap-0.5 border-line p-1 text-left
                ${i % 7 ? 'border-l' : ''} ${i >= 7 ? 'border-t' : ''}
                ${compacto ? 'min-h-12 items-center' : 'min-h-24'}
                ${foraDoMes ? 'bg-surface-alt/60 text-txt-muted' : ''}
                ${dia === selecionado && compacto ? 'bg-primary/10' : ''}
                hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-primary`}
            >
              <span
                className={`grid size-6 place-items-center rounded-full text-caption
                  ${dia === hoje ? 'bg-primary font-semibold text-txt-inverse' : ''}`}
              >
                {Number(dia.slice(8, 10))}
              </span>

              {compacto ? (
                doDia.length > 0 && (
                  <span className="flex flex-wrap justify-center gap-0.5">
                    {doDia.slice(0, 4).map((item) => (
                      <span key={item.id} className="size-1.5 rounded-full" style={{ backgroundColor: item.cor }} />
                    ))}
                  </span>
                )
              ) : (
                <>
                  {doDia.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onAbrir(item)
                      }}
                      className={`flex min-w-0 items-center gap-1 rounded-sm px-1 text-[11px] leading-5 text-txt hover:bg-surface
                        ${item.status === 'FALTOU' ? 'opacity-55' : ''}`}
                    >
                      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: item.cor }} />
                      <span className="shrink-0 text-txt-secondary">{horaDe(item.inicio)}</span>
                      {item.consultaId && <IconConsulta className="size-3 shrink-0 text-txt-secondary" aria-label="Consulta" />}
                      <span className="truncate">{item.titulo}</span>
                    </button>
                  ))}
                  {doDia.length > 3 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        // Ver os outros do dia, não abrir o cadastro
                        e.stopPropagation()
                        onVerDia(dia)
                      }}
                      className="self-start rounded-sm px-1 text-[11px] text-txt-secondary hover:bg-surface hover:text-primary"
                    >
                      +{doDia.length - 3} mais
                    </button>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
