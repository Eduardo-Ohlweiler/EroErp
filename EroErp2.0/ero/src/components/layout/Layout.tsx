import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { IconAlerta, IconMenu, IconSair } from '@/assets/icons'
import { useAuth } from '@/hooks/useAuth'
import { useMenuRecolhido } from '@/hooks/useMenuRecolhido'
import { useTheme } from '@/hooks/useTheme'
import { paletaPorChave } from '@/styles/paletas'
import { ROLE_LABEL } from '@/types/auth'
import { Sidebar } from './Sidebar'
import { TenantSwitcher } from './TenantSwitcher'
import { TThemeToggle } from '../common/TThemeToggle'

export function Layout() {
  const { sessao, logout } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)
  const { recolhido, alternar, desktop } = useMenuRecolhido()
  const { paleta } = useTheme()

  // Variante de menu e cabeçalho escuros (docs/05 §11.6): a moldura usa os
  // tokens do escuro da paleta. No tema escuro ela já é escura — o atributo
  // só repete o que o <html> diz.
  const moldura = paletaPorChave(paleta).menuEscuro ? 'dark' : undefined
  // Com a moldura escura, o cabeçalho tem o tom do menu: um degrau mais claro
  // que ele abriria uma emenda no canto do logo.
  const fundoMoldura = moldura ? 'bg-sidebar' : 'bg-surface'

  // Esc fecha o drawer.
  useEffect(() => {
    if (!menuAberto) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAberto(false)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [menuAberto])

  // Um botão, dois papéis: abaixo de lg abre o drawer; a partir de lg
  // recolhe e expande o menu fixo.
  const rotuloMenu = desktop ? (recolhido ? 'Expandir menu' : 'Recolher menu') : 'Abrir menu'

  return (
    <div className="min-h-dvh bg-bg">
      <Sidebar
        aberta={menuAberto}
        onFechar={() => setMenuAberto(false)}
        recolhido={recolhido}
        desktop={desktop}
        moldura={moldura}
      />

      {/* Deslocado pela sidebar só a partir de lg, onde ela é fixa; o recuo
          anima junto com a largura dela. */}
      <div
        className={`conteudo-da-aplicacao transition-[padding-left] duration-300 ease-out
          ${recolhido ? 'lg:pl-sidebar-min' : 'lg:pl-sidebar'}`}
      >
        {sessao?.impersonating && (
          <div className="nao-imprime flex items-center justify-center gap-2 bg-warning-bg px-4 py-2 text-center text-caption text-warning">
            <IconAlerta className="size-4 shrink-0" />
            <span>
              Você está navegando como o tenant{' '}
              <strong>&ldquo;{sessao.tenantNome}&rdquo;</strong>.
            </span>
          </div>
        )}

        <header
          data-theme={moldura}
          className={`nao-imprime sticky top-0 z-20 flex h-header items-center gap-3 border-b border-line px-4 sm:px-6 ${fundoMoldura}`}>
          <button
            type="button"
            onClick={() => (desktop ? alternar() : setMenuAberto(true))}
            aria-label={rotuloMenu}
            aria-expanded={desktop ? !recolhido : menuAberto}
            title={desktop ? `${rotuloMenu} (Ctrl+B)` : undefined}
            className="grid size-9 shrink-0 place-items-center rounded-md text-txt-secondary transition-colors hover:bg-surface-alt hover:text-txt"
          >
            <IconMenu className="size-5" />
          </button>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:block">
              <TenantSwitcher />
            </div>

            <div className="hidden text-right leading-tight md:block">
              <p className="text-body text-txt">{sessao?.nome}</p>
              <p className="text-caption text-txt-secondary">
                {sessao && ROLE_LABEL[sessao.role]}
              </p>
            </div>

            <TThemeToggle />

            <button
              type="button"
              onClick={() => void logout()}
              title="Sair"
              aria-label="Sair"
              className="grid size-9 place-items-center rounded-md text-txt-secondary
                transition-colors hover:bg-danger-bg hover:text-danger"
            >
              <IconSair className="size-5" />
            </button>
          </div>
        </header>

        {/* Seletor de tenant abaixo do header no mobile, onde não cabe ao lado */}
        {sessao?.role === 'SUPERADMIN' && (
          <div data-theme={moldura} className={`nao-imprime border-b border-line px-4 py-2 lg:hidden ${fundoMoldura}`}>
            <TenantSwitcher />
          </div>
        )}

        <main className="mx-auto w-full max-w-350 p-4 sm:p-6">
          {/* Nada de cabeçalho de papel aqui: quem carrega marca, cliente e
              data é a própria `Folha` de cada documento. Um cabeçalho global
              apareceria por cima dela, duplicado. */}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
