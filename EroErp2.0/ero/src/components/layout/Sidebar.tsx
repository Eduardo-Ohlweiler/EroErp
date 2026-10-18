import { useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'
import type { ComponentType, FocusEvent, MouseEvent, SVGProps } from 'react'
import {
  IconAgenda,
  IconCadastroAuxiliar,
  IconDashboard,
  IconEstoque,
  IconFechar,
  IconFilial,
  IconLog,
  IconMovimentacao,
  IconPessoas,
  IconPerfil,
  IconProduto,
  IconServico,
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
    titulo: 'Atendimento',
    itens: [{ para: '/app/agenda', rotulo: 'Agenda', Icone: IconAgenda, tela: 'AGENDA' }],
  },
  {
    titulo: 'Cadastros',
    itens: [
      { para: '/app/pessoas', rotulo: 'Pessoas', Icone: IconPessoas, tela: 'PESSOAS' },
      { para: '/app/filiais', rotulo: 'Filiais', Icone: IconFilial, tela: 'FILIAIS' },
      { para: '/app/servicos', rotulo: 'Serviços', Icone: IconServico, tela: 'SERVICOS' },
      { para: '/app/produtos', rotulo: 'Produtos', Icone: IconProduto, tela: 'PRODUTOS' },
      {
        para: '/app/auxiliares-produto',
        rotulo: 'Auxiliares de produto',
        Icone: IconCadastroAuxiliar,
        tela: 'AUXILIARES_PRODUTO',
      },
    ],
  },
  {
    titulo: 'Estoque',
    itens: [
      { para: '/app/estoque', rotulo: 'Estoque', Icone: IconEstoque, tela: 'ESTOQUE' },
      {
        para: '/app/estoque-movimentacoes',
        rotulo: 'Movimentações',
        Icone: IconMovimentacao,
        tela: 'ESTOQUE',
      },
    ],
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
  /** Só ícones, a partir de `lg`. Abaixo disso o drawer mostra tudo. */
  recolhido: boolean
  /** A partir de `lg` — só então o recolhido mostra a dica do item. */
  desktop: boolean
  /** 'dark' na variante de menu escuro: a sidebar usa o escuro da paleta. */
  moldura?: 'dark'
}

interface Dica {
  rotulo: string
  top: number
  left: number
}

/**
 * Sidebar clara — o peso invertido da direção visual (docs/05).
 *
 * Fixa a partir de `lg`, onde recolhe para só ícones (248 ↔ 68 px, animando a
 * largura junto com o recuo do conteúdo); abaixo disso vira drawer sobre um
 * overlay, conforme a regra de responsividade.
 *
 * Recolhida, nada sai do DOM: rótulos e títulos de grupo somem por opacidade
 * enquanto a largura anima, e o ícone fica parado no centro dos 68 px — o
 * padding do item é o mesmo nos dois estados. A dica com o rótulo vai por
 * portal ao `body`: o `nav` rola e o `aside` tem `translate`, e os dois
 * prenderiam uma caixa posicionada dentro deles.
 */
export function Sidebar({ aberta, onFechar, recolhido, desktop, moldura }: SidebarProps) {
  const { hasRole, podeLer } = useAuth()
  const [dica, setDica] = useState<Dica | null>(null)
  const comDica = recolhido && desktop

  /**
   * Sem `roles` nem `tela`, todo autenticado vê. Com `roles`, só quem tem o
   * nível; com `tela`, só quem ao menos lê a tela.
   */
  const podeVer = (item: Item) =>
    (!item.roles || hasRole(...item.roles)) && (!item.tela || podeLer(item.tela))

  function mostrarDica(rotulo: string, e: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) {
    if (!comDica) return
    const caixa = e.currentTarget.getBoundingClientRect()
    setDica({ rotulo, top: caixa.top + caixa.height / 2, left: caixa.right + 10 })
  }

  // Some com o rótulo: em transição, a classe `lg:` sozinha não basta — o
  // drawer (abaixo de lg) mostra sempre.
  const someRecolhido = `transition-opacity duration-200 ${recolhido ? 'lg:opacity-0' : ''}`

  return (
    <>
      <div
        onClick={onFechar}
        aria-hidden
        /* Cor fixa de propósito: o scrim escurece o conteúdo nos dois
           temas — não deve clarear junto com a interface. Sempre no DOM,
           para aparecer e sumir com fade. */
        className={`fixed inset-0 z-30 bg-navy/50 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden
          ${aberta ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />

      <aside
        data-theme={moldura}
        className={`fixed inset-y-0 left-0 z-40 flex w-sidebar flex-col overflow-hidden border-r border-line
          bg-sidebar transition-[translate,width] duration-300 ease-out
          lg:translate-x-0 ${recolhido ? 'lg:w-sidebar-min' : ''}
          ${aberta ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="relative flex h-header shrink-0 items-center justify-between px-4">
          <MarcaEro className={`${someRecolhido} ${recolhido ? 'lg:pointer-events-none' : ''}`} />
          {/* O símbolo entra no lugar do logo, centrado nos 68 px. */}
          <MarcaEro
            tamanho="simbolo"
            className={`absolute left-[18px] hidden transition-opacity duration-200 lg:block
              ${recolhido ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          />
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar menu"
            className="grid size-9 place-items-center rounded-md text-txt-secondary hover:bg-surface-alt lg:hidden"
          >
            <IconFechar className="size-5" />
          </button>
        </div>

        <nav
          aria-label="Menu principal"
          onScroll={() => setDica(null)}
          className="flex flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden px-2 py-3"
        >
          {GRUPOS.map((grupo, i) => {
            const visiveis = grupo.itens.filter(podeVer)
            if (visiveis.length === 0) return null

            return (
              <div key={grupo.titulo ?? i} className="flex flex-col gap-0.5">
                {grupo.titulo && (
                  <div className="relative h-6">
                    <p
                      className={`truncate px-3 pb-1 text-caption font-medium uppercase tracking-wide text-txt-muted ${someRecolhido}`}
                    >
                      {grupo.titulo}
                    </p>
                    {/* Recolhido, o título vira um filete: separa o grupo sem texto. */}
                    <span
                      aria-hidden
                      className={`absolute inset-x-3 top-1/2 hidden border-t border-line transition-opacity duration-200 lg:block
                        ${recolhido ? 'opacity-100' : 'opacity-0'}`}
                    />
                  </div>
                )}
                {/* `end` no Início porque o NavLink casa por prefixo — sem
                    ele, /app ficaria ativo em todas as telas do ERP. */}
                {visiveis.map(({ para, rotulo, Icone }) => (
                  <NavLink
                    key={para}
                    to={para}
                    end={para === '/app'}
                    onClick={() => {
                      setDica(null)
                      onFechar()
                    }}
                    aria-label={comDica ? rotulo : undefined}
                    onMouseEnter={(e) => mostrarDica(rotulo, e)}
                    onMouseLeave={() => setDica(null)}
                    onFocus={(e) => mostrarDica(rotulo, e)}
                    onBlur={() => setDica(null)}
                    className={({ isActive }) =>
                      `flex h-10 items-center gap-3 rounded-md pl-4.25 pr-3 text-body whitespace-nowrap transition-colors
                       ${
                         isActive
                           ? 'bg-sidebar-active-bg font-medium text-sidebar-active-text'
                           : 'text-sidebar-text hover:bg-surface-alt hover:text-txt'
                       }`
                    }
                  >
                    <Icone className="size-4.5 shrink-0" />
                    <span className={`min-w-0 truncate ${someRecolhido}`}>{rotulo}</span>
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>
      </aside>

      {comDica &&
        dica &&
        createPortal(
          <div
            role="tooltip"
            style={{ top: dica.top, left: dica.left }}
            className="pointer-events-none fixed z-50 -translate-y-1/2 animate-surgir whitespace-nowrap rounded-sm
              bg-txt px-2.5 py-1.5 text-caption font-medium text-txt-inverse shadow-hover"
          >
            {dica.rotulo}
          </div>,
          document.body,
        )}
    </>
  )
}
