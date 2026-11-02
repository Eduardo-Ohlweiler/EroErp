import type { ButtonHTMLAttributes, ComponentType, ReactNode, SVGProps } from 'react'
import {
  IconAdicionar,
  IconAnterior,
  IconBloqueado,
  IconBusca,
  IconCheck,
  IconDesbloquear,
  IconEditar,
  IconFechar,
} from '@/assets/icons'
import { useSomenteLeituraDoForm } from './somenteLeitura'

type Generica = 'primary' | 'secondary' | 'ghost' | 'danger'

/** As ações do kit (doc 14 §3.4): ícone, cor e rótulo prontos. */
type Acao = 'salvar' | 'novo' | 'filtrar' | 'limpar' | 'voltar' | 'editar' | 'inativar' | 'reativar'

type Variante = Generica | Acao
type Tamanho = 'md' | 'sm'

interface TButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variante
  size?: Tamanho
  loading?: boolean
  /**
   * O texto do botão. Nas ações, o padrão é o nome da ação ("Salvar");
   * `label=""` deixa só o ícone — o nome vira `aria-label` e dica (grade).
   */
  label?: string
  children?: ReactNode
}

/**
 * `text-txt-inverse` em vez de `text-white` nos botões cheios: no tema escuro
 * a primária é clara (`#5F8FD8`) e texto branco sobre ela dá 3,28:1 —
 * reprovado. Com o inverso (navy) sobe para 6,08:1, e no tema claro o inverso
 * já é branco sobre `#1E4686`, 9,23:1. Um token resolve os dois.
 */
const CORES: Record<Generica | 'perigoLeve', string> = {
  primary:
    'bg-primary text-txt-inverse hover:bg-primary-hover active:bg-primary-active',
  secondary:
    'bg-surface text-txt border border-line-strong hover:bg-surface-alt',
  ghost: 'text-primary hover:bg-surface-alt',
  danger: 'bg-danger text-txt-inverse hover:opacity-90',
  perigoLeve: 'text-danger hover:bg-danger-bg',
}

type Icone = ComponentType<SVGProps<SVGSVGElement>>

const ACOES: Record<Acao, { rotulo: string; cor: keyof typeof CORES; icone: Icone; escreve: boolean }> = {
  salvar: { rotulo: 'Salvar', cor: 'primary', icone: IconCheck, escreve: true },
  filtrar: { rotulo: 'Filtrar', cor: 'primary', icone: IconBusca, escreve: false },
  novo: { rotulo: 'Novo', cor: 'secondary', icone: IconAdicionar, escreve: true },
  limpar: { rotulo: 'Limpar', cor: 'secondary', icone: IconFechar, escreve: false },
  voltar: { rotulo: 'Voltar', cor: 'secondary', icone: IconAnterior, escreve: false },
  editar: { rotulo: 'Editar', cor: 'ghost', icone: IconEditar, escreve: false },
  inativar: { rotulo: 'Inativar', cor: 'perigoLeve', icone: IconBloqueado, escreve: true },
  reativar: { rotulo: 'Reativar', cor: 'ghost', icone: IconDesbloquear, escreve: true },
}

const TAMANHOS: Record<Tamanho, string> = {
  md: 'h-[38px] px-4 text-body',
  sm: 'h-8 px-3 text-caption',
}

const SO_ICONE: Record<Tamanho, string> = {
  md: 'size-[38px]',
  sm: 'size-8',
}

/**
 * Botão. As variantes de ação trazem ícone, cor e rótulo; dentro de um
 * `TForm somenteLeitura`, as que gravam (`salvar`, `novo`, `inativar`,
 * `reativar`) não aparecem — a tela não repete esse `if`.
 *
 * As genéricas (`primary`, `secondary`, `ghost`, `danger`) recebem o texto em
 * `label` ou em `children`.
 */
export function TButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  label,
  disabled,
  className = '',
  children,
  type,
  ...props
}: TButtonProps) {
  const somenteLeitura = useSomenteLeituraDoForm()
  const acao = variant in ACOES ? ACOES[variant as Acao] : undefined
  if (acao?.escreve && somenteLeitura) return null

  const texto = label ?? acao?.rotulo
  const soIcone = !!acao && texto === '' && !children
  const Icone = acao?.icone
  const cor = CORES[acao?.cor ?? (variant as Generica)]

  return (
    <button
      {...props}
      // Ação sem `type` não envia o formulário (Limpar, Voltar); a genérica
      // fica com o padrão do navegador, como sempre foi.
      type={type ?? (acao ? 'button' : undefined)}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-label={props['aria-label'] ?? (soIcone ? acao.rotulo : undefined)}
      title={props.title ?? (soIcone ? acao.rotulo : undefined)}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium
        transition-colors duration-150
        disabled:cursor-not-allowed disabled:opacity-60
        ${cor} ${soIcone ? SO_ICONE[size] : TAMANHOS[size]} ${className}`}
    >
      {loading ? (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        Icone && <Icone className="size-4" />
      )}
      {children ?? texto}
    </button>
  )
}
