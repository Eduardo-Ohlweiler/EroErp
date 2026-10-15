import { IconCheck } from '@/assets/icons'
import { TBadge } from '@/components/common'
import { PALETAS, type Paleta } from '@/styles/paletas'
import type { PaletaSistema } from '@/types/paleta'

/** Os dois grupos de cartões: as mesmas dez paletas, com a moldura clara ou escura. */
const GRUPOS = [
  {
    titulo: 'Paletas',
    nota: 'Menu e cabeçalho claros, como o conteúdo.',
    menuEscuro: false,
  },
  {
    titulo: 'Com menu e cabeçalho escuros',
    nota: 'As mesmas cores, com o menu lateral e o cabeçalho nos tons escuros da paleta. O conteúdo continua claro.',
    menuEscuro: true,
  },
]

interface SeletorPaletaProps {
  /** A paleta gravada — marcada como "Em uso". Sem ela (tenant novo), nenhuma é. */
  emUso?: PaletaSistema
  /** A marcada no seletor, ainda não aplicada. */
  escolhida: PaletaSistema
  onEscolher: (paleta: PaletaSistema) => void
}

/**
 * As vinte paletas em cartões, cada um com a miniatura clara e a escura.
 *
 * Só escolhe: aplicar é decisão de quem usa o seletor, num botão à parte.
 * Trocar a cor de um cliente inteiro não pode acontecer por um clique de quem
 * só estava olhando as opções.
 */
export function SeletorPaleta({ emUso, escolhida, onEscolher }: SeletorPaletaProps) {
  return (
    <>
      {GRUPOS.map((grupo) => (
        <fieldset key={grupo.titulo} className="mt-6 first:mt-0">
          <legend className="mb-1 text-h3 font-medium text-txt">{grupo.titulo}</legend>
          <p className="mb-3 text-caption text-txt-secondary">{grupo.nota}</p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {PALETAS.filter((p) => p.menuEscuro === grupo.menuEscuro).map((p) => (
              <CartaoPaleta
                key={p.chave}
                paleta={p}
                emUso={p.chave === emUso}
                selecionada={p.chave === escolhida}
                onEscolher={() => onEscolher(p.chave)}
              />
            ))}
          </div>
        </fieldset>
      ))}
    </>
  )
}

interface CartaoPaletaProps {
  paleta: Paleta
  emUso: boolean
  selecionada: boolean
  onEscolher: () => void
}

/**
 * Rádio nativo escondido dentro de um rótulo: o teclado (setas, Tab, espaço)
 * vem do navegador, e o cartão inteiro é a área de clique.
 */
function CartaoPaleta({ paleta, emUso, selecionada, onEscolher }: CartaoPaletaProps) {
  return (
    <label
      className={`flex cursor-pointer flex-col gap-3 rounded-lg border bg-surface p-3 transition-colors
        has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary
        ${selecionada ? 'border-primary ring-1 ring-primary' : 'border-line hover:border-line-strong'}`}
    >
      <input
        type="radio"
        name="paleta"
        value={paleta.chave}
        checked={selecionada}
        onChange={onEscolher}
        className="sr-only"
      />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="block text-h3 font-medium text-txt">{paleta.rotulo}</span>
          <span className="block text-caption text-txt-secondary">{paleta.descricao}</span>
        </div>
        {emUso && (
          <TBadge tom="sucesso" icone={<IconCheck className="size-3.5" />}>
            Em uso
          </TBadge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Miniatura atributo={paleta.atributo} tema="light" menuEscuro={paleta.menuEscuro} />
        <Miniatura atributo={paleta.atributo} tema="dark" menuEscuro={paleta.menuEscuro} />
      </div>
    </label>
  )
}

/**
 * A tela em miniatura, pintada pelo **CSS de verdade**: `data-theme` e
 * `data-paleta` no próprio elemento, e as variáveis do `theme.css` valem na
 * subárvore. Nenhuma cor é repetida aqui.
 *
 * Todo elemento com tema leva também o seu `data-paleta` — a Padrão leva
 * "padrao", que não casa com bloco nenhum. Sem isso a moldura escura de uma
 * miniatura herdaria a paleta do `<html>` que a contém: o seletor da moldura
 * (`[data-paleta] [data-theme=dark]`) casa com qualquer ancestral, e é o
 * `:not([data-paleta])` dele que deixa a miniatura de fora.
 */
function Miniatura({
  atributo,
  tema,
  menuEscuro,
}: {
  atributo: string | null
  tema: 'light' | 'dark'
  menuEscuro: boolean
}) {
  const paleta = atributo ?? 'padrao'
  const moldura = menuEscuro ? { 'data-theme': 'dark', 'data-paleta': paleta } : {}

  return (
    <div className="flex flex-col gap-1">
      <div
        data-theme={tema}
        data-paleta={paleta}
        aria-hidden
        className="flex h-24 overflow-hidden rounded-md border border-line bg-bg text-txt"
      >
        <div {...moldura} className="flex w-[38%] flex-col gap-1 border-r border-line bg-sidebar p-1.5">
          <span className="h-1.5 w-3/4 rounded-full bg-txt" />
          <span className="mt-1 truncate rounded bg-sidebar-active-bg px-1 text-[10px] leading-4 text-sidebar-active-text">
            Início
          </span>
          <span className="truncate px-1 text-[10px] leading-4 text-sidebar-text">Pessoas</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            {...moldura}
            className={`flex h-3.5 shrink-0 items-center justify-end gap-1 border-b border-line px-1.5 ${menuEscuro ? 'bg-sidebar' : 'bg-surface'}`}
          >
            <span className="h-1 w-5 rounded-full bg-txt-secondary" />
            <span className="size-1.5 rounded-full bg-txt-secondary" />
          </div>
          <div className="p-1.5">
            <div className="rounded border border-line bg-surface p-1.5">
              <span className="block truncate text-[11px] font-medium leading-4 text-txt">Cliente</span>
              <span className="block truncate text-[10px] leading-4 text-txt-secondary">R$ 1.850,00</span>
              <span className="mt-1 inline-block rounded bg-primary px-1.5 text-[10px] leading-4 text-txt-inverse">
                Salvar
              </span>
            </div>
          </div>
        </div>
      </div>
      <span className="text-center text-caption text-txt-secondary">
        {tema === 'light' ? 'Claro' : 'Escuro'}
      </span>
    </div>
  )
}
