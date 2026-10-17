import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { z } from 'zod'
import { IconAdicionar, IconFechar } from '@/assets/icons'
import { TBadge, TButton, TCombo, TEntry, TPage, TPanel, TTextArea } from '@/components/common'
import { useSomenteLeitura } from '@/hooks/useSomenteLeitura'
import { handleApiError } from '@/services/api'
import { filialService } from '@/services/filialService'
import { servicoService } from '@/services/servicoService'
import type { ServicoRequest } from '@/types/servico'
import { paraNumero, textoDaMascara } from '@/utils/format'

const schema = z
  .object({
    nome: z.string().trim().min(1, 'Informe o nome').max(150, 'Até 150 caracteres'),
    observacao: z.string().max(2000, 'Até 2000 caracteres'),
    filiais: z.array(
      z.object({
        filialId: z.string().min(1, 'Escolha a filial'),
        filialRotulo: z.string(),
        /** Só para sinalizar a filial inativada depois; não vai ao servidor. */
        filialAtiva: z.boolean(),
        /** Texto da máscara. Vazio é "não informado" e vai como null. */
        valor: z.string(),
      }),
    ),
  })
  .superRefine((dados, ctx) => {
    const vistas = new Set<string>()
    dados.filiais.forEach((linha, i) => {
      if (!linha.filialId) return
      if (vistas.has(linha.filialId)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Esta filial já está na lista',
          path: ['filiais', i, 'filialId'],
        })
      }
      vistas.add(linha.filialId)
    })
  })

type FormData = z.infer<typeof schema>

const VAZIO: FormData = { nome: '', observacao: '', filiais: [] }

/**
 * Cadastro de serviço. O código é do sistema: aparece depois de salvo e não
 * se edita. O valor é por filial e opcional — campo vazio grava "não
 * informado", que não é o mesmo que R$ 0,00.
 */
