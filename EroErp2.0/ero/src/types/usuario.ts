import type { Role } from './auth'
import type { Paginacao } from './comum'
import type { Permissao } from './permissao'
import type { PeriodoAcesso } from './tenant'

/** Espelha o `UsuarioResponseDto`. Nunca traz senha nem hash. */
export interface UsuarioResponse {
  id: string
  tenantId: string
  tenantNome: string
  nome: string
  email: string
  telefone: string | null
  codigoPais: string
  role: Role
  ativo: boolean
  bloqueado: boolean
  createdAt: string
  /**
   * Telas liberadas, como gravadas. Só vem no registro aberto; na listagem é
   * vazia. ADMIN e SUPERADMIN não têm linha: acessam tudo.
   */
  permissoes: Permissao[]
}

/**
 * O `tenantId` decide o destino, e omiti-lo no tenant raiz **cria um cliente
 * novo** com o nome do usuário — que nasce ADMIN, ignorando a `role` enviada.
 * Ver docs/02-modulo-usuarios §3.1.
 */
export interface UsuarioCreate {
  nome: string
  email: string
  senha: string
  telefone?: string
  codigoPais?: string
  role?: Role
  tenantId?: string
  /** Licença do cliente novo. Ignorado ao entrar num tenant existente. */
  periodoAcesso?: PeriodoAcesso
  /** Só para o nível USER — nos outros é ignorada. */
  permissoes?: Permissao[]
}

export interface UsuarioUpdate {
  nome: string
  email: string
  telefone?: string
  codigoPais?: string
  role: Role
  /** Estado completo: tela que não vem perde o acesso. */
  permissoes?: Permissao[]
}

export interface UsuarioFiltros extends Paginacao {
  nome?: string
  email?: string
  role?: Role
  ativo?: boolean
}

export interface PerfilUpdate {
  nome: string
  telefone?: string
  codigoPais?: string
}

export interface SenhaUpdate {
  senhaAtual: string
  senhaNova: string
}

/** Senha nova definida pelo superadmin para quem perdeu a sua. */
export interface SenhaRedefinicao {
  senhaNova: string
}
