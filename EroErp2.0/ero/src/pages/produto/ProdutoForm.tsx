import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { z } from 'zod'
import { TButton, TCombo, TEntry, TPage, TPanel, TSelect, TTextArea } from '@/components/common'
import { useSomenteLeitura } from '@/hooks/useSomenteLeitura'
import { handleApiError } from '@/services/api'
import { auxiliarService, subgrupoService } from '@/services/auxiliarProdutoService'
import { catalogoService } from '@/services/catalogoService'
import { pessoaService } from '@/services/pessoaService'
import { produtoService } from '@/services/produtoService'
import type { OpcaoSelect } from '@/components/common'
import type { ProdutoRequest } from '@/types/produto'
import { paraNumero, textoDaMascara } from '@/utils/format'

const categorias = auxiliarService('categorias')
const marcas = auxiliarService('marcas')

const schema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome').max(150, 'Até 150 caracteres'),
  unidadeMedidaId: z.string().min(1, 'Escolha a unidade'),
  /** Só dígitos; o verificador é conferido no servidor, que diz qual seria. */
  ean: z
    .string()
    .trim()
    .refine((v) => v === '' || /^(\d{8}|\d{12,14})$/.test(v), 'Só dígitos: 8, 12, 13 ou 14'),
  descricao: z.string().max(2000, 'Até 2000 caracteres'),
  subgrupoId: z.string(),
  categoriaId: z.string(),
  marcaId: z.string(),
  fornecedorId: z.string(),
  /** Texto da máscara. Vazio é "não informado" e vai como null. */
  custo: z.string(),
})

type FormData = z.infer<typeof schema>

const VAZIO: FormData = {
  nome: '',
  unidadeMedidaId: '',
  ean: '',
  descricao: '',
  subgrupoId: '',
  categoriaId: '',
  marcaId: '',
  fornecedorId: '',
  custo: '',
}

/** Rótulos do registro carregado, para os combos não abrirem com o id cru. */
interface Rotulos {
  subgrupo?: string
  categoria?: string
  marca?: string
  fornecedor?: string
}

/**
 * Cadastro de produto, sem parte fiscal. O código é do sistema; o preço de
 * venda é por filial e mora no estoque. Custo vazio grava "não informado",
 * que não é o mesmo que R$ 0,00.
 */
