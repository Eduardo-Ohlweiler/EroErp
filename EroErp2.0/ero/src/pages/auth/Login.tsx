import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { TButton, TEntry, TThemeToggle } from '@/components/common'
import { MarcaEro } from '@/components/layout/MarcaEro'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { handleApiError } from '@/services/api'
import axios from 'axios'

const schema = z.object({
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  senha: z.string().min(1, 'Informe a senha'),
})

type FormData = z.infer<typeof schema>

export function Login() {
  const { login, autenticado } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [erroLogin, setErroLogin] = useState<string | null>(null)
  const { definirPaleta } = useTheme()

  // A paleta é de cada tenant, e aqui ainda não há tenant: o login abre sempre
  // na padrão, mesmo que o cache guarde a cor do último cliente que entrou.
  useEffect(() => {
    if (!autenticado) definirPaleta('PADRAO')
  }, [autenticado, definirPaleta])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  /** Volta para onde o usuário tentou ir antes de ser mandado ao login. */
  const destino = (location.state as { de?: string } | null)?.de ?? '/app'

  // Com o login fora da raiz, chegar aqui já logado passa a ser comum — pelo
  // favorito antigo ou pelo histórico do navegador.
  if (autenticado) return <Navigate to={destino} replace />

  async function onSubmit(dados: FormData) {
    setErroLogin(null)
    try {
      await login(dados)
      navigate(destino, { replace: true })
    } catch (erro) {
      // 401 e 429 são resposta esperada aqui e aparecem no formulário, não em
      // toast — o usuário está olhando para o campo que errou.
      if (axios.isAxiosError(erro) && (erro.response?.status === 401 || erro.response?.status === 429)) {
        setErroLogin(erro.response.data?.erro ?? 'E-mail ou senha inválidos')
        return
      }
      handleApiError(erro)
    }
  }

  // O desenho é o do login do EroErp antigo: um cartão só, compacto, com o
  // logo no topo e o formulário embaixo. A diferença é a faixa navy atrás do
  // logo — ele é branco, e direto sobre o cartão claro sumiria.
  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-bg p-4">
      {/* Alternar tema antes de entrar — quem trabalha à noite não deve
          precisar logar no claro para depois trocar. */}
      <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
        <TThemeToggle />
      </div>

      <div className="w-full max-w-sm overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
        <MarcaEro tamanho="faixa" />

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-4 p-6 sm:p-8"
        >
          <h1 className="text-center text-caption text-txt-muted">Acesse sua conta</h1>

          <TEntry
            label="E-mail"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="seu@email.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <TEntry
            label="Senha"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.senha?.message}
            {...register('senha')}
          />

          {erroLogin && (
            <p
              role="alert"
              className="rounded-md border border-danger bg-danger-bg px-3 py-2 text-caption text-danger"
            >
              {erroLogin}
            </p>
          )}

          <TButton type="submit" loading={isSubmitting} className="mt-2 w-full">
            Entrar
          </TButton>
        </form>
      </div>
    </main>
  )
}
