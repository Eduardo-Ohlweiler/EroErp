import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { z } from 'zod'
import { IconConsulta } from '@/assets/icons'
import { AcoesCompromisso } from '@/components/agenda/AcoesCompromisso'
import { CamposCompromisso } from '@/components/agenda/CamposCompromisso'
import { PreviaSerie, type ItemSerie } from '@/components/agenda/PreviaSerie'
import { TAviso, TBadge, TButton, TCheckBox, TEntry, TPage, TSelect } from '@/components/common'
import { useAuth } from '@/hooks/useAuth'
import { useDisponibilidade } from '@/hooks/useDisponibilidade'
import { useSomenteLeitura } from '@/hooks/useSomenteLeitura'
import { handleApiError } from '@/services/api'
import { compromissoService } from '@/services/compromissoService'
import type { CompromissoRequest, CompromissoResponse, Recorrencia, TipoRecorrencia } from '@/types/compromisso'
import { chaveDoInstante, estaAberto, RECORRENCIA_OPCOES, STATUS_ROTULO, STATUS_TOM } from '@/utils/agenda'
import {
  camposCompromissoSchema,
  camposDeResposta,
  camposIniciais,
  compromissoDoFormulario,
  refinarHorario,
} from '@/utils/compromissoForm'
import { formatarDataHora, paraNumero } from '@/utils/format'

const schema = camposCompromissoSchema
  .extend({
    repete: z.boolean(),
    tipoRecorrencia: z.string(),
    quantidade: z.string(),
  })
  .superRefine((d, ctx) => {
    refinarHorario(d, ctx)
    if (d.repete) {
      const n = paraNumero(d.quantidade)
      if (n === undefined || n < 2 || n > 52) {
        ctx.addIssue({ code: 'custom', message: 'De 2 a 52 vezes, contando a primeira', path: ['quantidade'] })
      }
    }
  })

type FormData = z.infer<typeof schema>

/**
 * Compromisso da agenda. O responsável começa como quem está logado e se
 * troca — a recepção agenda para o profissional. Enquanto se preenche, a
 * tela pergunta ao servidor quem já está ocupado: o responsável ocupado
 * impede salvar, o convidado ocupado é só aviso. Os campos do compromisso
 * são os mesmos da consulta (`CamposCompromisso`); a recorrência e a prévia
 * da série são só daqui.
 */
export function CompromissoForm() {
  const { id } = useParams()
  const [busca] = useSearchParams()
  const navigate = useNavigate()
  const { sessao, podeLer, podeEscrever } = useAuth()
  const editando = !!id
  const somenteLeitura = useSomenteLeitura('AGENDA')

  const [carregando, setCarregando] = useState(editando)
  const [salvo, setSalvo] = useState<CompromissoResponse>()

  const travado = somenteLeitura || (salvo !== undefined && !estaAberto(salvo.status))

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...camposIniciais(busca, sessao),
      repete: false,
      tipoRecorrencia: 'SEMANAL',
      quantidade: '4',
    },
  })
  const {
    handleSubmit,
    reset,
    register,
    watch,
    formState: { errors, isSubmitting },
  } = form

  const carregar = useCallback(() => {
    if (!id) return
    compromissoService
      .findById(id)
      .then((c) => {
        setSalvo(c)
        reset({ ...camposDeResposta(c), repete: false, tipoRecorrencia: 'SEMANAL', quantidade: '' })
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

  const repete = !editando && v.repete
  const quantidade = paraNumero(v.quantidade)
  const serieValida = !repete || (quantidade !== undefined && quantidade >= 2 && quantidade <= 52)
  const disponibilidade = useDisponibilidade(
    {
      dia: v.dia,
      horaInicio: v.horaInicio,
      horaFim: v.horaFim,
      responsavelId: v.responsavelId,
      convidadoIds: v.convidados?.map((c) => c.id) ?? [],
      recorrencia: repete && serieValida ? { tipo: v.tipoRecorrencia as TipoRecorrencia, quantidade: quantidade! } : null,
      ocorrencias: personalizada?.map(({ inicio, fim }) => ({ inicio, fim })) ?? null,
    },
    travado || !serieValida,
    id,
  )

  async function onSubmit(d: FormData) {
    if (travado) return
    const recorrencia: Recorrencia | null =
      !editando && d.repete ? { tipo: d.tipoRecorrencia as TipoRecorrencia, quantidade: paraNumero(d.quantidade)! } : null
    const payload: CompromissoRequest = {
      ...compromissoDoFormulario(d),
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
              {salvo.consultaId && <TBadge tom="sage" icone={<IconConsulta className="size-3" />}>Consulta</TBadge>}
              {salvo.motivoCancelamento && (
                <span className="text-caption text-txt-secondary">Motivo: {salvo.motivoCancelamento}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {salvo.consultaId && podeLer('CONSULTAS') && (
                <TButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/app/consultas/${salvo.consultaId}`)}
                >
                  <IconConsulta className="size-4" />
                  Abrir consulta
                </TButton>
              )}
              {podeEscrever('AGENDA') && <AcoesCompromisso compromisso={salvo} onAlterado={carregar} />}
            </div>
          </div>
        )}

        <FormProvider {...form}>
          <fieldset disabled={travado} className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">
            <CamposCompromisso
              travado={travado}
              editando={editando}
              disponibilidade={disponibilidade}
              clienteObrigatorio={!!salvo?.consultaId}
              avisoQuando={
                personalizada && (
                  <TAviso className="mb-4">
                    Você mudou datas da lista. Mexer no dia, nas horas, no tipo ou na quantidade refaz a
                    lista e desfaz essas mudanças.
                  </TAviso>
                )
              }
              recorrencia={
                <>
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
                </>
              }
              previa={
                itensDaSerie && (
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
                )
              }
            />
          </fieldset>
        </FormProvider>

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
    </TPage>
  )
}
