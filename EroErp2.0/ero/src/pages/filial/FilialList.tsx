import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { IconAdicionar, IconBusca } from '@/assets/icons'
import {
  TAcoesDeExportacao,
  TBadge,
  TButton,
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
import type { Page } from '@/types/comum'
import { OPCOES_TIPO_FILIAL, type FilialResponse, type TipoFilial } from '@/types/filial'
import { AUSENTE, formatarDocumento, rotuloDe } from '@/utils/format'
import type { ColunaExportavel } from '@/utils/planilha'

export function FilialList() {
  const navigate = useNavigate()
  const { sessao } = useAuth()
  const somenteLeitura = useSomenteLeitura('FILIAIS')

  const [nome, setNome] = useState('')
  const [documento, setDocumento] = useState('')
  const [tipo, setTipo] = useState('')
  const [ativo, setAtivo] = useState('true')
  const [pagina, setPagina] = useState(0)
  const [dados, setDados] = useState<Page<FilialResponse>>()
  const [carregando, setCarregando] = useState(true)
  const [paraImprimir, setParaImprimir] = useState<ResultadoDaCarga<FilialResponse>>()

  const nomeBusca = useDebounce(nome)
  const documentoBusca = useDebounce(documento)

  const filtros = useCallback(
    () => ({
      nome: nomeBusca || undefined,
      documento: documentoBusca || undefined,
      tipo: (tipo as TipoFilial) || undefined,
      ativo: ativo === '' ? undefined : ativo === 'true',
    }),
    [nomeBusca, documentoBusca, tipo, ativo],
  )

  const carregar = useCallback(() => {
    setCarregando(true)
    filialService
      .getAll({ ...filtros(), page: pagina, size: 20 })
      .then(setDados)
      .catch(handleApiError)
      .finally(() => setCarregando(false))
    // `sessao.tenantId` é sinal de invalidação: trocar de tenant refaz a
    // consulta, senão a tela fica com os dados do cliente anterior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao?.tenantId, filtros, pagina])

  useEffect(carregar, [carregar])

  /** Cobre o filtro inteiro, não a página aberta. Ver `TAcoesDeExportacao`. */
  const carregarTudo = useCallback(
    async (limite: number, indice: number): Promise<PaginaDaCarga<FilialResponse>> => {
      const pagina = await filialService.getAll({ ...filtros(), page: indice, size: limite })
      return { linhas: pagina.content, total: pagina.totalElements }
    },
    [filtros],
  )

  const colunasExportadas: ColunaExportavel<FilialResponse>[] = [
    { titulo: 'Nome', valor: (f) => f.pessoaNome },
    { titulo: 'Nome fantasia', valor: (f) => f.nomeFantasia ?? '' },
    { titulo: 'CPF / CNPJ', valor: (f) => formatarDocumento(f.documento) },
    { titulo: 'Tipo', valor: (f) => rotuloDe(OPCOES_TIPO_FILIAL, f.tipo) ?? '' },
    { titulo: 'Matriz', valor: (f) => f.matrizNome ?? '' },
    { titulo: 'Situação', valor: (f) => (f.ativo ? 'Ativa' : 'Inativa') },
  ]

  const filtrosAplicados = [
    { rotulo: 'Nome', valor: nomeBusca },
    { rotulo: 'CPF/CNPJ', valor: documentoBusca },
    { rotulo: 'Tipo', valor: rotuloDe(OPCOES_TIPO_FILIAL, tipo) ?? '' },
    { rotulo: 'Situação', valor: ativo === 'true' ? 'Ativa' : ativo === 'false' ? 'Inativa' : '' },
  ]

  async function alternarAtivo(filial: FilialResponse) {
    try {
      await filialService.alterarAtivo(filial.id, !filial.ativo)
      toast.success(
        filial.ativo ? `${filial.pessoaNome} foi inativada` : `${filial.pessoaNome} foi reativada`,
      )
      carregar()
    } catch (erro) {
      handleApiError(erro)
    }
  }

  const colunas: Coluna<FilialResponse>[] = [
    {
      chave: 'nome',
      cabecalho: 'Nome',
      render: (f) => (
        <span className="flex items-center gap-2.5">
          <BolinhaDaCor cor={f.cor} />
          <span className="flex min-w-0 flex-col">
            <span>{f.pessoaNome}</span>
            {f.nomeFantasia && (
              <span className="text-caption text-txt-secondary">{f.nomeFantasia}</span>
            )}
          </span>
        </span>
      ),
    },
    {
      chave: 'documento',
      cabecalho: 'CPF / CNPJ',
      render: (f) => formatarDocumento(f.documento) || AUSENTE,
    },
    {
      chave: 'tipo',
      cabecalho: 'Tipo',
      render: (f) =>
        f.tipo === 'MATRIZ' ? <TBadge tom="info">Matriz</TBadge> : <TBadge tom="sage">Filial</TBadge>,
    },
    {
      chave: 'matriz',
      cabecalho: 'Matriz',
      secundaria: true,
      render: (f) => f.matrizNome ?? AUSENTE,
    },
    {
      chave: 'situacao',
      cabecalho: 'Situação',
      render: (f) =>
        f.ativo ? <TBadge tom="sucesso">Ativa</TBadge> : <TBadge tom="neutro">Inativa</TBadge>,
    },
  ]

  return (
    <TPage
      title="Filiais"
      subtitle="Matrizes e filiais em nome das quais o seu tenant opera. Os dados cadastrais ficam na pessoa."
      actions={
        <>
          <TAcoesDeExportacao
            nome="Filiais"
            colunas={colunasExportadas}
            carregar={carregarTudo}
            aoCarregarParaImprimir={setParaImprimir}
          />
          {!somenteLeitura && (
            <TButton onClick={() => navigate('/app/filiais/nova')}>
              <IconAdicionar className="size-4" />
              Nova filial
            </TButton>
          )}
        </>
      }
      documento={
        paraImprimir && (
          <DocumentoLista
            titulo="Filiais"
            colunas={colunasExportadas}
            linhas={paraImprimir.linhas}
            truncado={paraImprimir.restantes}
            filtros={filtrosAplicados}
            chaveDe={(f) => f.id}
            resumo={[
              { rotulo: 'Filiais', valor: String(paraImprimir.linhas.length) },
              {
                rotulo: 'Matrizes',
                valor: String(paraImprimir.linhas.filter((f) => f.tipo === 'MATRIZ').length),
              },
              {
                rotulo: 'Ativas',
                valor: String(paraImprimir.linhas.filter((f) => f.ativo).length),
              },
            ]}
            nota="Cada matriz vem seguida das suas filiais."
          />
        )
      }
    >
      <TPanel>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TEntry
            label="Nome"
            placeholder="Buscar por nome"
            value={nome}
            suffix={<IconBusca className="size-4" />}
            onChange={(e) => {
              setNome(e.target.value)
              setPagina(0)
            }}
          />
          <TEntry
            label="CPF / CNPJ"
            placeholder="Com ou sem pontuação"
            value={documento}
            onChange={(e) => {
              setDocumento(e.target.value)
              setPagina(0)
            }}
          />
          <TSelect
            label="Tipo"
            vazio="Todos"
            opcoes={OPCOES_TIPO_FILIAL}
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value)
              setPagina(0)
            }}
          />
          <TSelect
            label="Situação"
            vazio="Todas"
            opcoes={[
              { valor: 'true', rotulo: 'Ativa' },
              { valor: 'false', rotulo: 'Inativa' },
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
        chaveDe={(f) => f.id}
        carregando={carregando}
        onLinhaClick={(f) => navigate(`/app/filiais/${f.id}`)}
        tituloCartao={(f) => (
          <span className="flex items-center gap-2">
            <BolinhaDaCor cor={f.cor} />
            {f.pessoaNome}
          </span>
        )}
        vazioTitulo="Nenhuma filial encontrada"
        vazioDescricao={
          somenteLeitura
            ? 'Ajuste os filtros.'
            : 'Ajuste os filtros ou cadastre a primeira matriz.'
        }
        acoes={somenteLeitura ? undefined : (f) => (
          <TButton
            variant="secondary"
            size="sm"
            onClick={() => void alternarAtivo(f)}
            title={f.ativo ? 'Inativar — o cadastro continua no histórico' : 'Reativar a filial'}
          >
            {f.ativo ? 'Inativar' : 'Reativar'}
          </TButton>
        )}
      />

      <TDataGridFooter pagina={dados} onPaginaChange={setPagina} />
    </TPage>
  )
}

/** A cor da filial, como ela aparece nas outras telas. */
export function BolinhaDaCor({ cor }: { cor: string }) {
  return (
    <span
      aria-hidden
      style={{ backgroundColor: cor }}
      className="inline-block size-3 shrink-0 rounded-full ring-1 ring-line-strong"
    />
  )
}
