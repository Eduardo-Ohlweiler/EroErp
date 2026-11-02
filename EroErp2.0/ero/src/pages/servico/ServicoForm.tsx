import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import {
  TAuditoria,
  TBadge,
  TButton,
  TDBCombo,
  TEntry,
  TFieldList,
  TForm,
  TFormActionsLeft,
  TFormFooter,
  TPage,
  TPanel,
  TRow,
  TTextArea,
  useMessage,
} from '@/components/common'
import { useSomenteLeitura } from '@/hooks/useSomenteLeitura'
import { filialService } from '@/services/filialService'
import { servicoService } from '@/services/servicoService'
import type { ServicoRequest, ServicoResponse } from '@/types/servico'
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
type LinhaFilial = FormData['filiais'][number]

const VAZIO: FormData = { nome: '', observacao: '', filiais: [] }
const LINHA_NOVA: LinhaFilial = { filialId: '', filialRotulo: '', filialAtiva: true, valor: '' }

function paraForm(s: ServicoResponse): FormData {
  return {
    nome: s.nome,
    observacao: s.observacao ?? '',
    filiais: s.filiais.map((f) => ({
      filialId: f.filialId,
      filialRotulo: f.filialNome,
      filialAtiva: f.filialAtiva,
      // Com as mesmas casas do campo: String(72.5) reabriria como "72,5"
      valor: textoDaMascara(f.valor, 2),
    })),
  }
}

function paraCorpo(dados: FormData): ServicoRequest {
  return {
    nome: dados.nome.trim(),
    observacao: dados.observacao.trim() || undefined,
    filiais: dados.filiais.map((f) => ({
      filialId: f.filialId,
      valor: paraNumero(f.valor) ?? null,
    })),
  }
}

/**
 * Cadastro de serviço. O código é do sistema: aparece depois de salvo e não
 * se edita. O valor é por filial e opcional — campo vazio grava "não
 * informado", que não é o mesmo que R$ 0,00.
 */
export function ServicoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const somenteLeitura = useSomenteLeitura('SERVICOS')
  const msg = useMessage()
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: VAZIO })
  const [salvo, setSalvo] = useState<ServicoResponse>()
  const [carregando, setCarregando] = useState(!!id)
  const linhas = useWatch({ control: form.control, name: 'filiais' })

  const carregar = useCallback(() => {
    if (!id) return
    servicoService
      .findById(id)
      .then((s) => {
        setSalvo(s)
        form.reset(paraForm(s))
      })
      .catch(msg.erroApi)
      .finally(() => setCarregando(false))
  }, [id, form, msg])

  useEffect(carregar, [carregar])

  const salvar = async (dados: FormData) => {
    try {
      if (id) {
        await servicoService.update(id, paraCorpo(dados))
        msg.sucesso('Serviço salvo')
        // Relê: o "Alterado em" só existe depois do commit.
        carregar()
      } else {
        const criado = await servicoService.create(paraCorpo(dados))
        msg.sucesso(`Serviço ${criado.codigo} cadastrado`)
        navigate(`/app/servicos/${criado.id}`)
      }
    } catch (erro) {
      msg.erroApi(erro)
    }
  }

  /** No cadastro novo, Novo só esvazia; num registro aberto, vai para o novo. */
  const novo = () => (id ? navigate('/app/servicos/novo') : form.reset(VAZIO))

  /** As filiais já escolhidas saem do combo das outras linhas. */
  const escolhidas = (exceto: number) =>
    new Set((linhas ?? []).filter((_, i) => i !== exceto).map((l) => l.filialId).filter(Boolean))

  return (
    <TPage
      title={somenteLeitura ? 'Serviço' : id ? 'Editar serviço' : 'Novo serviço'}
      breadcrumb={['Cadastros', 'Serviços', id ? 'Editar' : 'Novo']}
      carregando={carregando}
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
          <TTextArea name="observacao" label="Observação" linhas={4} maxLength={2000} />
        </TRow>

        <TPanel
          title="Valores por filial"
          subtitle="Opcional. Em branco fica como não informado, que não é o mesmo que zero."
        >
          <TFieldList<LinhaFilial>
            name="filiais"
            novaLinha={LINHA_NOVA}
            rotuloAdicionar="Acrescentar filial"
            vazio="Nenhuma filial com valor. O serviço vale para o cadastro mesmo assim."
            colunas={[
              {
                name: 'filialId',
                componente: (campo, i, linha) => (
                  <TDBCombo
                    name={campo}
                    label="Filial"
                    placeholder="Busque a filial"
                    rotuloInicial={linha.filialRotulo}
                    buscar={(termo) =>
                      filialService.select(termo).then((lista) => {
                        const fora = escolhidas(i)
                        return lista
                          .filter((f) => !fora.has(f.id))
                          .map((f) => ({ id: f.id, nome: f.nome }))
                      })
                    }
                  />
                ),
              },
              {
                name: 'valor',
                componente: (campo) => (
                  <TEntry name={campo} label="Valor (R$)" mascara="decimal" placeholder="Não informado" />
                ),
              },
            ]}
            detalhe={(_, linha) =>
              linha.filialAtiva === false && (
                <span className="flex flex-wrap items-center gap-2 text-caption text-txt-secondary">
                  <TBadge tom="neutro">Filial inativa</TBadge>
                  O valor fica guardado e ainda se corrige.
                </span>
              )
            }
          />
        </TPanel>

        <TAuditoria registro={salvo} />

        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="salvar" type="submit" loading={form.formState.isSubmitting} />
            <TButton variant="novo" onClick={novo} />
            <TButton variant="voltar" onClick={() => navigate('/app/servicos')} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
