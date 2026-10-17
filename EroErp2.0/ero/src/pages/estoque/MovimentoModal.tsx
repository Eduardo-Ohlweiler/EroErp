import { useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { TButton, TCombo, TEntry, TModal } from '@/components/common'
import { handleApiError } from '@/services/api'
import { estoqueService } from '@/services/estoqueService'
import { filialService } from '@/services/filialService'
import type { EstoqueMovimentavel } from '@/types/estoque'
import { casasDaUnidade, formatarQuantidade, mascaraDaUnidade } from '@/utils/estoque'
import { paraNumero } from '@/utils/format'

export type TipoDeMovimento = 'entrada' | 'ajuste' | 'transferencia'

const TITULOS: Record<TipoDeMovimento, string> = {
  entrada: 'Entrada de estoque',
  ajuste: 'Ajuste de estoque',
  transferencia: 'Transferência entre filiais',
}

interface Props {
  tipo: TipoDeMovimento
  onFechar: () => void
  /** Depois de gravar: a lista se recarrega. */
  onGravado: () => void
}

/**
 * Entrada, ajuste ou transferência. O produto vem do combo do que **se
 * movimenta** na filial escolhida — com controle de estoque, ativo, de
 * produto ativo. Sem controle, o produto não aparece aqui: é a regra.
 *
 * A quantidade usa a máscara da unidade: inteira para UN, CX e PC, três casas
 * para o resto. Com três casas numa unidade contável, quem digita "10" teria
 * 0,010.
 */
export function MovimentoModal({ tipo, onFechar, onGravado }: Props) {
  const [filialId, setFilialId] = useState('')
  const [item, setItem] = useState<EstoqueMovimentavel>()
  const [destinoId, setDestinoId] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [motivo, setMotivo] = useState('')
  const [erros, setErros] = useState<Record<string, string | undefined>>({})
  const [salvando, setSalvando] = useState(false)
  /** Os itens que o combo trouxe, para achar o escolhido com o saldo. */
  const [opcoes, setOpcoes] = useState<EstoqueMovimentavel[]>([])

  const transferencia = tipo === 'transferencia'
  const ajuste = tipo === 'ajuste'
  const sigla = item?.unidadeSigla
  const casas = casasDaUnidade(sigla)

  async function salvar(evento: FormEvent) {
    evento.preventDefault()
    const numero = paraNumero(quantidade)
    const novos: Record<string, string | undefined> = {
      filial: filialId ? undefined : 'Escolha a filial',
      produto: item ? undefined : filialId ? 'Escolha o produto' : undefined,
      destino: transferencia && !destinoId ? 'Escolha a filial de destino' : undefined,
      quantidade:
        numero === undefined
          ? 'Informe a quantidade'
          : !ajuste && numero <= 0
            ? 'Tem de ser maior que zero'
            : transferencia && item && numero > item.quantidade
              ? `Há ${formatarQuantidade(item.quantidade, sigla)} na origem`
              : undefined,
      motivo: ajuste && !motivo.trim() ? 'Diga por que o saldo mudou' : undefined,
    }
    if (Object.values(novos).some(Boolean)) return setErros(novos)

    setSalvando(true)
    try {
      const texto = motivo.trim() || undefined
      if (tipo === 'entrada') {
        await estoqueService.entrada(item!.id, { quantidade: numero!, motivo: texto })
        toast.success(`Entrada de ${formatarQuantidade(numero, sigla)} em ${item!.produtoNome}`)
      } else if (ajuste) {
        await estoqueService.ajuste(item!.id, { quantidadeNova: numero!, motivo: texto! })
        toast.success(`${item!.produtoNome} ajustado para ${formatarQuantidade(numero, sigla)}`)
      } else {
        await estoqueService.transferir({
          produtoId: item!.produtoId,
          filialOrigemId: filialId,
          filialDestinoId: destinoId,
          quantidade: numero!,
          motivo: texto,
        })
        toast.success(`${formatarQuantidade(numero, sigla)} de ${item!.produtoNome} transferidos`)
      }
      onGravado()
      onFechar()
    } catch (e) {
      handleApiError(e)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <TModal
      aberto
      titulo={TITULOS[tipo]}
      onFechar={onFechar}
      largura="sm"
      acoes={
        <>
          <TButton type="button" variant="secondary" onClick={onFechar}>
            Cancelar
          </TButton>
          <TButton type="submit" form="form-movimento" loading={salvando}>
            {tipo === 'entrada' ? 'Lançar entrada' : ajuste ? 'Ajustar' : 'Transferir'}
          </TButton>
        </>
      }
    >
      <form id="form-movimento" onSubmit={salvar} noValidate className="flex flex-col gap-4">
        <TCombo
          label={transferencia ? 'Filial de origem' : 'Filial'}
          placeholder="Busque a filial"
          value={filialId}
          onChange={(v) => {
            setFilialId(v)
            setItem(undefined)
            setOpcoes([])
            if (v === destinoId) setDestinoId('')
            setErros((e) => ({ ...e, filial: undefined }))
          }}
          buscar={(t) => filialService.select(t).then((l) => l.map((f) => ({ id: f.id, nome: f.nome })))}
          error={erros.filial}
        />

        {/* A chave refaz o combo quando a filial muda: a lista é da filial */}
        <TCombo
          key={filialId || 'sem-filial'}
          label="Produto"
          placeholder={filialId ? 'Nome, código ou EAN' : 'Escolha a filial antes'}
          disabled={!filialId}
          value={item?.id ?? ''}
          onChange={(v) => {
            setItem(opcoes.find((o) => o.id === v))
            setErros((e) => ({ ...e, produto: undefined }))
          }}
          buscar={(t) =>
            estoqueService.movimentaveis(filialId, t).then((lista) => {
              setOpcoes(lista)
              return lista.map((o) => ({ id: o.id, nome: `${o.produtoCodigo} — ${o.produtoNome}` }))
            })
          }
          ajuda={
            item
              ? `Saldo atual: ${formatarQuantidade(item.quantidade, sigla)}`
              : 'Só aparece o que controla estoque nesta filial.'
          }
          error={erros.produto}
        />

        {transferencia && (
          <TCombo
            key={`destino-${filialId}`}
            label="Filial de destino"
            placeholder="Busque a filial"
            value={destinoId}
            onChange={(v) => {
              setDestinoId(v)
              setErros((e) => ({ ...e, destino: undefined }))
            }}
            buscar={(t) =>
              filialService
                .select(t)
                .then((l) => l.filter((f) => f.id !== filialId).map((f) => ({ id: f.id, nome: f.nome })))
            }
            ajuda="Sem estoque do produto lá, a linha é aberta com controle e sem preço."
            error={erros.destino}
          />
        )}

        <TEntry
          key={`quantidade-${casas}`}
          label={`${ajuste ? 'Quantidade contada' : 'Quantidade'}${sigla ? ` (${sigla})` : ''}`}
          mascara={mascaraDaUnidade(sigla)}
          casas={casas}
          inputMode="numeric"
          value={quantidade}
          onChange={(e) => {
            setQuantidade(e.target.value)
            setErros((x) => ({ ...x, quantidade: undefined }))
          }}
          ajuda={ajuste ? 'Quanto há de fato. O histórico grava a diferença.' : undefined}
          error={erros.quantidade}
        />

        <TEntry
          label={ajuste ? 'Motivo' : 'Motivo (opcional)'}
          maxLength={255}
          value={motivo}
          onChange={(e) => {
            setMotivo(e.target.value)
            setErros((x) => ({ ...x, motivo: undefined }))
          }}
          error={erros.motivo}
        />
      </form>
    </TModal>
  )
}
