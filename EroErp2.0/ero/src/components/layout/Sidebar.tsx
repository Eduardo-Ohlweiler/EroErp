import { NavLink } from 'react-router-dom'
import type { ComponentType, SVGProps } from 'react'
import {
  IconDashboard,
  IconFechar,
  IconLog,
  IconPessoas,
  IconPerfil,
  IconTenants,
  IconUsuarios,
} from '@/assets/icons'
import { MarcaEro } from '@/components/layout/MarcaEro'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/types/auth'
import type { Tela } from '@/types/permissao'

interface Item {
  para: string
  rotulo: string
  Icone: ComponentType<SVGProps<SVGSVGElement>>
  /** Sem roles, todo autenticado vê. */
  roles?: Role[]
  /** Tela de módulo de negócio: aparece para quem ao menos a lê. */
  tela?: Tela
}

interface Grupo {
  titulo?: string
  itens: Item[]
}

const GRUPOS: Grupo[] = [
  {
    itens: [{ para: '/app', rotulo: 'Início', Icone: IconDashboard }],
  },
  {
    titulo: 'Cadastros',
    itens: [{ para: '/app/pessoas', rotulo: 'Pessoas', Icone: IconPessoas, tela: 'PESSOAS' }],
  },
  {
    titulo: 'Administração',
    itens: [
      { para: '/app/usuarios', rotulo: 'Usuários', Icone: IconUsuarios, roles: ['SUPERADMIN'] },
      { para: '/app/tenants', rotulo: 'Tenants', Icone: IconTenants, roles: ['SUPERADMIN'] },
      { para: '/app/log-acesso', rotulo: 'Log de acesso', Icone: IconLog, roles: ['SUPERADMIN'] },
    ],
  },
  {
    titulo: 'Conta',
    itens: [{ para: '/app/perfil', rotulo: 'Meu perfil', Icone: IconPerfil }],
  },
]

interface SidebarProps {
  /** Aberta como drawer no mobile. */
  aberta: boolean
  onFechar: () => void
  /** 'dark' na variante de menu escuro: a sidebar usa o escuro da paleta. */
  moldura?: 'dark'
}

/**
 * Sidebar clara — o peso invertido da direção visual (docs/05).
 *
 * Fixa a partir de `lg`; abaixo disso vira drawer sobre um overlay, conforme a
 * regra de responsividade.
 */
export function Sidebar({ aberta, onFechar, moldura }: SidebarProps) {
  const { hasRole, podeLer } = useAuth()

  /**
   * Sem `roles` nem `tela`, todo autenticado vê. Com `roles`, só quem tem o
   * nível; com `tela`, só quem ao menos lê a tela.
   */
  const podeVer = (item: Item) =>
    (!item.roles || hasRole(...item.roles)) && (!item.tela || podeLer(item.tela))

  return (
    <>
      {aberta && (
        <div
          onClick={onFechar}
          aria-hidden
          /* Cor fixa de propósito: o scrim escurece o conteúdo nos dois
             temas — não deve clarear junto com a interface. */
          className="fixed inset-0 z-30 bg-navy/50 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        data-theme={moldura}
        className={`fixed inset-y-0 left-0 z-40 flex w-sidebar flex-col border-r border-line
          bg-sidebar transition-transform duration-200
          lg:translate-x-0
          ${aberta ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-header shrink-0 items-center justify-between px-4">
          <MarcaEro />
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar menu"
            className="grid size-9 place-items-center rounded-md text-txt-secondary hover:bg-surface-alt lg:hidden"
          >
            <IconFechar className="size-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-2 py-3">
          {GRUPOS.map((grupo, i) => {
            const visiveis = grupo.itens.filter(podeVer)
            if (visiveis.length === 0) return null

            return (
              <div key={grupo.titulo ?? i} className="flex flex-col gap-0.5">
                {grupo.titulo && (
                  <p className="px-3 pb-1 text-caption font-medium uppercase tracking-wide text-txt-muted">
                    {grupo.titulo}
                  </p>
                )}
                {/* `end` no Início porque o NavLink casa por prefixo — sem
                    ele, /app ficaria ativo em todas as telas do ERP. */}
                {visiveis.map(({ para, rotulo, Icone }) => (
                  <NavLink
                    key={para}
                    to={para}
                    end={para === '/app'}
                    onClick={onFechar}
                    className={({ isActive }) =>
                      `flex h-10 items-center gap-3 rounded-md px-3 text-body transition-colors
                       ${
                         isActive
                           ? 'bg-sidebar-active-bg font-medium text-sidebar-active-text'
                           : 'text-sidebar-text hover:bg-surface-alt hover:text-txt'
                       }`
                    }
                  >
                    <Icone className="size-4.5 shrink-0" />
                    {rotulo}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
