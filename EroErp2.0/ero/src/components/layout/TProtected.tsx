import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/types/auth'
import type { Tela } from '@/types/permissao'

interface TProtectedProps {
  /** Sem roles, basta estar autenticado. */
  roles?: Role[]
  /** Tela cuja permissão a rota exige: leitura, ou escrita com `escrita`. */
  tela?: Tela
  /** Rota que só existe para gravar (o cadastro novo): exige escrita na tela. */
  escrita?: boolean
}

/**
 * Guarda de rota. É **conveniência de navegação**, não segurança: a autorização
 * real é o `@PreAuthorize` do backend. Esconder rota não protege dado.
 */
export function TProtected({ roles, tela, escrita = false }: TProtectedProps) {
  const { autenticado, carregando, hasRole, podeLer, podeEscrever } = useAuth()
  const location = useLocation()

  // Enquanto a sessão é restaurada pelo refresh token, não decidir nada —
  // senão a tela de login pisca a cada F5 de quem já está logado.
  if (carregando) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg">
        <span
          role="status"
          aria-label="Carregando"
          className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        />
      </div>
    )
  }

  if (!autenticado) {
    // Guarda a query junto: sem ela, quem caiu no login voltava para a lista
    // perdendo página, busca e filtros.
    return (
      <Navigate to="/app/login" replace state={{ de: location.pathname + location.search }} />
    )
  }

  if (roles && !hasRole(...roles)) {
    return <Navigate to="/app" replace />
  }

  if (tela && !(escrita ? podeEscrever(tela) : podeLer(tela))) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
