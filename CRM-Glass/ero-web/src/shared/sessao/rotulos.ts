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

/**
 * Onde uma tela existe: `contratante` (dentro de um contratante: Usuários), `plataforma` (só o superadmin fora de
 * um contratante) ou `ambos` (Logs).
 */
export type EscopoDaTela = 'contratante' | 'plataforma' | 'ambos';

/** O usuário está onde a tela existe? */
export const dentroDoEscopo = (u: Pick<UsuarioLogado, 'papel' | 'superadminAtuando'>, escopo: EscopoDaTela) =>
  escopo === 'ambos' || (escopo === 'plataforma') === naVisaoDePlataforma(u);

/**
 * Pode abrir a tela: ela está nas `telas` do `GET /api/auth/eu` (códigos de docs/04-permissoes.md) e no escopo
 * certo. Monta o menu e guarda as rotas (`ExigeTela`). Esconder é conforto: quem barra é a API.
 */
export const podeAbrirTela = (
  u: Pick<UsuarioLogado, 'papel' | 'superadminAtuando' | 'telas'>,
  tela: string,
  escopo: EscopoDaTela,
) => (u.telas ?? []).includes(tela) && dentroDoEscopo(u, escopo);

/** Administrador do contratante ou superadmin: quem cria administrador, redefine senha e desbloqueia. */
export const ehAdministrador = (u: Pick<UsuarioLogado, 'papel'>) => u.papel === 'ADMIN' || u.papel === 'SUPERADMIN';

/** Nome da seção do menu com os cadastros (Pessoas, Cadastros auxiliares) e do começo do caminho das telas deles. */
export const ROTULO_CADASTROS = 'Cadastros';
