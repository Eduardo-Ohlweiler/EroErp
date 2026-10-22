import { useState } from 'react'
import { toast } from 'react-toastify'
import { TButton, TModal, TRadio, TTextArea } from '@/components/common'
import { handleApiError } from '@/services/api'
import { compromissoService } from '@/services/compromissoService'
import type { CompromissoResponse, EscopoCancelamento } from '@/types/compromisso'
import { estaAberto } from '@/utils/agenda'

/**
 * Quem executa cada ação. O padrão é a agenda (`compromissoService`, tela
 * AGENDA); a consulta passa os dela, que gravam o mesmo compromisso pela
 * tela CONSULTAS. Ação ausente, botão ausente.
 */
export interface AcoesDeSituacao<R> {
  confirmar?: (id: string) => Promise<R>
  concluir?: (id: string) => Promise<R>
  faltou: (id: string) => Promise<R>
  cancelar: (id: string, motivo?: string, escopo?: EscopoCancelamento) => Promise<R>
}

interface Props<R> {
  compromisso: Pick<CompromissoResponse, 'id' | 'status' | 'inicio' | 'serieId' | 'consultaId'>
  /** Depois de cada mudança, com o que a ação devolveu. */
  onAlterado: (r: R) => void
  acoes?: AcoesDeSituacao<R>
  className?: string
}

/**
 * Os botões de situação — confirmar, concluir, falta, cancelar. Iguais no
 * resumo do calendário e no formulário, para a regra não morar em dois
 * lugares: só aparecem com o compromisso aberto, e "Faltou" só depois do
 * horário de início, como o servidor exige. Num compromisso que é consulta
 * não há Concluir: conclui-se pela consulta, que baixa o estoque.
 */
export function AcoesCompromisso<R = CompromissoResponse>({
  compromisso,
  onAlterado,
  acoes = compromissoService as unknown as AcoesDeSituacao<R>,
  className = '',
}: Props<R>) {
  const [ocupado, setOcupado] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [escopo, setEscopo] = useState<EscopoCancelamento>('ESTE')

  if (!estaAberto(compromisso.status)) return null
  const jaComecou = new Date(compromisso.inicio).getTime() <= Date.now()

  async function executar(acao: () => Promise<R>, mensagem: string) {
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
      () => acoes.cancelar(compromisso.id, motivo.trim() || undefined, escopo),
      escopo === 'SEGUINTES' ? 'Compromisso e os seguintes cancelados' : 'Compromisso cancelado',
    )
    setCancelando(false)
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {compromisso.status === 'AGENDADO' && acoes.confirmar && (
        <TButton
          type="button"
          variant="secondary"
          size="sm"
          disabled={ocupado}
          onClick={() => executar(() => acoes.confirmar!(compromisso.id), 'Compromisso confirmado')}
        >
          Confirmar
        </TButton>
      )}
      {!compromisso.consultaId && acoes.concluir && (
        <TButton
          type="button"
          variant="secondary"
          size="sm"
          disabled={ocupado}
          onClick={() => executar(() => acoes.concluir!(compromisso.id), 'Compromisso concluído')}
        >
          Concluir
        </TButton>
      )}
      {jaComecou && (
        <TButton
          type="button"
          variant="secondary"
          size="sm"
          disabled={ocupado}
          onClick={() => executar(() => acoes.faltou(compromisso.id), 'Falta registrada')}
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
