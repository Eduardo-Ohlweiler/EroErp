import type { ReactNode } from 'react'

interface TPageProps {
  title: string
  /** O caminho até a tela, em texto, acima do título: `['Cadastros', 'Produtos']`. */
  breadcrumb?: string[]
  subtitle?: string
  actions?: ReactNode
  /**
   * O que sai no papel — uma `Folha`, não a tela.
   *
   * Quando vem preenchido, **todo o conteúdo de tela para de imprimir**: a
   * folha é o documento, e ela não é um espelho do formulário. Sem ele a
   * página imprime como está, que é o comportamento de quem ainda não tem
   * documento próprio.
   */
  documento?: ReactNode
  /** Mostra o spinner no lugar do conteúdo — a tela não monta spinner. */
  carregando?: boolean
  children: ReactNode
}

export function TPage({
  title,
  breadcrumb,
  subtitle,
  actions,
  documento,
  carregando = false,
  children,
}: TPageProps) {
  // Marcar aqui, e não em cada tela, é o que impede uma delas de ganhar
  // documento e continuar imprimindo o formulário por baixo dele.
  const soTela = documento ? 'nao-imprime' : undefined

  return (
    <div className="flex flex-col gap-5">
      <header
        className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${soTela ?? ''}`}
      >
        <div className="min-w-0">
          {breadcrumb && breadcrumb.length > 0 && (
            <nav aria-label="Caminho" className="mb-1 text-caption text-txt-muted">
              {breadcrumb.join(' › ')}
            </nav>
          )}
          <h1 className="text-h1 font-medium text-txt">{title}</h1>
          {subtitle && <p className="mt-0.5 text-caption text-txt-secondary">{subtitle}</p>}
        </div>
        {/*
          `flex-wrap` porque três ações não cabem lado a lado em 360 px, e o
          `shrink-0` sozinho as empurrava para fora da tela — rolagem
          horizontal, que a regra 6 do projeto proíbe. Telas com uma ou duas
          ações não mudam: a quebra só acontece quando falta largura.
        */}
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </header>

      {carregando ? (
        <div className="grid place-items-center py-20">
          <span
            role="status"
            aria-label="Carregando"
            className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
          />
        </div>
      ) : (
        <div className={`flex flex-col gap-5 ${soTela ?? ''}`}>{children}</div>
      )}

      {!carregando && documento}
    </div>
  )
}
