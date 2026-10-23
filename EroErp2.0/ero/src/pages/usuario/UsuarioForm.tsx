import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { z } from 'zod'
import { IconTenants } from '@/assets/icons'
import { TButton, TCombo, TEntry, TPage, TPanel, TSelect } from '@/components/common'
import { PermissoesUsuario } from '@/components/usuario/PermissoesUsuario'
import { RedefinirSenhaModal } from '@/components/usuario/RedefinirSenhaModal'
import { useAuth } from '@/hooks/useAuth'
import { handleApiError } from '@/services/api'
import { permissaoService } from '@/services/permissaoService'
import { tenantService } from '@/services/tenantService'
import { usuarioService } from '@/services/usuarioService'
import { ROLE_LABEL, type Role } from '@/types/auth'
import type { CatalogoModulo, Permissao } from '@/types/permissao'
import { OPCOES_PERIODO_ACESSO, type PeriodoAcesso } from '@/types/tenant'
import { mascararTelefone, somenteDigitos } from '@/utils/format'
import { SENHA_PASSA_DE_72_BYTES, senhaCabeNoBcrypt } from '@/utils/senha'

const schema = z.object({
  nome: z.string().min(1, 'Informe o nome').max(255),
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  // Só no cadastro; o piso de 10 é conferido no envio, que sabe se é cadastro
  senha: z.string().refine(senhaCabeNoBcrypt, SENHA_PASSA_DE_72_BYTES).optional(),
  telefone: z.string().optional(),
  role: z.string().optional(),
  tenantId: z.string().optional(),
  periodoAcesso: z.string().optional(),
})

type FormData = z.infer<typeof schema>

/** Espelha a decisão do backend em `UsuarioService.ehClienteNovo`. */
type Destino = 'novo-cliente' | 'tenant-existente'

/** O que o atalho "Novo usuário neste tenant", do cadastro do tenant, entrega. */
interface TenantDoAtalho {
  tenantId: string
  tenantNome: string
}

const opcoesDe = (roles: Role[]) => roles.map((r) => ({ valor: r, rotulo: ROLE_LABEL[r] }))

/**
 * Superadministrador só existe no tenant do sistema — o tenant que abriga um
 * superadmin nunca expira, e um cliente não pode ganhar isso por engano. O
 * backend recusa fora dele (`UsuarioService.validarConcessaoDeRole`); aqui a
 * opção simplesmente não aparece.
 */
const OPCOES_ROLE = opcoesDe(['ADMIN', 'USER'])
const OPCOES_ROLE_NO_SISTEMA = opcoesDe(['SUPERADMIN', 'ADMIN', 'USER'])

