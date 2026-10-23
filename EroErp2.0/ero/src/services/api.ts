import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'react-toastify'
import type { AuthResponse } from '@/types/auth'
import type { ErroResponse } from '@/types/comum'
import { tokenStore } from './tokenStore'

/** Em dev cai no proxy do Vite (`/api` → :8080); em produção, a URL real. */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 30_000,
})

/**
 * De quem é o access token em memória: usuário e tenant efetivo. Os dois,
 * porque o refresh é do navegador — outra aba pode ter entrado com outra
 * pessoa no mesmo tenant, e a renovação devolveria essa outra pessoa.
 */
export interface DonoDoToken {
  usuarioId: string
  tenantId: string
}

const mesmoDono = (a: DonoDoToken | null | undefined, b: DonoDoToken | null | undefined) =>
  (a?.usuarioId ?? null) === (b?.usuarioId ?? null) && (a?.tenantId ?? null) === (b?.tenantId ?? null)

interface RequisicaoRepetivel extends InternalAxiosRequestConfig {
  _jaTentouRenovar?: boolean
  /** De quem era a sessão quando a requisição saiu — ver o interceptor de resposta. */
  _dono?: DonoDoToken | null
}

/** Rotas que não levam token — e que não devem disparar renovação. */
const ROTAS_PUBLICAS = ['/auth/login', '/auth/refresh']

const ehRotaPublica = (url?: string) =>
  !!url && ROTAS_PUBLICAS.some((rota) => url.startsWith(rota))

/** Lido do AuthContext: o dono da sessão em memória, ou nulo sem sessão. */
let donoAtual: (() => DonoDoToken | null) | null = null
export function registrarDonoDoToken(callback: () => DonoDoToken | null) {
  donoAtual = callback
}

api.interceptors.request.use((config: RequisicaoRepetivel) => {
  const token = tokenStore.getAccessToken()
  if (token && !ehRotaPublica(config.url)) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Anotado na saída, e não na volta do 401: uma requisição que tomou 401
  // depois de outra já ter renovado a sessão leria ali o dono novo e seria
  // repetida nele. A repetição pós-renovação passa por aqui de novo e mantém
  // o que já está anotado.
  config._dono ??= donoAtual?.() ?? null
  return config
})

/**
 * **Uma renovação por vez, no navegador inteiro.**
 *
 * O refresh é de uso único com rotação: reapresentar um token já consumido faz
 * o backend revogar toda a cadeia, tratando como roubo. Duas chamadas
 * concorrentes com o mesmo token derrubam a sessão do próprio usuário.
 *
 * Isso acontece em três cenários reais, e por isso a trava é compartilhada:
 *
 * 1. Várias requisições tomando 401 ao mesmo tempo.
 * 2. O `StrictMode` do React, que em desenvolvimento monta o efeito de boot
 *    duas vezes — as duas leriam o mesmo token do `localStorage`.
 * 3. Duas abas, que dividem o mesmo `localStorage`: um F5 nas duas, ou o
 *    access token das duas vencendo junto.
 *
 * A promessa por aba resolve os dois primeiros; a trava do navegador
 * (`navigator.locks`), o terceiro. A leitura e a gravação do refresh ficam
 * **dentro** da trava: a aba que entra depois lê o token que a anterior acabou
 * de girar, e não o que ela consumiu. O access token não se divide — cada aba
 * fica com o seu, e todos seguem válidos.
 */
let renovacaoEmCurso: Promise<AuthResponse> | null = null

export function renovarSessao(): Promise<AuthResponse> {
  renovacaoEmCurso ??= comTravaEntreAbas(executarRenovacao).finally(() => {
    renovacaoEmCurso = null
  })
  return renovacaoEmCurso
}

/**
 * `navigator.locks` só existe em contexto seguro (HTTPS ou localhost). Servido
 * por HTTP em outro endereço, fica só a trava da aba: duas abas renovando no
 * mesmo instante ainda podem se derrubar. A defesa ali é servir por HTTPS, não
 * reinventar uma trava sobre o `localStorage`.
 */
function comTravaEntreAbas<T>(tarefa: () => Promise<T>): Promise<T> {
  const { locks } = navigator as Partial<NavigatorLocks>
  if (!locks) return tarefa()
  return locks.request('ero-renovacao', tarefa)
}

