import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconAdicionar } from '@/assets/icons'
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
import { handleApiError } from '@/services/api'
import { consultaService } from '@/services/consultaService'
import { filialService } from '@/services/filialService'
import { pessoaService } from '@/services/pessoaService'
import { usuarioService } from '@/services/usuarioService'
import type { Page } from '@/types/comum'
import type { StatusCompromisso } from '@/types/compromisso'
import type { ConsultaLista } from '@/types/consulta'
import { diaCurto, diaDe, faixaDeHorario, STATUS_ROTULO, STATUS_TOM } from '@/utils/agenda'
import { fimDoDia, inicioDoDia } from '@/utils/estoque'
import { formatarData, formatarMoeda } from '@/utils/format'
import type { ColunaExportavel } from '@/utils/planilha'

/**
 * As consultas do tenant, da mais recente para a mais antiga. Os filtros são
 * do compromisso — filial, responsável, cliente, situação e o dia do início —
 * porque é lá que esses dados moram.
 */
export function ConsultaList() {
  const navigate = useNavigate()
  const { sessao } = useAuth()
  const somenteLeitura = useSomenteLeitura('CONSULTAS')

  const [filialId, setFilialId] = useState('')
  const [responsavelId, setResponsavelId] = useState('')
  const [pessoaId, setPessoaId] = useState('')
  const nomes = useRef(new Map<string, string>())
  const [status, setStatus] = useState('')
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [pagina, setPagina] = useState(0)
  const [dados, setDados] = useState<Page<ConsultaLista>>()
  const [carregando, setCarregando] = useState(true)
  const [paraImprimir, setParaImprimir] = useState<ResultadoDaCarga<ConsultaLista>>()

  // Trocar de tenant limpa os filtros: o id de lá não existe aqui
  useEffect(() => {
    setFilialId('')
    setResponsavelId('')
    setPessoaId('')
    setPagina(0)
  }, [sessao?.tenantId])

  const filtros = useCallback(
    () => ({
      filialId: filialId || undefined,
      responsavelId: responsavelId || undefined,
      pessoaId: pessoaId || undefined,
      status: (status || undefined) as StatusCompromisso | undefined,
      de: inicioDoDia(de),
      ate: fimDoDia(ate),
    }),
    [filialId, responsavelId, pessoaId, status, de, ate],
  )

  const carregar = useCallback(() => {
    setCarregando(true)
    consultaService
      .getAll({ ...filtros(), page: pagina, size: 20 })
      .then(setDados)
      .catch(handleApiError)
      .finally(() => setCarregando(false))
    // `sessao.tenantId` é sinal de invalidação: trocar de tenant refaz a consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao?.tenantId, filtros, pagina])

  useEffect(carregar, [carregar])

  /** Cobre o filtro inteiro, não a página aberta. Ver `TAcoesDeExportacao`. */
  const carregarTudo = useCallback(
    async (limite: number, indice: number): Promise<PaginaDaCarga<ConsultaLista>> => {
      const pagina = await consultaService.getAll({ ...filtros(), page: indice, size: limite })
      return { linhas: pagina.content, total: pagina.totalElements }
    },
    [filtros],
  )

  const colunasExportadas: ColunaExportavel<ConsultaLista>[] = [
    { titulo: 'Dia', valor: (c) => diaCurto(diaDe(c.inicio)) },
    { titulo: 'Horário', valor: (c) => faixaDeHorario(c.inicio, c.fim) },
    { titulo: 'Cliente', valor: (c) => c.pessoaNome ?? '' },
    { titulo: 'Título', valor: (c) => c.titulo },
    { titulo: 'Responsável', valor: (c) => c.responsavelNome },
    { titulo: 'Filial', valor: (c) => c.filialNome },
    { titulo: 'Situação', valor: (c) => STATUS_ROTULO[c.status] },
    { titulo: 'Total', valor: (c) => formatarMoeda(c.total) },
  ]

  const filtrosAplicados = [
    { rotulo: 'Filial', valor: filialId ? (nomes.current.get(filialId) ?? '') : '' },
    { rotulo: 'Responsável', valor: responsavelId ? (nomes.current.get(responsavelId) ?? '') : '' },
    { rotulo: 'Cliente', valor: pessoaId ? (nomes.current.get(pessoaId) ?? '') : '' },
    { rotulo: 'Situação', valor: status ? STATUS_ROTULO[status as StatusCompromisso] : '' },
    { rotulo: 'De', valor: de ? formatarData(`${de}T00:00:00`) : '' },
    { rotulo: 'Até', valor: ate ? formatarData(`${ate}T00:00:00`) : '' },
  ]

  const colunas: Coluna<ConsultaLista>[] = [
    {
      chave: 'quando',
      cabecalho: 'Quando',
      className: 'w-36 tabular-nums',
      render: (c) => (
        <span className="flex flex-col">
          <span>{diaCurto(diaDe(c.inicio))}</span>
          <span className="text-caption text-txt-secondary">{faixaDeHorario(c.inicio, c.fim)}</span>
        </span>
      ),
    },
    {
      chave: 'cliente',
      cabecalho: 'Cliente',
      render: (c) => (
        <span className="flex min-w-0 flex-col">
          <span>{c.pessoaNome}</span>
          <span className="line-clamp-1 text-caption text-txt-secondary">{c.titulo}</span>
        </span>
      ),
    },
    { chave: 'responsavel', cabecalho: 'Responsável', render: (c) => c.responsavelNome },
    {
      chave: 'filial',
      cabecalho: 'Filial',
      secundaria: true,
      render: (c) => (
        <span className="flex items-center gap-2">
          <BolinhaDaCor cor={c.filialCor} />
          {c.filialNome}
        </span>
      ),
    },
    {
      chave: 'situacao',
      cabecalho: 'Situação',
      render: (c) => <TBadge tom={STATUS_TOM[c.status]}>{STATUS_ROTULO[c.status]}</TBadge>,
    },
    { chave: 'total', cabecalho: 'Total', numerica: true, render: (c) => formatarMoeda(c.total) },
  ]

  function guardarNome<T extends { id: string; nome: string }>(lista: T[]) {
    return lista.map((i) => {
      nomes.current.set(i.id, i.nome)
      return { id: i.id, nome: i.nome }
    })
  }

  return (
    <TPage
      title="Consultas"
      subtitle="O atendimento sobre o compromisso da agenda, com serviços e produtos."
      actions={
        <>
          <TAcoesDeExportacao
            nome="Consultas"
            colunas={colunasExportadas}
            carregar={carregarTudo}
            aoCarregarParaImprimir={setParaImprimir}
          />
          {!somenteLeitura && (
            <TButton onClick={() => navigate('/app/consultas/nova')}>
              <IconAdicionar className="size-4" />
              Nova consulta
            </TButton>
          )}
        </>
      }
      documento={
        paraImprimir && (
          <DocumentoLista
            titulo="Consultas"
            colunas={colunasExportadas}
            linhas={paraImprimir.linhas}
            truncado={paraImprimir.restantes}
            filtros={filtrosAplicados}
            chaveDe={(c) => c.id}
            resumo={[
              { rotulo: 'Consultas', valor: String(paraImprimir.linhas.length) },
              {
                rotulo: 'Total',
                valor: formatarMoeda(paraImprimir.linhas.reduce((soma, c) => soma + c.total, 0)),
              },
            ]}
          />
        )
      }
    >
      <TPanel>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <TCombo
            label="Filial"
            vazio="Todas"
            placeholder="Todas"
            value={filialId}
            onChange={(v) => {
              setFilialId(v)
              setPagina(0)
            }}
            buscar={(t) => filialService.select(t).then(guardarNome)}
          />
          <TCombo
            label="Responsável"
            vazio="Todos"
            placeholder="Todos"
            value={responsavelId}
            onChange={(v) => {
              setResponsavelId(v)
              setPagina(0)
            }}
            buscar={(t) => usuarioService.select(t).then(guardarNome)}
          />
          <TCombo
            label="Cliente"
            vazio="Todos"
            placeholder="Todos"
            value={pessoaId}
            onChange={(v) => {
              setPessoaId(v)
              setPagina(0)
            }}
            buscar={(t) => pessoaService.select(t).then(guardarNome)}
          />
          <TSelect
            label="Situação"
            vazio="Todas"
            opcoes={Object.entries(STATUS_ROTULO).map(([valor, rotulo]) => ({ valor, rotulo }))}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
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
        chaveDe={(c) => c.id}
        carregando={carregando}
        onLinhaClick={(c) => navigate(`/app/consultas/${c.id}`)}
        tituloCartao={(c) => `${c.pessoaNome ?? c.titulo} · ${diaCurto(diaDe(c.inicio))}`}
        vazioTitulo="Nenhuma consulta encontrada"
        vazioDescricao={
          somenteLeitura
            ? 'Ajuste os filtros.'
            : 'Ajuste os filtros, abra uma consulta nova ou inicie uma a partir da agenda.'
        }
      />

      <TDataGridFooter pagina={dados} onPaginaChange={setPagina} />
    </TPage>
  )
}
