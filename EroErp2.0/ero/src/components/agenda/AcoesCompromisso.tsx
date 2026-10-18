import { useState } from 'react'
import { toast } from 'react-toastify'
import { TButton, TModal, TRadio, TTextArea } from '@/components/common'
import { handleApiError } from '@/services/api'
import { compromissoService } from '@/services/compromissoService'
import type { CompromissoResponse, EscopoCancelamento } from '@/types/compromisso'
import { estaAberto } from '@/utils/agenda'

interface Props {
  compromisso: Pick<CompromissoResponse, 'id' | 'status' | 'inicio' | 'serieId'>
  /** Depois de cada mudança, com o compromisso como ficou. */
  onAlterado: (c: CompromissoResponse) => void
  className?: string
}

/**
 * Os botões de situação — confirmar, concluir, falta, cancelar. Iguais no
 * resumo do calendário e no formulário, para a regra não morar em dois
 * lugares: só aparecem com o compromisso aberto, e "Faltou" só depois do
 * horário de início, como o servidor exige.
 */
export function AcoesCompromisso({ compromisso, onAlterado, className = '' }: Props) {
  const [ocupado, setOcupado] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [escopo, setEscopo] = useState<EscopoCancelamento>('ESTE')

  if (!estaAberto(compromisso.status)) return null
  const jaComecou = new Date(compromisso.inicio).getTime() <= Date.now()

  async function executar(acao: () => Promise<CompromissoResponse>, mensagem: string) {
    setOcupado(true)
    try {
      const c = await acao()
      toast.success(mensagem)
      onAlterado(c)
    } catch (erro) {
      handleApiError(erro)
    } finally {
      setOcupado(false)
    }
  }

  async function cancelar() {
    await executar(
      () => compromissoService.cancelar(compromisso.id, motivo.trim() || undefined, escopo),
      escopo === 'SEGUINTES' ? 'Compromisso e os seguintes cancelados' : 'Compromisso cancelado',
    )
    setCancelando(false)
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {compromisso.status === 'AGENDADO' && (
        <TButton
          type="button"
          variant="secondary"
          size="sm"
          disabled={ocupado}
          onClick={() => executar(() => compromissoService.confirmar(compromisso.id), 'Compromisso confirmado')}
        >
          Confirmar
        </TButton>
      )}
      <TButton
        type="button"
        variant="secondary"
        size="sm"
        disabled={ocupado}
        onClick={() => executar(() => compromissoService.concluir(compromisso.id), 'Compromisso concluído')}
      >
        Concluir
      </TButton>
      {jaComecou && (
        <TButton
          type="button"
          variant="secondary"
          size="sm"
          disabled={ocupado}
          onClick={() => executar(() => compromissoService.faltou(compromisso.id), 'Falta registrada')}
        >
          Faltou
        </TButton>
      )}
      <TButton
        type="button"
        variant="danger"
        size="sm"
        disabled={ocupado}
        onClick={() => {
          setMotivo('')
          setEscopo('ESTE')
          setCancelando(true)
        }}
      >
        Cancelar
      </TButton>

      <TModal
        aberto={cancelando}
        titulo="Cancelar compromisso"
        onFechar={() => setCancelando(false)}
        largura="sm"
        acoes={
          <>
            <TButton type="button" variant="secondary" onClick={() => setCancelando(false)}>
              Voltar
            </TButton>
            <TButton type="button" variant="danger" loading={ocupado} onClick={cancelar}>
              Cancelar compromisso
            </TButton>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {compromisso.serieId && (
            <TRadio
              label="Este compromisso se repete"
              vertical
              value={escopo}
              onChange={(v) => setEscopo(v as EscopoCancelamento)}
              opcoes={[
                { valor: 'ESTE', rotulo: 'Só este' },
                { valor: 'SEGUINTES', rotulo: 'Este e os seguintes ainda abertos' },
              ]}
            />
          )}
          <TTextArea
            label="Motivo (opcional)"
            rows={3}
            maxLength={500}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>
      </TModal>
    </div>
  )
}
