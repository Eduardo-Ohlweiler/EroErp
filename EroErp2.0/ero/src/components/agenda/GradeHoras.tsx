import { useEffect, useRef, type MouseEvent } from 'react'
import { IconCheck, IconRepetir } from '@/assets/icons'
import type { CompromissoCalendario } from '@/types/compromisso'
import {
  diaDaSemana,
  faixaDeHorario,
  posicionarNoDia,
  STATUS_ROTULO,
  tocaODia,
} from '@/utils/agenda'

/** Altura de uma hora na grade. Meia hora (24 px) ainda cabe uma linha de título. */
const HORA_PX = 48
const HORAS = Array.from({ length: 24 }, (_, h) => h)

interface Props {
  dias: string[]
  itens: CompromissoCalendario[]
  hoje: string
  onAbrir: (item: CompromissoCalendario) => void
  /** Sem ele, o horário vazio não é clicável (quem só lê). */
  onNovo?: (dia: string, hora: string) => void
}

/**
 * Grade de horas do dia e da semana. O bloco tem a altura da duração e os
 * sobrepostos dividem a coluna lado a lado (`posicionarNoDia`). Abre rolada
 * perto da hora atual, ou das 7h — madrugada vazia não ocupa a tela de quem
 * chega.
 */
export function GradeHoras({ dias, itens, hoje, onAbrir, onNovo }: Props) {
  const corpo = useRef<HTMLDivElement>(null)
  const agora = new Date()
  const minutoAgora = agora.getHours() * 60 + agora.getMinutes()

  // Abre no primeiro compromisso do período (ou às 7h, se vem antes ou não há
  // nenhum): o começo do dia é o que se procura, e a madrugada vazia sai da frente.
  const primeiraHora = Math.min(
    7,
    ...itens.filter((i) => dias.some((d) => tocaODia(i, d))).map((i) => new Date(i.inicio).getHours()),
  )
  useEffect(() => {
    if (corpo.current) corpo.current.scrollTop = Math.max(0, primeiraHora - 0.5) * HORA_PX
    // Só ao trocar o período ou ao chegarem os dados: rolar a cada recarga
    // tiraria o usuário de onde está
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dias.join(), itens.length > 0])

  function aoClicarNoDia(e: MouseEvent<HTMLDivElement>, dia: string) {
    if (!onNovo || e.target !== e.currentTarget) return
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top
    const meiaHora = Math.min(47, Math.max(0, Math.floor((y / HORA_PX) * 2)))
    const hora = `${String(Math.floor(meiaHora / 2)).padStart(2, '0')}:${meiaHora % 2 ? '30' : '00'}`
    onNovo(dia, hora)
  }

  const colunas = `3rem repeat(${dias.length}, minmax(0, 1fr))`

  return (
    <div className="overflow-hidden rounded-md border border-line">
      {dias.length > 1 && (
        <div className="grid border-b border-line bg-surface-alt" style={{ gridTemplateColumns: colunas }}>
          <span />
          {dias.map((dia) => (
            <span
              key={dia}
              className={`border-l border-line px-1 py-2 text-center text-caption capitalize
                ${dia === hoje ? 'font-semibold text-primary' : 'text-txt-secondary'}`}
            >
              {diaDaSemana(dia).replace('.', '')} {dia.slice(8, 10)}
            </span>
          ))}
        </div>
      )}

      <div ref={corpo} className="max-h-[68vh] overflow-y-auto">
        <div className="relative grid" style={{ gridTemplateColumns: colunas, height: 24 * HORA_PX }}>
          {/* Régua de horas */}
          <div className="relative">
            {HORAS.map((h) => (
              <span
                key={h}
                className="absolute right-1.5 -translate-y-1/2 text-[11px] text-txt-muted"
                style={{ top: h * HORA_PX }}
              >
                {h > 0 ? `${String(h).padStart(2, '0')}h` : ''}
              </span>
            ))}
          </div>

          {dias.map((dia) => {
            const blocos = posicionarNoDia(itens.filter((i) => tocaODia(i, dia)), dia)
            return (
              <div
                key={dia}
                onClick={(e) => aoClicarNoDia(e, dia)}
                className={`relative border-l border-line ${onNovo ? 'cursor-copy' : ''}
                  ${dia === hoje ? 'bg-primary/[0.03]' : ''}`}
                style={{
                  backgroundImage: `repeating-linear-gradient(to bottom, var(--color-line) 0 1px, transparent 1px ${HORA_PX}px)`,
                }}
              >
                {dia === hoje && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-danger"
                    style={{ top: (minutoAgora / 60) * HORA_PX }}
                  />
                )}

                {blocos.map(({ item, de, ate, coluna, colunas: total }) => {
                  const altura = Math.max(((ate - de) / 60) * HORA_PX - 2, 20)
                  const fechado = item.status === 'CANCELADO' || item.status === 'FALTOU'
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onAbrir(item)}
                      title={`${item.titulo} · ${faixaDeHorario(item.inicio, item.fim)} · ${STATUS_ROTULO[item.status]}`}
                      className={`absolute z-[1] flex flex-col overflow-hidden rounded-sm border-l-[3px] px-1.5 py-0.5
                        text-left text-[12px] leading-tight text-txt hover:z-20 hover:shadow-hover
                        focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-primary
                        ${fechado ? 'opacity-55' : ''}`}
                      style={{
                        top: (de / 60) * HORA_PX + 1,
                        height: altura,
                        left: `calc(${(coluna / total) * 100}% + 2px)`,
                        width: `calc(${100 / total}% - 4px)`,
                        borderLeftColor: item.cor,
                        backgroundColor: `${item.cor}26`,
                      }}
                    >
                      <span
                        className={`flex items-center gap-1 truncate font-medium ${
                          item.status === 'CANCELADO' ? 'line-through' : ''
                        }`}
                      >
                        {item.status === 'CONCLUIDO' && <IconCheck className="size-3 shrink-0" />}
                        {item.recorrente && <IconRepetir className="size-3 shrink-0 text-txt-muted" />}
                        <span className="truncate">{item.titulo}</span>
                      </span>
                      {altura >= 34 && (
                        <span className="truncate text-txt-secondary">
                          {faixaDeHorario(item.inicio, item.fim)}
                          {item.status === 'FALTOU' && ' · faltou'}
                        </span>
                      )}
                      {altura >= 50 && item.pessoaNome && (
                        <span className="truncate text-txt-secondary">{item.pessoaNome}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

