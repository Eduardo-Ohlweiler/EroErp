import { AUSENTE } from '@/utils/format'
import type { ReactNode } from 'react'

/**
 * Gravidade de um resultado, atribuída pelo backend — que é quem conhece a
 * régua. A tela só pinta; nunca deduz o tom do texto.
 */
export type TomResultado = 'NEUTRO' | 'ADEQUADO' | 'ATENCAO' | 'CRITICO'

export interface Classificacao {
  tom: TomResultado
  rotulo: string
}

interface TResultProps {
  label: string
  /** Já formatado para exibição. Ausente vira "—" com o motivo. */
  valor?: ReactNode
  unidade?: string
  classificacao?: Classificacao | null
  /** De onde veio o número: a regra, a tabela, o cálculo aplicado. */
  referencia?: string
  /** Por que o valor está ausente. Vem do backend. */
  motivoAusencia?: string | null
  /** Enquanto recalcula, o valor anterior fica visível e esmaecido. */
  recalculando?: boolean
  /**
   * Versão de uma linha, para a faixa de dependência no topo de uma aba — um
   * valor que ela recebeu de outra, e que por isso não compete visualmente com
   * os números dali.
   */
  compacto?: boolean
  className?: string
}

/**
 * Um resultado calculado: valor, unidade, classificação e referência.
 *
 * A referência não é enfeite. Quem decide com base no número precisa saber de
 * onde ele veio — um valor solto na tela não é auditável.
 *
 * **Ausência é explicada, nunca muda.** O traço sozinho faz o usuário achar que
 * o sistema falhou. O motivo vem do backend, que é quem conhece as condições de
 * validade.
 *
 * **Enquanto recalcula, o valor anterior permanece esmaecido** — sumir ou
 * piscar a cada tecla torna a tela impossível de ler.
 */
export function TResult({
  label,
  valor,
  unidade,
  classificacao,
  referencia,
  motivoAusencia,
  recalculando = false,
  compacto = false,
  className = '',
}: TResultProps) {
  /*
   * O traço TAMBÉM é ausência. `formatarNumero(null)` devolve `AUSENTE` — uma
   * string, e portanto um valor "presente" para quem só testasse vazio contra
   * null e "". No projeto de origem isso calou dezenas de motivos que o servidor
   * calculava fielmente. Reconhecer o traço aqui, e não em cada chamada, é o que
   * impede um ponto novo de regredir.
   */
  const vazio = valor === undefined || valor === null || valor === '' || valor === AUSENTE
  const cor = classificacao ? COR_TOM[classificacao.tom] : ''

  if (compacto) {
    return (
      <div
        className={`flex flex-wrap items-baseline gap-x-1.5 transition-opacity duration-150
          ${recalculando ? 'opacity-50' : 'opacity-100'} ${className}`}
      >
        <span className="text-caption text-txt-secondary">{label}</span>
        {vazio ? (
          <span className="text-caption text-txt-muted">{motivoAusencia ?? '—'}</span>
        ) : (
          <>
            <span className="numeric text-body font-semibold text-txt">{valor}</span>
            {unidade && <span className="text-caption text-txt-secondary">{unidade}</span>}
            {referencia && <span className="text-caption text-txt-muted">· {referencia}</span>}
          </>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-caption text-txt-secondary">{label}</span>

      <div
        className={`flex min-h-[38px] flex-wrap items-baseline gap-x-1.5 transition-opacity duration-150
          ${recalculando ? 'opacity-50' : 'opacity-100'}`}
      >
        {classificacao ? (
          <>
            <span className={`text-body font-semibold ${cor}`}>{classificacao.rotulo}</span>
            {/* O número e a classificação convivem: um sem o outro obriga a
                consultar a tabela.

                O `valor !== rotulo` é guarda, não otimização: quem passa o
                rótulo como valor JUNTO da classificação faria a tela imprimir
                o mesmo texto duas vezes. Consertar só os pontos de chamada
                deixa o próximo livre para nascer. */}
            {!vazio && valor !== classificacao.rotulo && (
              <span className="numeric text-caption text-txt-secondary">
                {valor}
                {unidade ? ` ${unidade}` : ''}
              </span>
            )}
          </>
        ) : vazio ? (
          <span className="text-body text-txt-muted">—</span>
        ) : (
          <>
            <span className="numeric text-h3 font-semibold text-txt">{valor}</span>
            {unidade && <span className="text-caption text-txt-secondary">{unidade}</span>}
          </>
        )}
      </div>

      {referencia && !(vazio && motivoAusencia) && (
        <span className="text-caption text-txt-muted">{referencia}</span>
      )}

      {/* O motivo explica uma ausência: ao lado de um número ele mentiria. */}
      {vazio && motivoAusencia && (
        <span className="text-caption text-txt-muted">{motivoAusencia}</span>
      )}
    </div>
  )
}

/**
 * Quatro tons, atribuídos pelo backend. Cor por enum, nunca por texto: colorir
 * com `texto.includes('adequado')` quebra na primeira flexão ("Adequada").
 *
 * `NEUTRO` não é ausência de classificação: é classificação sem juízo de
 * valor. Por isso usa a cor do texto comum em vez de cinza de "vazio".
 *
 * A cor nunca é o único portador: o rótulo diz o mesmo por escrito.
 */
const COR_TOM: Record<TomResultado, string> = {
  NEUTRO: 'text-txt',
  ADEQUADO: 'text-success',
  ATENCAO: 'text-warning',
  CRITICO: 'text-danger',
}
