import LogoEro from '@/assets/brand/logo-ero.svg?react'
import LogoEroHorizontal from '@/assets/brand/logo-ero-horizontal.svg?react'

interface MarcaEroProps {
  /**
   * `menu` para o topo do menu lateral; `destaque` para o 404 público;
   * `faixa` ocupa a largura toda, como cabeçalho de um cartão (o login).
   */
  tamanho?: 'menu' | 'destaque' | 'faixa'
  className?: string
}

/**
 * O logo do EroErp, em vetor que segue o tema.
 *
 * As letras são `currentColor` e o acento (a barra do "e", o arco e as barras
 * do "o") é `--logo-acento`. Inline, o SVG herda os tokens de onde está: no
 * menu, `txt` e `primary` da paleta e do tema da moldura — inclusive nas
 * variantes `_MENU_ESCURO`, cujo `<aside>` tem `data-theme="dark"`. Sem selo:
 * o fundo é o próprio menu, então combina em toda paleta.
 *
 * Login e 404 são públicos, sem tenant: ali o logo fica sobre a faixa `navy`
 * da marca, com `data-theme="dark"` para as letras e o acento virem claros.
 *
 * A folha impressa não usa este componente: lá fica o logotipo de texto
 * (`logo-full.svg`).
 */
export function MarcaEro({ tamanho = 'menu', className = '' }: MarcaEroProps) {
  const cores = 'text-txt [--logo-acento:var(--color-primary)]'

  if (tamanho === 'menu') {
    return <LogoEroHorizontal className={`h-11 w-auto max-w-full ${cores} ${className}`} />
  }

  if (tamanho === 'faixa') {
    return (
      <div data-theme="dark" className={`flex justify-center bg-navy px-6 py-7 ${className}`}>
        <LogoEro className={`h-auto w-44 ${cores}`} />
      </div>
    )
  }

  return (
    <span data-theme="dark" className={`inline-flex items-center rounded-lg bg-navy px-6 py-4 ${className}`}>
      <LogoEro className={`h-16 w-auto sm:h-20 ${cores}`} />
    </span>
  )
}
