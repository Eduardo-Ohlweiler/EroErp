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
import { handleApiError } from '@/services/api'
import { auxiliarService } from '@/services/auxiliarProdutoService'
import { produtoService } from '@/services/produtoService'
import type { Page } from '@/types/comum'
import type { ProdutoResponse } from '@/types/produto'
import { AUSENTE, formatarMoeda } from '@/utils/format'
import type { ColunaExportavel } from '@/utils/planilha'

const grupos = auxiliarService('grupos')
const marcas = auxiliarService('marcas')

/** "Bebidas › Sucos", só o grupo não existe: o produto aponta para o subgrupo. */
function classificacao(p: ProdutoResponse): string {
  return p.subgrupoNome ? `${p.grupoNome} › ${p.subgrupoNome}` : AUSENTE
}

export function ProdutoList() {
  const navigate = useNavigate()
  const { sessao } = useAuth()
  const somenteLeitura = useSomenteLeitura('PRODUTOS')

  const [termo, setTermo] = useState('')
  const [grupoId, setGrupoId] = useState('')
  const [marcaId, setMarcaId] = useState('')
  /** Nome de cada opção que os combos já trouxeram — o filtro aplicado da folha o mostra. */
  const nomes = useRef(new Map<string, string>())
  const [ativo, setAtivo] = useState('true')
  const [pagina, setPagina] = useState(0)
  const [dados, setDados] = useState<Page<ProdutoResponse>>()
  const [carregando, setCarregando] = useState(true)
  const [paraImprimir, setParaImprimir] = useState<ResultadoDaCarga<ProdutoResponse>>()

  const termoBusca = useDebounce(termo)

  const filtros = useCallback(
    () => ({
      termo: termoBusca || undefined,
      grupoId: grupoId || undefined,
      marcaId: marcaId || undefined,
      ativo: ativo === '' ? undefined : ativo === 'true',
    }),
    [termoBusca, grupoId, marcaId, ativo],
  )

  const carregar = useCallback(() => {
    setCarregando(true)
    produtoService
      .getAll({ ...filtros(), page: pagina, size: 20 })
      .then(setDados)
      .catch(handleApiError)
      .finally(() => setCarregando(false))
    // `sessao.tenantId` é sinal de invalidação: trocar de tenant refaz a consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao?.tenantId, filtros, pagina])

  useEffect(carregar, [carregar])

  // Grupo e marca são do tenant de antes: trocar de tenant limpa os filtros.
  useEffect(() => {
    setGrupoId('')
    setMarcaId('')
  }, [sessao?.tenantId])

  /** Cobre o filtro inteiro, não a página aberta. Ver `TAcoesDeExportacao`. */
  const carregarTudo = useCallback(
    async (limite: number, indice: number): Promise<PaginaDaCarga<ProdutoResponse>> => {
      const pagina = await produtoService.getAll({ ...filtros(), page: indice, size: limite })
      return { linhas: pagina.content, total: pagina.totalElements }
    },
    [filtros],
  )

  const colunasExportadas: ColunaExportavel<ProdutoResponse>[] = [
    { titulo: 'Código', valor: (p) => String(p.codigo) },
    { titulo: 'Nome', valor: (p) => p.nome },
    { titulo: 'EAN', valor: (p) => p.ean ?? '' },
    { titulo: 'Unidade', valor: (p) => p.unidadeSigla },
    { titulo: 'Grupo › Subgrupo', valor: classificacao },
    { titulo: 'Categoria', valor: (p) => p.categoriaNome ?? AUSENTE },
    { titulo: 'Marca', valor: (p) => p.marcaNome ?? AUSENTE },
    { titulo: 'Fornecedor', valor: (p) => p.fornecedorNome ?? AUSENTE },
    { titulo: 'Custo', valor: (p) => formatarMoeda(p.custo) },
    { titulo: 'Situação', valor: (p) => (p.ativo ? 'Ativo' : 'Inativo') },
  ]

  const filtrosAplicados = [
    { rotulo: 'Busca', valor: termoBusca },
    { rotulo: 'Grupo', valor: grupoId ? (nomes.current.get(grupoId) ?? '') : '' },
    { rotulo: 'Marca', valor: marcaId ? (nomes.current.get(marcaId) ?? '') : '' },
    { rotulo: 'Situação', valor: ativo === 'true' ? 'Ativo' : ativo === 'false' ? 'Inativo' : '' },
  ]

  async function alternarAtivo(produto: ProdutoResponse) {
    try {
      await produtoService.alterarAtivo(produto.id, !produto.ativo)
      toast.success(produto.ativo ? `${produto.nome} foi inativado` : `${produto.nome} foi reativado`)
      carregar()
    } catch (erro) {
      handleApiError(erro)
    }
  }

  const colunas: Coluna<ProdutoResponse>[] = [
    { chave: 'codigo', cabecalho: 'Código', className: 'w-24 tabular-nums', render: (p) => p.codigo },
    {
      chave: 'nome',
      cabecalho: 'Nome',
      render: (p) => (
        <span className="flex min-w-0 flex-col">
          <span>{p.nome}</span>
          {p.ean && <span className="text-caption tabular-nums text-txt-secondary">EAN {p.ean}</span>}
        </span>
      ),
    },
    { chave: 'unidade', cabecalho: 'Un.', className: 'w-16', render: (p) => p.unidadeSigla },
    { chave: 'grupo', cabecalho: 'Grupo › Subgrupo', secundaria: true, render: classificacao },
    { chave: 'marca', cabecalho: 'Marca', secundaria: true, render: (p) => p.marcaNome ?? AUSENTE },
    { chave: 'custo', cabecalho: 'Custo', numerica: true, render: (p) => formatarMoeda(p.custo) },
    {
      chave: 'situacao',
      cabecalho: 'Situação',
      render: (p) =>
        p.ativo ? <TBadge tom="sucesso">Ativo</TBadge> : <TBadge tom="neutro">Inativo</TBadge>,
    },
  ]

  return (
    <TPage
      title="Produtos"
      subtitle="O que o seu tenant vende ou consome. O preço de venda é por filial, no estoque."
      actions={
        <>
          <TAcoesDeExportacao
            nome="Produtos"
            colunas={colunasExportadas}
            carregar={carregarTudo}
            aoCarregarParaImprimir={setParaImprimir}
          />
          {!somenteLeitura && (
            <TButton onClick={() => navigate('/app/produtos/novo')}>
              <IconAdicionar className="size-4" />
              Novo produto
            </TButton>
          )}
        </>
      }
      documento={
        paraImprimir && (
          <DocumentoLista
            titulo="Produtos"
            colunas={colunasExportadas}
            linhas={paraImprimir.linhas}
            truncado={paraImprimir.restantes}
            filtros={filtrosAplicados}
            chaveDe={(p) => p.id}
            resumo={[
              { rotulo: 'Produtos', valor: String(paraImprimir.linhas.length) },
              { rotulo: 'Ativos', valor: String(paraImprimir.linhas.filter((p) => p.ativo).length) },
              {
                rotulo: 'Sem custo',
                valor: String(paraImprimir.linhas.filter((p) => p.custo == null).length),
              },
            ]}
            nota="Custo em branco é não informado, não zero."
          />
        )
      }
    >
      <TPanel>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TEntry
            label="Busca"
            placeholder="Nome, código ou EAN"
            value={termo}
            suffix={<IconBusca className="size-4" />}
            onChange={(e) => {
              setTermo(e.target.value)
              setPagina(0)
            }}
          />
          <TCombo
            label="Grupo"
            vazio="Todos"
            placeholder="Todos"
            value={grupoId}
            onChange={(valor) => {
              setGrupoId(valor)
              setPagina(0)
            }}
            buscar={(t) =>
              grupos.select(t).then((lista) =>
                lista.map((g) => {
                  nomes.current.set(g.id, g.nome)
                  return g
                }),
              )
            }
          />
          <TCombo
            label="Marca"
            vazio="Todas"
            placeholder="Todas"
            value={marcaId}
            onChange={(valor) => {
              setMarcaId(valor)
              setPagina(0)
            }}
            buscar={(t) =>
              marcas.select(t).then((lista) =>
                lista.map((m) => {
                  nomes.current.set(m.id, m.nome)
                  return m
                }),
              )
            }
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
        chaveDe={(p) => p.id}
        carregando={carregando}
        onLinhaClick={(p) => navigate(`/app/produtos/${p.id}`)}
        tituloCartao={(p) => p.nome}
        vazioTitulo="Nenhum produto encontrado"
        vazioDescricao={
          somenteLeitura ? 'Ajuste os filtros.' : 'Ajuste os filtros ou cadastre o primeiro produto.'
        }
        acoes={
          somenteLeitura
            ? undefined
            : (p) => (
                <TButton
                  variant="secondary"
                  size="sm"
                  onClick={() => void alternarAtivo(p)}
                  title={p.ativo ? 'Inativar — o cadastro continua no histórico' : 'Reativar o produto'}
                >
                  {p.ativo ? 'Inativar' : 'Reativar'}
                </TButton>
              )
        }
      />

      <TDataGridFooter pagina={dados} onPaginaChange={setPagina} />
    </TPage>
  )
}
