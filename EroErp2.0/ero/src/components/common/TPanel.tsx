import type { ReactNode } from 'react'

interface TPanelProps {
  title?: string
  /**
   * A nota que qualifica o título — procedência, ressalva, ou o recorte que o
   * painel mostra.
   *
   * <p>A ressalva que fica de fora vira rodapé em letra miúda que ninguém lê,
   * e sem ela um número pode ser lido ao contrário — "60 % da meta" é ótimo na
   * primeira semana do mês e problema na última.
   */
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * No tema claro a elevação vem da sombra difusa, e a borda é quase invisível
 * (`#EAEEF6`). No escuro a sombra não aparece — fundo escuro engole sombra —
 * então é a borda (`#16305A`) que desenha a aresta do card. A mesma classe
 * serve os dois: quem muda é o token.
 */
export function TPanel({ title, subtitle, actions, children, className = '' }: TPanelProps) {
  return (
    <section
      className={`rounded-lg border border-line bg-surface p-5 shadow-card ${className}`}
    >
      {(title || actions) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          {title && (
            <div className="min-w-0">
              <h2 className="text-h2 font-medium text-txt">{title}</h2>
              {subtitle && (
                <p className="mt-0.5 text-caption text-txt-secondary">{subtitle}</p>
              )}
            </div>
          )}
          {actions}
        </header>
      )}
      {children}
    </section>
  )
}
