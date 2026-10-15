import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ehPaletaValida, paletaPorChave } from '@/styles/paletas'
import type { PaletaSistema } from '@/types/paleta'

export type Tema = 'light' | 'dark'

const CHAVE = 'ero-tema'
const CHAVE_PALETA = 'ero-paleta'

interface ThemeContextValor {
  /** Claro ou escuro — escolha de cada usuário, salva no navegador. */
  tema: Tema
  alternar: () => void
  definir: (tema: Tema) => void
  /**
   * Paleta de cores do tenant efetivo. Quem a define é a sessão
   * (`AuthContext`): chega no login e na troca de tenant, e volta à padrão ao
   * sair — a tela de login não sabe o tenant.
   */
  paleta: PaletaSistema
  definirPaleta: (paleta: PaletaSistema) => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<ThemeContextValor | null>(null)

function temaInicial(): Tema {
  const salvo = localStorage.getItem(CHAVE)
  if (salvo === 'light' || salvo === 'dark') return salvo
  // Sem escolha registrada, abre no CLARO: é o tema da marca.
  // Não seguimos `prefers-color-scheme` — quem quiser o escuro alterna, e a
  // escolha fica salva.
  return 'light'
}

/**
 * O cache só serve para o F5 dentro do sistema não piscar — quem manda é a
 * sessão, restaurada logo em seguida. O `index.html` lê a mesma chave antes do
 * React montar.
 */
function paletaInicial(): PaletaSistema {
  const salva = localStorage.getItem(CHAVE_PALETA)
  return ehPaletaValida(salva) ? salva : 'PADRAO'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(temaInicial)
  const [paleta, setPaleta] = useState<PaletaSistema>(paletaInicial)

  useEffect(() => {
    const raiz = document.documentElement
    raiz.dataset.theme = tema
    localStorage.setItem(CHAVE, tema)

    // A padrão não tem atributo: sem ele valem os blocos originais do theme.css.
    const atributo = paletaPorChave(paleta).atributo
    if (atributo) raiz.dataset.paleta = atributo
    else delete raiz.dataset.paleta
    localStorage.setItem(CHAVE_PALETA, paleta)

    // A barra do navegador no mobile acompanha o canvas — lido do próprio CSS,
    // para não haver um hex aqui que discorde do theme.css.
    const fundo = getComputedStyle(raiz).getPropertyValue('--bg').trim()
    if (fundo) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', fundo)
  }, [tema, paleta])

  const definir = useCallback((novo: Tema) => setTema(novo), [])
  const alternar = useCallback(() => setTema((t) => (t === 'dark' ? 'light' : 'dark')), [])
  const definirPaleta = useCallback((nova: PaletaSistema) => setPaleta(nova), [])

  const valor = useMemo(
    () => ({ tema, alternar, definir, paleta, definirPaleta }),
    [tema, alternar, definir, paleta, definirPaleta],
  )

  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>
}