class SemRefreshToken extends Error {
  constructor() {
    super('sem refresh token')
    this.name = 'SemRefreshToken'
  }
}

/**
 * Só o refresh gira aqui, dentro da trava: ele é do navegador. O access token
 * novo fica para quem pediu decidir se aplica (`aplicar` no AuthContext) —
 * uma renovação que chega depois de a sessão ter mudado não pode passar por
 * cima dela.
 */
async function executarRenovacao(): Promise<AuthResponse> {
  let token = tokenStore.getRefreshToken()
  if (!token) throw new SemRefreshToken()

  // Cada volta exige um token que esta renovação ainda não enviou, e há um
  // teto: o laço termina mesmo que o servidor responda a marca para sempre.
  const enviados = new Set<string>()
  for (let tentativa = 1; ; tentativa++) {
    enviados.add(token)
    try {
      return await pedirRenovacao(token)
    } catch (erro) {
      if (!renovadaEmOutraAba(erro)) throw erro
      const novo = tentativa < TENTATIVAS_COM_A_MARCA ? await esperarRefreshInedito(enviados) : null
      if (!novo) throw new SessaoEncerradaNestaAba()
      token = novo
    }
  }
}

async function pedirRenovacao(refreshToken: string): Promise<AuthResponse> {
  // `axios.post` puro: não passa pelos interceptores desta instância
  const { data } = await axios.post<AuthResponse>(
    `${api.defaults.baseURL}/auth/refresh`,
    { refreshToken },
    { timeout: 30_000 },
  )

  if (data.refreshToken) tokenStore.setRefreshToken(data.refreshToken)
  return data
}

/**
 * **A trava não basta: o `localStorage` da outra aba chega atrasado.**
 *
 * Visto no Chrome, com duas abas renovando juntas: a aba B girou `tok-230` →
 * `tok-231`, gravou e soltou a trava (74519 ms); a aba A pegou a trava 1 ms
 * depois e o `getItem` ainda devolveu `tok-230` — às 74522 a mesma chave já
 * valia `231`. O servidor via reuso e revogava a cadeia, e as duas caíam.
 *
 * Agora o servidor tolera: um refresh girado há menos de 10 s volta 401 com
 * `motivo: SESSAO_RENOVADA_EM_OUTRA_ABA`, sem revogar nada. Então se relê a
 * chave — de novo após uma pausa curta, porque a primeira leitura pode estar
 * tão atrasada quanto a que mandou o token velho — e se tenta com o primeiro
 * token **inédito**.
 *
 * Inédito, e não só "diferente do último": com três abas na fila da trava
 * (B, C, A), B gira R0 → R1 e C, com a marca, gira R1 → R2; A leu R0, toma a
 * marca, e a releitura imediata ainda pode devolver R1, que C já consumiu.
 * R1 dá a marca de novo, e A espera pelo R2. Por isso o teto é de tentativas,
 * não uma tentativa só.
 */
const MOTIVO_RENOVADA_EM_OUTRA_ABA = 'SESSAO_RENOVADA_EM_OUTRA_ABA'
const TENTATIVAS_COM_A_MARCA = 4
const RELEITURAS = 3
const PAUSA_ENTRE_RELEITURAS_MS = 25

/**
 * A marca sobrou depois do teto: alguém girou ou revogou este refresh há
 * menos de 10 s, e esta aba não enxerga o token novo. **Só esta aba sai** —
 * a chave fica, porque pode ser o refresh vivo de outra aba, e apagá-la
 * (evento `storage`) derrubaria as que estão funcionando.
 *
 * Custo: se o refresh foi revogado de verdade (senha redefinida pelo
 * superadmin, logout em outro aparelho), a chave morta fica no navegador até
 * a próxima renovação de outra aba — que então toma 401 sem a marca e limpa.
 */
export class SessaoEncerradaNestaAba extends Error {
  constructor() {
    super('A sessão foi renovada em outra aba e não pôde ser lida nesta')
    this.name = 'SessaoEncerradaNestaAba'
  }
}

