import type { Papel, UsuarioLogado } from '../api/tipos';

const PAPEIS: Record<Papel, string> = {
  SUPERADMIN: 'Superadmin',
  ADMIN: 'Administrador',
  USUARIO: 'Usuário',
};

/** SUPERADMIN → "Superadmin", ADMIN → "Administrador", USUARIO → "Usuário". */
export const rotuloDoPapel = (papel: Papel) => PAPEIS[papel];

/** Nome do contratante em que está; o superadmin fora de um contratante está na "Plataforma". */
export const nomeDoContratante = (u: Pick<UsuarioLogado, 'tenantNome'>) => u.tenantNome?.trim() || 'Plataforma';

/** Nome do grupo do superadmin no menu (e do começo do caminho das telas dele). */
export const ROTULO_ADMINISTRATIVO = 'Administrativo';

/**
 * Superadmin na visão de plataforma (fora de um contratante): o único que vê o grupo Administrativo
 * (Contratantes). Esconder é conforto: quem barra é a API (papel + `exigirVisaoPlataforma`).
 */
export const naVisaoDePlataforma = (u: Pick<UsuarioLogado, 'papel' | 'superadminAtuando'>) =>
  u.papel === 'SUPERADMIN' && !u.superadminAtuando;
