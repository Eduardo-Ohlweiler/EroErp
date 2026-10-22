import axios from 'axios'
import { useEffect, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { handleApiError } from '@/services/api'
import { compromissoService } from '@/services/compromissoService'
import type { Disponibilidade, Ocorrencia, Recorrencia } from '@/types/compromisso'
import { instante } from '@/utils/agenda'
import { HORA } from '@/utils/compromissoForm'

export interface PerguntaDisponibilidade {
  dia: string
  horaInicio: string
  horaFim: string
  responsavelId: string
  convidadoIds: string[]
  /** Só na agenda, ao criar uma série. */
  recorrencia?: Recorrencia | null
  ocorrencias?: Ocorrencia[] | null
}

/**
 * Quem já está ocupado nos horários do formulário, perguntado ao servidor com
 * debounce enquanto se preenche. Nesta superfície um 400 é estado do
 * formulário, que já se mostra nos campos: não vai para o toast.
 *
 * @param desligado formulário travado, ou com a série ainda inválida
 * @param ignorarId o próprio compromisso, ao alterar
 */
export function useDisponibilidade(
  pergunta: PerguntaDisponibilidade,
  desligado: boolean,
  ignorarId?: string,
): Disponibilidade | null {
  const [disponibilidade, setDisponibilidade] = useState<Disponibilidade | null>(null)
  const chave = useDebounce(JSON.stringify(pergunta), 500)

  useEffect(() => {
    const q = JSON.parse(chave) as PerguntaDisponibilidade
    const valido =
      !desligado &&
      /^\d{4}-\d{2}-\d{2}$/.test(q.dia) &&
      HORA.test(q.horaInicio) &&
      HORA.test(q.horaFim) &&
      q.horaFim > q.horaInicio &&
      (q.responsavelId || q.convidadoIds.length > 0)
    if (!valido) {
      setDisponibilidade(null)
      return
    }
    let vigente = true
    compromissoService
      .disponibilidade({
        inicio: instante(q.dia, q.horaInicio),
        fim: instante(q.dia, q.horaFim),
        responsavelId: q.responsavelId || undefined,
        convidadoIds: q.convidadoIds,
        recorrencia: q.recorrencia ?? null,
        ocorrencias: q.recorrencia ? (q.ocorrencias ?? null) : null,
        ignorarId,
      })
      .then((r) => vigente && setDisponibilidade(r))
      .catch((erro) => {
        if (axios.isAxiosError(erro) && erro.response?.status === 400) return
        handleApiError(erro)
      })
    return () => {
      vigente = false
    }
  }, [chave, desligado, ignorarId])

  return disponibilidade
}
