import { Building2, Home, ScrollText, Users } from 'lucide-react';
import type { ItemMenu } from '../design-system/shell';
import type { UsuarioLogado } from '../shared/api/tipos';
import { naVisaoDePlataforma, podeAbrirTela, ROTULO_ADMINISTRATIVO, type EscopoDaTela } from '../shared/sessao';

/** Título da tela na barra superior, pelo caminho (o primeiro que casar). */
export const TITULOS: [RegExp, string][] = [
  [/^\/$/, 'Início'],
  [/^\/admin\/contratantes(\/|$)/, 'Contratantes'],
  [/^\/admin\/usuarios(\/|$)/, 'Usuários'],
  [/^\/admin\/logs(\/|$)/, 'Logs'],
  [/^\/minha-conta(\/|$)/, 'Minha conta'],
];

export const tituloDaRota = (pathname: string) => TITULOS.find(([r]) => r.test(pathname))?.[1] ?? 'Início';

/** Nome do grupo de baixo do menu; mora em shared/sessao para as telas usarem no caminho (breadcrumb). */
export { ROTULO_ADMINISTRATIVO };

/** Item do menu com o que o Início mostra nos atalhos. */
export type ItemDoMenu = ItemMenu & { descricao?: string };

/** Uma tela com grupo de liberação (docs/04-permissoes.md): código, rota e onde ela existe. */
export type TelaDoMenu = ItemDoMenu & { tela: string; escopo: EscopoDaTela };

/**
 * Registro das telas com grupo. Entram no menu as que estão nas `telas` do `GET /api/auth/eu` e no escopo:
 * Usuários só dentro de um contratante (o superadmin acessa o contratante antes); Logs nos dois lugares.
 */
export const TELAS_DO_MENU: TelaDoMenu[] = [
  {
    tela: 'usuario-list',
    to: '/admin/usuarios',
    label: 'Usuários',
    icon: Users,
    escopo: 'contratante',
    descricao: 'Quem acessa, com que papel e quais telas.',
  },
  {
    tela: 'auditoria-list',
    to: '/admin/logs',
    label: 'Logs',
    icon: ScrollText,
    escopo: 'ambos',
    descricao: 'Entradas, alterações e eventos de segurança.',
  },
];

/** Contratantes: presa ao papel (superadmin na visão de plataforma), sem grupo (docs/04 "Telas sem grupo"). */
const CONTRATANTES: ItemDoMenu = {
  to: '/admin/contratantes',
  label: 'Contratantes',
  icon: Building2,
  descricao: 'Cadastro das empresas que usam o CRM.',
};

/** Grupo de cima do menu: o Início. */
export function menuDoUsuario(_usuario: UsuarioLogado): ItemDoMenu[] {
  return [{ to: '/', label: 'Início', icon: Home }];
}

/**
 * Grupo Administrativo (embaixo no menu): as telas do registro liberadas para o usuário, no escopo dele, mais
 * Contratantes para o superadmin na visão de plataforma. Esconder é conforto: quem barra é a API.
 */
export function menuAdministrativo(usuario: Pick<UsuarioLogado, 'papel' | 'superadminAtuando' | 'telas'>): ItemDoMenu[] {
  const liberadas = TELAS_DO_MENU.filter((t) => podeAbrirTela(usuario, t.tela, t.escopo)).map(
    ({ tela: _tela, escopo: _escopo, ...item }) => item,
  );
  return naVisaoDePlataforma(usuario) ? [...liberadas, CONTRATANTES] : liberadas;
}
