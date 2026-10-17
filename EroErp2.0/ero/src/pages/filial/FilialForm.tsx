import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { z } from 'zod'
import { IconAdicionar } from '@/assets/icons'
import { TButton, TCombo, TPage, TPanel, TSelect } from '@/components/common'
import { PessoaRapidaModal } from '@/components/pessoa/PessoaRapidaModal'
import { useAuth } from '@/hooks/useAuth'
import { useSomenteLeitura } from '@/hooks/useSomenteLeitura'
import { handleApiError } from '@/services/api'
import { filialService } from '@/services/filialService'
import { pessoaService } from '@/services/pessoaService'
import { OPCOES_TIPO_FILIAL, type TipoFilial } from '@/types/filial'
import type { PessoaResponse } from '@/types/pessoa'
import { AUSENTE, formatarDocumento } from '@/utils/format'

/**
 * Cores sugeridas: tons médios, que leem como bolinha tanto no claro quanto
 * no escuro. A cor é dado da filial, não token de tema — por isso hex aqui.
 */
const CORES_SUGERIDAS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#64748B',
]

const schema = z
  .object({
    pessoaId: z.string().min(1, 'Escolha a pessoa'),
    pessoaRotulo: z.string().optional(),
    tipo: z.enum(['MATRIZ', 'FILIAL']),
    matrizId: z.string().optional(),
    matrizRotulo: z.string().optional(),
    cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Escolha uma cor'),
  })
  .refine((d) => d.tipo === 'MATRIZ' || !!d.matrizId, {
    message: 'Escolha a matriz desta filial',
    path: ['matrizId'],
  })

type FormData = z.infer<typeof schema>

const VAZIO: FormData = {
  pessoaId: '',
  pessoaRotulo: '',
  tipo: 'MATRIZ',
  matrizId: '',
  matrizRotulo: '',
  cor: CORES_SUGERIDAS[0],
}

/** "Nome (documento)" — homônimo é comum, o documento desempata. */
function rotuloComDocumento(nome: string, documento?: string | null) {
  return documento ? `${nome} (${formatarDocumento(documento)})` : nome
}

/**
 * Cadastro de filial — o "emitente" do EroErp antigo.
 *
 * <p>A filial só aponta para uma pessoa: CNPJ, inscrições e endereço são
 * dela, e aparecem aqui em leitura, com o atalho para editá-los lá. Assim um
 * dado cadastral tem um lugar só.
 */
