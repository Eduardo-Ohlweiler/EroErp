import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { z } from 'zod'
import { IconAgenda, IconExcluir } from '@/assets/icons'
import { AcoesCompromisso } from '@/components/agenda/AcoesCompromisso'
import { CamposCompromisso } from '@/components/agenda/CamposCompromisso'
import {
  TAviso,
  TBadge,
  TButton,
  TCombo,
  TEntry,
  TModal,
  TPage,
  TPanel,
  TResult,
  TSelect,
  TTabs,
  TTextArea,
  type Aba,
} from '@/components/common'
import { Folha, Observacao, Secao, TabelaDoc, TiraIndicadores } from '@/components/impressao/Folha'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { useDisponibilidade } from '@/hooks/useDisponibilidade'
import { useSomenteLeitura } from '@/hooks/useSomenteLeitura'
import { handleApiError } from '@/services/api'
import { compromissoService } from '@/services/compromissoService'
import { consultaService } from '@/services/consultaService'
import { servicoService } from '@/services/servicoService'
import type { AcoesDeSituacao, CompromissoResponse } from '@/types/compromisso'
import type {
  Ajuste,
  ConsultaCalculo,
  ConsultaProdutoItem,
  ConsultaResponse,
  ConsultaServicoItem,
  TipoAjuste,
  TipoCalculo,
} from '@/types/consulta'
import { diaPorExtenso, diaDe, estaAberto, faixaDeHorario, instante, STATUS_ROTULO, STATUS_TOM } from '@/utils/agenda'
import {
  camposCompromissoSchema,
  camposDeResposta,
  camposIniciais,
  compromissoDoFormulario,
  HORA,
  refinarHorario,
} from '@/utils/compromissoForm'
import { casasDaUnidade, formatarQuantidade, mascaraDaUnidade } from '@/utils/estoque'
import { AUSENTE, formatarDataHora, formatarMoeda, hojeIso, paraNumero, textoDaMascara } from '@/utils/format'

const schema = camposCompromissoSchema
  .extend({ observacao: z.string().max(2000, 'Até 2000 caracteres') })
  .superRefine((d, ctx) => {
    refinarHorario(d, ctx)
    if (!d.pessoaId) {
      ctx.addIssue({ code: 'custom', message: 'A consulta precisa de um cliente', path: ['pessoaId'] })
    }
  })

type FormData = z.infer<typeof schema>

// ─── Itens na tela ──────────────────────────────────────────────────────

/** O ajuste como se digita: vazio é "sem ajuste". */
interface AjusteTela {
  tipo: '' | TipoAjuste
  calculo: TipoCalculo
  valor: string
}

interface LinhaServico extends AjusteTela {
  /** Chave da linha na tela — o item novo ainda não tem id. */
  chave: string
  id?: string
  servicoId: string
  nome: string
  quantidade: string
  preco: string
}

interface LinhaProduto extends AjusteTela {
  chave: string
  id?: string
  produtoId: string
  nome: string
  unidadeSigla: string
  quantidade: string
  preco: string
  controlaEstoque?: boolean
  saldo?: number | null
}

const SEM_AJUSTE: AjusteTela = { tipo: '', calculo: 'FIXO', valor: '' }

const TIPOS_DE_AJUSTE = [
  { valor: 'DESCONTO', rotulo: 'Desconto' },
  { valor: 'ACRESCIMO', rotulo: 'Acréscimo' },
]
const CALCULOS = [
  { valor: 'FIXO', rotulo: 'Em R$' },
  { valor: 'PERCENTUAL', rotulo: 'Em %' },
]

let sequencia = 0
const novaChave = () => `nova-${++sequencia}`

function ajusteDeResposta(a: Ajuste): AjusteTela {
  return a.tipoAjuste
    ? { tipo: a.tipoAjuste, calculo: a.tipoCalculo ?? 'FIXO', valor: textoDaMascara(a.valorAjuste, 2) }
    : SEM_AJUSTE
}

/** O ajuste no corpo: os três juntos, ou nenhum — o servidor recusa a metade. */
function ajusteDoCorpo(a: AjusteTela): Ajuste {
  return a.tipo ? { tipoAjuste: a.tipo, tipoCalculo: a.calculo, valorAjuste: paraNumero(a.valor) ?? null } : {}
}

function servicosDoCorpo(linhas: LinhaServico[]): ConsultaServicoItem[] {
  return linhas.map((s) => ({
    id: s.id,
    servicoId: s.servicoId,
    quantidade: paraNumero(s.quantidade) ?? 0,
    precoUnitario: paraNumero(s.preco) ?? null,
    ...ajusteDoCorpo(s),
  }))
}

function produtosDoCorpo(linhas: LinhaProduto[]): ConsultaProdutoItem[] {
  return linhas.map((p) => ({
    id: p.id,
    produtoId: p.produtoId,
    quantidade: paraNumero(p.quantidade) ?? 0,
    precoUnitario: paraNumero(p.preco) ?? null,
    ...ajusteDoCorpo(p),
  }))
}