function renovadaEmOutraAba(erro: unknown): boolean {
  return (
    axios.isAxiosError<ErroResponse>(erro) &&
    erro.response?.status === 401 &&
    erro.response.data?.motivo === MOTIVO_RENOVADA_EM_OUTRA_ABA
  )
}

/** O refresh que outra aba gravou e esta renovação ainda não enviou, ou nulo. */
async function esperarRefreshInedito(enviados: Set<string>): Promise<string | null> {
  for (let i = 0; i <= RELEITURAS; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, PAUSA_ENTRE_RELEITURAS_MS))
    const lido = tokenStore.getRefreshToken()
    if (lido && !enviados.has(lido)) return lido
  }
  return null
}

/**
 * true quando a falha da renovação quer dizer **sessão morta**, e a chave
 * vai junto: não havia refresh, ou o servidor o recusou sem a marca (401 —
 * vencido, revogado, reusado, usuário inativo). A marca que sobra no teto é
 * `SessaoEncerradaNestaAba`, que não entra aqui: sai só a aba, e quem trata
 * confere ela antes. Sem rede, timeout, 429 e 5xx são soluço: o refresh
 * fica, e apagá-lo derrubaria todas as abas (evento `storage`) num deploy.
 */
export function renovacaoRecusada(erro: unknown): boolean {
  if (erro instanceof SemRefreshToken) return true
  return axios.isAxiosError(erro) && erro.response?.status === 401
}

/**
 * A renovação devolveu outro tenant que não o da requisição.
 *
 * O refresh token é o do login, e a troca de tenant não emite outro: renovar
 * no meio de uma navegação como outro cliente devolve o superadmin ao tenant
 * de **origem**. Repetir a requisição ali a mandaria ao cliente errado, então
 * ela não é repetida — rejeita com este erro, que o `handleApiError` ignora,
 * porque o AuthContext já avisou (`registrarRenovacao`).
 */
export class SessaoVoltouAoTenantDeOrigem extends Error {
  readonly tenantNome: string

  constructor(tenantNome: string) {
    super('A sessão foi renovada no tenant de origem')
    this.name = 'SessaoVoltouAoTenantDeOrigem'
    this.tenantNome = tenantNome
  }
}

/**
 * Chamado pelo AuthContext a cada renovação que o interceptor aplica, com a
 * resposta inteira: sem isso, paleta, permissões e tenant da tela ficariam os
 * de antes, com o token novo já valendo para outro. `voltouAOrigem` diz que a
 * sessão mudou de tenant e a requisição foi abandonada
 * (`SessaoVoltouAoTenantDeOrigem`) — é quando se avisa e se sai da tela.
 */
type AoRenovar = (resposta: AuthResponse, voltouAOrigem: boolean) => void
let aoRenovar: AoRenovar | null = null
export function registrarRenovacao(callback: AoRenovar) {
  aoRenovar = callback
}

/**
 * Como a sessão acaba nesta aba. Por padrão leva o refresh junto; com
 * `manterRefresh`, só esta aba sai — ver `SessaoEncerradaNestaAba`.
 */
export interface ComoEncerrar {
  manterRefresh?: boolean
}

/** Chamado pelo AuthContext quando a sessão morre de vez. */
let aoPerderSessao: ((como?: ComoEncerrar) => void) | null = null
export function registrarPerdaDeSessao(callback: (como?: ComoEncerrar) => void) {
  aoPerderSessao = callback
}

/** Chamado pelo AuthContext a cada 403, para reler as permissões. */
let aoNegarAcesso: (() => void) | null = null
export function registrarAcessoNegado(callback: () => void) {
  aoNegarAcesso = callback
}

function perderSessao(como: ComoEncerrar = {}) {
  if (como.manterRefresh) tokenStore.setAccessToken(null)
  else tokenStore.clear()
  aoPerderSessao?.(como)
}

