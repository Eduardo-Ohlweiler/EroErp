import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
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
  TRow,
  TTabPanel,
  TTabs,
  useMessage,
  useQuestion,
  type Aba,
  type Coluna,
} from '@/components/common'
import { useAuth } from '@/hooks/useAuth'
import { useSomenteLeitura } from '@/hooks/useSomenteLeitura'
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
      // Na página 0, recarrega; noutra, a troca de página já recarrega — as
      // duas juntas disparavam duas consultas, e a da página velha podia chegar depois.
      if (pagina === 0) carregar()
      else setPagina(0)
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

const schemaSubgrupo = z.object({
  grupoId: z.string().min(1, 'Escolha o grupo'),
  nome: z.string().trim().min(1, 'Informe o nome').max(100, 'Até 100 caracteres'),
})

type DadosSubgrupo = z.infer<typeof schemaSubgrupo>

const SUBGRUPO_VAZIO: DadosSubgrupo = { grupoId: '', nome: '' }

/** FormList como o `PainelSimples`, com o grupo a que o subgrupo pertence. */
function PainelSubgrupos() {
  const { sessao } = useAuth()
  const somenteLeitura = useSomenteLeitura('AUXILIARES_PRODUTO')
  const msg = useMessage()
  const { confirmar } = useQuestion()
  const form = useForm<DadosSubgrupo>({ resolver: zodResolver(schemaSubgrupo), defaultValues: SUBGRUPO_VAZIO })
  /** O id em edição; sem ele, o formulário cadastra. */
  const [editando, setEditando] = useState<string>()
  /** O nome do grupo do subgrupo em edição, para o combo não abrir com o id cru. */
  const [grupoRotulo, setGrupoRotulo] = useState('')
  const [pagina, setPagina] = useState(0)
  const [dados, setDados] = useState<Page<SubgrupoResponse>>()
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(() => {
    setCarregando(true)
    subgrupoService
      .getAll({ page: pagina, size: 20 })
      .then(setDados)
      .catch(msg.erroApi)
      .finally(() => setCarregando(false))
    // `sessao.tenantId` é sinal de invalidação: trocar de tenant refaz a consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao?.tenantId, pagina])

  useEffect(carregar, [carregar])

  const limpar = () => {
    setEditando(undefined)
    setGrupoRotulo('')
    form.reset(SUBGRUPO_VAZIO)
  }

  const editar = (item: SubgrupoResponse) => {
    setEditando(item.id)
    setGrupoRotulo(item.grupoNome)
    form.reset({ grupoId: item.grupoId, nome: item.nome })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const salvar = async (d: DadosSubgrupo) => {
    const nome = d.nome.trim()
    try {
      if (editando) {
        await subgrupoService.update(editando, d.grupoId, nome)
        msg.sucesso('Subgrupo salvo')
      } else {
        await subgrupoService.create(d.grupoId, nome)
        msg.sucesso('Subgrupo cadastrado')
      }
      limpar()
      // Na página 0, recarrega; noutra, a troca de página já recarrega.
      if (pagina === 0) carregar()
      else setPagina(0)
    } catch (e) {
      msg.erroApi(e)
    }
  }

  const alternar = async (item: SubgrupoResponse) => {
    if (
      !(await confirmar({
        mensagem: `${item.ativo ? 'Inativar' : 'Reativar'} ${item.nome}?`,
        variante: item.ativo ? 'inativar' : 'reativar',
      }))
    )
      return
    try {
      await subgrupoService.alterarAtivo(item.id, !item.ativo)
      msg.sucesso(`${item.nome} foi ${item.ativo ? 'inativado' : 'reativado'}`)
      carregar()
    } catch (e) {
      msg.erroApi(e)
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
    {
      chave: 'situacao',
      cabecalho: 'Situação',
      className: 'w-px whitespace-nowrap',
      render: (s) => situacao(s.ativo),
    },
  ]

  return (
    <div className="flex flex-col gap-5 pt-5">
      <TForm form={form} onSubmit={salvar} somenteLeitura={somenteLeitura}>
        <TRow>
          <TDBCombo
            name="grupoId"
            label="Grupo"
            required
            placeholder="Busque o grupo"
            rotuloInicial={grupoRotulo}
            buscar={(t) => grupos.select(t)}
          />
        </TRow>
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
        chaveDe={(s) => s.id}
        carregando={carregando}
        onLinhaClick={somenteLeitura ? undefined : editar}
        tituloCartao={(s) => s.nome}
        vazioTitulo="Nenhum subgrupo encontrado"
        vazioDescricao={somenteLeitura ? '' : 'Cadastre acima.'}
        acoes={
          somenteLeitura
            ? undefined
            : (s) => (
                <>
                  <TButton variant="editar" label="" size="sm" onClick={() => editar(s)} />
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
    </div>
  )
}

function maiuscula(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