export function ServicoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editando = !!id
  const somenteLeitura = useSomenteLeitura('SERVICOS')

  const [carregando, setCarregando] = useState(editando)
  const [codigo, setCodigo] = useState<number>()

  const {
    handleSubmit,
    control,
    reset,
    register,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: VAZIO })

  const filiais = useFieldArray({ control, name: 'filiais' })
  const linhas = watch('filiais')

  useEffect(() => {
    if (!id) return
    servicoService
      .findById(id)
      .then((s) => {
        setCodigo(s.codigo)
        reset({
          nome: s.nome,
          observacao: s.observacao ?? '',
          filiais: s.filiais.map((f) => ({
            filialId: f.filialId,
            filialRotulo: f.filialNome,
            filialAtiva: f.filialAtiva,
            // Com as mesmas casas do campo: String(72.5) reabriria como "72,5"
            valor: textoDaMascara(f.valor, 2),
          })),
        })
      })
      .catch(handleApiError)
      .finally(() => setCarregando(false))
  }, [id, reset])

  async function onSubmit(dados: FormData) {
    if (somenteLeitura) return
    const payload: ServicoRequest = {
      nome: dados.nome.trim(),
      observacao: dados.observacao.trim() || undefined,
      filiais: dados.filiais.map((f) => ({
        filialId: f.filialId,
        valor: paraNumero(f.valor) ?? null,
      })),
    }
    try {
      if (editando) {
        await servicoService.update(id!, payload)
        toast.success('Serviço salvo')
      } else {
        const criado = await servicoService.create(payload)
        toast.success(`Serviço ${criado.codigo} cadastrado`)
      }
      navigate('/app/servicos')
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

  /** As filiais já escolhidas saem do combo das outras linhas. */
  const escolhidas = (exceto: number) =>
    new Set(linhas.filter((_, i) => i !== exceto).map((l) => l.filialId).filter(Boolean))

  return (
    <TPage title={somenteLeitura ? 'Serviço' : editando ? 'Editar serviço' : 'Novo serviço'}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {somenteLeitura && (
          <p className="rounded-md bg-info-bg px-3 py-2 text-caption text-info">
            Você tem acesso só de leitura a esta tela.
          </p>
        )}

        {/* `min-w-0` porque o fieldset tem largura mínima de conteúdo, e em
            360 px empurraria a tela para os lados. */}
        <fieldset disabled={somenteLeitura} className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">
          <TPanel title="Serviço">
            <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <TEntry
                label="Código"
                value={codigo !== undefined ? String(codigo) : ''}
                placeholder="Automático"
                // disabled e não readOnly: tem de parecer o que é, um campo que não se digita
                disabled
                ajuda={codigo === undefined ? 'Gerado ao salvar' : undefined}
              />
              <TEntry
                label="Nome"
                maxLength={150}
                error={errors.nome?.message}
                {...register('nome')}
              />
              <TTextArea
                label="Observação"
                rows={4}
                maxLength={2000}
                className="sm:col-span-2"
                error={errors.observacao?.message}
                {...register('observacao')}
              />
            </div>
          </TPanel>

          <TPanel
            title="Valores por filial"
            subtitle="Opcional. Em branco fica como não informado, que não é o mesmo que zero."
            actions={
              !somenteLeitura && (
                <TButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    filiais.append({ filialId: '', filialRotulo: '', filialAtiva: true, valor: '' })
                  }
                >
                  <IconAdicionar className="size-4" />
                  Acrescentar filial
                </TButton>
              )
            }
          >
            {filiais.fields.length === 0 ? (
              <p className="text-caption text-txt-secondary">
                Nenhuma filial com valor. O serviço vale para o cadastro mesmo assim.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {filiais.fields.map((campo, i) => (
                  <li
                    key={campo.id}
                    // No celular a filial ocupa a linha, e valor e remover dividem a de baixo.
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-line pb-3 last:border-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_11rem_auto] sm:border-0 sm:pb-0"
                  >
                    <Controller
                      control={control}
                      name={`filiais.${i}.filialId`}
                      render={({ field }) => (
                        <TCombo
                          label="Filial"
                          className="col-span-2 sm:col-span-1"
                          placeholder="Busque a filial"
                          value={field.value}
                          rotuloInicial={linhas[i]?.filialRotulo}
                          onChange={field.onChange}
                          buscar={(termo) =>
                            filialService.select(termo).then((lista) => {
                              const fora = escolhidas(i)
                              return lista
                                .filter((f) => !fora.has(f.id))
                                .map((f) => ({ id: f.id, nome: f.nome }))
                            })
                          }
                          error={errors.filiais?.[i]?.filialId?.message}
                        />
                      )}
                    />
                    <TEntry
                      label="Valor (R$)"
                      mascara="decimal"
                      inputMode="numeric"
                      placeholder="Não informado"
                      {...register(`filiais.${i}.valor`)}
                    />
                    {!somenteLeitura && (
                      <div className="mt-6 flex items-center">
                        <TButton
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => filiais.remove(i)}
                          title="Tirar esta filial da lista"
                          aria-label="Remover filial"
                        >
                          <IconFechar className="size-4" />
                        </TButton>
                      </div>
                    )}
                    {linhas[i]?.filialAtiva === false && (
                      <span className="col-span-2 flex flex-wrap items-center gap-2 text-caption text-txt-secondary sm:col-span-3">
                        <TBadge tom="neutro">Filial inativa</TBadge>
                        O valor fica guardado e ainda se corrige.
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </TPanel>
        </fieldset>

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <TButton
            type="button"
            variant="secondary"
            onClick={() => navigate('/app/servicos')}
            className="sm:w-auto"
          >
            {somenteLeitura ? 'Voltar' : 'Cancelar'}
          </TButton>
          {!somenteLeitura && (
            <TButton type="submit" loading={isSubmitting}>
              Salvar
            </TButton>
          )}
        </div>
      </form>
    </TPage>
  )
}
