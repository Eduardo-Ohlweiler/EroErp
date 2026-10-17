import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { z } from 'zod'
import { TBadge, TButton, TCheckBox, TCombo, TEntry, TPage, TPanel } from '@/components/common'
import { useSomenteLeitura } from '@/hooks/useSomenteLeitura'
import { BolinhaDaCor } from '@/pages/filial/FilialList'
import { handleApiError } from '@/services/api'
import { estoqueService } from '@/services/estoqueService'
import { filialService } from '@/services/filialService'
import { produtoService } from '@/services/produtoService'
import type { EstoqueResponse, MovimentacaoResponse } from '@/types/estoque'
import {
  casasDaUnidade,
  formatarQuantidade,
  formatarQuantidadeComSinal,
  mascaraDaUnidade,
  ROTULO_MOVIMENTACAO,
} from '@/utils/estoque'
import { formatarDataHora, paraNumero, textoDaMascara } from '@/utils/format'

const schema = z.object({
  produtoId: z.string(),
  filialId: z.string(),
  controlaEstoque: z.boolean(),
  /** Textos das máscaras. Vazio é "não informado" e vai como null. */
  precoVenda: z.string(),
  quantidadeMinima: z.string(),
  quantidadeInicial: z.string(),
})

type FormData = z.infer<typeof schema>

const VAZIO: FormData = {
  produtoId: '',
  filialId: '',
  controlaEstoque: true,
  precoVenda: '',
  quantidadeMinima: '',
  quantidadeInicial: '',
}

/**
 * O estoque de um produto numa filial. Produto e filial são a identidade da
 * linha: escolhidos ao abrir, não mudam. A quantidade só muda em
 * Movimentações — aqui ela aparece, e só o saldo inicial entra pelo
 * cadastro. Sem controle de estoque, a linha guarda o preço da filial.
 */
