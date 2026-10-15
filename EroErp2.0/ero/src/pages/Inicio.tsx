import type { ComponentType, SVGProps } from 'react'
import { Link } from 'react-router-dom'
import {
  IconLog,
  IconPerfil,
  IconPessoas,
  IconTenants,
  IconUsuarios,
} from '@/assets/icons'
import { TPage } from '@/components/common'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/types/auth'

interface Atalho {
  para: string
  titulo: string
  descricao: string
  Icone: ComponentType<SVGProps<SVGSVGElement>>
  /** Sem roles, todo autenticado vê — o mesmo contrato do menu. */
  roles?: Role[]
}

const ATALHOS: Atalho[] = [
  {
    para: '/app/pessoas',
    titulo: 'Pessoas',
    descricao: 'Clientes, fornecedores e funcionários.',
    Icone: IconPessoas,
  },
  {
    para: '/app/perfil',
    titulo: 'Meu perfil',
    descricao: 'Seus dados e a troca de senha.',
    Icone: IconPerfil,
  },
  {
    para: '/app/usuarios',
    titulo: 'Usuários',
    descricao: 'Acessos ao sistema e o tenant de cada um.',
    Icone: IconUsuarios,
    roles: ['SUPERADMIN'],
  },
  {
    para: '/app/tenants',
    titulo: 'Tenants',
    descricao: 'Clientes do sistema, período de acesso e paleta de cores.',
    Icone: IconTenants,
    roles: ['SUPERADMIN'],
  },
  {
    para: '/app/log-acesso',
    titulo: 'Log de acesso',
    descricao: 'Entradas e tentativas recusadas.',
    Icone: IconLog,
    roles: ['SUPERADMIN'],
  },
]

/**
 * Tela inicial. Por ora, atalhos para o que existe; cada módulo novo que
 * chegar decide se ganha um cartão aqui ou um resumo próprio.
 */
export function Inicio() {
  const { sessao, hasRole } = useAuth()
  const primeiroNome = sessao?.nome.split(' ')[0] ?? ''
  const visiveis = ATALHOS.filter((a) => !a.roles || hasRole(...a.roles))

  return (
    <TPage title={`Olá, ${primeiroNome}`} subtitle={sessao?.tenantNome}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visiveis.map(({ para, titulo, descricao, Icone }) => (
          <Link
            key={para}
            to={para}
            className="flex items-start gap-3 rounded-lg border border-line bg-surface p-4
              transition-colors hover:border-line-strong hover:bg-surface-alt"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-surface-alt text-primary">
              <Icone className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-body font-medium text-txt">{titulo}</span>
              <span className="block text-caption text-txt-secondary">{descricao}</span>
            </span>
          </Link>
        ))}
      </div>
    </TPage>
  )
}
