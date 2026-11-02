import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { IconAdicionar, IconBusca } from '@/assets/icons'
import {
  TBadge,
  TButton,
  TDBCombo,
  TDataGrid,
  TDataGridFooter,
  TEntry,
  TForm,
  TFormActionsLeft,
  TFormFooter,
  TPage,
  TPanel,
  TCombo,
  TRow,
  TTabPanel,
  TTabs,
  useMessage,
  useQuestion,
  type Aba,
  type Coluna,
} from '@/components/common'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { useSomenteLeitura } from '@/hooks/useSomenteLeitura'
import { handleApiError } from '@/services/api'
import { auxiliarService, subgrupoService } from '@/services/auxiliarProdutoService'
import type { AuxiliarResponse, AuxiliarSimples, SubgrupoResponse } from '@/types/auxiliarProduto'
import type { Page } from '@/types/comum'
import { z } from 'zod'

const ABAS: Aba[] = [
  { id: 'grupos', rotulo: 'Grupos' },
  { id: 'subgrupos', rotulo: 'Subgrupos' },
  { id: 'categorias', rotulo: 'Categorias' },
  { id: 'marcas', rotulo: 'Marcas' },
]

/** Singular de cada aba, para as frases ("Novo grupo", "Marca salva"). */
const NOMES: Record<AuxiliarSimples, { singular: string; feminino: boolean }> = {
  grupos: { singular: 'grupo', feminino: false },
  categorias: { singular: 'categoria', feminino: true },
  marcas: { singular: 'marca', feminino: true },
}

/**
 * Grupo, subgrupo, categoria e marca do produto — uma tela, uma aba para
 * cada. São listas curtas de nomes: o cadastro é ali mesmo, em linha, sem
 * página própria. Nada se apaga — inativa-se, e o produto que já usava
 * continua usando.
 *
 * A aba aberta vai na URL (`?aba=marcas`), para o link levar direto a ela.
 */
export function AuxiliaresProduto() {
  const [busca, setBusca] = useSearchParams()
  const aba = ABAS.some((a) => a.id === busca.get('aba')) ? busca.get('aba')! : 'grupos'

  return (
    <TPage
      title="Auxiliares de produto"
      breadcrumb={['Cadastros', 'Auxiliares de produto']}
      subtitle="Como o seu tenant organiza os produtos. Tudo opcional no cadastro do produto."
    >
      <TTabs abas={ABAS} ativa={aba} onChange={(id) => setBusca({ aba: id }, { replace: true })} />
      <TTabPanel id="grupos" ativa={aba}>
        <PainelSimples tipo="grupos" />
      </TTabPanel>
      <TTabPanel id="subgrupos" ativa={aba}>
        <PainelSubgrupos />
      </TTabPanel>
      <TTabPanel id="categorias" ativa={aba}>
        <PainelSimples tipo="categorias" />
      </TTabPanel>
      <TTabPanel id="marcas" ativa={aba}>
        <PainelSimples tipo="marcas" />
      </TTabPanel>
    </TPage>
  )
}

// ─────────────────────────────────────────────────────────────────────────

/** Busca e situação, comuns às quatro abas. */
function useFiltrosDaLista() {
  const [termo, setTermo] = useState('')
  const [ativo, setAtivo] = useState('true')
  const [pagina, setPagina] = useState(0)
  const termoBusca = useDebounce(termo)
  return { termo, setTermo, termoBusca, ativo, setAtivo, pagina, setPagina }
}

function Filtros({
  termo,
  ativo,
  aoMudarTermo,
  aoMudarAtivo,
}: {
  termo: string
  ativo: string
  aoMudarTermo: (v: string) => void
  aoMudarAtivo: (v: string) => void
}) {
  return (
    <>
      <TEntry
        label="Busca"
        placeholder="Nome"
        value={termo}
        suffix={<IconBusca className="size-4" />}
        onChange={(e) => aoMudarTermo(e.target.value)}
      />
      <TCombo
        label="Situação"
        vazio="Todas"
        opcoes={[
          { valor: 'true', rotulo: 'Ativo' },
          { valor: 'false', rotulo: 'Inativo' },
        ]}
        value={ativo}
        onChange={(e) => aoMudarAtivo(e.target.value)}
      />
    </>
  )
}

function situacao(ativo: boolean) {
  return ativo ? <TBadge tom="sucesso">Ativo</TBadge> : <TBadge tom="neutro">Inativo</TBadge>
}

// ─── Grupo, categoria e marca ────────────────────────────────────────────

const schemaSimples = z.object({
  nome: z.string().trim().min(1, 'Informe o nome').max(100, 'Até 100 caracteres'),
})

type DadosSimples = z.infer<typeof schemaSimples>

const SIMPLES_VAZIO: DadosSimples = { nome: '' }

/**
 * FormList (doc 14 §4.3): o formulário em cima cadastra ou, com uma linha
 * escolhida na grade, edita; a grade embaixo lista ativos e inativos, sem
 * filtro. Inativar e reativar são da grade.
 */
