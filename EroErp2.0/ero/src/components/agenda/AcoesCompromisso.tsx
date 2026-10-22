import { useState } from 'react'
import { toast } from 'react-toastify'
import { TButton, TModal, TRadio, TTextArea } from '@/components/common'
import { handleApiError } from '@/services/api'
import type { AcoesDeSituacao, CompromissoResponse, EscopoCancelamento } from '@/types/compromisso'
import { estaAberto } from '@/utils/agenda'

interface Props<R> {
  compromisso: Pick<CompromissoResponse, 'id' | 'status' | 'inicio' | 'serieId' | 'consultaId'>
  /** Quem executa: `acoesDaAgenda`, ou as da consulta. */
  acoes: AcoesDeSituacao<R>
  /** Depois de cada mudança, com o que a ação devolveu. */
  onAlterado: (r: R) => void
  className?: string
}

/**
 * Os botões de situação — confirmar, concluir, falta, cancelar. Iguais no
 * resumo do calendário, no formulário da agenda e na consulta, para a regra
 * não morar em três lugares: só aparecem com o compromisso aberto, e "Faltou"
 * só depois do horário de início e fora do atendimento, como o servidor
 * exige. Num compromisso que é consulta não há Concluir: conclui-se pela
 * consulta, que baixa o estoque. "Este e os seguintes" só com a ação da
 * série, que é da agenda.
 */
export function AcoesCompromisso<R>({ compromisso, acoes, onAlterado, className = '' }: Props<R>) {
  const [ocupado, setOcupado] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [escopo, setEscopo] = useState<EscopoCancelamento>('ESTE')

  if (!estaAberto(compromisso.status)) return null
  const jaComecou = new Date(compromisso.inicio).getTime() <= Date.now()
  const cancelaSerie = !!compromisso.serieId && !!acoes.cancelarSeguintes

  async function executar(acao: () => Promise<R>, mensagem: string) {
    setOcupado(true)
    try {
      const r = await acao()
      toast.success(mensagem)
      onAlterado(r)
    } catch (erro) {
      handleApiError(erro)
    } finally {
      setOcupado(false)
    }
  }

  async function cancelar() {
    const texto = motivo.trim() || undefined
    await executar(
      () =>
        escopo === 'SEGUINTES' && acoes.cancelarSeguintes
          ? acoes.cancelarSeguintes(compromisso.id, texto)
          : acoes.cancelar(compromisso.id, texto),
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
      {/* Em atendimento a pessoa veio: conclui-se ou cancela-se, falta não */}
      {jaComecou && compromisso.status !== 'EM_ATENDIMENTO' && (
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
          {cancelaSerie && (
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
          {compromisso.serieId && !cancelaSerie && (
            <p className="text-caption text-txt-secondary">
              Cancela só esta data. As outras da série se cancelam pela agenda.
            </p>
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
