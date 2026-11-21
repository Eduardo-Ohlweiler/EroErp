import type { ComponentType } from 'react';
import { Ellipsis } from 'lucide-react';

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

/** O item "Mais" da barra inferior: rótulo, título do submenu e da seção dele. */
export const ROTULO_DO_MAIS = 'Mais';
export const SECAO_DO_MAIS = 'Mais telas';
/** O `to` do "Mais": não é rota (nunca casa com o `pathname`); o item fica ativo pelos filhos. */
export const ROTA_DO_MAIS = '#mais';

/** Corta as seções nos primeiros `quantos` itens, na ordem; devolve o que coube e o que sobrou (seção vazia some). */
function cortar(secoes: readonly SecaoMenu[], quantos: number): { cabem: SecaoMenu[]; sobram: SecaoMenu[] } {
  let resta = quantos;
  const cabem: SecaoMenu[] = [];
  const sobram: SecaoMenu[] = [];
  for (const s of secoes) {
    const n = Math.max(0, Math.min(resta, s.itens.length));
    resta -= n;
    if (n > 0) cabem.push({ ...s, itens: s.itens.slice(0, n) });
    if (n < s.itens.length) sobram.push({ ...s, itens: s.itens.slice(n) });
  }
  return { cabem, sobram };
}

/**
 * As seções da barra inferior (função pura). Os itens contam na ordem das seções (o pai de um submenu conta como um);
 * seção sem item some. Até o máximo, entram todos. Passou do máximo: entram os primeiros `maximo − 1` e o último
 * lugar vira **"Mais"** (ícone `Ellipsis`, numa seção própria), um pai cujos filhos são o que sobrou, achatado como
 * no Ctrl+K (`telasDoMenu`: "Cadastros auxiliares › Tipos de telefone"). Ele abre o mesmo submenu flutuante e fica
 * ativo quando a rota está num desses filhos.
 */
export function secoesDaBarraInferior(secoes: readonly SecaoMenu[], maximo = MAXIMO_NA_BARRA_INFERIOR): SecaoMenu[] {
  const comItens = secoes.filter((s) => s.itens.length > 0);
  const total = comItens.reduce((n, s) => n + s.itens.length, 0);
  if (total <= maximo) return comItens.map((s) => ({ ...s, itens: [...s.itens] }));
  const { cabem, sobram } = cortar(comItens, Math.max(0, maximo - 1));
  const filhos: ItemMenu[] = telasDoMenu(sobram).map((t) => ({ ...t.item, label: t.rotulo, filhos: undefined }));
  return [...cabem, { rotulo: SECAO_DO_MAIS, itens: [{ to: ROTA_DO_MAIS, label: ROTULO_DO_MAIS, icon: Ellipsis, filhos }] }];
}