export function FilialForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editando = !!id
  const somenteLeitura = useSomenteLeitura('FILIAIS')
  const { podeLer } = useAuth()
  const leDadosDaPessoa = podeLer('PESSOAS')

  const [carregando, setCarregando] = useState(editando)
  const [modalAberto, setModalAberto] = useState(false)
  const [pessoa, setPessoa] = useState<PessoaResponse>()

  const {
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    register,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: VAZIO })

  const tipo = watch('tipo')
  const pessoaId = watch('pessoaId')
  const cor = watch('cor')

  useEffect(() => {
    if (!id) return
    filialService
      .findById(id)
      .then((f) =>
        reset({
          pessoaId: f.pessoaId,
          pessoaRotulo: rotuloComDocumento(f.pessoaNome, f.documento),
          tipo: f.tipo,
          matrizId: f.matrizId ?? '',
          matrizRotulo: f.matrizNome ?? '',
          cor: f.cor,
        }),
      )
      .catch(handleApiError)
      .finally(() => setCarregando(false))
  }, [id, reset])

  // Os dados cadastrais da pessoa escolhida, só para leitura. Quem não lê
  // Pessoas não os busca — a resposta seria 403 a cada troca de combo.
  useEffect(() => {
    if (!pessoaId || !leDadosDaPessoa) {
      setPessoa(undefined)
      return
    }
    let vigente = true
    pessoaService
      .findById(pessoaId)
      .then((p) => vigente && setPessoa(p))
      .catch(handleApiError)
    return () => {
      vigente = false
    }
  }, [pessoaId, leDadosDaPessoa])

  async function onSubmit(dados: FormData) {
    if (somenteLeitura) return
    const payload = {
      pessoaId: dados.pessoaId,
      tipo: dados.tipo as TipoFilial,
      // Matriz não responde a ninguém: o backend recusa o campo na MATRIZ.
      matrizId: dados.tipo === 'FILIAL' ? dados.matrizId || undefined : undefined,
      cor: dados.cor,
    }
    try {
      if (editando) {
        await filialService.update(id!, payload)
        toast.success('Filial salva')
      } else {
        await filialService.create(payload)
        toast.success('Filial cadastrada')
      }
      navigate('/app/filiais')
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

  const endereco = pessoa?.enderecos.find((e) => e.principal) ?? pessoa?.enderecos[0]

  return (
    <TPage title={somenteLeitura ? 'Filial' : editando ? 'Editar filial' : 'Nova filial'}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {somenteLeitura && (
          <p className="rounded-md bg-info-bg px-3 py-2 text-caption text-info">
            Você tem acesso só de leitura a esta tela.
          </p>
        )}

        {/* `min-w-0` porque o fieldset tem largura mínima de conteúdo, e em
            360 px empurraria a tela para os lados. */}
        <fieldset disabled={somenteLeitura} className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">
          <TPanel title="Filial">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-2 sm:col-span-2">
                <Controller
                  control={control}
                  name="pessoaId"
                  render={({ field }) => (
                    <TCombo
                      label="Pessoa"
                      className="flex-1"
                      placeholder="Busque por nome ou documento"
                      value={field.value}
                      rotuloInicial={watch('pessoaRotulo')}
                      onChange={field.onChange}
                      buscar={(termo) =>
                        pessoaService.select(termo).then((pessoas) =>
                          pessoas.map((p) => ({ id: p.id, nome: rotuloComDocumento(p.nome, p.documento) })),
                        )
                      }
                      ajuda="Empresa ou profissional já cadastrado em Pessoas."
                      error={errors.pessoaId?.message}
                    />
                  )}
                />
                {!somenteLeitura && (
                  <TButton
                    type="button"
                    variant="secondary"
                    onClick={() => setModalAberto(true)}
                    title="Cadastrar uma pessoa nova sem sair daqui"
                    aria-label="Cadastrar pessoa nova"
                    // Alinhado pelo topo do campo (abaixo do rótulo): a ajuda e o
                    // erro do combo quebram em duas linhas no celular.
                    className="mt-6"
                  >
                    <IconAdicionar className="size-4" />
                  </TButton>
                )}
              </div>

              <TSelect
                label="Tipo"
                opcoes={OPCOES_TIPO_FILIAL}
                ajuda={
                  tipo === 'MATRIZ'
                    ? 'Um negócio próprio. O tenant pode ter mais de uma matriz.'
                    : 'Responde a uma matriz.'
                }
                {...register('tipo', {
                  onChange: (e) => {
                    if (e.target.value === 'MATRIZ') {
                      setValue('matrizId', '')
                      setValue('matrizRotulo', '')
                    }
                  },
                })}
              />

              {tipo === 'FILIAL' && (
                <Controller
                  control={control}
                  name="matrizId"
                  render={({ field }) => (
                    <TCombo
                      label="Matriz"
                      placeholder="Busque a matriz"
                      value={field.value ?? ''}
                      rotuloInicial={watch('matrizRotulo')}
                      onChange={field.onChange}
                      buscar={(termo) =>
                        filialService.select(termo, 'MATRIZ', id).then((matrizes) =>
                          matrizes.map((m) => ({ id: m.id, nome: rotuloComDocumento(m.nome, m.documento) })),
                        )
                      }
                      error={errors.matrizId?.message}
                    />
                  )}
                />
              )}

              <fieldset className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
                <legend className="mb-1.5 text-caption text-txt-secondary">
                  Cor de identificação
                </legend>
                <div className="flex flex-wrap items-center gap-2">
                  {CORES_SUGERIDAS.map((sugerida) => {
                    const escolhida = sugerida.toUpperCase() === cor.toUpperCase()
                    return (
                      <button
                        key={sugerida}
                        type="button"
                        onClick={() => setValue('cor', sugerida, { shouldDirty: true })}
                        aria-label={`Cor ${sugerida}`}
                        aria-pressed={escolhida}
                        style={{ backgroundColor: sugerida }}
                        className={`size-8 rounded-full ring-offset-2 ring-offset-surface transition-shadow
                          ${escolhida ? 'ring-2 ring-txt' : 'ring-1 ring-line-strong hover:ring-2 hover:ring-line-strong'}`}
                      />
                    )
                  })}
                  <label className="flex items-center gap-2 text-caption text-txt-secondary">
                    <input
                      type="color"
                      aria-label="Outra cor"
                      value={cor}
                      onChange={(e) => setValue('cor', e.target.value.toUpperCase(), { shouldDirty: true })}
                      className="size-8 cursor-pointer rounded-md border border-line-strong bg-surface p-0.5"
                    />
                    Outra
                  </label>
                </div>
                <p className="text-caption text-txt-muted">
                  Identifica a filial nas listas e combos das outras telas.
                </p>
                {errors.cor && <p className="text-caption text-danger">{errors.cor.message}</p>}
              </fieldset>
            </div>
          </TPanel>
        </fieldset>

        {pessoaId && (
          <TPanel
            title="Dados da pessoa"
            subtitle="CNPJ, inscrições e endereço moram no cadastro da pessoa."
            actions={
              leDadosDaPessoa && (
                <Link
                  to={`/app/pessoas/${pessoaId}`}
                  className="text-caption font-medium text-primary hover:underline"
                >
                  Abrir em Pessoas
                </Link>
              )
            }
          >
            {!leDadosDaPessoa ? (
              <p className="text-caption text-txt-secondary">
                Você não tem acesso ao cadastro de Pessoas, onde ficam os dados desta filial.
              </p>
            ) : !pessoa ? (
              <p className="text-caption text-txt-secondary">Carregando…</p>
            ) : (
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                <Dado rotulo={pessoa.tipoPessoa === 'PESSOA_FISICA' ? 'CPF' : 'CNPJ'}>
                  {formatarDocumento(pessoa.cpf ?? pessoa.cnpj) || AUSENTE}
                </Dado>
                {pessoa.tipoPessoa === 'PESSOA_JURIDICA' && (
                  <>
                    <Dado rotulo="Razão social">{pessoa.razaoSocial || AUSENTE}</Dado>
                    <Dado rotulo="Nome fantasia">{pessoa.nomeFantasia || AUSENTE}</Dado>
                    <Dado rotulo="Inscrição estadual">{pessoa.inscricaoEstadual || AUSENTE}</Dado>
                    <Dado rotulo="Inscrição municipal">{pessoa.inscricaoMunicipal || AUSENTE}</Dado>
                  </>
                )}
                <Dado rotulo="Endereço" className="sm:col-span-2 lg:col-span-3">
                  {endereco
                    ? [
                        [endereco.rua, endereco.numero].filter(Boolean).join(', '),
                        endereco.bairro,
                        `${endereco.cidadeNome}/${endereco.estadoSigla}`,
                      ]
                        .filter(Boolean)
                        .join(' — ')
                    : 'Nenhum endereço cadastrado'}
                </Dado>
              </dl>
            )}
          </TPanel>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <TButton
            type="button"
            variant="secondary"
            onClick={() => navigate('/app/filiais')}
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

      <PessoaRapidaModal
        aberto={modalAberto}
        tipoPadrao="Outros"
        onFechar={() => setModalAberto(false)}
        onCriada={(criada) => {
          // Já entra selecionada
          setValue('pessoaRotulo', rotuloComDocumento(criada.nome, criada.cpf ?? criada.cnpj))
          setValue('pessoaId', criada.id, { shouldValidate: true })
          setModalAberto(false)
        }}
      />
    </TPage>
  )
}

function Dado({
  rotulo,
  className = '',
  children,
}: {
  rotulo: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-caption text-txt-secondary">{rotulo}</dt>
      <dd className="break-words text-body text-txt">{children}</dd>
    </div>
  )
}
