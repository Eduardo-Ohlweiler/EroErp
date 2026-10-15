import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { z } from 'zod'
import { TButton, TEntry, TPage, TPanel, TSelect } from '@/components/common'
import { SeletorPaleta } from '@/components/tenant/SeletorPaleta'
import { handleApiError } from '@/services/api'
import { tenantService } from '@/services/tenantService'
import type { PaletaSistema } from '@/types/paleta'
import { OPCOES_PERIODO_ACESSO, type PeriodoAcesso } from '@/types/tenant'

const schema = z.object({
  nome: z.string().min(1, 'Informe o nome').max(255),
  periodoAcesso: z.string(),
})

type FormData = z.infer<typeof schema>

/**
 * Abre um tenant sem usuário. Os usuários dele vêm depois — pelo atalho no
 * cadastro do tenant ou pela tela de usuários, escolhendo-o como cliente.
 *
 * Ao contrário da edição, que salva nome, prazo e paleta separados, aqui é um
 * envio só: nada existe ainda, e não há efeito a isolar.
 */
export function TenantNovo() {
  const navigate = useNavigate()
  const [paleta, setPaleta] = useState<PaletaSistema>('PADRAO')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { periodoAcesso: 'INDETERMINADO' },
  })

  async function criar(dados: FormData) {
    try {
      const criado = await tenantService.create({
        nome: dados.nome,
        periodoAcesso: dados.periodoAcesso as PeriodoAcesso,
        paleta,
      })
      toast.success(`Tenant "${criado.nome}" criado`)
      navigate(`/app/tenants/${criado.id}`, { replace: true })
    } catch (erro) {
      handleApiError(erro)
    }
  }

  return (
    <TPage title="Novo tenant" subtitle="Abre o cliente. Os usuários dele são cadastrados depois.">
      <form onSubmit={handleSubmit(criar)} noValidate className="flex flex-col gap-5">
        <TPanel title="Dados do cliente">
          <div className="grid gap-4 sm:grid-cols-2">
            <TEntry label="Nome" autoFocus error={errors.nome?.message} {...register('nome')} />
            <TSelect
              label="Período de acesso"
              opcoes={OPCOES_PERIODO_ACESSO}
              ajuda="Contado a partir de hoje. Ao fim do prazo o cliente é desativado."
              {...register('periodoAcesso')}
            />
          </div>
        </TPanel>

        <TPanel
          title="Aparência"
          subtitle="A paleta de cores para os usuários deste cliente. Dá para trocar depois."
        >
          <SeletorPaleta escolhida={paleta} onEscolher={setPaleta} />
        </TPanel>

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <TButton
            type="button"
            variant="secondary"
            onClick={() => navigate('/app/tenants')}
            className="sm:w-auto"
          >
            Cancelar
          </TButton>
          <TButton type="submit" loading={isSubmitting}>
            Criar tenant
          </TButton>
        </div>
      </form>
    </TPage>
  )
}
