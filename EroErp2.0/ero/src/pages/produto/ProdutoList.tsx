import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  SITUACAO_OPCOES,
  TAcoesDeExportacao,
  TBadge,
  TButton,
  TCombo,
  TDataGrid,
  TDataGridFooter,
  TDBCombo,
  TEntry,
  TForm,
  TFormActionsLeft,
  TFormFooter,
  TPage,
  TRow,
  useMessage,
  useQuestion,
  type Coluna,
  type PaginaDaCarga,
  type ResultadoDaCarga,
} from '@/components/common'
import { DocumentoLista } from '@/components/impressao/DocumentoLista'
import { useAuth } from '@/hooks/useAuth'
import { useSomenteLeitura } from '@/hooks/useSomenteLeitura'
import { auxiliarService } from '@/services/auxiliarProdutoService'
import { produtoService } from '@/services/produtoService'
import type { Page } from '@/types/comum'
import type { ProdutoResponse } from '@/types/produto'
import { AUSENTE, formatarMoeda } from '@/utils/format'
import type { ColunaExportavel } from '@/utils/planilha'

const grupos = auxiliarService('grupos')
const marcas = auxiliarService('marcas')

interface Filtros {
  termo: string
  grupoId: string
  marcaId: string
  ativo: string
}

const FILTROS_VAZIOS: Filtros = { termo: '', grupoId: '', marcaId: '', ativo: 'true' }

/** O que a API recebe: vazio é "sem filtro". */
function paraConsulta(f: Filtros) {
  return {
    termo: f.termo.trim() || undefined,
    grupoId: f.grupoId || undefined,
    marcaId: f.marcaId || undefined,
    ativo: f.ativo === '' ? undefined : f.ativo === 'true',
  }
}

/** "Bebidas › Sucos", só o grupo não existe: o produto aponta para o subgrupo. */
function classificacao(p: ProdutoResponse): string {
  return p.subgrupoNome ? `${p.grupoNome} › ${p.subgrupoNome}` : AUSENTE
}

