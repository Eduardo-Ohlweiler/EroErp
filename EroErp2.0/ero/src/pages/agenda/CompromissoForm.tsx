import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { z } from 'zod'
import { IconAdicionar } from '@/assets/icons'
import { AcoesCompromisso } from '@/components/agenda/AcoesCompromisso'
import { PreviaSerie, type ItemSerie } from '@/components/agenda/PreviaSerie'
import {
  TAviso,
  TBadge,
  TButton,
  TCheckBox,
  TCombo,
  TComboMulti,
  TEntry,
  TPage,
  TPanel,
  TSelect,
  TTextArea,
} from '@/components/common'
import { PessoaRapidaModal } from '@/components/pessoa/PessoaRapidaModal'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { useSomenteLeitura } from '@/hooks/useSomenteLeitura'
import { handleApiError } from '@/services/api'
import { compromissoService } from '@/services/compromissoService'
import { filialService } from '@/services/filialService'
import { pessoaService } from '@/services/pessoaService'
import { usuarioService } from '@/services/usuarioService'
import type {
  CompromissoRequest,
  CompromissoResponse,
  Disponibilidade,
  Ocorrencia,
  Recorrencia,
  TipoRecorrencia,
} from '@/types/compromisso'
import {
  chaveDoInstante,
  diaCurto,
  diaDe,
  faixaDeHorario,
  horaDe,
  instante,
  RECORRENCIA_OPCOES,
  STATUS_ROTULO,
  STATUS_TOM,
  estaAberto,
} from '@/utils/agenda'
import { formatarDataHora, hojeIso, paraNumero } from '@/utils/format'

const HORA = /^\d{2}:\d{2}$/

const schema = z
  .object({
    filialId: z.string().min(1, 'Escolha a filial'),
    filialRotulo: z.string(),
    responsavelId: z.string().min(1, 'Escolha o responsável'),
    responsavelRotulo: z.string(),
    pessoaId: z.string(),
    pessoaRotulo: z.string(),
    titulo: z.string().trim().min(1, 'Informe o título').max(255, 'Até 255 caracteres'),
    dia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe o dia'),
    horaInicio: z.string().regex(HORA, 'Informe a hora'),
    horaFim: z.string().regex(HORA, 'Informe a hora'),
    convidados: z.array(z.object({ id: z.string(), nome: z.string() })).max(20, 'No máximo 20 convidados'),
    corDaFilial: z.boolean(),
    cor: z.string(),
    descricao: z.string().max(2000, 'Até 2000 caracteres'),
    repete: z.boolean(),
    tipoRecorrencia: z.string(),
    quantidade: z.string(),
  })
  .superRefine((d, ctx) => {
    if (HORA.test(d.horaInicio) && HORA.test(d.horaFim) && d.horaFim <= d.horaInicio) {
      ctx.addIssue({ code: 'custom', message: 'Termina depois de começar', path: ['horaFim'] })
    }
    if (d.repete) {
      const n = paraNumero(d.quantidade)
      if (n === undefined || n < 2 || n > 52) {
        ctx.addIssue({ code: 'custom', message: 'De 2 a 52 vezes, contando a primeira', path: ['quantidade'] })
      }
    }
  })

type FormData = z.infer<typeof schema>

/** Hora cheia seguinte — o horário padrão de quem abre "Novo" sem escolher um. */
function proximaHoraCheia(): string {
  const h = Math.min(new Date().getHours() + 1, 23)
  return `${String(h).padStart(2, '0')}:00`
}

/** A hora do relógio, `HH:mm`, sem arredondar. */
function horaAtual(): string {
  return horaDe(new Date().toISOString())
}

