import { Home } from 'lucide-react';
import type { ItemMenu } from '../design-system/shell';
import type { UsuarioLogado } from '../shared/api/tipos';

/** Título da tela na barra superior, pelo caminho (o primeiro que casar). */
export const TITULOS: [RegExp, string][] = [[/^\/$/, 'Início']];

export const tituloDaRota = (pathname: string) => TITULOS.find(([r]) => r.test(pathname))?.[1] ?? 'Início';

/**
 * Menu da casca. As telas novas entram aqui filtradas por `usuario.telas` (códigos de docs/04-permissoes.md);
 * as presas ao papel (Contratantes, Configuração), por `usuario.papel`. Nesta entrega só há o Início.
 */
export function menuDoUsuario(_usuario: UsuarioLogado): ItemMenu[] {
  return [{ to: '/', label: 'Início', icon: Home }];
}
