/**
 * Regras puras do `TFieldList` (docs/07 §3.2): colunas em uma ou várias linhas e a marca `principal` exclusiva.
 */

/** As colunas de uma linha só (`C[]`) ou de um item em várias linhas (`C[][]`, uma `TRow` por grupo). */
export function linhasDasColunas<C>(colunas: C[] | C[][]): C[][] {
  if (colunas.length === 0) return [[]];
  return Array.isArray(colunas[0]) ? (colunas as C[][]) : [colunas as C[]];
}

const marcada = (linha: unknown, campo: string) => !!(linha as Record<string, unknown> | null | undefined)?.[campo];

/**
 * A linha que o Acrescentar põe no fim. Com `principal`, ela vem marcada quando nenhuma outra está (a 1ª linha da
 * lista já nasce principal) e desmarcada quando já existe uma.
 */
export function linhaParaAcrescentar<L>(nova: L, atuais: readonly L[], principal?: string): L {
  if (!principal) return nova;
  const temPrincipal = atuais.some((l) => marcada(l, principal));
  return { ...nova, [principal]: !temPrincipal } as L;
}

/**
 * Depois de remover a linha `removida`: o índice (na lista que sobrou) que passa a ser a principal, ou `null` quando
 * nada muda. Remover a principal passa a marca para a 1ª que sobrou.
 */
export function principalDepoisDeRemover<L>(linhas: readonly L[], removida: number, principal?: string): number | null {
  if (!principal) return null;
  if (!marcada(linhas[removida], principal)) return null;
  return linhas.length > 1 ? 0 : null;
}

/** Os valores do campo `principal` depois de marcar a linha `escolhida`: só ela fica marcada. */
export function marcarPrincipal(total: number, escolhida: number): boolean[] {
  return Array.from({ length: total }, (_, i) => i === escolhida);
}

/**
 * Os valores de um formulário que só tem a linha `caminho` (`valores.1`, `a.b.0`) com o conteúdo `linha`: o retrato
 * que a linha que está saindo usa enquanto anima (ver `CongelaAoSair` no `TFieldList`). Índice vira posição de array.
 */
export function valoresNoCaminho(caminho: string, linha: unknown): Record<string, unknown> {
  const partes = caminho.split('.');
  const raiz: Record<string, unknown> = {};
  let no: Record<string, unknown> | unknown[] = raiz;
  partes.forEach((parte, i) => {
    const ultima = i === partes.length - 1;
    const filho = ultima ? linha : /^\d+$/.test(partes[i + 1]) ? [] : {};
    if (Array.isArray(no)) no[Number(parte)] = filho;
    else no[parte] = filho;
    no = filho as Record<string, unknown> | unknown[];
  });
  return raiz;
}
