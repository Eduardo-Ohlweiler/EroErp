import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { registrarAcessoNegado, registrarPerdaDeSessao, renovarSessao } from '@/services/api'
import { useTheme } from '@/hooks/useTheme'
import { authService } from '@/services/authService'
import { tokenStore } from '@/services/tokenStore'
import { usuarioService } from '@/services/usuarioService'
import { ehPaletaValida } from '@/styles/paletas'
import type { AuthResponse, LoginRequest, Role, Sessao } from '@/types/auth'
import type { Tela } from '@/types/permissao'

interface AuthContextValor {
  sessao: Sessao | null
  /** true enquanto a sessão é restaurada no boot — evita piscar a tela de login. */
  carregando: boolean
  autenticado: boolean
  login: (dados: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  /** Devolve a sessão nova — quem troca precisa do nome do destino. */
  switchTenant: (tenantId: string) => Promise<Sessao>
  exitTenant: () => Promise<Sessao>
  /** Conveniência visual. A autorização real é o `@PreAuthorize` do backend. */
  hasRole: (...roles: Role[]) => boolean
  /**
   * Permissão por tela, já resolvida pelo servidor (ADMIN e SUPERADMIN têm
   * todas). Também conveniência visual: quem barra é o backend.
   */
  podeLer: (tela: Tela) => boolean
  podeEscrever: (tela: Tela) => boolean
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValor | null>(null)

function paraSessao(resposta: AuthResponse): Sessao {
  return {
    usuarioId: resposta.usuarioId,
    nome: resposta.nome,
    email: resposta.email,
    role: resposta.role,
    tenantId: resposta.tenantId,
    tenantNome: resposta.tenantNome,
    paleta: resposta.paleta,
    impersonating: resposta.impersonating,
    permissoes: resposta.permissoes ?? {},
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null)
  const [carregando, setCarregando] = useState(true)
  const { definirPaleta } = useTheme()

  const aplicar = useCallback((resposta: AuthResponse) => {
    tokenStore.setAccessToken(resposta.accessToken)
    // Na troca de tenant o refresh vem nulo: o token atual continua valendo.
    if (resposta.refreshToken) tokenStore.setRefreshToken(resposta.refreshToken)

    // A cor é do tenant efetivo: na troca de tenant ela muda junto.
    definirPaleta(ehPaletaValida(resposta.paleta) ? resposta.paleta : 'PADRAO')

    const nova = paraSessao(resposta)
    setSessao(nova)
    return nova
  }, [definirPaleta])

  /** Sem sessão não há tenant: a tela de login abre na paleta padrão. */
  const encerrar = useCallback(() => {
    tokenStore.clear()
    setSessao(null)
    definirPaleta('PADRAO')
  }, [definirPaleta])

  /**
   * Restaura a sessão no boot. O access token vive só em memória, então o F5
   * o perde — o refresh token no `localStorage` é o que traz a sessão de volta.
   *
   * Usa `renovarSessao()`, que compartilha a trava com o interceptor. Sem ela,
   * o `StrictMode` monta este efeito duas vezes, as duas reapresentam o mesmo
   * refresh token, e o backend — corretamente — revoga a cadeia inteira
   * tratando como token roubado. O sintoma era cair no login sem motivo.
   */
  useEffect(() => {
    if (!tokenStore.getRefreshToken()) {
      setCarregando(false)
      return
    }

    renovarSessao()
      .then(aplicar)
      .catch(encerrar)
      .finally(() => setCarregando(false))
  }, [aplicar, encerrar])

  /** O interceptor avisa quando a renovação falhou de vez. */
  useEffect(() => registrarPerdaDeSessao(encerrar), [encerrar])

  /**
   * Um 403 pode ser permissão retirada pelo superadmin depois do login — o
   * access token dura 8 h, e a sessão em memória ficaria mostrando o que o
   * servidor já recusa. Relê as permissões para o menu e os botões
   * acompanharem.
   */
  useEffect(
    () =>
      registrarAcessoNegado(() => {
        usuarioService
          .getAcesso()
          .then((permissoes) => setSessao((atual) => (atual ? { ...atual, permissoes } : atual)))
          .catch(() => {})
      }),
    [],
  )

  const valor = useMemo<AuthContextValor>(
    () => ({
      sessao,
      carregando,
      autenticado: sessao !== null,

      login: async (dados) => {
        aplicar(await authService.login(dados))
      },

      logout: async () => {
        try {
          await authService.logout()
        } finally {
          // Mesmo que o logout falhe no servidor, a sessão local morre aqui.
          encerrar()
        }
      },

      switchTenant: async (tenantId) => aplicar(await authService.switchTenant(tenantId)),
      exitTenant: async () => aplicar(await authService.exitTenant()),

      hasRole: (...roles) => {
        if (!sessao) return false
        if (sessao.role === 'SUPERADMIN') return true
        return roles.includes(sessao.role)
      },

      podeLer: (tela) => !!sessao?.permissoes[tela],
      podeEscrever: (tela) => sessao?.permissoes[tela] === 'ESCRITA',
    }),
    [sessao, carregando, aplicar, encerrar],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