function geralDoCorpo(a: AjusteTela) {
  const { tipoAjuste, tipoCalculo, valorAjuste } = ajusteDoCorpo(a)
  return { tipoAjusteGeral: tipoAjuste, tipoCalculoGeral: tipoCalculo, valorAjusteGeral: valorAjuste }
}

/** "−10%", "+R$ 5,00" — como o ajuste de um item aparece no papel. */
function rotuloDoAjuste(a: Ajuste): string {
  if (!a.tipoAjuste || a.valorAjuste == null) return ''
  const sinal = a.tipoAjuste === 'DESCONTO' ? '−' : '+'
  return a.tipoCalculo === 'PERCENTUAL'
    ? `${sinal}${textoDaMascara(a.valorAjuste, 2)}%`
    : `${sinal}${formatarMoeda(a.valorAjuste)}`
}

function mensagemDoErro(erro: unknown): string | null {
  if (axios.isAxiosError<{ erro?: string }>(erro) && (erro.response?.status === 400 || erro.response?.status === 409)) {
    return erro.response.data?.erro ?? 'Confira os itens'
  }
  return null
}

/**
 * A consulta: o atendimento sobre um compromisso, com serviços e produtos.
 *
 * O compromisso é o mesmo da agenda, com os mesmos campos (`CamposCompromisso`)
 * e a mesma situação — a consulta não tem status próprio. Serviços e produtos
 * só aparecem para quem lê essas telas; quem não lê manda a lista nula, e o
 * servidor mantém o que existe. O preço vem do catálogo da filial e se edita;
 * os totais vêm sempre do servidor (`/consultas/calculo`), nunca da conta da
 * tela.
 */
