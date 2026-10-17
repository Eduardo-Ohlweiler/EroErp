import { useCallback, useEffect, useState } from 'react'

const CHAVE = 'ero.menuRecolhido'
const DESKTOP = '(min-width: 1024px)'

function lerPreferencia(): boolean {
  try {
    return localStorage.getItem(CHAVE) === '1'
  } catch {
    return false
  }
}

function gravarPreferencia(recolhido: boolean) {
  try {
    localStorage.setItem(CHAVE, recolhido ? '1' : '0')
  } catch {
    // Navegação privada ou armazenamento bloqueado: vale só nesta aba.
  }
}

function ehCampoEditavel(alvo: EventTarget | null): boolean {
  if (!(alvo instanceof HTMLElement)) return false
  return alvo.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName)
}

/**
 * Menu lateral recolhido (só ícones) a partir de `lg`.
 *
 * Preferência do navegador, não do usuário no servidor: fica no
 * `localStorage`. Abaixo de `lg` o menu é drawer e o recolhido não se aplica —
 * as classes `lg:` cuidam do visual, e `desktop` diz a quem precisa decidir
 * em código (o botão do header, a dica do item).
 *
 * Ctrl+B alterna no desktop, fora de campo editável.
 */
export function useMenuRecolhido() {
  const [recolhido, setRecolhido] = useState(lerPreferencia)
  const [desktop, setDesktop] = useState(() => window.matchMedia(DESKTOP).matches)

  const alternar = useCallback(() => {
    setRecolhido((atual) => {
      gravarPreferencia(!atual)
      return !atual
    })
  }, [])

  useEffect(() => {
    const consulta = window.matchMedia(DESKTOP)
    const aoMudar = (e: MediaQueryListEvent) => setDesktop(e.matches)
    consulta.addEventListener('change', aoMudar)
    return () => consulta.removeEventListener('change', aoMudar)
  }, [])

  useEffect(() => {
    if (!desktop) return
    const aoTeclar = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'b') {
        if (ehCampoEditavel(e.target)) return
        e.preventDefault()
        alternar()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [desktop, alternar])

  return { recolhido, alternar, desktop }
}
