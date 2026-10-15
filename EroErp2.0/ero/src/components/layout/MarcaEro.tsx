import logoEro from '@/assets/brand/logo-ero.png'

interface MarcaEroProps {
  /**
   * `menu` para o topo do menu lateral; `destaque` para o 404 público;
   * `faixa` ocupa a largura toda, como cabeçalho de um cartão (o login).
   */
  tamanho?: 'menu' | 'destaque' | 'faixa'
  className?: string
}

/**
 * O logo do EroErp sobre um chip navy.
 *
 * O arquivo é prateado e branco, desenhado para fundo escuro: direto sobre o
 * menu claro ou o fundo do login, o "ero" some. O chip tem cor FIXA (`navy`,
 * não token de tema) de propósito — é o fundo para o qual o logo foi
 * desenhado, e precisa ser o mesmo em toda paleta e nos dois temas.
 *
 * A folha impressa não usa este componente: no papel o chip gastaria tinta, e
 * lá fica o logotipo de texto (`logo-full.svg`).
 */
export function MarcaEro({ tamanho = 'menu', className = '' }: MarcaEroProps) {
  if (tamanho === 'faixa') {
    return (
      <div className={`flex justify-center bg-navy px-6 py-7 ${className}`}>
        <img src={logoEro} alt="EroErp" className="h-auto w-44" />
      </div>
    )
  }

  const chip = tamanho === 'menu' ? 'rounded-md px-3 py-1.5' : 'rounded-lg px-6 py-4'
  const altura = tamanho === 'menu' ? 'h-8' : 'h-16 sm:h-20'

  return (
    <span className={`inline-flex items-center bg-navy ${chip} ${className}`}>
      <img src={logoEro} alt="EroErp" className={`${altura} w-auto`} />
    </span>
  )
}
