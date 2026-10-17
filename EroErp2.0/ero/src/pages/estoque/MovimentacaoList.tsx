import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { IconMovimentacao } from '@/assets/icons'
import {
  TAcoesDeExportacao,
  TBadge,
  TButton,
  TCombo,
  TDataGrid,
  TDataGridFooter,
  TEntry,
  TPage,
  TPanel,
  TSelect,
  type Coluna,
  type PaginaDaCarga,
  type ResultadoDaCarga,
} from '@/components/common'
import { DocumentoLista } from '@/components/impressao/DocumentoLista'
import { useAuth } from '@/hooks/useAuth'
import { useSomenteLeitura } from '@/hooks/useSomenteLeitura'
import { BolinhaDaCor } from '@/pages/filial/FilialList'
import { MovimentoModal, type TipoDeMovimento } from '@/pages/estoque/MovimentoModal'
import { handleApiError } from '@/services/api'
import { estoqueService } from '@/services/estoqueService'
import { filialService } from '@/services/filialService'
import { produtoService } from '@/services/produtoService'
import type { Page } from '@/types/comum'
import type { MovimentacaoResponse, TipoMovimentacao } from '@/types/estoque'
import {
  fimDoDia,
  formatarQuantidade,
  formatarQuantidadeComSinal,
  inicioDoDia,
  ROTULO_MOVIMENTACAO,
} from '@/utils/estoque'
import { formatarData, formatarDataHora } from '@/utils/format'
import type { ColunaExportavel } from '@/utils/planilha'

/** Quem chega pelo "Ver todas" do estoque traz os nomes para os combos. */
interface EstadoDaRota {
  produtoNome?: string
  filialNome?: string
}

/** Na transferência, o outro lado: "para Loja Centro", "de Loja Matriz". */
function contraparte(m: MovimentacaoResponse): string {
  if (!m.filialContraparteNome) return ''
  return `${m.tipo === 'TRANSFERENCIA_SAIDA' ? 'para' : 'de'} ${m.filialContraparteNome}`
}

/** "Loja Matriz, para Loja Centro" — a planilha e a folha levam numa célula só. */
function filiais(m: MovimentacaoResponse): string {
  const outra = contraparte(m)
  return outra ? `${m.filialNome}, ${outra}` : m.filialNome
}

function tomDoTipo(tipo: TipoMovimentacao) {
  return tipo === 'ENTRADA' ? 'sucesso' : tipo === 'AJUSTE' ? 'alerta' : 'info'
}

/**
 * O histórico do estoque, do mais novo ao mais antigo, e as três operações
 * que mexem no saldo: entrada, ajuste e transferência. A quantidade vem com
 * sinal — entrada positiva, saída negativa.
 */
