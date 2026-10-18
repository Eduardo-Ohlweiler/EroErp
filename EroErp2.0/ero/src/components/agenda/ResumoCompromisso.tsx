import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { TBadge, TButton, TModal } from '@/components/common'
import { AcoesCompromisso } from '@/components/agenda/AcoesCompromisso'
import { handleApiError } from '@/services/api'
import { compromissoService } from '@/services/compromissoService'
import type { CompromissoResponse } from '@/types/compromisso'
import { diaDe, diaPorExtenso, estaAberto, faixaDeHorario, STATUS_ROTULO, STATUS_TOM } from '@/utils/agenda'

interface Props {
  /** O compromisso a mostrar; nulo, fechado. */
  id: string | null
  onFechar: () => void
  /** Depois de uma mudança de situação — o calendário recarrega. */
  onAlterado: () => void
  podeEscrever: boolean
}

/** O que se vê ao tocar num compromisso do calendário, com as ações de situação. */
export function ResumoCompromisso({ id, onFechar, onAlterado, podeEscrever }: Props) {
  const navigate = useNavigate()
  const [c, setC] = useState<CompromissoResponse | null>(null)

  useEffect(() => {
    setC(null)
    if (!id) return
    compromissoService.findById(id).then(setC).catch((e) => {
      handleApiError(e)
      onFechar()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <TModal
      aberto={!!id}
      titulo={c?.titulo ?? 'Compromisso'}
      onFechar={onFechar}
      largura="sm"
      acoes={
        c && (
          <>
            <TButton type="button" variant="secondary" onClick={onFechar}>
              Fechar
            </TButton>
            <TButton type="button" onClick={() => navigate(`/app/agenda/${c.id}`)}>
              {podeEscrever && estaAberto(c.status) ? 'Editar' : 'Abrir'}
            </TButton>
          </>
        )
      }
    >
      {!c ? (
        <div className="grid place-items-center py-8">
          <span
            role="status"
            aria-label="Carregando"
            className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <TBadge tom={STATUS_TOM[c.status]}>{STATUS_ROTULO[c.status]}</TBadge>
            {c.serieId && <TBadge tom="neutro">Recorrente</TBadge>}
          </div>

          <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-body">
            <Linha rotulo="Quando">
              <span className="first-letter:uppercase">{diaPorExtenso(diaDe(c.inicio))}</span>
              <br />
              {faixaDeHorario(c.inicio, c.fim)}
            </Linha>
            <Linha rotulo="Responsável">{c.responsavelNome}</Linha>
            {c.convidados.length > 0 && (
              <Linha rotulo="Convidados">{c.convidados.map((cv) => cv.nome).join(', ')}</Linha>
            )}
            {c.pessoaNome && <Linha rotulo="Cliente">{c.pessoaNome}</Linha>}
            <Linha rotulo="Filial">
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: c.corExibicao }} />
                {c.filialNome}
              </span>
            </Linha>
            {c.descricao && <Linha rotulo="Descrição">{c.descricao}</Linha>}
            {c.motivoCancelamento && <Linha rotulo="Motivo">{c.motivoCancelamento}</Linha>}
          </dl>

          {podeEscrever && (
            <AcoesCompromisso
              compromisso={c}
              onAlterado={(novo) => {
                setC(novo)
                onAlterado()
              }}
            />
          )}
        </div>
      )}
    </TModal>
  )
}

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-caption text-txt-secondary">{rotulo}</dt>
      <dd className="m-0 min-w-0 break-words text-txt">{children}</dd>
    </>
  )
}
