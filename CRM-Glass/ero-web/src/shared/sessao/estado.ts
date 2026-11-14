import type { TemaApi, UsuarioLogado } from '../api/tipos';

/**
 * Estados da sessão:
 * - carregando: abrindo a página, tentando renovar pelo cookie (Splash);
 * - indisponivel: a API não respondeu ao abrir (rede, 5xx) → tela de erro com "Tentar de novo";
 * - anonimo: sem sessão (nunca entrou, saiu ou expirou);
 * - pendente: entrou, mas precisa trocar a senha antes de usar o sistema (só alcança /api/auth/*);
 * - autenticado: pode usar a casca.
 */
export type EstadoSessao =
  | { tipo: 'carregando' }
  | { tipo: 'indisponivel'; detail: string; correlationId?: string }
  | { tipo: 'anonimo'; motivo: MotivoAnonimo }
  | { tipo: 'pendente'; usuario: UsuarioLogado }
  | { tipo: 'autenticado'; usuario: UsuarioLogado };

/** nenhum: abriu sem sessão · saiu: clicou em Sair · expirou: a renovação foi recusada no meio do uso */
export type MotivoAnonimo = 'nenhum' | 'saiu' | 'expirou';

export type AcaoSessao =
  | { tipo: 'iniciar' }
  | { tipo: 'usuario'; usuario: UsuarioLogado }
  /** o usuário trocou o próprio tema (botão da barra): muda só o `temaPreferido`, sem reler o `/eu` */
  | { tipo: 'temaPreferido'; tema: TemaApi | null }
  | { tipo: 'semSessao' }
  | { tipo: 'indisponivel'; detail: string; correlationId?: string }
  | { tipo: 'encerrada'; motivo: Exclude<MotivoAnonimo, 'nenhum'> };

export const ESTADO_INICIAL: EstadoSessao = { tipo: 'carregando' };

/** Usuário → autenticado, ou pendente quando há troca de senha obrigatória. */
export function estadoDoUsuario(usuario: UsuarioLogado): EstadoSessao {
  return usuario.pendencia === 'TROCAR_SENHA' ? { tipo: 'pendente', usuario } : { tipo: 'autenticado', usuario };
}

export function reduzirSessao(estado: EstadoSessao, acao: AcaoSessao): EstadoSessao {
  switch (acao.tipo) {
    case 'iniciar':
      return { tipo: 'carregando' };
    case 'usuario':
      return estadoDoUsuario(acao.usuario);
    case 'temaPreferido':
      // Sem sessão não há de quem trocar o tema.
      if (estado.tipo !== 'pendente' && estado.tipo !== 'autenticado') return estado;
      if (estado.usuario.temaPreferido === acao.tema) return estado;
      return { ...estado, usuario: { ...estado.usuario, temaPreferido: acao.tema } };
    case 'semSessao':
      return { tipo: 'anonimo', motivo: 'nenhum' };
    case 'indisponivel':
      return { tipo: 'indisponivel', detail: acao.detail, correlationId: acao.correlationId };
    case 'encerrada':
      // Quem já está fora não "expira" de novo (ex.: duas chamadas recusadas ao mesmo tempo).
      if (estado.tipo === 'anonimo') return estado;
      return { tipo: 'anonimo', motivo: acao.motivo };
  }
}

/** Usuário da sessão, se houver (pendente ou autenticado). */
export function usuarioDoEstado(estado: EstadoSessao): UsuarioLogado | null {
  return estado.tipo === 'pendente' || estado.tipo === 'autenticado' ? estado.usuario : null;
}

/**
 * Quem é a sessão: usuário + contratante. Quando muda (outra aba entrou com outra conta e a renovação
 * trouxe esse usuário, ou o superadmin passou a atuar em outro contratante), o cache das telas é de outra
 * pessoa e precisa ser limpo.
 */
export function identidadeDoUsuario(usuario: UsuarioLogado): string {
  return `${usuario.id}|${usuario.tenantId ?? ''}`;
}

/** Trocou de usuário ou de contratante em relação à identidade anterior (null = não havia sessão). */
export function trocouIdentidade(anterior: string | null, usuario: UsuarioLogado): boolean {
  return anterior !== null && anterior !== identidadeDoUsuario(usuario);
}
