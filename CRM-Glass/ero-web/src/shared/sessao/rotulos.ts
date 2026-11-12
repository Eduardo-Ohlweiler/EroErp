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