export function ProdutoList() {
  const navigate = useNavigate()
  const { sessao } = useAuth()
  const somenteLeitura = useSomenteLeitura('PRODUTOS')
  const msg = useMessage()
  const { confirmar } = useQuestion()
  const form = useForm<Filtros>({ defaultValues: FILTROS_VAZIOS })
  const [aplicados, setAplicados] = useState(FILTROS_VAZIOS)
  const [pagina, setPagina] = useState(0)
  const [dados, setDados] = useState<Page<ProdutoResponse>>()
  const [carregando, setCarregando] = useState(true)
  const [paraImprimir, setParaImprimir] = useState<ResultadoDaCarga<ProdutoResponse>>()
  /** Nome de cada opção que os combos já trouxeram — o filtro aplicado da folha o mostra. */
  const nomes = useRef(new Map<string, string>())

  const carregar = useCallback(() => {
    setCarregando(true)
    produtoService
      .getAll({ ...paraConsulta(aplicados), page: pagina, size: 20 })
      .then(setDados)
      .catch(msg.erroApi)
      .finally(() => setCarregando(false))
    // `sessao.tenantId` é sinal de invalidação: trocar de tenant refaz a consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao?.tenantId, aplicados, pagina])

  useEffect(carregar, [carregar])

  const filtrar = (f: Filtros) => {
    setAplicados(f)
    setPagina(0)
  }
  const limpar = () => {
    form.reset(FILTROS_VAZIOS)
    filtrar(FILTROS_VAZIOS)
  }

  // Grupo e marca são do tenant de antes: trocar de tenant limpa os filtros.
  useEffect(() => {
    form.reset(FILTROS_VAZIOS)
    setAplicados(FILTROS_VAZIOS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao?.tenantId])

  /** Cobre o filtro aplicado inteiro, não a página aberta. Ver `TAcoesDeExportacao`. */
  const carregarTudo = useCallback(
    async (limite: number, indice: number): Promise<PaginaDaCarga<ProdutoResponse>> => {
      const pagina = await produtoService.getAll({ ...paraConsulta(aplicados), page: indice, size: limite })
      return { linhas: pagina.content, total: pagina.totalElements }
    },
    [aplicados],
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
    { titulo: 'Custo', numerica: true, valor: (p) => formatarMoeda(p.custo) },
    { titulo: 'Situação', valor: (p) => (p.ativo ? 'Ativo' : 'Inativo') },
  ]

  const filtrosAplicados = [
    { rotulo: 'Busca', valor: aplicados.termo.trim() },
    { rotulo: 'Grupo', valor: aplicados.grupoId ? (nomes.current.get(aplicados.grupoId) ?? '') : '' },
    { rotulo: 'Marca', valor: aplicados.marcaId ? (nomes.current.get(aplicados.marcaId) ?? '') : '' },
    {
      rotulo: 'Situação',
      valor: aplicados.ativo === 'true' ? 'Ativo' : aplicados.ativo === 'false' ? 'Inativo' : '',
    },
  ]

  const alternar = async (produto: ProdutoResponse) => {
    if (
      !(await confirmar({
        mensagem: `${produto.ativo ? 'Inativar' : 'Reativar'} ${produto.nome}?`,
        variante: produto.ativo ? 'inativar' : 'reativar',
      }))
    )
      return
    try {
      await produtoService.alterarAtivo(produto.id, !produto.ativo)
      msg.sucesso(produto.ativo ? `${produto.nome} foi inativado` : `${produto.nome} foi reativado`)
      carregar()
    } catch (erro) {
      msg.erroApi(erro)
    }
  }

  const colunas: Coluna<ProdutoResponse>[] = [
    {
      chave: 'codigo',
      cabecalho: 'Código',
      className: 'w-px whitespace-nowrap tabular-nums',
      render: (p) => p.codigo,
    },
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
    { chave: 'unidade', cabecalho: 'Un.', className: 'w-px whitespace-nowrap', render: (p) => p.unidadeSigla },
    { chave: 'grupo', cabecalho: 'Grupo › Subgrupo', secundaria: true, render: classificacao },
    { chave: 'marca', cabecalho: 'Marca', secundaria: true, render: (p) => p.marcaNome ?? AUSENTE },
    {
      chave: 'custo',
      cabecalho: 'Custo',
      numerica: true,
      className: 'w-px whitespace-nowrap',
      render: (p) => formatarMoeda(p.custo),
    },
    {
      chave: 'situacao',
      cabecalho: 'Situação',
      className: 'w-px whitespace-nowrap',
      render: (p) =>
        p.ativo ? <TBadge tom="sucesso">Ativo</TBadge> : <TBadge tom="neutro">Inativo</TBadge>,
    },
  ]

  return (
    <TPage
      title="Produtos"
      breadcrumb={['Cadastros', 'Produtos']}
      subtitle="O que o seu tenant vende ou consome. O preço de venda é por filial, no estoque."
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
      <TForm form={form} onSubmit={filtrar}>
        <TRow>
          <TEntry name="termo" label="Busca" placeholder="Nome, código ou EAN" />
        </TRow>
        <TRow>
          <TDBCombo
            name="grupoId"
            label="Grupo"
            vazio="Todos"
            placeholder="Todos"
            buscar={(t) =>
              grupos.select(t).then((lista) =>
                lista.map((g) => {
                  nomes.current.set(g.id, g.nome)
                  return g
                }),
              )
            }
          />
        </TRow>
        <TRow>
          <TDBCombo
            name="marcaId"
            label="Marca"
            vazio="Todas"
            placeholder="Todas"
            buscar={(t) =>
              marcas.select(t).then((lista) =>
                lista.map((m) => {
                  nomes.current.set(m.id, m.nome)
                  return m
                }),
              )
            }
          />
        </TRow>
        <TRow>
          <TCombo name="ativo" label="Situação" opcoes={SITUACAO_OPCOES} vazio="Todas" />
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="buscar" type="submit" />
            <TButton variant="limpar" onClick={limpar} />
            {!somenteLeitura && <TButton variant="novo" onClick={() => navigate('/app/produtos/novo')} />}
            <TAcoesDeExportacao
              nome="Produtos"
              colunas={colunasExportadas}
              carregar={carregarTudo}
              aoCarregarParaImprimir={setParaImprimir}
            />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

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
                <>
                  <TButton variant="editar" label="" size="sm" onClick={() => navigate(`/app/produtos/${p.id}`)} />
                  <TButton
                    variant={p.ativo ? 'inativar' : 'reativar'}
                    label=""
                    size="sm"
                    onClick={() => void alternar(p)}
                  />
                </>
              )
        }
      />
      <TDataGridFooter pagina={dados} onPaginaChange={setPagina} />
    </TPage>
  )
}
