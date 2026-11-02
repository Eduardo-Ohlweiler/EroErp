import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import {
  CORES_SUGERIDAS,
  TAuditoria,
  TButton,
  TCombo,
  TCor,
  TDBCombo,
  TEntry,
  TForm,
  TFormActionsLeft,
  TFormFooter,
  TPage,
  TPanel,
  TRow,
  useMessage,
} from '@/components/common'
import { PessoaRapidaModal } from '@/components/pessoa/PessoaRapidaModal'
import { useAuth } from '@/hooks/useAuth'
import { useSomenteLeitura } from '@/hooks/useSomenteLeitura'
import { filialService } from '@/services/filialService'
import { pessoaService } from '@/services/pessoaService'
import { OPCOES_TIPO_FILIAL, type FilialResponse, type TipoFilial } from '@/types/filial'
import type { PessoaResponse } from '@/types/pessoa'
import { AUSENTE, formatarDocumento, mascararCep } from '@/utils/format'

const schema = z
  .object({
    pessoaId: z.string().min(1, 'Escolha a pessoa'),
    tipo: z.enum(['MATRIZ', 'FILIAL']),
    matrizId: z.string().optional(),
    cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Escolha uma cor'),
  })
  .refine((d) => d.tipo === 'MATRIZ' || !!d.matrizId, {
    message: 'Escolha a matriz desta filial',
    path: ['matrizId'],
  })

type FormData = z.infer<typeof schema>

const VAZIO: FormData = {
  pessoaId: '',
  tipo: 'MATRIZ',
  matrizId: '',
  cor: CORES_SUGERIDAS[0],
}

/** Rótulos dos combos, para não abrirem com o id cru. */
interface Rotulos {
  pessoa?: string
  matriz?: string
}

/** "Nome (documento)" — homônimo é comum, o documento desempata. */
function rotuloComDocumento(nome: string, documento?: string | null) {
  return documento ? `${nome} (${formatarDocumento(documento)})` : nome
}

function paraForm(f: FilialResponse): FormData {
  return { pessoaId: f.pessoaId, tipo: f.tipo, matrizId: f.matrizId ?? '', cor: f.cor }
}

