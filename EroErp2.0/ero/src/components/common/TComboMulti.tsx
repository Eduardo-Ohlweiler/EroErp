import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { IconBusca, IconFechar } from '@/assets/icons'
import { useDebounce } from '@/hooks/useDebounce'
import { handleApiError } from '@/services/api'
import type { SelectOption } from '@/types/comum'

interface TComboMultiProps {
  label: string
  /** Os escolhidos, com o nome — o chip precisa dele sem nova busca. */
  value: SelectOption[]
  onChange: (valor: SelectOption[]) => void
  /** Busca no servidor (um `/select`). Recebe `undefined` na carga inicial. */
  buscar: (termo?: string) => Promise<SelectOption[]>
  /** Ids que não podem ser escolhidos aqui — ex.: o responsável entre os convidados. */
  excluir?: string[]
  /** Teto de escolhas; atingido, a busca some. */
  maximo?: number
  placeholder?: string
  error?: string
  ajuda?: string
  className?: string
  disabled?: boolean
}

/**
 * O {@link TCombo} para vários: cada escolhido vira um chip removível, e a
 * busca continua embaixo. Mesma busca no servidor com debounce, mesmo
 * teclado (↓/↑, Enter, Esc); Backspace com a busca vazia tira o último chip.
 */
export function TComboMulti({
  label,
  value,
  onChange,
  buscar,
  excluir = [],
  maximo,
  placeholder = 'Busque para acrescentar…',
  error,
  ajuda,
  className = '',
  disabled = false,
}: TComboMultiProps) {
  const idBase = useId()
  const idInput = `${idBase}-input`
  const idLista = `${idBase}-lista`
  const idErro = `${idBase}-erro`

  const raiz = useRef<HTMLDivElement>(null)
  const [aberto, setAberto] = useState(false)
  const [termo, setTermo] = useState('')
  const [opcoes, setOpcoes] = useState<SelectOption[]>([])
  const [destacado, setDestacado] = useState(0)
  const [carregando, setCarregando] = useState(false)
  const termoBusca = useDebounce(termo, 300)

  const cheio = maximo !== undefined && value.length >= maximo
  const fora = new Set([...excluir, ...value.map((v) => v.id)])
  const disponiveis = opcoes.filter((o) => !fora.has(o.id))

  const fechar = useCallback(() => {
    setAberto(false)
    setTermo('')
  }, [])

  useEffect(() => {
    if (!aberto) return
    setCarregando(true)
    buscar(termoBusca || undefined)
      .then((r) => {
        setOpcoes(r)
        setDestacado(0)
      })
      .catch(handleApiError)
      .finally(() => setCarregando(false))
    // `buscar` é recriada a cada render; o termo e a abertura disparam a consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, termoBusca])

  useEffect(() => {
    if (!aberto) return
    const aoClicar = (e: MouseEvent) => {
      if (!raiz.current?.contains(e.target as Node)) fechar()
    }
    document.addEventListener('mousedown', aoClicar)
    return () => document.removeEventListener('mousedown', aoClicar)
  }, [aberto, fechar])

  function acrescentar(opcao: SelectOption) {
    onChange([...value, opcao])
    setTermo('')
    setDestacado(0)
  }

  function remover(id: string) {
    onChange(value.filter((v) => v.id !== id))
  }

  function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!aberto) return setAberto(true)
      setDestacado((i) => Math.min(i + 1, disponiveis.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setDestacado((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (!aberto) return
      e.preventDefault()
      const escolhido = disponiveis[destacado]
      if (escolhido) acrescentar(escolhido)
    } else if (e.key === 'Escape') {
      fechar()
    } else if (e.key === 'Backspace' && !termo && value.length > 0) {
      remover(value[value.length - 1].id)
    }
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={raiz}>
      <label htmlFor={idInput} className="text-caption text-txt-secondary">
        {label}
      </label>

      <div
        className={`relative flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-md border bg-surface px-2 py-1
          ${disabled ? 'cursor-not-allowed opacity-60' : ''}
          ${
            error
              ? 'border-danger focus-within:ring-[3px] focus-within:ring-danger/15'
              : 'border-line-strong focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/10'
          }`}
      >
        {value.map((v) => (
          <span
            key={v.id}
            className="inline-flex max-w-full items-center gap-1 rounded bg-surface-alt py-0.5 pl-2 pr-1 text-caption text-txt"
          >
            <span className="truncate">{v.nome}</span>
            {!disabled && (
              <button
                type="button"
                aria-label={`Tirar ${v.nome}`}
                onClick={() => remover(v.id)}
                className="grid size-5 place-items-center rounded text-txt-muted hover:bg-surface hover:text-txt"
              >
                <IconFechar className="size-3" />
              </button>
            )}
          </span>
        ))}

        {!cheio && !disabled && (
          <span className="relative flex min-w-[8rem] flex-1 items-center">
            <IconBusca className="pointer-events-none absolute left-1 size-4 text-txt-muted" />
            <input
              id={idInput}
              role="combobox"
              aria-expanded={aberto}
              aria-controls={idLista}
              aria-autocomplete="list"
              aria-invalid={!!error}
              aria-describedby={error ? idErro : undefined}
              autoComplete="off"
              placeholder={value.length === 0 ? placeholder : ''}
              value={termo}
              onChange={(e) => {
                setTermo(e.target.value)
                if (!aberto) setAberto(true)
              }}
              onFocus={() => setAberto(true)}
              onKeyDown={aoTeclar}
              className="h-7 w-full bg-transparent pl-7 text-body text-txt placeholder:text-txt-muted focus:outline-none"
            />
          </span>
        )}

        {aberto && !cheio && (
          <ul
            id={idLista}
            role="listbox"
            className="absolute left-0 top-full z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-md
              border border-line-strong bg-surface py-1 shadow-hover"
          >
            {carregando && <li className="px-3 py-2 text-caption text-txt-muted">Buscando…</li>}
            {!carregando &&
              disponiveis.map((opcao, i) => (
                <li
                  key={opcao.id}
                  role="option"
                  aria-selected={false}
                  onMouseEnter={() => setDestacado(i)}
                  onClick={() => acrescentar(opcao)}
                  className={`cursor-pointer px-3 py-2 text-body text-txt ${i === destacado ? 'bg-surface-alt' : ''}`}
                >
                  {opcao.nome}
                </li>
              ))}
            {!carregando && disponiveis.length === 0 && (
              <li className="px-3 py-2 text-caption text-txt-muted">
                {termo ? <>Nenhum resultado para &ldquo;{termo}&rdquo;</> : 'Ninguém mais a acrescentar'}
              </li>
            )}
          </ul>
        )}
      </div>

      {error ? (
        <span id={idErro} role="alert" className="text-caption text-danger">
          {error}
        </span>
      ) : ajuda ? (
        <span className="text-caption text-txt-muted">{ajuda}</span>
      ) : null}
    </div>
  )
}