export function MovimentacaoList() {
  const { sessao } = useAuth()
  const somenteLeitura = useSomenteLeitura('ESTOQUE')
  const [parametros] = useSearchParams()
  const estado = (useLocation().state ?? {}) as EstadoDaRota

  const [filialId, setFilialId] = useState(parametros.get('filialId') ?? '')
  const [produtoId, setProdutoId] = useState(parametros.get('produtoId') ?? '')
  const nomes = useRef(
    new Map<string, string>([
      [parametros.get('filialId') ?? '', estado.filialNome ?? ''],
      [parametros.get('produtoId') ?? '', estado.produtoNome ?? ''],
    ]),
  )
  const [tipo, setTipo] = useState('')
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [pagina, setPagina] = useState(0)
  const [dados, setDados] = useState<Page<MovimentacaoResponse>>()
  const [carregando, setCarregando] = useState(true)
  const [paraImprimir, setParaImprimir] = useState<ResultadoDaCarga<MovimentacaoResponse>>()
  const [modal, setModal] = useState<TipoDeMovimento>()

  const filtros = useCallback(
    () => ({
      filialId: filialId || undefined,
      produtoId: produtoId || undefined,
      tipo: (tipo || undefined) as TipoMovimentacao | undefined,
      de: inicioDoDia(de),
      ate: fimDoDia(ate),
    }),
    [filialId, produtoId, tipo, de, ate],
  )

  const carregar = useCallback(() => {
    setCarregando(true)
    estoqueService
      .movimentacoes({ ...filtros(), page: pagina, size: 20 })
      .then(setDados)
      .catch(handleApiError)
      .finally(() => setCarregando(false))
    // `sessao.tenantId` é sinal de invalidação: trocar de tenant refaz a consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao?.tenantId, filtros, pagina])

  useEffect(carregar, [carregar])

  /** Cobre o filtro inteiro, não a página aberta. Ver `TAcoesDeExportacao`. */
  const carregarTudo = useCallback(
    async (limite: number, indice: number): Promise<PaginaDaCarga<MovimentacaoResponse>> => {
      const pagina = await estoqueService.movimentacoes({ ...filtros(), page: indice, size: limite })
      return { linhas: pagina.content, total: pagina.totalElements }
    },
    [filtros],
  )

  const colunasExportadas: ColunaExportavel<MovimentacaoResponse>[] = [
    { titulo: 'Data', valor: (m) => formatarDataHora(m.createdAt) },
    { titulo: 'Tipo', valor: (m) => ROTULO_MOVIMENTACAO[m.tipo] },
    { titulo: 'Código', valor: (m) => String(m.produtoCodigo) },
    { titulo: 'Produto', valor: (m) => m.produtoNome },
    { titulo: 'Filial', valor: filiais },
    { titulo: 'Quantidade', valor: (m) => formatarQuantidadeComSinal(m.quantidade, m.unidadeSigla) },
    { titulo: 'Saldo antes', valor: (m) => formatarQuantidade(m.quantidadeAnterior, m.unidadeSigla) },
    { titulo: 'Saldo depois', valor: (m) => formatarQuantidade(m.quantidadePosterior, m.unidadeSigla) },
    { titulo: 'Motivo', valor: (m) => m.motivo ?? '' },
    { titulo: 'Usuário', valor: (m) => m.usuarioNome ?? '' },
  ]

  const filtrosAplicados = [
    { rotulo: 'Filial', valor: filialId ? (nomes.current.get(filialId) ?? '') : '' },
    { rotulo: 'Produto', valor: produtoId ? (nomes.current.get(produtoId) ?? '') : '' },
    { rotulo: 'Tipo', valor: tipo ? ROTULO_MOVIMENTACAO[tipo as TipoMovimentacao] : '' },
    { rotulo: 'De', valor: de ? formatarData(`${de}T00:00:00`) : '' },
    { rotulo: 'Até', valor: ate ? formatarData(`${ate}T00:00:00`) : '' },
  ]

  const colunas: Coluna<MovimentacaoResponse>[] = [
    {
      chave: 'data',
      cabecalho: 'Data',
      className: 'w-40 tabular-nums',
      render: (m) => formatarDataHora(m.createdAt),
    },
    {
      chave: 'tipo',
      cabecalho: 'Tipo',
      render: (m) => <TBadge tom={tomDoTipo(m.tipo)}>{ROTULO_MOVIMENTACAO[m.tipo]}</TBadge>,
    },
    {
      chave: 'produto',
      cabecalho: 'Produto',
      render: (m) => (
        <span className="flex min-w-0 flex-col">
          <span>{m.produtoNome}</span>
          {m.motivo && <span className="line-clamp-1 text-caption text-txt-secondary">{m.motivo}</span>}
        </span>
      ),
    },
    {
      chave: 'filial',
      cabecalho: 'Filial',
      // A filial da linha em destaque; o outro lado da transferência embaixo,
      // menor — com seta e os dois nomes na mesma linha, a célula quebrava em três
      render: (m) => (
        <span className="flex items-start gap-2">
          <span className="mt-1.5">
            <BolinhaDaCor cor={m.filialCor} />
          </span>
          <span className="flex min-w-0 flex-col">
            <span>{m.filialNome}</span>
            {m.filialContraparteNome && (
              <span className="text-caption text-txt-secondary">{contraparte(m)}</span>
            )}
          </span>
        </span>
      ),
    },
    {
      chave: 'quantidade',
      cabecalho: 'Quantidade',
      numerica: true,
      render: (m) => (
        <span className={m.quantidade > 0 ? 'text-success' : 'text-danger'}>
          {formatarQuantidadeComSinal(m.quantidade, m.unidadeSigla)}
        </span>
      ),
    },
    {
      chave: 'saldo',
      cabecalho: 'Saldo',
      numerica: true,
      secundaria: true,
      render: (m) => (
        <span className="whitespace-nowrap">
          {formatarQuantidade(m.quantidadeAnterior, m.unidadeSigla)} →{' '}
          {formatarQuantidade(m.quantidadePosterior, m.unidadeSigla)}
        </span>
      ),
    },
    {
      chave: 'usuario',
      cabecalho: 'Usuário',
      secundaria: true,
      render: (m) => m.usuarioNome ?? '',
    },
  ]

  return (
    <TPage
      title="Movimentações de estoque"
      subtitle="Entradas, ajustes e transferências. Produto sem controle de estoque não se movimenta."
      actions={
        <>
          <TAcoesDeExportacao
            nome="Movimentações de estoque"
            colunas={colunasExportadas}
            carregar={carregarTudo}
            aoCarregarParaImprimir={setParaImprimir}
          />
          {!somenteLeitura && (
            <>
              <TButton variant="secondary" onClick={() => setModal('entrada')}>
                Entrada
              </TButton>
              <TButton variant="secondary" onClick={() => setModal('ajuste')}>
                Ajuste
              </TButton>
              <TButton onClick={() => setModal('transferencia')}>
                <IconMovimentacao className="size-4" />
                Transferência
              </TButton>
            </>
          )}
        </>
      }
      documento={
        paraImprimir && (
          <DocumentoLista
            titulo="Movimentações de estoque"
            colunas={colunasExportadas}
            linhas={paraImprimir.linhas}
            truncado={paraImprimir.restantes}
            filtros={filtrosAplicados}
            chaveDe={(m) => m.id}
            resumo={[{ rotulo: 'Movimentações', valor: String(paraImprimir.linhas.length) }]}
            nota="Quantidade com sinal: entrada positiva, saída negativa."
          />
        )
      }
    >
      <TPanel>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <TCombo
            label="Filial"
            vazio="Todas"
            placeholder="Todas"
            value={filialId}
            rotuloInicial={estado.filialNome}
            onChange={(v) => {
              setFilialId(v)
              setPagina(0)
            }}
            buscar={(t) =>
              filialService.select(t).then((l) =>
                l.map((f) => {
                  nomes.current.set(f.id, f.nome)
                  return { id: f.id, nome: f.nome }
                }),
              )
            }
          />
          <TCombo
            label="Produto"
            vazio="Todos"
            placeholder="Todos"
            value={produtoId}
            rotuloInicial={estado.produtoNome}
            onChange={(v) => {
              setProdutoId(v)
              setPagina(0)
            }}
            buscar={(t) =>
              produtoService.select(t).then((l) =>
                l.map((p) => {
                  nomes.current.set(p.id, p.nome)
                  return { id: p.id, nome: `${p.codigo} — ${p.nome}` }
                }),
              )
            }
          />
          <TSelect
            label="Tipo"
            vazio="Todos"
            opcoes={Object.entries(ROTULO_MOVIMENTACAO).map(([valor, rotulo]) => ({ valor, rotulo }))}
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value)
              setPagina(0)
            }}
          />
          <TEntry
            label="De"
            type="date"
            value={de}
            onChange={(e) => {
              setDe(e.target.value)
              setPagina(0)
            }}
          />
          <TEntry
            label="Até"
            type="date"
            value={ate}
            onChange={(e) => {
              setAte(e.target.value)
              setPagina(0)
            }}
          />
        </div>
      </TPanel>

      <TDataGrid
        colunas={colunas}
        linhas={dados?.content ?? []}
        chaveDe={(m) => m.id}
        carregando={carregando}
        tituloCartao={(m) => `${ROTULO_MOVIMENTACAO[m.tipo]} · ${m.produtoNome}`}
        vazioTitulo="Nenhuma movimentação encontrada"
        vazioDescricao={
          somenteLeitura
            ? 'Ajuste os filtros.'
            : 'Ajuste os filtros, ou lance uma entrada, um ajuste ou uma transferência.'
        }
      />

      <TDataGridFooter pagina={dados} onPaginaChange={setPagina} />

      {modal && <MovimentoModal tipo={modal} onFechar={() => setModal(undefined)} onGravado={carregar} />}
    </TPage>
  )
}