function paraCorpo(d: FormData) {
  return {
    pessoaId: d.pessoaId,
    tipo: d.tipo as TipoFilial,
    // Matriz não responde a ninguém: o backend recusa o campo na MATRIZ.
    matrizId: d.tipo === 'FILIAL' ? d.matrizId || undefined : undefined,
    cor: d.cor,
  }
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
  const somenteLeitura = useSomenteLeitura('FILIAIS')
  const { podeLer } = useAuth()
  const leDadosDaPessoa = podeLer('PESSOAS')
  const msg = useMessage()
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: VAZIO })
  const [salvo, setSalvo] = useState<FilialResponse>()
  const [rotulos, setRotulos] = useState<Rotulos>({})
  const [carregando, setCarregando] = useState(!!id)
  const [modalAberto, setModalAberto] = useState(false)
  const [pessoa, setPessoa] = useState<PessoaResponse>()

  const tipo = useWatch({ control: form.control, name: 'tipo' })
  const pessoaId = useWatch({ control: form.control, name: 'pessoaId' })

  const carregar = useCallback(() => {
    if (!id) return
    filialService
      .findById(id)
      .then((f) => {
        setSalvo(f)
        setRotulos({
          pessoa: rotuloComDocumento(f.pessoaNome, f.documento),
          matriz: f.matrizNome ?? undefined,
        })
        form.reset(paraForm(f))
      })
      .catch(msg.erroApi)
      .finally(() => setCarregando(false))
  }, [id, form, msg])

  useEffect(carregar, [carregar])

  // Matriz não responde a ninguém: voltar para Matriz esquece a escolhida.
  useEffect(() => {
    if (tipo === 'MATRIZ' && form.getValues('matrizId')) {
      form.setValue('matrizId', '')
      setRotulos((r) => ({ ...r, matriz: undefined }))
    }
  }, [tipo, form])

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
      .catch(msg.erroApi)
    return () => {
      vigente = false
    }
  }, [pessoaId, leDadosDaPessoa, msg])

  const salvar = async (dados: FormData) => {
    try {
      if (id) {
        await filialService.update(id, paraCorpo(dados))
        msg.sucesso('Filial salva')
        // Relê: o "Alterado em" só existe depois do commit.
        carregar()
      } else {
        const criada = await filialService.create(paraCorpo(dados))
        msg.sucesso('Filial cadastrada')
        navigate(`/app/filiais/${criada.id}`)
      }
    } catch (erro) {
      msg.erroApi(erro)
    }
  }

  /** No cadastro novo, Novo só esvazia; num registro aberto, vai para o novo. */
  const novo = () => {
    if (id) return navigate('/app/filiais/nova')
    setRotulos({})
    form.reset(VAZIO)
  }

  const endereco = pessoa?.enderecos.find((e) => e.principal) ?? pessoa?.enderecos[0]

  return (
    <TPage
      title={somenteLeitura ? 'Filial' : id ? 'Editar filial' : 'Nova filial'}
      breadcrumb={['Cadastros', 'Filiais', id ? 'Editar' : 'Nova']}
      carregando={carregando}
    >
      <TForm form={form} onSubmit={salvar} somenteLeitura={somenteLeitura}>
        <TRow>
          <TDBCombo
            name="pessoaId"
            label="Pessoa"
            required
            placeholder="Busque por nome ou documento"
            rotuloInicial={rotulos.pessoa}
            buscar={(termo) =>
              pessoaService.select(termo).then((pessoas) =>
                pessoas.map((p) => ({ id: p.id, nome: rotuloComDocumento(p.nome, p.documento) })),
              )
            }
            ajuda="Empresa ou profissional já cadastrado em Pessoas."
            acao={
              <TButton
                variant="novo"
                label=""
                onClick={() => setModalAberto(true)}
                title="Cadastrar uma pessoa nova sem sair daqui"
                aria-label="Cadastrar pessoa nova"
              />
            }
          />
        </TRow>
        <TRow>
          <TCombo
            name="tipo"
            label="Tipo"
            required
            opcoes={OPCOES_TIPO_FILIAL}
            ajuda={
              tipo === 'MATRIZ'
                ? 'Um negócio próprio. O tenant pode ter mais de uma matriz.'
                : 'Responde a uma matriz.'
            }
          />
        </TRow>
        {tipo === 'FILIAL' && (
          <TRow>
            <TDBCombo
              name="matrizId"
              label="Matriz"
              required
              placeholder="Busque a matriz"
              rotuloInicial={rotulos.matriz}
              buscar={(termo) =>
                filialService.select(termo, 'MATRIZ', id).then((matrizes) =>
                  matrizes.map((m) => ({ id: m.id, nome: rotuloComDocumento(m.nome, m.documento) })),
                )
              }
            />
          </TRow>
        )}
        <TRow>
          <TCor
            name="cor"
            label="Cor de identificação"
            ajuda="Identifica a filial nas listas e combos das outras telas."
          />
        </TRow>

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
              <>
                <TRow>
                  <TEntry
                    label={pessoa.tipoPessoa === 'PESSOA_FISICA' ? 'CPF' : 'CNPJ'}
                    width={pessoa.tipoPessoa === 'PESSOA_FISICA' ? 'cpf' : 'cnpj'}
                    value={formatarDocumento(pessoa.cpf ?? pessoa.cnpj) || AUSENTE}
                    disabled
                  />
                </TRow>
                {pessoa.tipoPessoa === 'PESSOA_JURIDICA' && (
                  <>
                    <TRow>
                      <TEntry label="Razão social" value={pessoa.razaoSocial || AUSENTE} disabled />
                    </TRow>
                    <TRow>
                      <TEntry label="Nome fantasia" value={pessoa.nomeFantasia || AUSENTE} disabled />
                    </TRow>
                    <TRow>
                      <TEntry
                        label="Inscrição estadual"
                        width="curto"
                        value={pessoa.inscricaoEstadual || AUSENTE}
                        disabled
                      />
                    </TRow>
                    <TRow>
                      <TEntry
                        label="Inscrição municipal"
                        width="curto"
                        value={pessoa.inscricaoMunicipal || AUSENTE}
                        disabled
                      />
                    </TRow>
                  </>
                )}
                {endereco ? (
                  <>
                    <TRow>
                      <TEntry label="Rua" value={endereco.rua || AUSENTE} disabled />
                    </TRow>
                    <TRow>
                      <TEntry
                        label="CEP"
                        width="cep"
                        value={endereco.cep ? mascararCep(endereco.cep) : AUSENTE}
                        disabled
                      />
                      <TEntry label="Número" width="curto" value={endereco.numero || AUSENTE} disabled />
                      <TEntry
                        label="Complemento"
                        width="curto"
                        value={endereco.complemento || AUSENTE}
                        disabled
                      />
                    </TRow>
                    <TRow>
                      <TEntry label="Bairro" width="curto" value={endereco.bairro || AUSENTE} disabled />
                      <TEntry label="Cidade" width="medio" value={endereco.cidadeNome} disabled />
                      <TEntry label="UF" width="uf" value={endereco.estadoSigla} disabled />
                    </TRow>
                  </>
                ) : (
                  <TRow>
                    <TEntry label="Endereço" value="Nenhum endereço cadastrado" disabled />
                  </TRow>
                )}
              </>
            )}
          </TPanel>
        )}

        <TAuditoria registro={salvo} />

        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="salvar" type="submit" loading={form.formState.isSubmitting} />
            <TButton variant="novo" onClick={novo} />
            <TButton variant="voltar" onClick={() => navigate('/app/filiais')} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <PessoaRapidaModal
        aberto={modalAberto}
        tipoPadrao="Outros"
        onFechar={() => setModalAberto(false)}
        onCriada={(criada) => {
          // Já entra selecionada
          setRotulos((r) => ({ ...r, pessoa: rotuloComDocumento(criada.nome, criada.cpf ?? criada.cnpj) }))
          form.setValue('pessoaId', criada.id, { shouldValidate: true, shouldDirty: true })
          setModalAberto(false)
        }}
      />
    </TPage>
  )
}