export function ProdutoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editando = !!id
  const somenteLeitura = useSomenteLeitura('PRODUTOS')

  const [carregando, setCarregando] = useState(editando)
  const [codigo, setCodigo] = useState<number>()
  const [rotulos, setRotulos] = useState<Rotulos>({})
  const [unidades, setUnidades] = useState<OpcaoSelect[]>()
  const [tipoFornecedor, setTipoFornecedor] = useState<string>()

  const {
    handleSubmit,
    control,
    reset,
    register,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: VAZIO })

  useEffect(() => {
    catalogoService
      .unidadesMedida()
      .then((lista) => setUnidades(lista.map((u) => ({ valor: u.id, rotulo: `${u.sigla} — ${u.descricao}` }))))
      .catch((erro) => {
        setUnidades([])
        handleApiError(erro)
      })
    catalogoService
      .tiposCadastro()
      .then((tipos) => setTipoFornecedor(tipos.find((t) => t.nome === 'Fornecedor')?.id))
      .catch(handleApiError)
  }, [])

  useEffect(() => {
    if (!id) return
    produtoService
      .findById(id)
      .then((p) => {
        setCodigo(p.codigo)
        setRotulos({
          subgrupo: p.subgrupoNome ? `${p.grupoNome} › ${p.subgrupoNome}` : undefined,
          categoria: p.categoriaNome ?? undefined,
          marca: p.marcaNome ?? undefined,
          fornecedor: p.fornecedorNome ?? undefined,
        })
        reset({
          nome: p.nome,
          unidadeMedidaId: p.unidadeMedidaId,
          ean: p.ean ?? '',
          descricao: p.descricao ?? '',
          subgrupoId: p.subgrupoId ?? '',
          categoriaId: p.categoriaId ?? '',
          marcaId: p.marcaId ?? '',
          fornecedorId: p.fornecedorId ?? '',
          // Com as mesmas casas do campo: String(72.5) reabriria como "72,5"
          custo: textoDaMascara(p.custo, 2),
        })
      })
      .catch(handleApiError)
      .finally(() => setCarregando(false))
  }, [id, reset])

  async function onSubmit(dados: FormData) {
    if (somenteLeitura) return
    const payload: ProdutoRequest = {
      nome: dados.nome.trim(),
      unidadeMedidaId: dados.unidadeMedidaId,
      ean: dados.ean.trim() || undefined,
      descricao: dados.descricao.trim() || undefined,
      subgrupoId: dados.subgrupoId || undefined,
      categoriaId: dados.categoriaId || undefined,
      marcaId: dados.marcaId || undefined,
      fornecedorId: dados.fornecedorId || undefined,
      custo: paraNumero(dados.custo) ?? null,
    }
    try {
      if (editando) {
        await produtoService.update(id!, payload)
        toast.success('Produto salvo')
      } else {
        const criado = await produtoService.create(payload)
        toast.success(`Produto ${criado.codigo} cadastrado`)
      }
      navigate('/app/produtos')
    } catch (erro) {
      handleApiError(erro)
    }
  }

  // As unidades antes do formulário: um <select> montado sem a opção perde o
  // valor que o registro carregado põe nele.
  if (carregando || !unidades) {
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
    <TPage title={somenteLeitura ? 'Produto' : editando ? 'Editar produto' : 'Novo produto'}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {somenteLeitura && (
          <p className="rounded-md bg-info-bg px-3 py-2 text-caption text-info">
            Você tem acesso só de leitura a esta tela.
          </p>
        )}

        {/* `min-w-0` porque o fieldset tem largura mínima de conteúdo, e em
            360 px empurraria a tela para os lados. */}
        <fieldset disabled={somenteLeitura} className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">
          <TPanel title="Produto">
            <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <TEntry
                label="Código"
                value={codigo !== undefined ? String(codigo) : ''}
                placeholder="Automático"
                // disabled e não readOnly: tem de parecer o que é, um campo que não se digita
                disabled
                ajuda={codigo === undefined ? 'Gerado ao salvar' : undefined}
              />
              <TEntry label="Nome" maxLength={150} error={errors.nome?.message} {...register('nome')} />
              {/* Linha própria: na coluna de 8rem do código a unidade sairia cortada */}
              <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                <TSelect
                  label="Unidade"
                  vazio="Escolha"
                  opcoes={unidades}
                  error={errors.unidadeMedidaId?.message}
                  {...register('unidadeMedidaId')}
                />
                <TEntry
                  label="EAN (código de barras)"
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="Opcional"
                  error={errors.ean?.message}
                  {...register('ean')}
                />
              </div>
              <TTextArea
                label="Descrição"
                rows={3}
                maxLength={2000}
                className="sm:col-span-2"
                error={errors.descricao?.message}
                {...register('descricao')}
              />
            </div>
          </TPanel>

          <TPanel title="Classificação" subtitle="Opcional. Cadastre as opções em Auxiliares de produto.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Controller
                control={control}
                name="subgrupoId"
                render={({ field }) => (
                  <TCombo
                    label="Grupo › Subgrupo"
                    vazio="Nenhum"
                    placeholder="Busque o subgrupo"
                    value={field.value}
                    rotuloInicial={rotulos.subgrupo}
                    onChange={field.onChange}
                    buscar={(t) =>
                      subgrupoService
                        .select(t)
                        .then((lista) => lista.map((s) => ({ id: s.id, nome: `${s.grupoNome} › ${s.nome}` })))
                    }
                  />
                )}
              />
              <Controller
                control={control}
                name="categoriaId"
                render={({ field }) => (
                  <TCombo
                    label="Categoria"
                    vazio="Nenhuma"
                    placeholder="Busque a categoria"
                    value={field.value}
                    rotuloInicial={rotulos.categoria}
                    onChange={field.onChange}
                    buscar={(t) => categorias.select(t)}
                  />
                )}
              />
              <Controller
                control={control}
                name="marcaId"
                render={({ field }) => (
                  <TCombo
                    label="Marca"
                    vazio="Nenhuma"
                    placeholder="Busque a marca"
                    value={field.value}
                    rotuloInicial={rotulos.marca}
                    onChange={field.onChange}
                    buscar={(t) => marcas.select(t)}
                  />
                )}
              />
            </div>
          </TPanel>

          <TPanel title="Compra" subtitle="Custo em branco fica como não informado, que não é o mesmo que zero.">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
              <Controller
                control={control}
                name="fornecedorId"
                render={({ field }) => (
                  <TCombo
                    label="Fornecedor"
                    vazio="Nenhum"
                    placeholder="Busque o fornecedor"
                    value={field.value}
                    rotuloInicial={rotulos.fornecedor}
                    onChange={field.onChange}
                    ajuda="Pessoas com o tipo de cadastro Fornecedor"
                    buscar={(t) =>
                      pessoaService
                        .select(t, tipoFornecedor)
                        .then((lista) => lista.map((p) => ({ id: p.id, nome: p.nome })))
                    }
                  />
                )}
              />
              <TEntry
                label="Custo (R$)"
                mascara="decimal"
                inputMode="numeric"
                placeholder="Não informado"
                {...register('custo')}
              />
            </div>
          </TPanel>
        </fieldset>

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <TButton
            type="button"
            variant="secondary"
            onClick={() => navigate('/app/produtos')}
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
