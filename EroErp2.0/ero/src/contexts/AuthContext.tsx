import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { toast } from 'react-toastify'
import {
  registrarAcessoNegado,
  registrarPerdaDeSessao,
  registrarRenovacao,
  registrarDonoDoToken,
  renovacaoRecusada,
  renovarSessao,
  SessaoEncerradaNestaAba,
  type ComoEncerrar,
  type DonoDoToken,
} from '@/services/api'
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
  /**
   * Encerra só aqui, sem `/auth/logout`: para quando o servidor já derrubou a
   * sessão (troca da própria senha). O logout ali tomaria 401, e o
   * interceptor renovaria com um refresh revogado — falso alarme de reuso.
   */
  encerrarLocal: () => void
  /**
   * Sobe a cada vez que uma renovação devolveu o superadmin ao tenant de
   * origem no meio da navegação. O `Layout` observa e volta ao início: a tela
   * aberta era de outro cliente.
   */
  saidaForcada: number
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
  const [saidaForcada, setSaidaForcada] = useState(0)
  const { definirPaleta } = useTheme()

  /**
   * Usuário e tenant do token em memória, que o interceptor anota em cada
   * requisição. Ref, e não o estado: muda no mesmo instante que o token, sem
   * esperar a próxima renderização.
   */
  const donoDoToken = useRef<DonoDoToken | null>(null)
  useEffect(() => registrarDonoDoToken(() => donoDoToken.current), [])

  const aplicar = useCallback((resposta: AuthResponse) => {
    tokenStore.setAccessToken(resposta.accessToken)
    donoDoToken.current = { usuarioId: resposta.usuarioId, tenantId: resposta.tenantId }
    // Na troca de tenant o refresh vem nulo: o token atual continua valendo.
    if (resposta.refreshToken) tokenStore.setRefreshToken(resposta.refreshToken)

    // A cor é do tenant efetivo: na troca de tenant ela muda junto.
    definirPaleta(ehPaletaValida(resposta.paleta) ? resposta.paleta : 'PADRAO')

    const nova = paraSessao(resposta)
    setSessao(nova)
    return nova
  }, [definirPaleta])

  /**
   * Sem sessão não há tenant: a tela de login abre na paleta padrão.
   * `manterRefresh` é a saída só desta aba (`SessaoEncerradaNestaAba`): a
   * chave pode ser o refresh vivo de outra, e apagá-la a derrubaria.
   */
  const encerrar = useCallback((como: ComoEncerrar = {}) => {
    if (como.manterRefresh) tokenStore.setAccessToken(null)
    else tokenStore.clear()
    donoDoToken.current = null
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
   *
   * Só o refresh recusado apaga o token. Sem rede ou com o servidor fora
   * (deploy, 502), a tela é a do login, mas o refresh fica: o próximo F5, com
   * o servidor de volta, restaura a sessão — e as outras abas não caem junto
   * pelo evento `storage`. O `toastId` junta os dois avisos do `StrictMode`.
   */
  useEffect(() => {
    if (!tokenStore.getRefreshToken()) {
      setCarregando(false)
      return
    }

    renovarSessao()
      .then(aplicar)
      .catch((erro) => {
        if (erro instanceof SessaoEncerradaNestaAba) {
          encerrar({ manterRefresh: true })
          return
        }
        if (renovacaoRecusada(erro)) {
          encerrar()
          return
        }
        toast.error('Não foi possível falar com o servidor para restaurar a sessão. Tente de novo em instantes.', {
          toastId: 'sessao-sem-servidor',
        })
      })
      .finally(() => setCarregando(false))
  }, [aplicar, encerrar])

  /** O interceptor avisa quando a renovação falhou de vez. */
  useEffect(() => registrarPerdaDeSessao(encerrar), [encerrar])

  /** Saiu em outra aba, sai nesta: o refresh token é um só no navegador. */
  useEffect(() => tokenStore.aoSumirEmOutraAba(() => encerrar()), [encerrar])

  /**
   * A renovação que o interceptor aplica passa por `aplicar`, para a tela
   * acompanhar o token novo — e é ele quem decide aplicar: a que chega depois
   * de a sessão ter mudado é descartada lá. Se ela devolveu o superadmin ao
   * tenant de origem, a requisição não foi repetida, e quem estava no meio de
   * uma gravação precisa saber que ela não aconteceu. Só a primeira das que
   * tomaram 401 juntas chega aqui com a volta; o `toastId` fixo é a reserva.
   */
  useEffect(
    () =>
      registrarRenovacao((resposta, voltouAOrigem) => {
        aplicar(resposta)
        if (!voltouAOrigem) return
        toast.warning(
          `A sessão foi renovada e você voltou a ${resposta.tenantNome}. ` +
            'A última ação não foi enviada: entre de novo no cliente para refazê-la.',
          { toastId: 'sessao-voltou-ao-tenant-de-origem' },
        )
        setSaidaForcada((n) => n + 1)
      }),
    [aplicar],
  )

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

      encerrarLocal: () => encerrar(),
      saidaForcada,

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
    [sessao, carregando, saidaForcada, aplicar, encerrar],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
