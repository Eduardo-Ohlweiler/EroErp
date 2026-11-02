import { useCallback, useRef, useState, type ReactNode } from 'react'
import { TButton } from './TButton'
import { TModal } from './TModal'
import { PerguntaContext, type Pergunta, type Perguntar } from './useQuestion'

const ROTULOS = { inativar: 'Inativar', reativar: 'Reativar', excluir: 'Excluir', confirmar: 'Confirmar' }

/**
 * A janela de confirmação do aplicativo, uma só. Montada uma vez, no `App`;
 * as telas perguntam por `useQuestion()`.
 */
export function TQuestionProvider({ children }: { children: ReactNode }) {
  const [pergunta, setPergunta] = useState<Pergunta>()
  const responder = useRef<(sim: boolean) => void>(undefined)

  const perguntar = useCallback<Perguntar>(
    (nova) =>
      new Promise<boolean>((resolve) => {
        // Uma pergunta aberta que é trocada por outra conta como "não".
        responder.current?.(false)
        responder.current = resolve
        setPergunta(nova)
      }),
    [],
  )

  const fechar = useCallback((sim: boolean) => {
    responder.current?.(sim)
    responder.current = undefined
    setPergunta(undefined)
  }, [])

  const variante = pergunta?.variante ?? 'confirmar'
  const perigo = variante === 'inativar' || variante === 'excluir'

  return (
    <PerguntaContext.Provider value={perguntar}>
      {children}
      <TModal
        aberto={!!pergunta}
        titulo={pergunta?.titulo ?? 'Confirmar'}
        onFechar={() => fechar(false)}
        largura="sm"
        acoes={
          <>
            <TButton variant="secondary" type="button" onClick={() => fechar(false)}>
              Cancelar
            </TButton>
            <TButton
              variant={perigo ? 'danger' : 'primary'}
              type="button"
              autoFocus
              onClick={() => fechar(true)}
            >
              {pergunta?.confirmar ?? ROTULOS[variante]}
            </TButton>
          </>
        }
      >
        <p className="text-body text-txt">{pergunta?.mensagem}</p>
      </TModal>
    </PerguntaContext.Provider>
  )
}
