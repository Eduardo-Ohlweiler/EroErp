import { AUSENTE, formatarDataHora } from '@/utils/format'
import { TEntry } from './TEntry'
import { TCol, TRow } from './TRow'

/** O que o `ResponseDto` de cadastro publica sobre quem gravou (doc 14 §3.2). */
export interface Auditavel {
  criadoPorNome?: string | null
  createdAt?: string | null
  alteradoPorNome?: string | null
  updatedAt?: string | null
}

/**
 * Quem criou e quem alterou, e quando — só na edição, no fim do formulário,
 * só leitura. A linha que não tem dado (registro nunca alterado) não aparece;
 * metade de uma linha sem dado (alterado antes de se guardar quem) mostra o traço.
 */
export function TAuditoria({ registro }: { registro?: Auditavel }) {
  if (!registro) return null
  const criado = !!(registro.criadoPorNome || registro.createdAt)
  const alterado = !!(registro.alteradoPorNome || registro.updatedAt)
  if (!criado && !alterado) return null

  return (
    <div className="flex flex-col gap-4 border-t border-line pt-4">
      {criado && (
        <Linha
          rotuloQuem="Criado por"
          quem={registro.criadoPorNome}
          rotuloQuando="Criado em"
          quando={registro.createdAt}
        />
      )}
      {alterado && (
        <Linha
          rotuloQuem="Alterado por"
          quem={registro.alteradoPorNome}
          rotuloQuando="Alterado em"
          quando={registro.updatedAt}
        />
      )}
    </div>
  )
}

function Linha({
  rotuloQuem,
  quem,
  rotuloQuando,
  quando,
}: {
  rotuloQuem: string
  quem?: string | null
  rotuloQuando: string
  quando?: string | null
}) {
  return (
    <TRow>
      <TCol width="auto">
        <TEntry label={rotuloQuem} value={quem || AUSENTE} readOnly tabIndex={-1} width="medio" />
      </TCol>
      <TCol width="auto">
        <TEntry label={rotuloQuando} value={quando ? formatarDataHora(quando) : AUSENTE} readOnly tabIndex={-1} width="dataHora" />
      </TCol>
    </TRow>
  )
}
