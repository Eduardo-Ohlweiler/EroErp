import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { IconAdicionar, IconBusca } from '@/assets/icons'
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
import { useDebounce } from '@/hooks/useDebounce'
import { useSomenteLeitura } from '@/hooks/useSomenteLeitura'
import { BolinhaDaCor } from '@/pages/filial/FilialList'
import { handleApiError } from '@/services/api'
import { estoqueService } from '@/services/estoqueService'
import { filialService } from '@/services/filialService'
import type { Page } from '@/types/comum'
import type { EstoqueResponse } from '@/types/estoque'
import { formatarQuantidade } from '@/utils/estoque'
import { formatarMoeda } from '@/utils/format'
import type { ColunaExportavel } from '@/utils/planilha'

const NAO_CONTROLA = 'Não controla'

/** O saldo, ou "Não controla": sem controle a quantidade não se move e não diz nada. */
function saldo(e: EstoqueResponse): string {
  return e.controlaEstoque ? formatarQuantidade(e.quantidade, e.unidadeSigla) : NAO_CONTROLA
}

/**
 * O estoque de cada produto em cada filial — e o preço de venda dele ali.
 * O saldo só muda em Movimentações; aqui se cadastra preço, controle e
 * mínimo.
 */
export function EstoqueList() {
  const navigate = useNavigate()
  const { sessao } = useAuth()
  const somenteLeitura = useSomenteLeitura('ESTOQUE')

  const [termo, setTermo] = useState('')
  const [filialId, setFilialId] = useState('')
  const nomesDeFilial = useRef(new Map<string, string>())
  const [controla, setControla] = useState('')
  const [ativo, setAtivo] = useState('true')
  const [pagina, setPagina] = useState(0)
  const [dados, setDados] = useState<Page<EstoqueResponse>>()
  const [carregando, setCarregando] = useState(true)
  const [paraImprimir, setParaImprimir] = useState<ResultadoDaCarga<EstoqueResponse>>()

  const termoBusca = useDebounce(termo)

  const filtros = useCallback(
    () => ({
      termo: termoBusca || undefined,
      filialId: filialId || undefined,
      controla: controla === '' ? undefined : controla === 'true',
      ativo: ativo === '' ? undefined : ativo === 'true',
    }),
    [termoBusca, filialId, controla, ativo],
  )

  const carregar = useCallback(() => {
    setCarregando(true)
    estoqueService
      .getAll({ ...filtros(), page: pagina, size: 20 })
      .then(setDados)
      .catch(handleApiError)
      .finally(() => setCarregando(false))
    // `sessao.tenantId` é sinal de invalidação: trocar de tenant refaz a consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao?.tenantId, filtros, pagina])

  useEffect(carregar, [carregar])

  // A filial escolhida é do tenant de antes: trocar de tenant limpa o filtro.
  useEffect(() => setFilialId(''), [sessao?.tenantId])

  /** Cobre o filtro inteiro, não a página aberta. Ver `TAcoesDeExportacao`. */
  const carregarTudo = useCallback(
    async (limite: number, indice: number): Promise<PaginaDaCarga<EstoqueResponse>> => {
      const pagina = await estoqueService.getAll({ ...filtros(), page: indice, size: limite })
      return { linhas: pagina.content, total: pagina.totalElements }
    },
    [filtros],
  )

  const colunasExportadas: ColunaExportavel<EstoqueResponse>[] = [
    { titulo: 'Código', valor: (e) => String(e.produtoCodigo) },
    { titulo: 'Produto', valor: (e) => e.produtoNome },
    { titulo: 'Filial', valor: (e) => e.filialNome },
    { titulo: 'Saldo', valor: saldo },
    { titulo: 'Preço de venda', valor: (e) => formatarMoeda(e.precoVenda) },
    { titulo: 'Mínimo', valor: (e) => formatarQuantidade(e.quantidadeMinima, e.unidadeSigla) },
    { titulo: 'Situação', valor: (e) => (e.ativo ? 'Ativo' : 'Inativo') },
  ]

  const filtrosAplicados = [
    { rotulo: 'Busca', valor: termoBusca },
    { rotulo: 'Filial', valor: filialId ? (nomesDeFilial.current.get(filialId) ?? '') : '' },
    { rotulo: 'Controle', valor: controla === 'true' ? 'Controla' : controla === 'false' ? NAO_CONTROLA : '' },
    { rotulo: 'Situação', valor: ativo === 'true' ? 'Ativo' : ativo === 'false' ? 'Inativo' : '' },
  ]

  async function alternarAtivo(e: EstoqueResponse) {
    try {
      await estoqueService.alterarAtivo(e.id, !e.ativo)
      toast.success(
        e.ativo
          ? `Estoque de ${e.produtoNome} em ${e.filialNome} inativado`
          : `Estoque de ${e.produtoNome} em ${e.filialNome} reativado`,
      )
      carregar()
    } catch (erro) {
      handleApiError(erro)
    }
  }

  const colunas: Coluna<EstoqueResponse>[] = [
    {
      chave: 'produto',
      cabecalho: 'Produto',
      render: (e) => (
        <span className="flex min-w-0 flex-col">
          <span>{e.produtoNome}</span>
          <span className="text-caption tabular-nums text-txt-secondary">
            Código {e.produtoCodigo}
            {!e.produtoAtivo && ' · produto inativo'}
          </span>
        </span>
      ),
    },
    {
      chave: 'filial',
      cabecalho: 'Filial',
      render: (e) => (
        <span className="flex items-center gap-2">
          <BolinhaDaCor cor={e.filialCor} />
          {e.filialNome}
        </span>
      ),
    },
    {
      chave: 'saldo',
      cabecalho: 'Saldo',
      numerica: true,
      render: (e) =>
        e.controlaEstoque ? (
          formatarQuantidade(e.quantidade, e.unidadeSigla)
        ) : (
          <span className="text-txt-secondary">{NAO_CONTROLA}</span>
        ),
    },
    { chave: 'preco', cabecalho: 'Preço de venda', numerica: true, render: (e) => formatarMoeda(e.precoVenda) },
    {
      chave: 'minimo',
      cabecalho: 'Mínimo',
      numerica: true,
      secundaria: true,
      render: (e) => formatarQuantidade(e.quantidadeMinima, e.unidadeSigla),
    },
    {
      chave: 'situacao',
      cabecalho: 'Situação',
      render: (e) =>
        e.ativo ? <TBadge tom="sucesso">Ativo</TBadge> : <TBadge tom="neutro">Inativo</TBadge>,
    },
  ]

  return (
    <TPage
      title="Estoque"
      subtitle="O saldo e o preço de venda de cada produto em cada filial. O saldo muda em Movimentações."
      actions={
        <>
          <TAcoesDeExportacao
            nome="Estoque"
            colunas={colunasExportadas}
            carregar={carregarTudo}
            aoCarregarParaImprimir={setParaImprimir}
          />
          {!somenteLeitura && (
            <TButton onClick={() => navigate('/app/estoque/novo')}>
              <IconAdicionar className="size-4" />
              Novo estoque
            </TButton>
          )}
        </>
      }
      documento={
        paraImprimir && (
          <DocumentoLista
            titulo="Estoque"
            colunas={colunasExportadas}
            linhas={paraImprimir.linhas}
            truncado={paraImprimir.restantes}
            filtros={filtrosAplicados}
            chaveDe={(e) => e.id}
            resumo={[
              { rotulo: 'Linhas', valor: String(paraImprimir.linhas.length) },
              {
                rotulo: 'Sem controle',
                valor: String(paraImprimir.linhas.filter((e) => !e.controlaEstoque).length),
              },
              {
                rotulo: 'Sem preço',
                valor: String(paraImprimir.linhas.filter((e) => e.precoVenda == null).length),
              },
            ]}
            nota="Preço em branco é não informado, não zero."
          />
        )
      }
    >
      <TPanel>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TEntry
            label="Busca"
            placeholder="Produto, código ou EAN"
            value={termo}
            suffix={<IconBusca className="size-4" />}
            onChange={(e) => {
              setTermo(e.target.value)
              setPagina(0)
            }}
          />
          <TCombo
            label="Filial"
            vazio="Todas"
            placeholder="Todas"
            value={filialId}
            onChange={(valor) => {
              setFilialId(valor)
              setPagina(0)
            }}
            buscar={(t) =>
              filialService.select(t).then((filiais) =>
                filiais.map((f) => {
                  nomesDeFilial.current.set(f.id, f.nome)
                  return { id: f.id, nome: f.nome }
                }),
              )
            }
          />
          <TSelect
            label="Controle"
            vazio="Todos"
            opcoes={[
              { valor: 'true', rotulo: 'Controla' },
              { valor: 'false', rotulo: NAO_CONTROLA },
            ]}
            value={controla}
            onChange={(e) => {
              setControla(e.target.value)
              setPagina(0)
            }}
          />
          <TSelect
            label="Situação"
            vazio="Todas"
            opcoes={[
              { valor: 'true', rotulo: 'Ativo' },
              { valor: 'false', rotulo: 'Inativo' },
            ]}
            value={ativo}
            onChange={(e) => {
              setAtivo(e.target.value)
              setPagina(0)
            }}
          />
        </div>
      </TPanel>

      <TDataGrid
        colunas={colunas}
        linhas={dados?.content ?? []}
        chaveDe={(e) => e.id}
        carregando={carregando}
        onLinhaClick={(e) => navigate(`/app/estoque/${e.id}`)}
        tituloCartao={(e) => e.produtoNome}
        vazioTitulo="Nenhum estoque encontrado"
        vazioDescricao={
          somenteLeitura
            ? 'Ajuste os filtros.'
            : 'Ajuste os filtros ou abra o estoque de um produto numa filial.'
        }
        acoes={
          somenteLeitura
            ? undefined
            : (e) => (
                <TButton variant="secondary" size="sm" onClick={() => void alternarAtivo(e)}>
                  {e.ativo ? 'Inativar' : 'Reativar'}
                </TButton>
              )
        }
      />

      <TDataGridFooter pagina={dados} onPaginaChange={setPagina} />
    </TPage>
  )
}
