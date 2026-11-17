import { Building2, Home, ScrollText, Tags, Users } from 'lucide-react';
import type { ItemMenu } from '../design-system/shell';
import { RAIZ_DOS_AUXILIARES, TELAS_AUXILIARES } from '../modules/auxiliares/telas';
import type { UsuarioLogado } from '../shared/api/tipos';
import { naVisaoDePlataforma, podeAbrirTela, ROTULO_ADMINISTRATIVO, ROTULO_CADASTROS, type EscopoDaTela } from '../shared/sessao';

/** Título da tela na barra superior, pelo caminho (o primeiro que casar). */
export const TITULOS: [RegExp, string][] = [
  [/^\/$/, 'Início'],
  [/^\/admin\/contratantes(\/|$)/, 'Contratantes'],
  [/^\/admin\/usuarios(\/|$)/, 'Usuários'],
  [/^\/admin\/logs(\/|$)/, 'Logs'],
  [/^\/cadastros\/auxiliares\/tipos-de-cadastro(\/|$)/, 'Tipos de cadastro'],
  [/^\/cadastros\/auxiliares\/tipos-de-telefone(\/|$)/, 'Tipos de telefone'],
  [/^\/cadastros\/auxiliares\/tipos-de-email(\/|$)/, 'Tipos de e-mail'],
  [/^\/cadastros\/auxiliares\/tipos-de-endereco(\/|$)/, 'Tipos de endereço'],
  [/^\/cadastros\/auxiliares\/tipos-de-rede-social(\/|$)/, 'Tipos de rede social'],
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

/** Nome da seção do meio do menu (a mesma do começo do caminho das telas de cadastro). */
export { ROTULO_CADASTROS };

/**
 * Seção Cadastros: o pai "Cadastros auxiliares", que abre o submenu com os auxiliares liberados (só dentro de um
 * contratante: o superadmin na plataforma não vê a seção). Sem filho liberado, o pai some. Pessoas entra aqui na
 * etapa das telas de Pessoas. Esconder é conforto: quem barra é a API.
 */
export function menuDeCadastros(usuario: Pick<UsuarioLogado, 'papel' | 'superadminAtuando' | 'telas'>): ItemDoMenu[] {
  const filhos = TELAS_AUXILIARES.filter((t) => podeAbrirTela(usuario, t.tela, 'contratante')).map(
    ({ tela: _tela, recurso: _recurso, ...item }): ItemDoMenu => item,
  );
  if (filhos.length === 0) return [];
  return [{ to: RAIZ_DOS_AUXILIARES, label: 'Cadastros auxiliares', icon: Tags, descricao: 'Os tipos usados nos cadastros.', filhos }];
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