export function ConsultaForm() {
  const { id } = useParams()
  const [busca] = useSearchParams()
  const navigate = useNavigate()
  const { sessao, podeLer, podeEscrever } = useAuth()
  const somenteLeitura = useSomenteLeitura('CONSULTAS')
  const veServicos = podeLer('SERVICOS')
  const veProdutos = podeLer('PRODUTOS')
  const compromissoId = id ? null : busca.get('compromissoId')

  const [carregando, setCarregando] = useState(!!id || !!compromissoId)
  const [salvo, setSalvo] = useState<ConsultaResponse>()
  /** O compromisso da agenda que esta consulta nova vai converter. */
  const [convertendo, setConvertendo] = useState<CompromissoResponse>()
  const [aba, setAba] = useState('atendimento')

  const [servicos, setServicos] = useState<LinhaServico[]>([])
  const [produtos, setProdutos] = useState<LinhaProduto[]>([])
  const [geral, setGeral] = useState<AjusteTela>(SEM_AJUSTE)
  /** Itens ou ajuste mexidos desde a última gravação. */
  const [itensAlterados, setItensAlterados] = useState(false)
  /** Remonta o combo de acrescentar a cada item: ele não guarda o último escolhido. */
  const [acrescentados, setAcrescentados] = useState(0)

  const [calculo, setCalculo] = useState<ConsultaCalculo | null>(null)
  const [erroCalculo, setErroCalculo] = useState<string | null>(null)
  const [recalculando, setRecalculando] = useState(false)

  const [ocupado, setOcupado] = useState(false)
  const [concluindo, setConcluindo] = useState(false)
  const [reconsultando, setReconsultando] = useState(false)

  const situacao = salvo?.compromisso.status ?? convertendo?.status
  const encerrada = situacao !== undefined && !estaAberto(situacao)
  const travado = somenteLeitura || encerrada
  // Convertendo, o compromisso já existe na agenda: muda-se depois de salvar
  const compromissoTravado = travado || !!convertendo

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { ...camposIniciais(busca, sessao), titulo: 'Consulta', observacao: '' },
  })
  const {
    handleSubmit,
    reset,
    register,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = form

  const aplicar = useCallback(
    (c: ConsultaResponse) => {
      setSalvo(c)
      reset({ ...camposDeResposta(c.compromisso), observacao: c.observacao ?? '' })
      setServicos(
        (c.servicos ?? []).map((s) => ({
          chave: s.id,
          id: s.id,
          servicoId: s.servicoId,
          nome: s.descricao,
          quantidade: String(s.quantidade),
          preco: textoDaMascara(s.precoUnitario, 2),
          ...ajusteDeResposta(s),
        })),
      )
      setProdutos(
        (c.produtos ?? []).map((p) => ({
          chave: p.id,
          id: p.id,
          produtoId: p.produtoId,
          nome: p.descricao,
          unidadeSigla: p.unidadeSigla,
          quantidade: textoDaMascara(p.quantidade, casasDaUnidade(p.unidadeSigla)),
          preco: textoDaMascara(p.precoUnitario, 2),
          controlaEstoque: p.controlaEstoque,
          saldo: p.saldoDisponivel,
          ...ajusteDeResposta(p),
        })),
      )
      setGeral(
        ajusteDeResposta({
          tipoAjuste: c.tipoAjusteGeral,
          tipoCalculo: c.tipoCalculoGeral,
          valorAjuste: c.valorAjusteGeral,
        }),
      )
      setItensAlterados(false)
    },
    [reset],
  )

  useEffect(() => {
    if (id) {
      consultaService
        .findById(id)
        .then(aplicar)
        .catch(handleApiError)
        .finally(() => setCarregando(false))
    } else if (compromissoId) {
      compromissoService
        .findById(compromissoId)
        .then((c) => {
          // Já é consulta: abre a dela, em vez de tentar converter de novo
          if (c.consultaId) {
            navigate(`/app/consultas/${c.consultaId}`, { replace: true })
            return
          }
          setConvertendo(c)
          reset({ ...camposDeResposta(c), observacao: '' })
        })
        .catch(handleApiError)
        .finally(() => setCarregando(false))
    }
  }, [id, compromissoId, aplicar, reset, navigate])

  const v = watch()

  // ─── Quem já está ocupado ───────────────────────────────────────────
  const disponibilidade = useDisponibilidade(
    {
      dia: v.dia,
      horaInicio: v.horaInicio,
      horaFim: v.horaFim,
      responsavelId: v.responsavelId,
      convidadoIds: v.convidados?.map((c) => c.id) ?? [],
    },
    compromissoTravado,
    salvo?.compromisso.id,
  )

  // ─── Os totais, sempre do servidor ──────────────────────────────────
  const corpoDoCalculo = useMemo(
    () =>
      JSON.stringify({
        consultaId: salvo?.id,
        filialId: v.filialId,
        servicos: veServicos ? servicosDoCorpo(servicos) : null,
        produtos: veProdutos ? produtosDoCorpo(produtos) : null,
        ...geralDoCorpo(geral),
      }),
    [salvo?.id, v.filialId, veServicos, veProdutos, servicos, produtos, geral],
  )
  const pedidoDoCalculo = useDebounce(corpoDoCalculo, 400)

  useEffect(() => {
    const corpo = JSON.parse(pedidoDoCalculo)
    if (!corpo.filialId) {
      setCalculo(null)
      return
    }
    let vigente = true
    setRecalculando(true)
    consultaService
      .calculo(corpo)
      .then((r) => {
        if (!vigente) return
        setCalculo(r)
        setErroCalculo(null)
      })
      .catch((erro) => {
        if (!vigente) return
        // Aqui um 400 (ou o 409 do produto sem estoque) é estado, não evento: inline
        const mensagem = mensagemDoErro(erro)
        if (mensagem) setErroCalculo(mensagem)
        else handleApiError(erro)
      })
      .finally(() => vigente && setRecalculando(false))
    return () => {
      vigente = false
    }
  }, [pedidoDoCalculo])

  // ─── Itens ──────────────────────────────────────────────────────────
  const nomesDeServico = useRef(new Map<string, string>())

  async function adicionarServico(servicoId: string) {
    if (!servicoId) return
    const nome = nomesDeServico.current.get(servicoId) ?? ''
    let preco = ''
    if (v.filialId) {
      try {
        const sugerido = await consultaService.preco(v.filialId, { servicoId })
        preco = textoDaMascara(sugerido.precoUnitario, 2)
      } catch (erro) {
        handleApiError(erro)
      }
    }
    setServicos((l) => [...l, { chave: novaChave(), servicoId, nome, quantidade: '1', preco, ...SEM_AJUSTE }])
    setItensAlterados(true)
    setAcrescentados((n) => n + 1)
  }

  const produtosDaFilial = useRef(new Map<string, { nome: string; unidadeSigla: string }>())

  async function adicionarProduto(produtoId: string) {
    if (!produtoId || !v.filialId) return
    const escolhido = produtosDaFilial.current.get(produtoId)
    try {
      const sugerido = await consultaService.preco(v.filialId, { produtoId })
      const unidade = sugerido.unidadeSigla ?? escolhido?.unidadeSigla ?? ''
      setProdutos((l) => [
        ...l,
        {
          chave: novaChave(),
          produtoId,
          nome: escolhido?.nome ?? '',
          unidadeSigla: unidade,
          quantidade: textoDaMascara(1, casasDaUnidade(unidade)),
          preco: textoDaMascara(sugerido.precoUnitario, 2),
          controlaEstoque: !!sugerido.controlaEstoque,
          saldo: sugerido.saldo,
          ...SEM_AJUSTE,
        },
      ])
      setItensAlterados(true)
      setAcrescentados((n) => n + 1)
    } catch (erro) {
      handleApiError(erro)
    }
  }

  function mudarServico(chave: string, mudanca: Partial<LinhaServico>) {
    setServicos((l) => l.map((s) => (s.chave === chave ? { ...s, ...mudanca } : s)))
    setItensAlterados(true)
  }

  function mudarProduto(chave: string, mudanca: Partial<LinhaProduto>) {
    setProdutos((l) => l.map((p) => (p.chave === chave ? { ...p, ...mudanca } : p)))
    setItensAlterados(true)
  }

  // ─── Gravar e situação ──────────────────────────────────────────────
  async function onSubmit(d: FormData) {
    if (travado) return
    const corpo = {
      observacao: d.observacao.trim() || undefined,
      servicos: veServicos ? servicosDoCorpo(servicos) : null,
      produtos: veProdutos ? produtosDoCorpo(produtos) : null,
      ...geralDoCorpo(geral),
    }
    try {
      if (salvo) {
        aplicar(await consultaService.update(salvo.id, { compromisso: compromissoDoFormulario(d), ...corpo }))
        toast.success('Consulta salva')
      } else {
        const criada = await consultaService.create(
          convertendo ? { compromissoId: convertendo.id, ...corpo } : { compromisso: compromissoDoFormulario(d), ...corpo },
        )
        toast.success('Consulta aberta')
        navigate(`/app/consultas/${criada.id}`, { replace: true })
      }
    } catch (erro) {
      handleApiError(erro)
    }
  }

  async function executar(acao: () => Promise<ConsultaResponse>, mensagem: string) {
    setOcupado(true)
    try {
      aplicar(await acao())
      toast.success(mensagem)
      return true
    } catch (erro) {
      handleApiError(erro)
      return false
    } finally {
      setOcupado(false)
    }
  }

  const acoesDaConsulta: AcoesDeSituacao<ConsultaResponse> | undefined = salvo && {
    faltou: () => consultaService.faltou(salvo.id),
    // Só esta consulta: sem cancelarSeguintes, o escopo da série nem aparece
    cancelar: (_compromissoId, motivo) => consultaService.cancelar(salvo.id, motivo),
  }

  if (carregando) {
    return (
      <div className="grid place-items-center py-20">
        <span
          role="status"
          aria-label="Carregando"
          className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        />
      </div>
    )
  }

  const sujo = isDirty || itensAlterados
  const abas: Aba[] = [
    {
      id: 'atendimento',
      rotulo: 'Atendimento',
      alerta: !!(errors.responsavelId || errors.filialId || errors.pessoaId || errors.titulo || errors.horaFim),
    },
    ...(veServicos ? [{ id: 'servicos', rotulo: servicos.length ? `Serviços (${servicos.length})` : 'Serviços' }] : []),
    ...(veProdutos ? [{ id: 'produtos', rotulo: produtos.length ? `Produtos (${produtos.length})` : 'Produtos' }] : []),
    { id: 'resumo', rotulo: 'Resumo', alerta: !!erroCalculo },
  ]
  const valoresServico = (i: number) => (erroCalculo ? undefined : calculo?.servicos[i])
  const valoresProduto = (i: number) => (erroCalculo ? undefined : calculo?.produtos[i])
  const aBaixar = (salvo?.produtos ?? []).filter((p) => p.controlaEstoque)

  return (
    <TPage
      title={!salvo ? 'Nova consulta' : travado ? 'Consulta' : 'Editar consulta'}
      subtitle={
        salvo?.criadoPorNome
          ? `Aberta por ${salvo.criadoPorNome} em ${formatarDataHora(salvo.createdAt)}`
          : convertendo
            ? 'A partir do compromisso da agenda'
            : undefined
      }
      documento={salvo && <ResumoImpresso consulta={salvo} veServicos={veServicos} veProdutos={veProdutos} />}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {somenteLeitura && (
          <p className="rounded-md bg-info-bg px-3 py-2 text-caption text-info">
            Você tem acesso só de leitura a esta tela.
          </p>
        )}

        {salvo && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <TBadge tom={STATUS_TOM[salvo.compromisso.status]}>{STATUS_ROTULO[salvo.compromisso.status]}</TBadge>
              {salvo.consultaOrigemId && <TBadge tom="neutro">Reconsulta</TBadge>}
              {salvo.compromisso.motivoCancelamento && (
                <span className="text-caption text-txt-secondary">Motivo: {salvo.compromisso.motivoCancelamento}</span>
              )}
            </div>
            {podeEscrever('CONSULTAS') && (
              <div className="flex flex-wrap gap-2">
                {(salvo.compromisso.status === 'AGENDADO' || salvo.compromisso.status === 'CONFIRMADO') && (
                  <TButton
                    type="button"
                    size="sm"
                    disabled={ocupado}
                    onClick={() => executar(() => consultaService.iniciar(salvo.id), 'Atendimento iniciado')}
                  >
                    Iniciar atendimento
                  </TButton>
                )}
                {estaAberto(salvo.compromisso.status) && (
                  <TButton
                    type="button"
                    size="sm"
                    variant={salvo.compromisso.status === 'EM_ATENDIMENTO' ? 'primary' : 'secondary'}
                    disabled={ocupado}
                    onClick={() => setConcluindo(true)}
                  >
                    Concluir
                  </TButton>
                )}
                {acoesDaConsulta && (
                  <AcoesCompromisso compromisso={salvo.compromisso} acoes={acoesDaConsulta} onAlterado={aplicar} />
                )}
                <TButton type="button" size="sm" variant="secondary" onClick={() => setReconsultando(true)}>
                  Reconsulta
                </TButton>
                {podeLer('AGENDA') && (
                  <TButton
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/app/agenda/${salvo.compromisso.id}`)}
                  >
                    <IconAgenda className="size-4" />
                    Na agenda
                  </TButton>
                )}
              </div>
            )}
          </div>
        )}

        <TTabs abas={abas} ativa={aba} onChange={setAba} />

        <fieldset disabled={travado} className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">
          {/* Atendimento — o compromisso e a observação */}
          <div role="tabpanel" id="painel-atendimento" hidden={aba !== 'atendimento'} className="flex flex-col gap-5">
            {convertendo && !travado && (
              <TAviso>
                Esta consulta usa o compromisso já agendado. Horário, cliente e participantes se mudam depois de
                salvar.
              </TAviso>
            )}
            <FormProvider {...form}>
              <fieldset disabled={compromissoTravado} className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">
                <CamposCompromisso
                  travado={compromissoTravado}
                  editando={!!salvo || !!convertendo}
                  disponibilidade={disponibilidade}
                  clienteObrigatorio
                />
              </fieldset>
            </FormProvider>
            <TPanel title="Atendimento">
              <TTextArea
                label="Observação"
                rows={4}
                maxLength={2000}
                error={errors.observacao?.message}
                {...register('observacao')}
              />
            </TPanel>
          </div>

          {/* Serviços */}
          {veServicos && (
            <div role="tabpanel" id="painel-servicos" hidden={aba !== 'servicos'}>
              <TPanel title="Serviços">
                <div className="flex flex-col gap-4">
                  {!travado && (
                    <TCombo
                      key={acrescentados}
                      label="Acrescentar serviço"
                      value=""
                      placeholder="Busque por nome ou código"
                      onChange={adicionarServico}
                      buscar={(termo) =>
                        servicoService.select(termo).then((l) =>
                          l.map((s) => {
                            nomesDeServico.current.set(s.id, s.nome)
                            return { id: s.id, nome: `${s.codigo} — ${s.nome}` }
                          }),
                        )
                      }
                      ajuda="O preço vem do valor do serviço nesta filial, e se muda aqui."
                    />
                  )}
                  {erroCalculo && <ErroDaConta mensagem={erroCalculo} />}
                  {servicos.length === 0 && <p className="text-caption text-txt-secondary">Nenhum serviço.</p>}
                  {servicos.map((s, i) => (
                    <ItemDaConsulta
                      key={s.chave}
                      nome={s.nome}
                      travado={travado}
                      onTirar={() => {
                        setServicos((l) => l.filter((x) => x.chave !== s.chave))
                        setItensAlterados(true)
                      }}
                      quantidade={
                        <TEntry
                          label="Quantidade"
                          mascara="inteiro"
                          inputMode="numeric"
                          value={s.quantidade}
                          onChange={(e) => mudarServico(s.chave, { quantidade: e.target.value })}
                        />
                      }
                      preco={s.preco}
                      onPreco={(preco) => mudarServico(s.chave, { preco })}
                      ajuste={s}
                      onAjuste={(a) => mudarServico(s.chave, a)}
                      valores={valoresServico(i)}
                      recalculando={recalculando}
                    />
                  ))}
                </div>
              </TPanel>
            </div>
          )}

          {/* Produtos */}
          {veProdutos && (
            <div role="tabpanel" id="painel-produtos" hidden={aba !== 'produtos'}>
              <TPanel title="Produtos">
                <div className="flex flex-col gap-4">
                  {!travado &&
                    (v.filialId ? (
                      <TCombo
                        key={`${v.filialId}-${acrescentados}`}
                        label="Acrescentar produto"
                        value=""
                        placeholder="Busque por nome, código ou EAN"
                        onChange={adicionarProduto}
                        buscar={(termo) =>
                          consultaService.produtos(v.filialId, termo).then((l) =>
                            l.map((p) => {
                              produtosDaFilial.current.set(p.id, { nome: p.nome, unidadeSigla: p.unidadeSigla })
                              return { id: p.id, nome: `${p.codigo} — ${p.nome}` }
                            }),
                          )
                        }
                        ajuda="Só os produtos com estoque nesta filial. O estoque baixa ao concluir."
                      />
                    ) : (
                      <p className="text-caption text-txt-secondary">
                        Escolha a filial na aba Atendimento: os produtos e os preços são dela.
                      </p>
                    ))}
                  {erroCalculo && <ErroDaConta mensagem={erroCalculo} />}
                  {produtos.length === 0 && <p className="text-caption text-txt-secondary">Nenhum produto.</p>}
                  {produtos.map((p, i) => {
                    const quantidade = paraNumero(p.quantidade) ?? 0
                    const falta =
                      !encerrada && p.controlaEstoque && p.saldo != null && quantidade > p.saldo
                    return (
                      <ItemDaConsulta
                        key={p.chave}
                        nome={p.nome}
                        travado={travado}
                        onTirar={() => {
                          setProdutos((l) => l.filter((x) => x.chave !== p.chave))
                          setItensAlterados(true)
                        }}
                        quantidade={
                          <TEntry
                            label="Quantidade"
                            mascara={mascaraDaUnidade(p.unidadeSigla)}
                            casas={casasDaUnidade(p.unidadeSigla)}
                            inputMode="decimal"
                            suffix={p.unidadeSigla}
                            value={p.quantidade}
                            onChange={(e) => mudarProduto(p.chave, { quantidade: e.target.value })}
                          />
                        }
                        preco={p.preco}
                        onPreco={(preco) => mudarProduto(p.chave, { preco })}
                        ajuste={p}
                        onAjuste={(a) => mudarProduto(p.chave, a)}
                        valores={valoresProduto(i)}
                        recalculando={recalculando}
                        nota={
                          falta ? (
                            <TAviso>
                              Há {formatarQuantidade(p.saldo, p.unidadeSigla)} no estoque desta filial: concluir vai
                              recusar enquanto não entrar mais.
                            </TAviso>
                          ) : p.controlaEstoque === false ? (
                            <p className="text-caption text-txt-secondary">Não controla estoque: nada baixa.</p>
                          ) : p.saldo != null && !encerrada ? (
                            <p className="text-caption text-txt-secondary">
                              Saldo na filial: {formatarQuantidade(p.saldo, p.unidadeSigla)}
                            </p>
                          ) : null
                        }
                      />
                    )
                  })}
                </div>
              </TPanel>
            </div>
          )}

          {/* Resumo — os totais do servidor e o ajuste geral */}
          <div role="tabpanel" id="painel-resumo" hidden={aba !== 'resumo'} className="flex flex-col gap-5">
            <TPanel title="Ajuste no total">
              <CamposDeAjuste
                ajuste={geral}
                onChange={(a) => {
                  setGeral(a)
                  setItensAlterados(true)
                }}
              />
            </TPanel>
            <TPanel title="Totais">
              {erroCalculo && <ErroDaConta mensagem={erroCalculo} className="mb-4" />}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {veServicos && (
                  <TResult
                    label="Serviços"
                    valor={calculo && !erroCalculo ? formatarMoeda(calculo.subtotalServicos) : undefined}
                    recalculando={recalculando}
                    motivoAusencia={erroCalculo ? 'Corrija o item acima' : 'Escolha a filial'}
                  />
                )}
                {veProdutos && (
                  <TResult
                    label="Produtos"
                    valor={calculo && !erroCalculo ? formatarMoeda(calculo.subtotalProdutos) : undefined}
                    recalculando={recalculando}
                    motivoAusencia={erroCalculo ? 'Corrija o item acima' : 'Escolha a filial'}
                  />
                )}
                <TResult
                  label="Ajuste no total"
                  valor={calculo && !erroCalculo ? formatarMoeda(calculo.ajusteGeral) : undefined}
                  recalculando={recalculando}
                  motivoAusencia={erroCalculo ? 'Corrija o item acima' : 'Escolha a filial'}
                />
                <TResult
                  label="Total"
                  valor={calculo && !erroCalculo ? formatarMoeda(calculo.total) : undefined}
                  referencia={calculo ? `Subtotal ${formatarMoeda(calculo.subtotal)}` : undefined}
                  recalculando={recalculando}
                  motivoAusencia={erroCalculo ? 'Corrija o item acima' : 'Escolha a filial'}
                />
              </div>
              {(!veServicos || !veProdutos) && (
                <p className="mt-3 text-caption text-txt-secondary">
                  O total inclui {!veServicos && !veProdutos ? 'serviços e produtos' : !veServicos ? 'serviços' : 'produtos'}{' '}
                  que você não vê. Salvar não mexe neles.
                </p>
              )}
            </TPanel>
          </div>
        </fieldset>

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <TButton type="button" variant="secondary" onClick={() => navigate('/app/consultas')} className="sm:w-auto">
            {travado ? 'Voltar' : 'Cancelar'}
          </TButton>
          {!travado && (
            <TButton type="submit" loading={isSubmitting}>
              {salvo ? 'Salvar' : 'Abrir consulta'}
            </TButton>
          )}
        </div>
      </form>

      {/* Concluir: o que vai baixar do estoque, antes de baixar */}
      <TModal
        aberto={concluindo}
        titulo="Concluir consulta"
        onFechar={() => setConcluindo(false)}
        largura="sm"
        acoes={
          <>
            <TButton type="button" variant="secondary" onClick={() => setConcluindo(false)}>
              Voltar
            </TButton>
            <TButton
              type="button"
              loading={ocupado}
              disabled={sujo}
              onClick={async () => {
                if (await executar(() => consultaService.concluir(salvo!.id), 'Consulta concluída')) {
                  setConcluindo(false)
                }
              }}
            >
              Concluir
            </TButton>
          </>
        }
      >
        <div className="flex flex-col gap-3 text-body">
          {sujo && <TAviso>Há alterações não salvas. Salve antes de concluir: conclui-se o que está gravado.</TAviso>}
          {!veProdutos ? (
            <p>Os produtos desta consulta que controlam estoque vão baixar do estoque da filial.</p>
          ) : aBaixar.length === 0 ? (
            <p>Nenhum produto desta consulta controla estoque: nada vai baixar.</p>
          ) : (
            <>
              <p>Vai baixar do estoque de {salvo?.compromisso.filialNome}:</p>
              <ul className="list-disc pl-5">
                {aBaixar.map((p) => (
                  <li key={p.id}>
                    {formatarQuantidade(p.quantidade, p.unidadeSigla)} de {p.descricao}
                    {p.saldoDisponivel != null && p.quantidade > p.saldoDisponivel && (
                      <span className="text-danger">
                        {' '}
                        — só há {formatarQuantidade(p.saldoDisponivel, p.unidadeSigla)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="text-caption text-txt-secondary">Concluída, a consulta não volta nem se altera.</p>
        </div>
      </TModal>

      {salvo && (
        <ReconsultaModal
          aberto={reconsultando}
          consulta={salvo}
          onFechar={() => setReconsultando(false)}
          onCriada={(nova) => {
            setReconsultando(false)
            toast.success('Reconsulta agendada')
            navigate(`/app/consultas/${nova.id}`)
          }}
        />
      )}
    </TPage>
  )
}

// ─────────────────────────────────────────────────────────────────────────

/** A recusa da conta (400 ou 409), inline: aqui ela é estado do formulário, não evento. */
function ErroDaConta({ mensagem, className = '' }: { mensagem: string; className?: string }) {
  return (
    <p role="alert" className={`rounded-md bg-danger-bg px-3 py-2 text-caption text-danger ${className}`}>
      {mensagem}
    </p>
  )
}

/** Ajuste de um item ou do total: tipo, cálculo e valor, que andam juntos. */
function CamposDeAjuste({ ajuste, onChange }: { ajuste: AjusteTela; onChange: (a: AjusteTela) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <TSelect
        label="Ajuste"
        vazio="Sem ajuste"
        opcoes={TIPOS_DE_AJUSTE}
        value={ajuste.tipo}
        onChange={(e) => onChange({ ...ajuste, tipo: e.target.value as AjusteTela['tipo'] })}
      />
      {ajuste.tipo && (
        <>
          <TSelect
            label="Como"
            opcoes={CALCULOS}
            value={ajuste.calculo}
            onChange={(e) => onChange({ ...ajuste, calculo: e.target.value as TipoCalculo })}
          />
          <TEntry
            label={ajuste.calculo === 'PERCENTUAL' ? 'Percentual' : 'Valor'}
            mascara="decimal"
            inputMode="decimal"
            suffix={ajuste.calculo === 'PERCENTUAL' ? '%' : 'R$'}
            value={ajuste.valor}
            onChange={(e) => onChange({ ...ajuste, valor: e.target.value })}
          />
        </>
      )}
    </div>
  )
}

/**
 * Um serviço ou produto da consulta: o nome no topo e, embaixo, quantidade,
 * preço, ajuste e os valores que o servidor publicou. No celular empilha.
 */
function ItemDaConsulta({
  nome,
  travado,
  onTirar,
  quantidade,
  preco,
  onPreco,
  ajuste,
  onAjuste,
  valores,
  recalculando,
  nota,
}: {
  nome: string
  travado: boolean
  onTirar: () => void
  quantidade: ReactNode
  preco: string
  onPreco: (preco: string) => void
  ajuste: AjusteTela
  onAjuste: (a: AjusteTela) => void
  valores?: { subtotal: number; ajuste: number; total: number }
  recalculando: boolean
  nota?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-line p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 break-words font-medium text-txt">{nome}</p>
        {!travado && (
          <TButton type="button" variant="ghost" size="sm" onClick={onTirar} aria-label={`Tirar ${nome}`}>
            <IconExcluir className="size-4" />
          </TButton>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[8rem_10rem_minmax(0,1fr)]">
        {quantidade}
        <TEntry
          label="Preço unitário"
          mascara="decimal"
          inputMode="decimal"
          suffix="R$"
          value={preco}
          placeholder="Informe"
          ajuda={preco ? undefined : 'Sem preço nesta filial: informe'}
          onChange={(e) => onPreco(e.target.value)}
        />
        <div className="sm:col-span-2 lg:col-span-1">
          <CamposDeAjuste ajuste={ajuste} onChange={(a) => onAjuste({ ...a })} />
        </div>
      </div>
      {nota}
      <p className={`flex flex-wrap justify-end gap-x-4 gap-y-1 text-caption tabular-nums ${recalculando ? 'opacity-60' : ''}`}>
        <span className="text-txt-secondary">Subtotal {valores ? formatarMoeda(valores.subtotal) : AUSENTE}</span>
        {valores && valores.ajuste !== 0 && (
          <span className="text-txt-secondary">Ajuste {formatarMoeda(valores.ajuste)}</span>
        )}
        <span className="font-medium text-txt">Total {valores ? formatarMoeda(valores.total) : AUSENTE}</span>
      </p>
    </div>
  )
}

/** Uma consulta nova a partir desta: mesmo cliente e filial, itens copiados sem ajuste. */
function ReconsultaModal({
  aberto,
  consulta,
  onFechar,
  onCriada,
}: {
  aberto: boolean
  consulta: ConsultaResponse
  onFechar: () => void
  onCriada: (c: ConsultaResponse) => void
}) {
  const [dia, setDia] = useState(hojeIso())
  const [das, setDas] = useState('09:00')
  const [as, setAs] = useState('10:00')
  const [gravando, setGravando] = useState(false)
  const valido = /^\d{4}-\d{2}-\d{2}$/.test(dia) && HORA.test(das) && HORA.test(as) && as > das

  async function agendar() {
    if (!valido) return
    setGravando(true)
    try {
      onCriada(await consultaService.reconsulta(consulta.id, { inicio: instante(dia, das), fim: instante(dia, as) }))
    } catch (erro) {
      handleApiError(erro)
    } finally {
      setGravando(false)
    }
  }

  return (
    <TModal
      aberto={aberto}
      titulo="Agendar reconsulta"
      onFechar={onFechar}
      largura="sm"
      acoes={
        <>
          <TButton type="button" variant="secondary" onClick={onFechar}>
            Voltar
          </TButton>
          <TButton type="button" loading={gravando} disabled={!valido} onClick={agendar}>
            Agendar
          </TButton>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-body text-txt-secondary">
          Com {consulta.compromisso.responsavelNome}, para {consulta.compromisso.pessoaNome}, em{' '}
          {consulta.compromisso.filialNome}. Os serviços e produtos vêm copiados, sem ajuste e com o preço de hoje.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <TEntry label="Dia" type="date" value={dia} onChange={(e) => setDia(e.target.value)} />
          <TEntry label="Das" type="time" value={das} onChange={(e) => setDas(e.target.value)} />
          <TEntry
            label="Às"
            type="time"
            value={as}
            error={HORA.test(das) && HORA.test(as) && as <= das ? 'Termina depois de começar' : undefined}
            onChange={(e) => setAs(e.target.value)}
          />
        </div>
      </div>
    </TModal>
  )
}

/** A folha impressa: demonstrativo da consulta, não o formulário. */
function ResumoImpresso({
  consulta: c,
  veServicos,
  veProdutos,
}: {
  consulta: ConsultaResponse
  veServicos: boolean
  veProdutos: boolean
}) {
  const comp = c.compromisso
  return (
    <Folha
      titulo="Resumo da consulta"
      pessoa={comp.pessoaNome ?? undefined}
      referencia={`${diaPorExtenso(diaDe(comp.inicio))}, ${faixaDeHorario(comp.inicio, comp.fim)} · ${comp.responsavelNome} · ${comp.filialNome}`}
    >
      <TiraIndicadores
        itens={[
          { rotulo: 'Situação', valor: STATUS_ROTULO[comp.status] },
          { rotulo: 'Subtotal', valor: formatarMoeda(c.subtotal) },
          { rotulo: 'Ajuste', valor: formatarMoeda(c.ajusteGeral) },
          { rotulo: 'Total', valor: formatarMoeda(c.total) },
        ]}
      />
      {veServicos && (
        <Secao titulo="Serviços">
          <TabelaDoc
            colunas={[
              { titulo: 'Serviço', celula: (s) => s.descricao },
              { titulo: 'Qtd.', celula: (s) => String(s.quantidade), numerica: true },
              { titulo: 'Preço', celula: (s) => formatarMoeda(s.precoUnitario), numerica: true },
              { titulo: 'Ajuste', celula: (s) => rotuloDoAjuste(s), numerica: true },
              { titulo: 'Total', celula: (s) => formatarMoeda(s.total), numerica: true },
            ]}
            linhas={c.servicos ?? []}
            chaveDe={(s) => s.id}
            vazio="Nenhum serviço."
          />
        </Secao>
      )}
      {veProdutos && (
        <Secao titulo="Produtos">
          <TabelaDoc
            colunas={[
              { titulo: 'Produto', celula: (p) => p.descricao },
              { titulo: 'Qtd.', celula: (p) => formatarQuantidade(p.quantidade, p.unidadeSigla), numerica: true },
              { titulo: 'Preço', celula: (p) => formatarMoeda(p.precoUnitario), numerica: true },
              { titulo: 'Ajuste', celula: (p) => rotuloDoAjuste(p), numerica: true },
              { titulo: 'Total', celula: (p) => formatarMoeda(p.total), numerica: true },
            ]}
            linhas={c.produtos ?? []}
            chaveDe={(p) => p.id}
            vazio="Nenhum produto."
          />
        </Secao>
      )}
      {c.tipoAjusteGeral && (
        <Secao titulo="Ajuste no total">
          <p className="folha-observacao">
            {c.tipoAjusteGeral === 'DESCONTO' ? 'Desconto' : 'Acréscimo'}{' '}
            {rotuloDoAjuste({ tipoAjuste: c.tipoAjusteGeral, tipoCalculo: c.tipoCalculoGeral, valorAjuste: c.valorAjusteGeral })}{' '}
            sobre {formatarMoeda(c.subtotal)}: {formatarMoeda(c.ajusteGeral)}
          </p>
        </Secao>
      )}
      <Observacao texto={c.observacao} />
    </Folha>
  )
}
