import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { z } from 'zod'
import { TButton, TEntry, TModal } from '@/components/common'
import { handleApiError } from '@/services/api'
import { usuarioService } from '@/services/usuarioService'
import { SENHA_PASSA_DE_72_BYTES, senhaCabeNoBcrypt } from '@/utils/senha'

/** Mesma régua do perfil e do backend: no mínimo 10 caracteres, no máximo 72 bytes. */
const schema = z
  .object({
    senhaNova: z
      .string()
      .min(10, 'A nova senha deve ter no mínimo 10 caracteres')
      .refine(senhaCabeNoBcrypt, SENHA_PASSA_DE_72_BYTES),
    confirmacao: z.string().min(1, 'Repita a nova senha'),
  })
  .refine((d) => d.senhaNova === d.confirmacao, {
    message: 'As senhas não conferem',
    path: ['confirmacao'],
  })

type FormData = z.infer<typeof schema>

interface RedefinirSenhaModalProps {
  aberto: boolean
  usuarioId: string
  usuarioNome: string
  onFechar: () => void
}

/**
 * O superadmin define uma senha nova para quem perdeu a sua — não há
 * recuperação por e-mail. O servidor também desbloqueia a conta e encerra as
 * sessões abertas do usuário, e o aviso diz isso: quem redefine precisa saber
 * que derrubou alguém que estivesse usando o sistema.
 */
export function RedefinirSenhaModal({ aberto, usuarioId, usuarioNome, onFechar }: RedefinirSenhaModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  function fechar() {
    reset({ senhaNova: '', confirmacao: '' })
    onFechar()
  }

  async function redefinir(dados: FormData) {
    try {
      await usuarioService.redefinirSenha(usuarioId, { senhaNova: dados.senhaNova })
      toast.success(
        `Senha de ${usuarioNome} redefinida. Repasse a nova senha — as sessões abertas dele foram encerradas.`,
      )
      fechar()
    } catch (erro) {
      handleApiError(erro)
    }
  }

  return (
    <TModal
      aberto={aberto}
      titulo="Redefinir senha"
      largura="sm"
      onFechar={fechar}
      acoes={
        <>
          <TButton type="button" variant="secondary" onClick={fechar} className="sm:w-auto">
            Cancelar
          </TButton>
          <TButton
            type="button"
            loading={isSubmitting}
            onClick={() => void handleSubmit(redefinir)()}
            className="sm:w-auto"
          >
            Redefinir
          </TButton>
        </>
      }
    >
      <div className="grid gap-4">
        <p className="text-body text-txt-secondary">
          Nova senha para <strong className="text-txt">{usuarioNome}</strong>. A conta é
          desbloqueada e todas as sessões abertas dele são encerradas.
        </p>
        <TEntry
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          autoFocus
          ajuda="Mínimo de 10 caracteres"
          error={errors.senhaNova?.message}
          {...register('senhaNova')}
        />
        <TEntry
          label="Confirme a nova senha"
          type="password"
          autoComplete="new-password"
          error={errors.confirmacao?.message}
          {...register('confirmacao')}
        />
      </div>
    </TModal>
  )
}