api.interceptors.response.use(
  (resposta) => resposta,
  async (erro: AxiosError<ErroResponse>) => {
    const original = erro.config as RequisicaoRepetivel | undefined

    if (erro.response?.status === 403) aoNegarAcesso?.()

    if (erro.response?.status !== 401 || !original || ehRotaPublica(original.url)) {
      return Promise.reject(erro)
    }

    // Sem refresh token não há como renovar: outra aba saiu, ou a sessão já
    // morreu aqui. Manter o access em memória só adiaria a queda para a
    // próxima tela, sem dizer por quê.
    if (!tokenStore.getRefreshToken()) {
      perderSessao()
      return Promise.reject(erro)
    }

    if (original._jaTentouRenovar) return Promise.reject(erro)

    // Logout, troca e saída de tenant são da sessão, não de um tenant: depois
    // de renovar, sempre se repetem. Abandonar o logout deixaria o refresh
    // novo vivo no servidor; abandonar a troca, o superadmin no lugar errado.
    const deSessao = !!original.url?.startsWith('/auth/')

    // A sessão mudou desde que esta saiu (troca de tenant, outro login, ou
    // outra requisição já renovou e voltou à origem): ela era da tela
    // anterior, e o token atual não tem nada a ver com o 401 dela. Cai calada
    // — o 401 o `handleApiError` já ignora —, sem abrir outra renovação nem
    // outro aviso.
    if (!deSessao && !mesmoDono(original._dono, donoAtual?.())) return Promise.reject(erro)

    original._jaTentouRenovar = true

    let resposta: AuthResponse
    try {
      resposta = await renovarSessao()
    } catch (falha) {
      if (falha instanceof SessaoEncerradaNestaAba) {
        perderSessao({ manterRefresh: true })
        return Promise.reject(erro)
      }
      if (renovacaoRecusada(falha)) {
        perderSessao()
        return Promise.reject(erro)
      }
      // Rede ou servidor fora: o refresh fica para a próxima tentativa, e o
      // erro que sobe é o da renovação, para o `handleApiError` dizer qual.
      return Promise.reject(falha)
    }

    const dono = original._dono
    const sessaoIntacta = mesmoDono(dono, donoAtual?.())

    // O refresh do navegador já é de outra pessoa: outra aba entrou com
    // outro usuário, e a chave é dela. Aplicar trocaria o usuário desta aba
    // em silêncio e repetiria a requisição como ele — inclusive um logout,
    // que encerraria a sessão da outra. Esta aba sai, sem tocar na chave.
    if (dono && resposta.usuarioId !== dono.usuarioId) {
      if (sessaoIntacta) perderSessao({ manterRefresh: true })
      return Promise.reject(erro)
    }

    // Duas decisões, com duas comparações:
    // - aplicar a renovação só se a sessão ainda é a desta requisição. Várias
    //   que tomaram 401 juntas esperam a mesma renovação; a primeira aplica,
    //   e as de outro tenant que vêm depois encontram a sessão já mudada.
    // - repetir só se a renovação devolveu o tenant em que ela saiu.
    const voltouAOrigem = !!dono && resposta.tenantId !== dono.tenantId

    if (sessaoIntacta) aoRenovar?.(resposta, voltouAOrigem && !deSessao)

    if (deSessao) {
      original.headers.Authorization = `Bearer ${resposta.accessToken}`
      return api(original)
    }
    if (!sessaoIntacta) return Promise.reject(erro)
    if (voltouAOrigem) return Promise.reject(new SessaoVoltouAoTenantDeOrigem(resposta.tenantNome))

    original.headers.Authorization = `Bearer ${resposta.accessToken}`
    return api(original)
  },
)

/**
 * Tratamento padrão de erro de API. Usar em todo `catch`.
 *
 * O 401 é omitido de propósito: o interceptor acima já cuidou dele, e mostrar
 * "não autenticado" enquanto a renovação acontece só confunde. A volta ao
 * tenant de origem também: o AuthContext já avisou, uma vez só.
 */
export function handleApiError(erro: unknown): void {
  if (erro instanceof SessaoVoltouAoTenantDeOrigem) return
  if (axios.isAxiosError<ErroResponse>(erro)) {
    const status = erro.response?.status

    if (status === 401) return
    if (status === 403) {
      toast.error('Você não tem permissão para esta ação')
      return
    }
    if (status === 404) {
      toast.error('Registro não encontrado')
      return
    }
    if (!erro.response) {
      toast.error('Não foi possível falar com o servidor')
      return
    }
    toast.error(erro.response.data?.erro ?? 'Falha na comunicação com o servidor')
    return
  }
  toast.error('Erro inesperado')
}