export function UsuarioForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { sessao } = useAuth()
  const editando = !!id

  /**
   * Vindo do atalho no cadastro do tenant, o destino já está decidido: o
   * painel "Destino" some e o tenant aparece fixo. Pelo state do router, e não
   * pela URL — um link copiado não deve carregar uma escolha de tenant.
   */
  const estado = useLocation().state as Partial<TenantDoAtalho> | null
  const tenantDoAtalho: TenantDoAtalho | null =
    !editando && estado?.tenantId && estado.tenantNome
      ? { tenantId: estado.tenantId, tenantNome: estado.tenantNome }
      : null
  const voltarPara = tenantDoAtalho ? `/app/tenants/${tenantDoAtalho.tenantId}` : '/app/usuarios'

  const [destino, setDestino] = useState<Destino>('novo-cliente')
  const [carregando, setCarregando] = useState(editando)
  const [tenantNome, setTenantNome] = useState<string>()
  /** Na edição: o tenant e o nível como estão gravados. */
  const [tenantDoUsuario, setTenantDoUsuario] = useState<string>()
  const [roleGravada, setRoleGravada] = useState<Role>()
  const [redefinindoSenha, setRedefinindoSenha] = useState(false)
  const [catalogo, setCatalogo] = useState<CatalogoModulo[]>([])
  /** Telas liberadas, no formato que o backend grava. Só vale para USER. */
  const [permissoes, setPermissoes] = useState<Permissao[]>([])
  /** A própria senha se troca no perfil, informando a atual. */
  const ehOProprio = editando && id === sessao?.usuarioId

  /**
   * Dentro de um tenant (troca de tenant), o usuário sempre entra nele — o
   * backend usa o tenant efetivo. Não faz sentido oferecer a escolha.
   */
  const dentroDeTenant = sessao?.impersonating ?? false

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    // Indeterminado por padrão: o default nunca pode ser o que derruba um
    // cliente por esquecimento. Quem quer prazo escolhe.
    defaultValues: {
      role: 'USER',
      periodoAcesso: 'INDETERMINADO',
      tenantId: tenantDoAtalho?.tenantId,
    },
  })

  useEffect(() => {
    if (!id) return
    usuarioService
      .findById(id)
      .then((u) => {
        reset({
          nome: u.nome,
          email: u.email,
          // Normaliza o que estiver gravado, com ou sem máscara.
          telefone: mascararTelefone(u.telefone ?? ''),
          role: u.role,
        })
        setTenantNome(u.tenantNome)
        setTenantDoUsuario(u.tenantId)
        setRoleGravada(u.role)
        setPermissoes(u.permissoes ?? [])
      })
      .catch(handleApiError)
      .finally(() => setCarregando(false))
  }, [id, reset])

  useEffect(() => {
    permissaoService.catalogo().then(setCatalogo).catch(handleApiError)
  }, [])

  const clienteNovo =
    !editando && !dentroDeTenant && !tenantDoAtalho && destino === 'novo-cliente'

  /** O cliente novo nasce ADMIN, qualquer que seja o nível no formulário. */
  const roleEfetiva = clienteNovo ? 'ADMIN' : (watch('role') as Role | undefined)
  const ehUsuarioComum = roleEfetiva === 'USER'

  /** Onde o usuário fica — o que decide se Superadministrador é opção. */
  const tenantDestino = editando
    ? tenantDoUsuario
    : (tenantDoAtalho?.tenantId ?? (dentroDeTenant ? sessao?.tenantId : watch('tenantId')))
  // Fora da troca de tenant, o tenant da sessão é o de origem do superadmin:
  // o do sistema. Um registro que já é SUPERADMIN mostra a opção sempre, para
  // o select não ficar vazio.
  const noTenantDoSistema = !dentroDeTenant && !!tenantDestino && tenantDestino === sessao?.tenantId
  const podeSerSuperadmin = noTenantDoSistema || roleGravada === 'SUPERADMIN'
  const opcoesRole = podeSerSuperadmin ? OPCOES_ROLE_NO_SISTEMA : OPCOES_ROLE

  // Trocou o cliente de destino depois de escolher Superadministrador: a opção
  // sumiu, e o valor não pode ficar escondido no formulário.
  useEffect(() => {
    if (!podeSerSuperadmin && watch('role') === 'SUPERADMIN') setValue('role', 'USER')
  }, [podeSerSuperadmin, watch, setValue])

  async function onSubmit(dados: FormData) {
    try {
      if (editando) {
        await usuarioService.update(id!, {
          nome: dados.nome,
          email: dados.email,
          telefone: somenteDigitos(dados.telefone),
          role: dados.role as Role,
          // Estado completo; fora do nível USER o backend apaga o que houver.
          permissoes: ehUsuarioComum ? permissoes : [],
        })
        toast.success('Usuário salvo')
      } else {
        if (!dados.senha || dados.senha.length < 10) {
          toast.error('A senha deve ter no mínimo 10 caracteres')
          return
        }
        const criado = await usuarioService.create({
          nome: dados.nome,
          email: dados.email,
          senha: dados.senha,
          telefone: somenteDigitos(dados.telefone),
          // Cliente novo: sem tenantId, o backend cria o tenant e força ADMIN
          tenantId: clienteNovo ? undefined : dados.tenantId || undefined,
          role: clienteNovo ? undefined : (dados.role as Role),
          // Licença do tenant que está nascendo — ignorada nos demais casos.
          periodoAcesso: clienteNovo ? (dados.periodoAcesso as PeriodoAcesso) : undefined,
          permissoes: ehUsuarioComum ? permissoes : undefined,
        })
        toast.success(
          clienteNovo
            ? `Cliente "${criado.tenantNome}" criado com ${criado.nome} como administrador`
            : 'Usuário criado',
        )
      }
      navigate(voltarPara)
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
    <TPage
      title={editando ? 'Editar usuário' : 'Novo usuário'}
      /* Na edição o cliente aparece como campo próprio no painel, não aqui. */
      subtitle={
        tenantDoAtalho
          ? `Será criado no tenant "${tenantDoAtalho.tenantNome}"`
          : !editando && dentroDeTenant
            ? `Será criado no tenant "${sessao?.tenantNome}"`
            : undefined
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {!editando && !dentroDeTenant && !tenantDoAtalho && (
          <TPanel title="Destino">
            <fieldset className="flex flex-col gap-3">
              <legend className="sr-only">Onde criar o usuário</legend>

              <OpcaoDestino
                selecionado={destino === 'novo-cliente'}
                onSelect={() => setDestino('novo-cliente')}
                titulo="Cliente novo"
                descricao="Cria um tenant com o nome do usuário. Ele nasce administrador — um tenant sem administrador seria um tenant que ninguém consegue gerir."
              />
              {destino === 'novo-cliente' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TSelect
                    label="Período de acesso"
                    opcoes={OPCOES_PERIODO_ACESSO}
                    ajuda="Ao fim do prazo o cliente é desativado automaticamente"
                    {...register('periodoAcesso')}
                  />
                </div>
              )}
              <OpcaoDestino
                selecionado={destino === 'tenant-existente'}
                onSelect={() => setDestino('tenant-existente')}
                titulo="Adicionar a um cliente existente"
                descricao="O usuário entra num tenant que já existe, com o nível de acesso que você escolher."
              />
            </fieldset>

            {destino === 'tenant-existente' && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="tenantId"
                  render={({ field }) => (
                    <TCombo
                      label="Cliente"
                      placeholder="Busque pelo nome"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      buscar={tenantService.select}
                      error={errors.tenantId?.message}
                    />
                  )}
                />
                <TSelect label="Nível de acesso" opcoes={opcoesRole} {...register('role')} />
              </div>
            )}
          </TPanel>
        )}

        <TPanel title="Dados do usuário">
          {(editando || tenantDoAtalho) && (
            <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-surface-alt px-3 py-2.5">
              <IconTenants className="size-4 shrink-0 text-txt-muted" />
              <span className="text-caption text-txt-secondary">Cliente:</span>
              <span className="text-body font-medium text-txt">
                {(tenantDoAtalho?.tenantNome ?? tenantNome) || '—'}
              </span>
              <span className="text-caption text-txt-muted">
                {editando ? '· não é alterado por aqui' : '· escolhido no cadastro do tenant'}
              </span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <TEntry
              label="Nome"
              autoFocus
              error={errors.nome?.message}
              ajuda={clienteNovo ? 'Também será o nome do tenant' : undefined}
              {...register('nome')}
            />
            <TEntry
              label="E-mail"
              type="email"
              autoComplete="off"
              ajuda="Único no sistema — é a credencial de login"
              error={errors.email?.message}
              {...register('email')}
            />
            <Controller
              control={control}
              name="telefone"
              render={({ field }) => (
                <TEntry
                  label="Telefone"
                  inputMode="numeric"
                  placeholder="(51) 99999-0000"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(mascararTelefone(e.target.value))}
                />
              )}
            />

            {!editando && (
              <TEntry
                label="Senha"
                type="password"
                autoComplete="new-password"
                ajuda="Mínimo de 10 caracteres"
                error={errors.senha?.message}
                {...register('senha')}
              />
            )}

            {(editando || dentroDeTenant || tenantDoAtalho) && (
              <TSelect label="Nível de acesso" opcoes={opcoesRole} {...register('role')} />
            )}
          </div>

          {clienteNovo && (
            <p className="mt-4 rounded-md bg-info-bg px-3 py-2 text-caption text-info">
              Será criado o tenant <strong>{watch('nome') || '…'}</strong> e este usuário
              como <strong>administrador</strong> dele.
            </p>
          )}
        </TPanel>

        <TPanel
          title="Acesso aos módulos"
          subtitle={
            ehUsuarioComum
              ? 'Marque os módulos liberados e, em cada tela, se o usuário só lê ou também grava.'
              : undefined
          }
        >
          {ehUsuarioComum ? (
            <PermissoesUsuario catalogo={catalogo} value={permissoes} onChange={setPermissoes} />
          ) : (
            <p className="text-caption text-txt-secondary">
              Superadministradores e administradores acessam todos os módulos, com leitura e
              escrita.
            </p>
          )}
        </TPanel>

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <TButton
            type="button"
            variant="secondary"
            onClick={() => navigate(voltarPara)}
            className="sm:w-auto"
          >
            Cancelar
          </TButton>
          <TButton type="submit" loading={isSubmitting}>
            Salvar
          </TButton>
        </div>
      </form>

      {editando && !ehOProprio && (
        <>
          <TPanel
            title="Senha"
            subtitle="Para quem perdeu a senha e não consegue entrar. Não há recuperação por e-mail."
          >
            <TButton
              type="button"
              variant="secondary"
              onClick={() => setRedefinindoSenha(true)}
              className="sm:w-auto"
            >
              Redefinir senha
            </TButton>
          </TPanel>

          <RedefinirSenhaModal
            aberto={redefinindoSenha}
            usuarioId={id!}
            usuarioNome={watch('nome') || 'o usuário'}
            onFechar={() => setRedefinindoSenha(false)}
          />
        </>
      )}
    </TPage>
  )
}

function OpcaoDestino({
  selecionado,
  onSelect,
  titulo,
  descricao,
}: {
  selecionado: boolean
  onSelect: () => void
  titulo: string
  descricao: string
}) {
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-md border p-3 transition-colors
        ${selecionado ? 'border-primary bg-surface-alt' : 'border-line-strong hover:bg-surface-alt'}`}
    >
      <input
        type="radio"
        name="destino"
        checked={selecionado}
        onChange={onSelect}
        className="mt-1 size-4 shrink-0 accent-[var(--primary)]"
      />
      <span>
        <span className="block text-body font-medium text-txt">{titulo}</span>
        <span className="block text-caption text-txt-secondary">{descricao}</span>
      </span>
    </label>
  )
}
