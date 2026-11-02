import { createContext, useContext } from 'react'

/**
 * A escala de larguras do kit de telas (doc 14 §2). A tela passa um destes
 * nomes em `width` — nunca `"50%"`, `"200px"` nem classe Tailwind solta.
 */
export type Largura =
  | 'uf' | 'codigo' | 'hora' | 'quantidade' | 'data' | 'cep' | 'valor' | 'cpf'
  | 'situacao' | 'cnpj' | 'dataHora' | 'curto' | 'medio' | 'metade' | 'longo'

/** Abaixo de `sm` todo campo é 100 %; daqui para cima, o tamanho do dado. */
export const CLASSE_LARGURA: Record<Largura, string> = {
  uf:         'sm:w-20 max-w-full',
  codigo:     'sm:w-32 max-w-full',
  hora:       'sm:w-32 max-w-full',
  quantidade: 'sm:w-32 max-w-full',
  data:       'sm:w-40 max-w-full',
  cep:        'sm:w-40 max-w-full',
  valor:      'sm:w-40 max-w-full',
  cpf:        'sm:w-44 max-w-full',
  situacao:   'sm:w-48 max-w-full',
  cnpj:       'sm:w-52 max-w-full',
  dataHora:   'sm:w-56 max-w-full',
  curto:      'sm:w-56 max-w-full',
  medio:      'sm:w-80 max-w-full',
  metade:     'sm:w-1/2 sm:min-w-64',
  longo:      'sm:w-full sm:min-w-64',
}

/** Verdadeiro dentro de uma `TRow` — é onde a largura padrão do campo vale. */
export const DentroDaLinha = createContext(false)

/**
 * A classe de largura do `div` de fora do campo.
 *
 * Com `width`, sempre. Sem ele, a largura padrão do componente só vale
 * **dentro de uma `TRow`**: as telas que ainda não foram para o kit põem o
 * campo numa célula de `grid`, e lá ele tem de continuar ocupando a célula —
 * senão cada uma encolheria pela metade antes de ser migrada.
 */
export function useLargura(width: Largura | undefined, padrao: Largura | 'conteudo'): string {
  const dentro = useContext(DentroDaLinha)
  const escolhida = width ?? (dentro ? padrao : undefined)
  if (!escolhida) return ''
  if (escolhida === 'conteudo') return 'max-w-full'
  return `w-full ${CLASSE_LARGURA[escolhida]}`
}
