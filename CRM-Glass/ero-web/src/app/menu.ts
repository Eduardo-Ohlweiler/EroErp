import { Building2, Home } from 'lucide-react';
import type { ItemMenu } from '../design-system/shell';
import type { UsuarioLogado } from '../shared/api/tipos';
import { naVisaoDePlataforma, ROTULO_ADMINISTRATIVO } from '../shared/sessao';

/** Título da tela na barra superior, pelo caminho (o primeiro que casar). */
export const TITULOS: [RegExp, string][] = [
  [/^\/$/, 'Início'],
  [/^\/admin\/contratantes(\/|$)/, 'Contratantes'],
];

export const tituloDaRota = (pathname: string) => TITULOS.find(([r]) => r.test(pathname))?.[1] ?? 'Início';

/** Nome do grupo de baixo do menu (o do superadmin na plataforma); mora em shared/sessao para as telas usarem. */
export { ROTULO_ADMINISTRATIVO };

/**
 * Menu da casca. As telas novas entram aqui filtradas por `usuario.telas` (códigos de docs/04-permissoes.md);
 * as presas ao papel (Contratantes), no grupo Administrativo de `menuAdministrativo`.
 */
export function menuDoUsuario(_usuario: UsuarioLogado): ItemMenu[] {
  return [{ to: '/', label: 'Início', icon: Home }];
}

/**
 * Grupo Administrativo (embaixo no menu): só o superadmin na visão de plataforma (docs/04 "Telas sem grupo").
 * Esconder é conforto: quem barra é a API.
 */
export function menuAdministrativo(usuario: Pick<UsuarioLogado, 'papel' | 'superadminAtuando'>): ItemMenu[] {
  if (!naVisaoDePlataforma(usuario)) return [];
  return [{ to: '/admin/contratantes', label: 'Contratantes', icon: Building2 }];
}
