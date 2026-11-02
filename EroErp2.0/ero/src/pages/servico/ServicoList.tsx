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
import { filialService } from '@/services/filialService'
import { servicoService } from '@/services/servicoService'
import type { Page } from '@/types/comum'
import type { ServicoResponse } from '@/types/servico'
import { AUSENTE, formatarMoeda } from '@/utils/format'
import type { ColunaExportavel } from '@/utils/planilha'

interface Filtros {
  termo: string
  filialId: string
  ativo: string
}

const FILTROS_VAZIOS: Filtros = { termo: '', filialId: '', ativo: 'true' }

/** O que a API recebe: vazio é "sem filtro". */
function paraConsulta(f: Filtros) {
  return {
    termo: f.termo.trim() || undefined,
    filialId: f.filialId || undefined,
    ativo: f.ativo === '' ? undefined : f.ativo === 'true',
  }
}

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
  const msg = useMessage()
  const { confirmar } = useQuestion()
  const form = useForm<Filtros>({ defaultValues: FILTROS_VAZIOS })
  const [aplicados, setAplicados] = useState(FILTROS_VAZIOS)
  const [pagina, setPagina] = useState(0)
  const [dados, setDados] = useState<Page<ServicoResponse>>()
  const [carregando, setCarregando] = useState(true)
  const [paraImprimir, setParaImprimir] = useState<ResultadoDaCarga<ServicoResponse>>()
  /** Nome de cada filial que o combo já trouxe — o filtro aplicado da folha o mostra. */
  const nomesDeFilial = useRef(new Map<string, string>())

  const carregar = useCallback(() => {
    setCarregando(true)
    servicoService
      .getAll({ ...paraConsulta(aplicados), page: pagina, size: 20 })
      .then(setDados)
      .catch(msg.erroApi)
      .finally(() => setCarregando(false))
    // `sessao.tenantId` é sinal de invalidação: trocar de tenant refaz a
    // consulta, senão a tela fica com os dados do cliente anterior.
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

  // A filial escolhida é do tenant de antes: trocar de tenant limpa o filtro.
  useEffect(() => {
    form.reset(FILTROS_VAZIOS)
    setAplicados(FILTROS_VAZIOS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao?.tenantId])

  /** Cobre o filtro aplicado inteiro, não a página aberta. Ver `TAcoesDeExportacao`. */
  const carregarTudo = useCallback(
    async (limite: number, indice: number): Promise<PaginaDaCarga<ServicoResponse>> => {
      const pagina = await servicoService.getAll({ ...paraConsulta(aplicados), page: indice, size: limite })
      return { linhas: pagina.content, total: pagina.totalElements }
    },
    [aplicados],
  )

  const filialRotulo = nomesDeFilial.current.get(aplicados.filialId) ?? ''

  const colunasExportadas: ColunaExportavel<ServicoResponse>[] = [
    { titulo: 'Código', valor: (s) => String(s.codigo) },
    { titulo: 'Nome', valor: (s) => s.nome },
    {
      titulo: aplicados.filialId ? `Valor (${filialRotulo})` : 'Valor',
      valor: (s) => valorExibido(s, aplicados.filialId),
    },
    { titulo: 'Valores por filial', valor: (s) => valoresPorFilial(s) },
    { titulo: 'Observação', valor: (s) => s.observacao ?? '' },
    { titulo: 'Situação', valor: (s) => (s.ativo ? 'Ativo' : 'Inativo') },
  ]

  const filtrosAplicados = [
    { rotulo: 'Busca', valor: aplicados.termo.trim() },
    { rotulo: 'Filial', valor: aplicados.filialId ? filialRotulo : '' },
    {
      rotulo: 'Situação',
      valor: aplicados.ativo === 'true' ? 'Ativo' : aplicados.ativo === 'false' ? 'Inativo' : '',
    },
  ]

  const alternar = async (servico: ServicoResponse) => {
    if (
      !(await confirmar({
        mensagem: `${servico.ativo ? 'Inativar' : 'Reativar'} ${servico.nome}?`,
        variante: servico.ativo ? 'inativar' : 'reativar',
      }))
    )
      return
    try {
      await servicoService.alterarAtivo(servico.id, !servico.ativo)
      msg.sucesso(servico.ativo ? `${servico.nome} foi inativado` : `${servico.nome} foi reativado`)
      carregar()
    } catch (erro) {
      msg.erroApi(erro)
    }
  }

  const colunas: Coluna<ServicoResponse>[] = [
    {
      chave: 'codigo',
      cabecalho: 'Código',
      className: 'w-px whitespace-nowrap tabular-nums',
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
      cabecalho: aplicados.filialId ? 'Valor na filial' : 'Valor',
      numerica: true,
      className: 'w-px whitespace-nowrap',
      render: (s) => (
        <span className="flex flex-col">
          <span>{valorExibido(s, aplicados.filialId)}</span>
          {!aplicados.filialId && s.filiais.length > 0 && (
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
      className: 'w-px whitespace-nowrap',
      render: (s) =>
        s.ativo ? <TBadge tom="sucesso">Ativo</TBadge> : <TBadge tom="neutro">Inativo</TBadge>,
    },
  ]

  return (
    <TPage
      title="Serviços"
      breadcrumb={['Cadastros', 'Serviços']}
      subtitle="O que o seu tenant presta. Serviço não tem estoque; o valor, opcional, é por filial."
      actions={
        <TAcoesDeExportacao
          nome="Serviços"
          colunas={colunasExportadas}
          carregar={carregarTudo}
          aoCarregarParaImprimir={setParaImprimir}
        />
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
                  paraImprimir.linhas.filter((s) => valorExibido(s, aplicados.filialId) === AUSENTE)
                    .length,
                ),
              },
            ]}
            nota="Valor em branco é não informado, não zero."
          />
        )
      }
    >
      <TForm form={form} onSubmit={filtrar}>
        <TRow>
          <TEntry name="termo" label="Busca" placeholder="Nome ou código" />
        </TRow>
        <TRow>
          <TDBCombo
            name="filialId"
            label="Filial"
            vazio="Todas"
            placeholder="Todas"
            buscar={(t) =>
              filialService.select(t).then((filiais) =>
                filiais.map((f) => {
                  nomesDeFilial.current.set(f.id, f.nome)
                  return { id: f.id, nome: f.nome }
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
            <TButton variant="filtrar" type="submit" />
            <TButton variant="limpar" onClick={limpar} />
            {!somenteLeitura && <TButton variant="novo" onClick={() => navigate('/app/servicos/novo')} />}
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

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
        acoes={
          somenteLeitura
            ? undefined
            : (s) => (
                <>
                  <TButton variant="editar" label="" size="sm" onClick={() => navigate(`/app/servicos/${s.id}`)} />
                  <TButton
                    variant={s.ativo ? 'inativar' : 'reativar'}
                    label=""
                    size="sm"
                    onClick={() => void alternar(s)}
                  />
                </>
              )
        }
      />
      <TDataGridFooter pagina={dados} onPaginaChange={setPagina} />
    </TPage>
  )
}
