import { useEffect, useState } from 'react'
import { handleApiError } from '@/services/api'
import type { SelectOption } from '@/types/comum'
import type { OpcaoSelect } from './TCombo'

/** Carrega uma vez as opções de um `/select` e as põe no formato `{ valor, rotulo }`. */
export function useOpcoesDoBanco(buscar: () => Promise<SelectOption[]>): OpcaoSelect[] {
  const [opcoes, setOpcoes] = useState<OpcaoSelect[]>([])
  useEffect(() => {
    buscar()
      .then((lista) => setOpcoes(lista.map((o) => ({ valor: o.id, rotulo: o.nome }))))
      .catch(handleApiError)
    // Carrega na montagem: `buscar` é recriada a cada render nos usos comuns.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return opcoes
}
