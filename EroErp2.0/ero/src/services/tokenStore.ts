/**
 * Onde os tokens vivem.
 *
 * - **Access token: em memória.** Não vai para `localStorage` — o que está lá é
 *   legível por qualquer script da página, e um XSS levaria a sessão junto.
 *   Custo: recarregar a página perde o access token.
 * - **Refresh token: em `localStorage`.** É o que permite restaurar a sessão
 *   depois do F5. Exposto ao mesmo risco, mas é de uso único e com rotação: se
 *   for roubado e usado, o backend derruba a cadeia inteira na próxima
 *   tentativa legítima.
 */

const CHAVE_REFRESH = 'ero-refresh'

let accessToken: string | null = null

export const tokenStore = {
  getAccessToken: () => accessToken,

  setAccessToken(token: string | null) {
    accessToken = token
  },

  getRefreshToken: () => localStorage.getItem(CHAVE_REFRESH),

  setRefreshToken(token: string | null) {
    if (token) localStorage.setItem(CHAVE_REFRESH, token)
    else localStorage.removeItem(CHAVE_REFRESH)
  },

  clear() {
    accessToken = null
    localStorage.removeItem(CHAVE_REFRESH)
  },

  /**
   * Avisa quando outra aba tira o refresh token do `localStorage` — logout,
   * troca da própria senha ou sessão perdida lá. O evento `storage` só chega
   * às **outras** abas, e o access token desta, em memória, valeria ainda por
   * horas: sem isto, a aba esquecida seguiria logada depois do "Sair".
   * Devolve a função que para de escutar.
   */
  aoSumirEmOutraAba(callback: () => void): () => void {
    const ouvir = (e: StorageEvent) => {
      // `key` nulo é um `localStorage.clear()`, que também leva o refresh
      if (e.storageArea !== localStorage || (e.key !== null && e.key !== CHAVE_REFRESH)) return
      if (!localStorage.getItem(CHAVE_REFRESH)) callback()
    }
    window.addEventListener('storage', ouvir)
    return () => window.removeEventListener('storage', ouvir)
  },
}
