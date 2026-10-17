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
import { filialService } from '@/services/filialService'
import { servicoService } from '@/services/servicoService'
import type { Page } from '@/types/comum'
import type { ServicoResponse } from '@/types/servico'
import { AUSENTE, formatarMoeda } from '@/utils/format'
import type { ColunaExportavel } from '@/utils/planilha'

/**
 * O valor que a lista mostra. Com uma filial no filtro, o daquela filial; sem
 * filtro, o único valor informado ou a faixa entre o menor e o maior. Nenhum
 * informado é o traço — vazio não é R$ 0,00.
 */
function valorExibido(servico: ServicoResponse, filialId?: string): string {
  if (filialId) {
    return formatarMoeda(servico.filiais.find((f) => f.filialId === filialId)?.valor)
  }
  const valores = servico.filiais
    .map((f) => f.valor)
    .filter((v): v is number => v !== null && v !== undefined)
  if (valores.length === 0) return AUSENTE
  const menor = Math.min(...valores)
  const maior = Math.max(...valores)
  return menor === maior ? formatarMoeda(menor) : `${formatarMoeda(menor)} – ${formatarMoeda(maior)}`
}

/** "Loja Centro: R$ 120,50 · Loja Matriz: —" — o detalhe que a planilha e a folha levam. */
function valoresPorFilial(servico: ServicoResponse): string {
  return servico.filiais.map((f) => `${f.filialNome}: ${formatarMoeda(f.valor)}`).join(' · ')
}