/** Uma hora depois, sem passar da meia-noite (o fim é do mesmo dia). */
function maisUmaHora(hora: string): string {
  const [h, m] = hora.split(':').map(Number)
  return h >= 23 ? '23:59' : `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function deResposta(c: CompromissoResponse): FormData {
  return {
    filialId: c.filialId,
    filialRotulo: c.filialNome,
    responsavelId: c.responsavelId,
    responsavelRotulo: c.responsavelNome,
    pessoaId: c.pessoaId ?? '',
    pessoaRotulo: c.pessoaNome ?? '',
    titulo: c.titulo,
    dia: diaDe(c.inicio),
    horaInicio: horaDe(c.inicio),
    horaFim: horaDe(c.fim),
    convidados: c.convidados.map((cv) => ({ id: cv.usuarioId, nome: cv.nome })),
    // A API omite o nulo: sem cor gravada o campo nem vem
    corDaFilial: c.cor == null,
    cor: c.cor ?? c.corExibicao,
    descricao: c.descricao ?? '',
    repete: false,
    tipoRecorrencia: 'SEMANAL',
    quantidade: '',
  }
}

/**
 * Compromisso da agenda. O responsável começa como quem está logado e se
 * troca — a recepção agenda para o profissional. Enquanto se preenche, a
 * tela pergunta ao servidor quem já está ocupado: o responsável ocupado
 * impede salvar, o convidado ocupado é só aviso.
 */
export function CompromissoForm() {
  const { id } = useParams()
  const [busca] = useSearchParams()
  const navigate = useNavigate()
  const { sessao, podeEscrever } = useAuth()
  const editando = !!id
  const somenteLeitura = useSomenteLeitura('AGENDA')

  const [carregando, setCarregando] = useState(editando)
  const [salvo, setSalvo] = useState<CompromissoResponse>()
  const [novoCliente, setNovoCliente] = useState(false)
  const [disponibilidade, setDisponibilidade] = useState<Disponibilidade | null>(null)

  const travado = somenteLeitura || (salvo !== undefined && !estaAberto(salvo.status))

  const {
    handleSubmit,
    control,
    reset,
    register,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: (() => {
      // ?inicio= vem do clique num horário da grade; ?dia= do clique num dia
      // do mês, e aí começa na hora atual
      const inicio = busca.get('inicio')
      const diaEscolhido = busca.get('dia')
      const diaValido = diaEscolhido && /^\d{4}-\d{2}-\d{2}$/.test(diaEscolhido) ? diaEscolhido : null
      const horaInicio = inicio ? horaDe(inicio) : diaValido ? horaAtual() : proximaHoraCheia()
      // O logado é usuário do tenant em que está — salvo o superadmin dentro
      // de outro tenant, que lá não existe como usuário
      const eu = sessao && !sessao.impersonating
      return {
        filialId: busca.get('filialId') ?? '',
        filialRotulo: '',
        responsavelId: eu ? sessao.usuarioId : '',
        responsavelRotulo: eu ? sessao.nome : '',
        pessoaId: '',
        pessoaRotulo: '',
        titulo: '',
        dia: inicio ? diaDe(inicio) : (diaValido ?? hojeIso()),
        horaInicio,
        horaFim: maisUmaHora(horaInicio),
        convidados: [],
        corDaFilial: true,
        cor: '#3B82F6',
        descricao: '',
        repete: false,
        tipoRecorrencia: 'SEMANAL',
        quantidade: '4',
      }
    })(),
  })

  const carregar = useCallback(() => {
    if (!id) return
    compromissoService
      .findById(id)
      .then((c) => {
        setSalvo(c)
        reset(deResposta(c))
      })
      .catch(handleApiError)
      .finally(() => setCarregando(false))
  }, [id, reset])

  useEffect(carregar, [carregar])

  // ─── Quem já está ocupado ────────────────────────────────────────────
  const v = watch()

  /**
   * A série editada na prévia (datas mudadas ou tiradas). Nula, vale a que o
   * tipo gera. Mudar o que gera a série a refaz: o dia, as horas, o tipo ou a
   * quantidade — e a tela avisa disso enquanto houver alterações.
   */
  const [personalizada, setPersonalizada] = useState<ItemSerie[] | null>(null)
  const [geradas, setGeradas] = useState(0)
  useEffect(() => {
    setPersonalizada(null)
  }, [v.dia, v.horaInicio, v.horaFim, v.tipoRecorrencia, v.quantidade, v.repete])

  const consulta = useDebounce(
    JSON.stringify({
      dia: v.dia,
      horaInicio: v.horaInicio,
      horaFim: v.horaFim,
      responsavelId: v.responsavelId,
      convidados: v.convidados?.map((c) => c.id),
      repete: !editando && v.repete,
      tipo: v.tipoRecorrencia,
      quantidade: v.quantidade,
      ocorrencias: personalizada?.map(({ inicio, fim }) => ({ inicio, fim })) ?? null,
    }),
    500,
  )

  useEffect(() => {
    if (travado) return
    const q = JSON.parse(consulta) as {
      dia: string
      horaInicio: string
      horaFim: string
      responsavelId: string
      convidados: string[]
      repete: boolean
      tipo: TipoRecorrencia
      quantidade: string
      ocorrencias: Ocorrencia[] | null
    }
    const quantidade = paraNumero(q.quantidade)
    const valido =
      /^\d{4}-\d{2}-\d{2}$/.test(q.dia) &&
      HORA.test(q.horaInicio) &&
      HORA.test(q.horaFim) &&
      q.horaFim > q.horaInicio &&
      (q.responsavelId || q.convidados.length > 0) &&
      (!q.repete || (quantidade !== undefined && quantidade >= 2 && quantidade <= 52))
    if (!valido) {
      setDisponibilidade(null)
      return
    }
    let vigente = true
    compromissoService
      .disponibilidade({
        inicio: instante(q.dia, q.horaInicio),
        fim: instante(q.dia, q.horaFim),
        responsavelId: q.responsavelId || undefined,
        convidadoIds: q.convidados,
        recorrencia: q.repete ? { tipo: q.tipo, quantidade: quantidade! } : null,
        ocorrencias: q.repete ? q.ocorrencias : null,
        ignorarId: id,
      })
      .then((r) => vigente && setDisponibilidade(r))
      .catch((erro) => {
        // Nesta superfície um 400 é estado do formulário, que já se mostra nos campos
        if (axios.isAxiosError(erro) && erro.response?.status === 400) return
        handleApiError(erro)
      })
    return () => {
      vigente = false
    }
  }, [consulta, travado, id])

  async function onSubmit(d: FormData) {
    if (travado) return
    const recorrencia: Recorrencia | null =
      !editando && d.repete ? { tipo: d.tipoRecorrencia as TipoRecorrencia, quantidade: paraNumero(d.quantidade)! } : null
    const payload: CompromissoRequest = {
      filialId: d.filialId,
      responsavelId: d.responsavelId,
      pessoaId: d.pessoaId || null,
      titulo: d.titulo.trim(),
      descricao: d.descricao.trim() || undefined,
      cor: d.corDaFilial ? null : d.cor.toUpperCase(),
      inicio: instante(d.dia, d.horaInicio),
      fim: instante(d.dia, d.horaFim),
      convidadoIds: d.convidados.map((c) => c.id),
      recorrencia,
      // A lista da prévia, se foi mexida: o servidor grava exatamente ela
      ocorrencias: recorrencia && personalizada ? personalizada.map(({ inicio, fim }) => ({ inicio, fim })) : null,
    }
    try {
      if (editando) {
        await compromissoService.update(id!, payload)
        toast.success('Compromisso salvo')
      } else {
        const criados = await compromissoService.create(payload)
        toast.success(criados.length > 1 ? `${criados.length} compromissos agendados` : 'Compromisso agendado')
      }
      navigate('/app/agenda')
    } catch (erro) {
      handleApiError(erro)
    }
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

  const choquesDoResponsavel =
    disponibilidade?.ocorrencias.flatMap((o) => o.choques.filter((c) => c.responsavel)) ?? []
  const choquesDeConvidados =
    disponibilidade?.ocorrencias.flatMap((o) => o.choques.filter((c) => !c.responsavel)) ?? []
  // A prévia da série: a editada, ou a que veio do servidor para o tipo escolhido
  const itensDaSerie: ItemSerie[] | null =
    editando || !v.repete
      ? null
      : (personalizada ??
        (disponibilidade && disponibilidade.ocorrencias.length > 1
          ? disponibilidade.ocorrencias.map(({ inicio, fim }) => ({ inicio, fim, alterada: false }))
          : null))
  const choquesPorData = new Map(
    (disponibilidade?.ocorrencias ?? []).map((o) => [chaveDoInstante(o.inicio), o.choques]),
  )

  /** Primeira mexida na lista: ela passa a ser a da última prévia, com a mudança. */
  function mexerNaSerie(mudar: (lista: ItemSerie[]) => ItemSerie[]) {
    const base = personalizada ?? itensDaSerie ?? []
    if (!personalizada) setGeradas(base.length)
    setPersonalizada(mudar(base))
  }

  return (
    <TPage
      title={!editando ? 'Novo compromisso' : travado ? 'Compromisso' : 'Editar compromisso'}
      subtitle={
        salvo?.criadoPorNome
          ? `Agendado por ${salvo.criadoPorNome} em ${formatarDataHora(salvo.createdAt)}`
          : undefined
      }
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
              <TBadge tom={STATUS_TOM[salvo.status]}>{STATUS_ROTULO[salvo.status]}</TBadge>
              {salvo.serieId && <TBadge tom="neutro">Recorrente</TBadge>}
              {salvo.motivoCancelamento && (
                <span className="text-caption text-txt-secondary">Motivo: {salvo.motivoCancelamento}</span>
              )}
            </div>
            {podeEscrever('AGENDA') && (
              <AcoesCompromisso compromisso={salvo} onAlterado={carregar} />
            )}
          </div>
        )}

        <fieldset disabled={travado} className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">
          <TPanel title="Quem participa">
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name="responsavelId"
                render={({ field }) => (
                  <TCombo
                    label="Responsável"
                    value={field.value}
                    rotuloInicial={v.responsavelRotulo || undefined}
                    onChange={(novo) => {
                      field.onChange(novo)
                      // Quem passa a responsável deixa de ser convidado
                      setValue('convidados', v.convidados.filter((c) => c.id !== novo))
                    }}
                    buscar={(termo) => usuarioService.select(termo)}
                    error={errors.responsavelId?.message}
                    ajuda={
                      editando
                        ? 'Quem vai atender.'
                        : sessao?.impersonating
                          ? 'Quem vai atender. Escolha um usuário deste tenant.'
                          : 'Quem vai atender. Começa com você.'
                    }
                  />
                )}
              />
              <Controller
                control={control}
                name="convidados"
                render={({ field }) => (
                  <TComboMulti
                    label="Convidados"
                    value={field.value}
                    onChange={field.onChange}
                    buscar={(termo) => usuarioService.select(termo)}
                    excluir={v.responsavelId ? [v.responsavelId] : []}
                    maximo={20}
                    disabled={travado}
                    error={errors.convidados?.message}
                    ajuda="Outros usuários que participam."
                  />
                )}
              />
            </div>
          </TPanel>

          <TPanel title="Compromisso">
            <div className="grid gap-4 sm:grid-cols-2">
              <TEntry
                label="Título"
                className="sm:col-span-2"
                maxLength={255}
                placeholder="Ex.: Consulta, Retorno, Reunião"
                error={errors.titulo?.message}
                {...register('titulo')}
              />
              <Controller
                control={control}
                name="filialId"
                render={({ field }) => (
                  <TCombo
                    label="Filial"
                    value={field.value}
                    rotuloInicial={v.filialRotulo || undefined}
                    onChange={field.onChange}
                    buscar={(termo) =>
                      filialService.select(termo).then((l) => l.map((f) => ({ id: f.id, nome: f.nome })))
                    }
                    error={errors.filialId?.message}
                  />
                )}
              />
              <div className="flex items-end gap-2">
                <Controller
                  control={control}
                  name="pessoaId"
                  render={({ field }) => (
                    <TCombo
                      label="Cliente"
                      className="min-w-0 flex-1"
                      value={field.value}
                      rotuloInicial={v.pessoaRotulo || undefined}
                      vazio="Sem cliente"
                      placeholder="Busque por nome ou documento"
                      onChange={field.onChange}
                      buscar={(termo) => pessoaService.select(termo).then((l) => l.map((p) => ({ id: p.id, nome: p.nome })))}
                    />
                  )}
                />
                {!travado && (
                  <TButton
                    type="button"
                    variant="secondary"
                    onClick={() => setNovoCliente(true)}
                    title="Cadastrar um cliente novo"
                    aria-label="Cadastrar cliente"
                  >
                    <IconAdicionar className="size-4" />
                  </TButton>
                )}
              </div>
            </div>
          </TPanel>

          <TPanel title="Quando">
            {personalizada && (
              <TAviso className="mb-4">
                Você mudou datas da lista. Mexer no dia, nas horas, no tipo ou na quantidade refaz a
                lista e desfaz essas mudanças.
              </TAviso>
            )}
            <div className="grid gap-4 sm:grid-cols-3">
              <TEntry label="Dia" type="date" error={errors.dia?.message} {...register('dia')} />
              <TEntry label="Das" type="time" error={errors.horaInicio?.message} {...register('horaInicio')} />
              <TEntry label="Às" type="time" error={errors.horaFim?.message} {...register('horaFim')} />
            </div>

            {!editando && (
              <div className="mt-4 flex flex-col gap-3">
                <TCheckBox label="Este compromisso se repete" {...register('repete')} />
                {v.repete && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TSelect
                      label="Repete"
                      opcoes={RECORRENCIA_OPCOES.map((o) => ({ valor: o.valor, rotulo: o.rotulo }))}
                      {...register('tipoRecorrencia')}
                    />
                    <TEntry
                      label="Quantas vezes, contando a primeira"
                      mascara="inteiro"
                      inputMode="numeric"
                      error={errors.quantidade?.message}
                      {...register('quantidade')}
                    />
                  </div>
                )}
              </div>
            )}

            {editando && salvo?.serieId && !travado && (
              <p className="mt-3 text-caption text-txt-secondary">
                Alterar mexe só nesta ocorrência; as outras da série ficam como estão.
              </p>
            )}

            {/* Quem já está ocupado — atualiza sozinho enquanto se preenche */}
            {!travado && choquesDoResponsavel.length > 0 && (
              <div role="alert" className="mt-4 rounded-md border border-danger/40 bg-danger-bg px-3 py-2 text-caption text-danger">
                <p className="font-medium">O responsável já tem compromisso neste horário — não dá para salvar assim:</p>
                <ul className="mt-1 list-disc pl-5">
                  {choquesDoResponsavel.slice(0, 5).map((c, i) => (
                    <li key={`${c.compromissoId}-${i}`}>
                      {diaCurto(diaDe(c.inicio))}, {faixaDeHorario(c.inicio, c.fim)} — {c.titulo}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!travado && choquesDeConvidados.length > 0 && (
              <TAviso className="mt-3">
                {[...new Set(choquesDeConvidados.map((c) => c.usuarioNome))].join(', ')}{' '}
                {new Set(choquesDeConvidados.map((c) => c.usuarioId)).size > 1 ? 'já têm' : 'já tem'} compromisso
                neste horário. Dá para salvar mesmo assim.
              </TAviso>
            )}
            {itensDaSerie && (
              <PreviaSerie
                itens={itensDaSerie}
                choques={choquesPorData}
                geradas={personalizada ? geradas : itensDaSerie.length}
                onEditar={(i, nova) =>
                  mexerNaSerie((lista) =>
                    lista
                      .map((item, j) => (j === i ? { ...nova, alterada: true } : item))
                      .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime()),
                  )
                }
                onTirar={(i) => mexerNaSerie((lista) => lista.filter((_, j) => j !== i))}
                onDesfazer={() => setPersonalizada(null)}
              />
            )}
          </TPanel>

          <TPanel title="Detalhes">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <TCheckBox label="Usar a cor da filial" {...register('corDaFilial')} />
                {!v.corDaFilial && (
                  <label className="flex items-center gap-2 text-caption text-txt-secondary">
                    Cor
                    <input
                      type="color"
                      className="h-9 w-14 cursor-pointer rounded border border-line-strong bg-surface p-0.5"
                      {...register('cor')}
                    />
                  </label>
                )}
              </div>
              <TTextArea
                label="Descrição"
                rows={4}
                maxLength={2000}
                error={errors.descricao?.message}
                {...register('descricao')}
              />
            </div>
          </TPanel>
        </fieldset>

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <TButton type="button" variant="secondary" onClick={() => navigate('/app/agenda')} className="sm:w-auto">
            {travado ? 'Voltar' : 'Cancelar'}
          </TButton>
          {!travado && (
            <TButton type="submit" loading={isSubmitting}>
              {editando ? 'Salvar' : 'Agendar'}
            </TButton>
          )}
        </div>
      </form>

      <PessoaRapidaModal
        aberto={novoCliente}
        onFechar={() => setNovoCliente(false)}
        onCriada={(p) => {
          setValue('pessoaId', p.id)
          setValue('pessoaRotulo', p.nome)
          setNovoCliente(false)
        }}
      />
    </TPage>
  )
}
