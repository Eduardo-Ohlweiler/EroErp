import type { ComponentType } from 'react';

/** Item do menu lateral e da barra inferior. A lista vem de `app/menu.ts` (frontend-modulos), já filtrada por permissão. */
export type ItemMenu = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: number;
  /**
   * Com filhos, o item vira um botão que abre o **submenu flutuante** (título = `label`, filhos com ícone e texto) e
   * fica ativo quando a rota está sob o `to` dele. Os filhos já vêm filtrados por permissão; sem nenhum, o pai sai do
   * menu (quem filtra é o `app/menu.ts`).
   */
  filhos?: ItemMenu[];
};

/** Uma seção do menu: um `<nav aria-label={rotulo}>`, separada da anterior por uma linha (`--line`). */
export type SecaoMenu = { rotulo: string; itens: ItemMenu[] };

export const isActive = (pathname: string, to: string) =>
  to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`);

/** O item (ou um dos filhos dele) está na rota atual. */
export const itemAtivo = (pathname: string, item: ItemMenu): boolean =>
  isActive(pathname, item.to) || (item.filhos ?? []).some((f) => isActive(pathname, f.to));

/** Separador do caminho de um filho na busca (Ctrl+K): "Cadastros auxiliares › Tipos de telefone". */
export const SEPARADOR_DO_CAMINHO = ' › ';

/** Uma tela do menu, já achatada: a seção, o item e o rótulo com o caminho do pai. */
export type TelaNavegavel = { secao: string; item: ItemMenu; rotulo: string };

/**
 * As telas do menu achatadas, na ordem das seções (função pura): o pai com filhos não é tela (é o submenu), os filhos
 * entram com o caminho ("Cadastros auxiliares › Tipos de telefone"). É o que o Ctrl+K e os atalhos do Início listam.
 */
export function telasDoMenu(secoes: readonly SecaoMenu[]): TelaNavegavel[] {
  return secoes.flatMap((s) =>
    s.itens.flatMap((item) =>
      item.filhos?.length
        ? item.filhos.map((f) => ({ secao: s.rotulo, item: f, rotulo: `${item.label}${SEPARADOR_DO_CAMINHO}${f.label}` }))
        : [{ secao: s.rotulo, item, rotulo: item.label }],
    ),
  );
}

/** Máximo de ícones na barra inferior (as seções somadas): mais que isso não cabe num celular de 320 px. */
export const MAXIMO_NA_BARRA_INFERIOR = 5;

/**
 * As seções que cabem na barra inferior (função pura): os itens contam na ordem das seções até o máximo (o pai de um
 * submenu conta como um); seção que fica sem item some.
 */
export function secoesDaBarraInferior(secoes: readonly SecaoMenu[], maximo = MAXIMO_NA_BARRA_INFERIOR): SecaoMenu[] {
  let resta = maximo;
  return secoes
    .map((s) => {
      const itens = s.itens.slice(0, Math.max(0, resta));
      resta -= itens.length;
      return { ...s, itens };
    })
    .filter((s) => s.itens.length > 0);
}