export function EstoqueForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editando = !!id
  const somenteLeitura = useSomenteLeitura('ESTOQUE')

  const [carregando, setCarregando] = useState(editando)
  const [registro, setRegistro] = useState<EstoqueResponse>()
  const [movimentos, setMovimentos] = useState<MovimentacaoResponse[]>([])
  /** Unidade de cada produto que o combo já trouxe: decide a máscara da quantidade. */
  const unidades = useRef(new Map<string, string>())
  const [unidadeNova, setUnidadeNova] = useState<string>()

  const {
    handleSubmit,
    control,
    reset,
    register,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: VAZIO })

  const controla = watch('controlaEstoque')
  const sigla = registro?.unidadeSigla ?? unidadeNova
  const casas = casasDaUnidade(sigla)

  useEffect(() => {
    if (!id) return
    Promise.all([
      estoqueService.findById(id),
      estoqueService.movimentacoes({ estoqueId: id, size: 10 }),
    ])
      .then(([e, pagina]) => {
        setRegistro(e)
        setMovimentos(pagina.content)
        const casasDoRegistro = casasDaUnidade(e.unidadeSigla)
        reset({
          produtoId: e.produtoId,
          filialId: e.filialId,
          controlaEstoque: e.controlaEstoque,
          // Com as mesmas casas do campo: String(72.5) reabriria como "72,5"
          precoVenda: textoDaMascara(e.precoVenda, 2),
          quantidadeMinima: textoDaMascara(e.quantidadeMinima, casasDoRegistro),
          quantidadeInicial: '',
        })
      })
      .catch(handleApiError)
      .finally(() => setCarregando(false))
  }, [id, reset])

  async function onSubmit(dados: FormData) {
    if (somenteLeitura) return
    const precoVenda = paraNumero(dados.precoVenda) ?? null
    const quantidadeMinima = paraNumero(dados.quantidadeMinima) ?? null
    try {
      if (editando) {
        await estoqueService.update(id!, {
          precoVenda,
          controlaEstoque: dados.controlaEstoque,
          quantidadeMinima,
        })
        toast.success('Estoque salvo')
      } else {
        let falta = false
        if (!dados.produtoId) {
          setError('produtoId', { message: 'Escolha o produto' })
          falta = true
        }
        if (!dados.filialId) {
          setError('filialId', { message: 'Escolha a filial' })
          falta = true
        }
        if (falta) return
        await estoqueService.create({
          produtoId: dados.produtoId,
          filialId: dados.filialId,
          precoVenda,
          controlaEstoque: dados.controlaEstoque,
          quantidadeMinima,
          quantidadeInicial: dados.controlaEstoque ? (paraNumero(dados.quantidadeInicial) ?? null) : null,
        })
        toast.success('Estoque aberto')
      }
      navigate('/app/estoque')
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

  return (
    <TPage title={somenteLeitura ? 'Estoque' : editando ? 'Editar estoque' : 'Novo estoque'}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {somenteLeitura && (
          <p className="rounded-md bg-info-bg px-3 py-2 text-caption text-info">
            Você tem acesso só de leitura a esta tela.
          </p>
        )}

        <fieldset disabled={somenteLeitura} className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">
          <TPanel title="Produto e filial">
            {registro ? (
              <dl className="grid gap-4 sm:grid-cols-3">
                <div className="min-w-0">
                  <dt className="text-caption text-txt-secondary">Produto</dt>
                  <dd className="flex flex-wrap items-center gap-2 text-body text-txt">
                    {registro.produtoCodigo} — {registro.produtoNome}
                    {!registro.produtoAtivo && <TBadge tom="neutro">Produto inativo</TBadge>}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-caption text-txt-secondary">Filial</dt>
                  <dd className="flex flex-wrap items-center gap-2 text-body text-txt">
                    <BolinhaDaCor cor={registro.filialCor} />
                    {registro.filialNome}
                    {!registro.filialAtiva && <TBadge tom="neutro">Filial inativa</TBadge>}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption text-txt-secondary">Saldo</dt>
                  <dd className="text-h3 font-medium tabular-nums text-txt">
                    {registro.controlaEstoque
                      ? formatarQuantidade(registro.quantidade, registro.unidadeSigla)
                      : 'Não controla'}
                  </dd>
                </div>
              </dl>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="produtoId"
                  render={({ field }) => (
                    <TCombo
                      label="Produto"
                      placeholder="Nome, código ou EAN"
                      value={field.value}
                      onChange={(valor) => {
                        field.onChange(valor)
                        setUnidadeNova(unidades.current.get(valor))
                      }}
                      buscar={(t) =>
                        produtoService.select(t).then((lista) =>
                          lista.map((p) => {
                            unidades.current.set(p.id, p.unidadeSigla)
                            return { id: p.id, nome: `${p.codigo} — ${p.nome} (${p.unidadeSigla})` }
                          }),
                        )
                      }
                      error={errors.produtoId?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="filialId"
                  render={({ field }) => (
                    <TCombo
                      label="Filial"
                      placeholder="Busque a filial"
                      value={field.value}
                      onChange={field.onChange}
                      buscar={(t) =>
                        filialService.select(t).then((lista) => lista.map((f) => ({ id: f.id, nome: f.nome })))
                      }
                      error={errors.filialId?.message}
                    />
                  )}
                />
              </div>
            )}
          </TPanel>

          <TPanel
            title="Preço e controle"
            subtitle="Preço em branco fica como não informado, que não é o mesmo que zero."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <TCheckBox
                label="Controla estoque"
                className="sm:col-span-3"
                ajuda="Sem controle, o produto não se movimenta nesta filial: vale só o preço."
                {...register('controlaEstoque')}
              />
              <TEntry
                label="Preço de venda (R$)"
                mascara="decimal"
                inputMode="numeric"
                placeholder="Não informado"
                {...register('precoVenda')}
              />
              <TEntry
                // A chave refaz o campo quando a unidade muda: a máscara de 0 e
                // a de 3 casas não leem o mesmo texto
                key={`minimo-${casas}`}
                label={`Quantidade mínima${sigla ? ` (${sigla})` : ''}`}
                mascara={mascaraDaUnidade(sigla)}
                casas={casas}
                inputMode="numeric"
                placeholder="Não informada"
                ajuda="Guardada para o painel; ainda não gera alerta."
                {...register('quantidadeMinima')}
              />
              {!editando && (
                <TEntry
                  key={`inicial-${casas}`}
                  label={`Quantidade inicial${sigla ? ` (${sigla})` : ''}`}
                  mascara={mascaraDaUnidade(sigla)}
                  casas={casas}
                  inputMode="numeric"
                  placeholder="Zero"
                  disabled={!controla}
                  ajuda={controla ? 'Entra como uma entrada "Saldo inicial".' : 'Sem controle não há saldo.'}
                  {...register('quantidadeInicial')}
                />
              )}
            </div>
          </TPanel>
        </fieldset>

        {registro && (
          <TPanel
            title="Últimas movimentações"
            actions={
              <Link
                to={`/app/estoque-movimentacoes?produtoId=${registro.produtoId}&filialId=${registro.filialId}`}
                // Os nomes vão no estado da rota: o combo de lá não os acharia pelo id
                state={{ produtoNome: registro.produtoNome, filialNome: registro.filialNome }}
                className="text-caption font-medium text-primary hover:underline"
              >
                Ver todas
              </Link>
            }
          >
            {movimentos.length === 0 ? (
              <p className="text-caption text-txt-secondary">Nenhuma movimentação ainda.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {movimentos.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2">
                    <span className="flex min-w-0 flex-col">
                      <span className="text-body text-txt">
                        {ROTULO_MOVIMENTACAO[m.tipo]}
                        {m.filialContraparteNome &&
                          (m.tipo === 'TRANSFERENCIA_SAIDA'
                            ? ` para ${m.filialContraparteNome}`
                            : ` de ${m.filialContraparteNome}`)}
                      </span>
                      <span className="text-caption text-txt-secondary">
                        {formatarDataHora(m.createdAt)}
                        {m.motivo && ` · ${m.motivo}`}
                      </span>
                    </span>
                    <span className="text-body tabular-nums text-txt">
                      {formatarQuantidadeComSinal(m.quantidade, m.unidadeSigla)}
                      <span className="text-caption text-txt-secondary">
                        {' '}→ {formatarQuantidade(m.quantidadePosterior, m.unidadeSigla)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </TPanel>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <TButton
            type="button"
            variant="secondary"
            onClick={() => navigate('/app/estoque')}
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
