import type { SVGProps } from 'react'

/**
 * Ícones em SVG inline, num módulo único.
 *
 * Nenhum componente importa ícone de outro lugar — trocar de família é mexer
 * só aqui. Traço de 1.8 para casar com a direção delicada do doc 05, e
 * `currentColor` para herdar a cor do texto nos dois temas.
 */
type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconDashboard = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="3" width="7" height="9" rx="2" />
    <rect x="14" y="3" width="7" height="5" rx="2" />
    <rect x="14" y="12" width="7" height="9" rx="2" />
    <rect x="3" y="16" width="7" height="5" rx="2" />
  </Icon>
)

export const IconUsuarios = (p: IconProps) => (
  <Icon {...p}>
    <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19" />
    <circle cx="10" cy="7.5" r="3.5" />
    <path d="M20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.4 4.6a3.5 3.5 0 0 1 0 5.8" />
  </Icon>
)

export const IconTenants = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 21h18M5 21V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v15M13 21V10h5a1 1 0 0 1 1 1v10" />
    <path d="M8 9h2M8 13h2M8 17h2M16 14h1M16 17h1" />
  </Icon>
)

/** Fachada de loja: a filial. O prédio (`IconTenants`) é o cliente do sistema. */
export const IconFilial = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 10v10h16V10" />
    <path d="M3 10 5 4h14l2 6c0 1.2-1 2-2.2 2s-2.3-.8-2.3-2c0 1.2-1 2-2.25 2S12 11.2 12 10c0 1.2-1 2-2.25 2S7.5 11.2 7.5 10c0 1.2-1 2-2.25 2S3 11.2 3 10Z" />
    <path d="M10 20v-5h4v5" />
  </Icon>
)

/** Chave de boca: o serviço, que se presta e não se estoca. */
export const IconServico = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
  </Icon>
)

/** Caixa fechada: o produto, que se estoca. */
export const IconProduto = (p: IconProps) => (
  <Icon {...p}>
    <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
    <path d="m3 8 9 5 9-5M12 13v8M7.5 5.5l9 5" />
  </Icon>
)

/** Prateleira com caixas: o saldo de cada filial. */
export const IconEstoque = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 21V4M21 21V4M3 12h18M3 21h18" />
    <rect x="6" y="6" width="5" height="6" rx="0.5" />
    <rect x="13" y="8" width="5" height="4" rx="0.5" />
    <rect x="8" y="15" width="6" height="6" rx="0.5" />
  </Icon>
)

/** Setas opostas: o que entrou, saiu ou foi de uma filial a outra. */
export const IconMovimentacao = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />
  </Icon>
)

export const IconLog = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </Icon>
)

export const IconConfiguracoes = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Icon>
)

export const IconPessoas = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
)

export const IconPerfil = IconPessoas

export const IconSair = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </Icon>
)

export const IconMenu = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </Icon>
)

export const IconFechar = (p: IconProps) => (
  <Icon {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
)

export const IconBusca = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
)

export const IconAdicionar = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

export const IconAnterior = (p: IconProps) => (
  <Icon {...p}>
    <path d="m15 18-6-6 6-6" />
  </Icon>
)

export const IconProximo = (p: IconProps) => (
  <Icon {...p}>
    <path d="m9 18 6-6-6-6" />
  </Icon>
)

export const IconSeta = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
)

export const IconCheck = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
)

export const IconBloqueado = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 1 1 8 0v3" />
  </Icon>
)

export const IconDesbloquear = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 7.5-2" />
  </Icon>
)

export const IconAlerta = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 9v4M12 17h.01" />
    <path d="M10.3 3.9 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  </Icon>
)

export const IconVazio = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z" />
    <path d="m3 7.5 9 4.5 9-4.5M12 12v9" />
  </Icon>
)

/** Ficha — a prancheta. */
export const IconFicha = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Z" />
    <path d="M8 6H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2" />
    <path d="M8 11h8" />
    <path d="M8 15h5" />
  </Icon>
)

/** Cadastros auxiliares — o molde a partir do qual as telas trabalham. */
export const IconCadastroAuxiliar = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18" />
    <path d="M9 9v11" />
  </Icon>
)

/** Clonar: a cópia editável de um modelo do sistema. */
export const IconClonar = (p: IconProps) => (
  <Icon {...p}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </Icon>
)

export const IconExcluir = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16" />
    <path d="M10 11v6M14 11v6" />
    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </Icon>
)

/** Reordenar a pergunta no construtor do modelo. */
export const IconSubir = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </Icon>
)

export const IconDescer = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </Icon>
)
