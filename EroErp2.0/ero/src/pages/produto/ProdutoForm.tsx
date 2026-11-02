import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import {
  TAuditoria,
  TButton,
  TCombo,
  TDBCombo,
  TEntry,
  TForm,
  TFormActionsLeft,
  TFormFooter,
  TPage,
  TPanel,
  TRow,
  TTextArea,
  useMessage,
  type OpcaoSelect,
} from '@/components/common'
import { useSomenteLeitura } from '@/hooks/useSomenteLeitura'
import { auxiliarService, subgrupoService } from '@/services/auxiliarProdutoService'
import { catalogoService } from '@/services/catalogoService'
import { pessoaService } from '@/services/pessoaService'
import { produtoService } from '@/services/produtoService'
import type { ProdutoRequest, ProdutoResponse } from '@/types/produto'
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

function paraForm(p: ProdutoResponse): FormData {
  return {
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
  }
}

function paraCorpo(dados: FormData): ProdutoRequest {
  return {
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
}

/**
 * Cadastro de produto, sem parte fiscal. O código é do sistema; o preço de
 * venda é por filial e mora no estoque. Custo vazio grava "não informado",
 * que não é o mesmo que R$ 0,00.
 */
export function ProdutoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const somenteLeitura = useSomenteLeitura('PRODUTOS')
  const msg = useMessage()
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: VAZIO })
  const [salvo, setSalvo] = useState<ProdutoResponse>()
  const [carregando, setCarregando] = useState(!!id)
  const [unidades, setUnidades] = useState<OpcaoSelect[]>()
  const [tipoFornecedor, setTipoFornecedor] = useState<string>()

  useEffect(() => {
    catalogoService
      .unidadesMedida()
      .then((lista) => setUnidades(lista.map((u) => ({ valor: u.id, rotulo: `${u.sigla} — ${u.descricao}` }))))
      .catch((erro) => {
        setUnidades([])
        msg.erroApi(erro)
      })
    catalogoService
      .tiposCadastro()
      .then((tipos) => setTipoFornecedor(tipos.find((t) => t.nome === 'Fornecedor')?.id))
      .catch(msg.erroApi)
  }, [msg])

  const carregar = useCallback(() => {
    if (!id) return
    produtoService
      .findById(id)
      .then((p) => {
        setSalvo(p)
        form.reset(paraForm(p))
      })
      .catch(msg.erroApi)
      .finally(() => setCarregando(false))
  }, [id, form, msg])

  useEffect(carregar, [carregar])

  const salvar = async (dados: FormData) => {
    try {
      if (id) {
        await produtoService.update(id, paraCorpo(dados))
        msg.sucesso('Produto salvo')
        // Relê: o "Alterado em" só existe depois do commit.
        carregar()
      } else {
        const criado = await produtoService.create(paraCorpo(dados))
        msg.sucesso(`Produto ${criado.codigo} cadastrado`)
        navigate(`/app/produtos/${criado.id}`)
      }
    } catch (erro) {
      msg.erroApi(erro)
    }
  }

  /** No cadastro novo, Novo só esvazia; num registro aberto, vai para o novo. */
  const novo = () => (id ? navigate('/app/produtos/novo') : form.reset(VAZIO))

  return (
    <TPage
      title={somenteLeitura ? 'Produto' : id ? 'Editar produto' : 'Novo produto'}
      breadcrumb={['Cadastros', 'Produtos', id ? 'Editar' : 'Novo']}
      // As unidades antes do formulário: um <select> montado sem a opção perde o
      // valor que o registro carregado põe nele.
      carregando={carregando || !unidades}
    >
      <TForm form={form} onSubmit={salvar} somenteLeitura={somenteLeitura}>
        <TRow>
          <TEntry
            label="Código"
            width="codigo"
            value={salvo ? String(salvo.codigo) : ''}
            placeholder="Automático"
            // disabled e não readOnly: tem de parecer o que é, um campo que não se digita
            disabled
            ajuda={salvo ? undefined : 'Gerado ao salvar'}
          />
        </TRow>
        <TRow>
          <TEntry name="nome" label="Nome" required autoFocus maxLength={150} />
        </TRow>
        <TRow>
          <TCombo name="unidadeMedidaId" label="Unidade" required vazio="Escolha" opcoes={unidades ?? []} />
        </TRow>
        <TRow>
          <TEntry
            name="ean"
            label="EAN (código de barras)"
            width="curto"
            inputMode="numeric"
            maxLength={14}
            placeholder="Opcional"
          />
        </TRow>
        <TRow>
          <TTextArea name="descricao" label="Descrição" linhas={3} maxLength={2000} />
        </TRow>

        <TPanel title="Classificação" subtitle="Opcional. Cadastre as opções em Auxiliares de produto.">
          <TRow>
            <TDBCombo
              name="subgrupoId"
              label="Grupo › Subgrupo"
              vazio="Nenhum"
              placeholder="Busque o subgrupo"
              rotuloInicial={salvo?.subgrupoNome ? `${salvo.grupoNome} › ${salvo.subgrupoNome}` : undefined}
              buscar={(t) =>
                subgrupoService
                  .select(t)
                  .then((lista) => lista.map((s) => ({ id: s.id, nome: `${s.grupoNome} › ${s.nome}` })))
              }
            />
          </TRow>
          <TRow>
            <TDBCombo
              name="categoriaId"
              label="Categoria"
              vazio="Nenhuma"
              placeholder="Busque a categoria"
              rotuloInicial={salvo?.categoriaNome ?? undefined}
              buscar={(t) => categorias.select(t)}
            />
          </TRow>
          <TRow>
            <TDBCombo
              name="marcaId"
              label="Marca"
              vazio="Nenhuma"
              placeholder="Busque a marca"
              rotuloInicial={salvo?.marcaNome ?? undefined}
              buscar={(t) => marcas.select(t)}
            />
          </TRow>
        </TPanel>

        <TPanel title="Compra" subtitle="Custo em branco fica como não informado, que não é o mesmo que zero.">
          <TRow>
            <TDBCombo
              name="fornecedorId"
              label="Fornecedor"
              vazio="Nenhum"
              placeholder="Busque o fornecedor"
              rotuloInicial={salvo?.fornecedorNome ?? undefined}
              ajuda="Pessoas com o tipo de cadastro Fornecedor"
              buscar={(t) =>
                pessoaService
                  .select(t, tipoFornecedor)
                  .then((lista) => lista.map((p) => ({ id: p.id, nome: p.nome })))
              }
            />
          </TRow>
          <TRow>
            <TEntry name="custo" label="Custo (R$)" mascara="decimal" placeholder="Não informado" />
          </TRow>
        </TPanel>

        <TAuditoria registro={salvo} />

        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="salvar" type="submit" loading={form.formState.isSubmitting} />
            <TButton variant="novo" onClick={novo} />
            <TButton variant="voltar" onClick={() => navigate('/app/produtos')} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