export function ServicoList() {
  const navigate = useNavigate()
  const { sessao } = useAuth()
  const somenteLeitura = useSomenteLeitura('SERVICOS')

  const [termo, setTermo] = useState('')
  const [filialId, setFilialId] = useState('')
  const [filialRotulo, setFilialRotulo] = useState('')
  /** Nome de cada filial que o combo já trouxe — o filtro aplicado da folha o mostra. */
  const nomesDeFilial = useRef(new Map<string, string>())
  const [ativo, setAtivo] = useState('true')
  const [pagina, setPagina] = useState(0)
  const [dados, setDados] = useState<Page<ServicoResponse>>()
  const [carregando, setCarregando] = useState(true)
  const [paraImprimir, setParaImprimir] = useState<ResultadoDaCarga<ServicoResponse>>()

  const termoBusca = useDebounce(termo)

  const filtros = useCallback(
    () => ({
      termo: termoBusca || undefined,
      filialId: filialId || undefined,
      ativo: ativo === '' ? undefined : ativo === 'true',
    }),
    [termoBusca, filialId, ativo],
  )

  const carregar = useCallback(() => {
    setCarregando(true)
    servicoService
      .getAll({ ...filtros(), page: pagina, size: 20 })
      .then(setDados)
      .catch(handleApiError)
      .finally(() => setCarregando(false))
    // `sessao.tenantId` é sinal de invalidação: trocar de tenant refaz a
    // consulta, senão a tela fica com os dados do cliente anterior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao?.tenantId, filtros, pagina])

  useEffect(carregar, [carregar])

  // A filial escolhida é do tenant de antes: trocar de tenant limpa o filtro.
  useEffect(() => {
    setFilialId('')
    setFilialRotulo('')
  }, [sessao?.tenantId])

  /** Cobre o filtro inteiro, não a página aberta. Ver `TAcoesDeExportacao`. */
  const carregarTudo = useCallback(
    async (limite: number, indice: number): Promise<PaginaDaCarga<ServicoResponse>> => {
      const pagina = await servicoService.getAll({ ...filtros(), page: indice, size: limite })
      return { linhas: pagina.content, total: pagina.totalElements }
    },
    [filtros],
  )

  const colunasExportadas: ColunaExportavel<ServicoResponse>[] = [
    { titulo: 'Código', valor: (s) => String(s.codigo) },
    { titulo: 'Nome', valor: (s) => s.nome },
    { titulo: filialId ? `Valor (${filialRotulo})` : 'Valor', valor: (s) => valorExibido(s, filialId) },
    { titulo: 'Valores por filial', valor: (s) => valoresPorFilial(s) },
    { titulo: 'Observação', valor: (s) => s.observacao ?? '' },
    { titulo: 'Situação', valor: (s) => (s.ativo ? 'Ativo' : 'Inativo') },
  ]

  const filtrosAplicados = [
    { rotulo: 'Busca', valor: termoBusca },
    { rotulo: 'Filial', valor: filialId ? filialRotulo : '' },
    { rotulo: 'Situação', valor: ativo === 'true' ? 'Ativo' : ativo === 'false' ? 'Inativo' : '' },
  ]

  async function alternarAtivo(servico: ServicoResponse) {
    try {
      await servicoService.alterarAtivo(servico.id, !servico.ativo)
      toast.success(servico.ativo ? `${servico.nome} foi inativado` : `${servico.nome} foi reativado`)
      carregar()
    } catch (erro) {
      handleApiError(erro)
    }
  }

  const colunas: Coluna<ServicoResponse>[] = [
    {
      chave: 'codigo',
      cabecalho: 'Código',
      className: 'w-24 tabular-nums',
      render: (s) => s.codigo,
    },
    {
      chave: 'nome',
      cabecalho: 'Nome',
      render: (s) => (
        <span className="flex min-w-0 flex-col">
          <span>{s.nome}</span>
          {s.observacao && (
            <span className="line-clamp-1 text-caption text-txt-secondary">{s.observacao}</span>
          )}
        </span>
      ),
    },
    {
      chave: 'valor',
      cabecalho: filialId ? 'Valor na filial' : 'Valor',
      numerica: true,
      render: (s) => (
        <span className="flex flex-col">
          <span>{valorExibido(s, filialId)}</span>
          {!filialId && s.filiais.length > 0 && (
            <span className="text-caption text-txt-secondary">
              {s.filiais.length === 1 ? s.filiais[0].filialNome : `${s.filiais.length} filiais`}
            </span>
          )}
        </span>
      ),
    },
    {
      chave: 'situacao',
      cabecalho: 'Situação',
      render: (s) =>
        s.ativo ? <TBadge tom="sucesso">Ativo</TBadge> : <TBadge tom="neutro">Inativo</TBadge>,
    },
  ]

  return (
    <TPage
      title="Serviços"
      subtitle="O que o seu tenant presta. Serviço não tem estoque; o valor, opcional, é por filial."
      actions={
        <>
          <TAcoesDeExportacao
            nome="Serviços"
            colunas={colunasExportadas}
            carregar={carregarTudo}
            aoCarregarParaImprimir={setParaImprimir}
          />
          {!somenteLeitura && (
            <TButton onClick={() => navigate('/app/servicos/novo')}>
              <IconAdicionar className="size-4" />
              Novo serviço
            </TButton>
          )}
        </>
      }
      documento={
        paraImprimir && (
          <DocumentoLista
            titulo="Serviços"
            colunas={colunasExportadas}
            linhas={paraImprimir.linhas}
            truncado={paraImprimir.restantes}
            filtros={filtrosAplicados}
            chaveDe={(s) => s.id}
            resumo={[
              { rotulo: 'Serviços', valor: String(paraImprimir.linhas.length) },
              {
                rotulo: 'Ativos',
                valor: String(paraImprimir.linhas.filter((s) => s.ativo).length),
              },
              {
                rotulo: 'Sem valor',
                valor: String(
                  paraImprimir.linhas.filter((s) => valorExibido(s, filialId) === AUSENTE).length,
                ),
              },
            ]}
            nota="Valor em branco é não informado, não zero."
          />
        )
      }
    >
      <TPanel>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TEntry
            label="Busca"
            placeholder="Nome ou código"
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
            rotuloInicial={filialRotulo}
            onChange={(valor) => {
              setFilialId(valor)
              setFilialRotulo(nomesDeFilial.current.get(valor) ?? '')
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
        chaveDe={(s) => s.id}
        carregando={carregando}
        onLinhaClick={(s) => navigate(`/app/servicos/${s.id}`)}
        tituloCartao={(s) => s.nome}
        vazioTitulo="Nenhum serviço encontrado"
        vazioDescricao={
          somenteLeitura ? 'Ajuste os filtros.' : 'Ajuste os filtros ou cadastre o primeiro serviço.'
        }
        acoes={somenteLeitura ? undefined : (s) => (
          <TButton
            variant="secondary"
            size="sm"
            onClick={() => void alternarAtivo(s)}
            title={s.ativo ? 'Inativar — o cadastro continua no histórico' : 'Reativar o serviço'}
          >
            {s.ativo ? 'Inativar' : 'Reativar'}
          </TButton>
        )}
      />

      <TDataGridFooter pagina={dados} onPaginaChange={setPagina} />
    </TPage>
  )
}
