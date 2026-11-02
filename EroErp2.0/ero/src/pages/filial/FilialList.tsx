import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  TAcoesDeExportacao,
  TBadge,
  TButton,
  TCombo,
  TDataGrid,
  TDataGridFooter,
  TEntry,
  TForm,
  TFormActionsLeft,
  TFormFooter,
  TPage,
  TRow,
  useMessage,
  useQuestion,
  type Coluna,
  type OpcaoSelect,
  type PaginaDaCarga,
  type ResultadoDaCarga,
} from '@/components/common'
import { DocumentoLista } from '@/components/impressao/DocumentoLista'
import { useAuth } from '@/hooks/useAuth'
import { useSomenteLeitura } from '@/hooks/useSomenteLeitura'
import { filialService } from '@/services/filialService'
import type { Page } from '@/types/comum'
import { OPCOES_TIPO_FILIAL, type FilialResponse, type TipoFilial } from '@/types/filial'
import { AUSENTE, formatarDocumento, rotuloDe } from '@/utils/format'
import type { ColunaExportavel } from '@/utils/planilha'

/** Os valores do `SITUACAO_OPCOES`, no feminino: é "a filial". */
const SITUACAO_DA_FILIAL: OpcaoSelect[] = [
  { valor: 'true', rotulo: 'Ativa' },
  { valor: 'false', rotulo: 'Inativa' },
]

interface Filtros {
  nome: string
  documento: string
  tipo: string
  ativo: string
}

const FILTROS_VAZIOS: Filtros = { nome: '', documento: '', tipo: '', ativo: 'true' }

/** O que a API recebe: vazio é "sem filtro". */
function paraConsulta(f: Filtros) {
  return {
    nome: f.nome.trim() || undefined,
    documento: f.documento.trim() || undefined,
    tipo: (f.tipo as TipoFilial) || undefined,
    ativo: f.ativo === '' ? undefined : f.ativo === 'true',
  }
}

export function FilialList() {
  const navigate = useNavigate()
  const { sessao } = useAuth()
  const somenteLeitura = useSomenteLeitura('FILIAIS')
  const msg = useMessage()
  const { confirmar } = useQuestion()
  const form = useForm<Filtros>({ defaultValues: FILTROS_VAZIOS })
  const [aplicados, setAplicados] = useState(FILTROS_VAZIOS)
  const [pagina, setPagina] = useState(0)
  const [dados, setDados] = useState<Page<FilialResponse>>()
  const [carregando, setCarregando] = useState(true)
  const [paraImprimir, setParaImprimir] = useState<ResultadoDaCarga<FilialResponse>>()

  const carregar = useCallback(() => {
    setCarregando(true)
    filialService
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

  /** Cobre o filtro aplicado inteiro, não a página aberta. Ver `TAcoesDeExportacao`. */
  const carregarTudo = useCallback(
    async (limite: number, indice: number): Promise<PaginaDaCarga<FilialResponse>> => {
      const pagina = await filialService.getAll({ ...paraConsulta(aplicados), page: indice, size: limite })
      return { linhas: pagina.content, total: pagina.totalElements }
    },
    [aplicados],
  )

  const colunasExportadas: ColunaExportavel<FilialResponse>[] = [
    { titulo: 'Nome', valor: (f) => f.pessoaNome },
    { titulo: 'Nome fantasia', valor: (f) => f.nomeFantasia ?? '' },
    { titulo: 'CPF / CNPJ', semQuebra: true, valor: (f) => formatarDocumento(f.documento) },
    { titulo: 'Tipo', valor: (f) => rotuloDe(OPCOES_TIPO_FILIAL, f.tipo) ?? '' },
    { titulo: 'Matriz', valor: (f) => f.matrizNome ?? '' },
    { titulo: 'Situação', valor: (f) => (f.ativo ? 'Ativa' : 'Inativa') },
  ]

  const filtrosAplicados = [
    { rotulo: 'Nome', valor: aplicados.nome.trim() },
    { rotulo: 'CPF/CNPJ', valor: aplicados.documento.trim() },
    { rotulo: 'Tipo', valor: rotuloDe(OPCOES_TIPO_FILIAL, aplicados.tipo) ?? '' },
    {
      rotulo: 'Situação',
      valor: aplicados.ativo === 'true' ? 'Ativa' : aplicados.ativo === 'false' ? 'Inativa' : '',
    },
  ]

  const alternar = async (filial: FilialResponse) => {
    if (
      !(await confirmar({
        mensagem: `${filial.ativo ? 'Inativar' : 'Reativar'} ${filial.pessoaNome}?`,
        variante: filial.ativo ? 'inativar' : 'reativar',
      }))
    )
      return
    try {
      await filialService.alterarAtivo(filial.id, !filial.ativo)
      msg.sucesso(filial.ativo ? `${filial.pessoaNome} foi inativada` : `${filial.pessoaNome} foi reativada`)
      carregar()
    } catch (erro) {
      msg.erroApi(erro)
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
      className: 'w-px whitespace-nowrap tabular-nums',
      render: (f) => formatarDocumento(f.documento) || AUSENTE,
    },
    {
      chave: 'tipo',
      cabecalho: 'Tipo',
      className: 'w-px whitespace-nowrap',
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
      className: 'w-px whitespace-nowrap',
      render: (f) =>
        f.ativo ? <TBadge tom="sucesso">Ativa</TBadge> : <TBadge tom="neutro">Inativa</TBadge>,
    },
  ]

  return (
    <TPage
      title="Filiais"
      breadcrumb={['Cadastros', 'Filiais']}
      subtitle="Matrizes e filiais em nome das quais o seu tenant opera. Os dados cadastrais ficam na pessoa."
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
      <TForm form={form} onSubmit={filtrar}>
        <TRow>
          <TEntry name="nome" label="Nome" placeholder="Buscar por nome" />
        </TRow>
        <TRow>
          <TEntry name="documento" label="CPF / CNPJ" width="cnpj" placeholder="Com ou sem pontuação" />
        </TRow>
        <TRow>
          <TCombo name="tipo" label="Tipo" vazio="Todos" opcoes={OPCOES_TIPO_FILIAL} />
        </TRow>
        <TRow>
          <TCombo name="ativo" label="Situação" vazio="Todas" opcoes={SITUACAO_DA_FILIAL} />
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="buscar" type="submit" />
            <TButton variant="limpar" onClick={limpar} />
            {!somenteLeitura && <TButton variant="novo" onClick={() => navigate('/app/filiais/nova')} />}
            <TAcoesDeExportacao
              nome="Filiais"
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
        acoes={
          somenteLeitura
            ? undefined
            : (f) => (
                <>
                  <TButton variant="editar" label="" size="sm" onClick={() => navigate(`/app/filiais/${f.id}`)} />
                  <TButton
                    variant={f.ativo ? 'inativar' : 'reativar'}
                    label=""
                    size="sm"
                    onClick={() => void alternar(f)}
                  />
                </>
              )
        }
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