function PainelSimples({ tipo }: { tipo: AuxiliarSimples }) {
  const { sessao } = useAuth()
  const somenteLeitura = useSomenteLeitura('AUXILIARES_PRODUTO')
  const msg = useMessage()
  const { confirmar } = useQuestion()
  const servico = auxiliarService(tipo)
  const { singular, feminino } = NOMES[tipo]
  const form = useForm<DadosSimples>({ resolver: zodResolver(schemaSimples), defaultValues: SIMPLES_VAZIO })
  /** O id em edição; sem ele, o formulário cadastra. */
  const [editando, setEditando] = useState<string>()
  const [pagina, setPagina] = useState(0)
  const [dados, setDados] = useState<Page<AuxiliarResponse>>()
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(() => {
    setCarregando(true)
    servico
      .getAll({ page: pagina, size: 20 })
      .then(setDados)
      .catch(msg.erroApi)
      .finally(() => setCarregando(false))
    // `sessao.tenantId` é sinal de invalidação: trocar de tenant refaz a consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao?.tenantId, tipo, pagina])

  useEffect(carregar, [carregar])

  const limpar = () => {
    setEditando(undefined)
    form.reset(SIMPLES_VAZIO)
  }

  const editar = (item: AuxiliarResponse) => {
    setEditando(item.id)
    form.reset({ nome: item.nome })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const salvar = async (d: DadosSimples) => {
    const nome = d.nome.trim()
    try {
      if (editando) {
        await servico.update(editando, nome)
        msg.sucesso(`${maiuscula(singular)} ${feminino ? 'salva' : 'salvo'}`)
      } else {
        await servico.create(nome)
        msg.sucesso(`${maiuscula(singular)} ${feminino ? 'cadastrada' : 'cadastrado'}`)
      }
      limpar()
      setPagina(0)
      carregar()
    } catch (e) {
      msg.erroApi(e)
    }
  }

  const alternar = async (item: AuxiliarResponse) => {
    if (
      !(await confirmar({
        mensagem: `${item.ativo ? 'Inativar' : 'Reativar'} ${item.nome}?`,
        variante: item.ativo ? 'inativar' : 'reativar',
      }))
    )
      return
    try {
      await servico.alterarAtivo(item.id, !item.ativo)
      msg.sucesso(`${item.nome} foi ${item.ativo ? 'inativad' : 'reativad'}${feminino ? 'a' : 'o'}`)
      carregar()
    } catch (e) {
      msg.erroApi(e)
    }
  }

  const colunas: Coluna<AuxiliarResponse>[] = [
    { chave: 'nome', cabecalho: 'Nome', render: (a) => a.nome },
    {
      chave: 'situacao',
      cabecalho: 'Situação',
      className: 'w-px whitespace-nowrap',
      render: (a) => situacao(a.ativo),
    },
  ]

  return (
    <div className="flex flex-col gap-5 pt-5">
      <TForm form={form} onSubmit={salvar} somenteLeitura={somenteLeitura}>
        <TRow>
          <TEntry name="nome" label="Nome" required maxLength={100} />
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="salvar" type="submit" loading={form.formState.isSubmitting} />
            <TButton variant="novo" onClick={limpar} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        colunas={colunas}
        linhas={dados?.content ?? []}
        chaveDe={(a) => a.id}
        carregando={carregando}
        onLinhaClick={somenteLeitura ? undefined : editar}
        tituloCartao={(a) => a.nome}
        vazioTitulo={`${feminino ? 'Nenhuma' : 'Nenhum'} ${singular} ${feminino ? 'encontrada' : 'encontrado'}`}
        vazioDescricao={somenteLeitura ? '' : 'Cadastre acima.'}
        acoes={
          somenteLeitura
            ? undefined
            : (a) => (
                <>
                  <TButton variant="editar" label="" size="sm" onClick={() => editar(a)} />
                  <TButton
                    variant={a.ativo ? 'inativar' : 'reativar'}
                    label=""
                    size="sm"
                    onClick={() => void alternar(a)}
                  />
                </>
              )
        }
      />
      <TDataGridFooter pagina={dados} onPaginaChange={setPagina} />
    </div>
  )
}

// ─── Subgrupo ────────────────────────────────────────────────────────────

const grupos = auxiliarService('grupos')

function PainelSubgrupos() {
  const { sessao } = useAuth()
  const somenteLeitura = useSomenteLeitura('AUXILIARES_PRODUTO')
  const f = useFiltrosDaLista()
  const [grupoFiltro, setGrupoFiltro] = useState('')

  const [dados, setDados] = useState<Page<SubgrupoResponse>>()
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState<SubgrupoResponse>()
  const [grupoId, setGrupoId] = useState('')
  const [grupoRotulo, setGrupoRotulo] = useState('')
  const [nome, setNome] = useState('')
  const [erros, setErros] = useState<{ grupo?: string; nome?: string }>({})
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(() => {
    setCarregando(true)
    subgrupoService
      .getAll({
        termo: f.termoBusca || undefined,
        grupoId: grupoFiltro || undefined,
        ativo: f.ativo === '' ? undefined : f.ativo === 'true',
        page: f.pagina,
        size: 20,
      })
      .then(setDados)
      .catch(handleApiError)
      .finally(() => setCarregando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao?.tenantId, f.termoBusca, f.ativo, f.pagina, grupoFiltro])

  useEffect(carregar, [carregar])

  // O grupo do filtro é do tenant de antes: trocar de tenant o limpa.
  useEffect(() => setGrupoFiltro(''), [sessao?.tenantId])

  function limpar() {
    setEditando(undefined)
    setGrupoId('')
    setGrupoRotulo('')
    setNome('')
    setErros({})
  }

  async function salvar(evento: FormEvent) {
    evento.preventDefault()
    const texto = nome.trim()
    const novos = {
      grupo: grupoId ? undefined : 'Escolha o grupo',
      nome: !texto ? 'Informe o nome' : texto.length > 100 ? 'Até 100 caracteres' : undefined,
    }
    if (novos.grupo || novos.nome) return setErros(novos)
    setSalvando(true)
    try {
      if (editando) {
        await subgrupoService.update(editando.id, grupoId, texto)
        toast.success('Subgrupo salvo')
      } else {
        await subgrupoService.create(grupoId, texto)
        toast.success('Subgrupo cadastrado')
      }
      limpar()
      carregar()
    } catch (e) {
      handleApiError(e)
    } finally {
      setSalvando(false)
    }
  }

  async function alternarAtivo(item: SubgrupoResponse) {
    try {
      await subgrupoService.alterarAtivo(item.id, !item.ativo)
      toast.success(`${item.nome} foi ${item.ativo ? 'inativado' : 'reativado'}`)
      carregar()
    } catch (e) {
      handleApiError(e)
    }
  }

  const colunas: Coluna<SubgrupoResponse>[] = [
    { chave: 'nome', cabecalho: 'Subgrupo', render: (s) => s.nome },
    {
      chave: 'grupo',
      cabecalho: 'Grupo',
      render: (s) => (
        <span className="flex flex-wrap items-center gap-2">
          {s.grupoNome}
          {!s.grupoAtivo && <TBadge tom="neutro">Grupo inativo</TBadge>}
        </span>
      ),
    },
    { chave: 'situacao', cabecalho: 'Situação', className: 'w-32', render: (s) => situacao(s.ativo) },
  ]

  return (
    <div className="flex flex-col gap-5 pt-5">
      {!somenteLeitura && (
        <TPanel title={editando ? 'Editar subgrupo' : 'Novo subgrupo'}>
          <form
            onSubmit={salvar}
            noValidate
            className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start"
          >
            <TDBCombo
              label="Grupo"
              placeholder="Busque o grupo"
              value={grupoId}
              rotuloInicial={grupoRotulo}
              onChange={(v) => {
                setGrupoId(v)
                setErros((e) => ({ ...e, grupo: undefined }))
              }}
              buscar={(t) => grupos.select(t)}
              error={erros.grupo}
            />
            <TEntry
              label="Nome"
              maxLength={100}
              value={nome}
              error={erros.nome}
              onChange={(e) => {
                setNome(e.target.value)
                setErros((x) => ({ ...x, nome: undefined }))
              }}
            />
            <div className="flex gap-2 sm:mt-6">
              {editando && (
                <TButton type="button" variant="secondary" onClick={limpar}>
                  Cancelar
                </TButton>
              )}
              <TButton type="submit" loading={salvando}>
                {!editando && <IconAdicionar className="size-4" />}
                {editando ? 'Salvar' : 'Adicionar'}
              </TButton>
            </div>
          </form>
        </TPanel>
      )}

      <TPanel>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Filtros
            termo={f.termo}
            ativo={f.ativo}
            aoMudarTermo={(v) => {
              f.setTermo(v)
              f.setPagina(0)
            }}
            aoMudarAtivo={(v) => {
              f.setAtivo(v)
              f.setPagina(0)
            }}
          />
          <TDBCombo
            label="Grupo"
            vazio="Todos"
            placeholder="Todos"
            value={grupoFiltro}
            onChange={(v) => {
              setGrupoFiltro(v)
              f.setPagina(0)
            }}
            buscar={(t) => grupos.select(t)}
          />
        </div>
      </TPanel>

      <TDataGrid
        colunas={colunas}
        linhas={dados?.content ?? []}
        chaveDe={(s) => s.id}
        carregando={carregando}
        onLinhaClick={
          somenteLeitura
            ? undefined
            : (s) => {
                setEditando(s)
                setGrupoId(s.grupoId)
                setGrupoRotulo(s.grupoNome)
                setNome(s.nome)
                setErros({})
              }
        }
        tituloCartao={(s) => s.nome}
        vazioTitulo="Nenhum subgrupo encontrado"
        vazioDescricao={somenteLeitura ? 'Ajuste os filtros.' : 'Ajuste os filtros ou cadastre acima.'}
        acoes={
          somenteLeitura
            ? undefined
            : (s) => (
                <TButton variant="secondary" size="sm" onClick={() => void alternarAtivo(s)}>
                  {s.ativo ? 'Inativar' : 'Reativar'}
                </TButton>
              )
        }
      />
      <TDataGridFooter pagina={dados} onPaginaChange={f.setPagina} />
    </div>
  )
}

function maiuscula(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
