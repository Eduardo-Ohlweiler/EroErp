/** Uma opção de combo fixo. */
export type OpcaoSelect = { valor: string; rotulo: string };

/**
 * As `dica`s das opções de um grupo (TRadio, TCheckBox com opções), sem repetir, na ordem das opções. Elas viram
 * ajuda visível do grupo: o `title` da opção só aparece com mouse, e no toque e no teclado ninguém o vê.
 */
export function dicasDasOpcoes(opcoes: { dica?: string }[]): string[] {
  return [...new Set(opcoes.map((o) => o.dica?.trim()).filter((d): d is string => !!d))];
}

/**
 * Comprimento (em caracteres) do maior rótulo das opções: o `data-rotulo-max` do `TCombo`, que o `medir-campos.mjs`
 * usa para decidir entre `situacao` (cabe até ~18 caracteres) e `medio` (docs/07 §2.1).
 */
export function maiorRotulo(opcoes: OpcaoSelect[]): number {
  return opcoes.reduce((m, o) => Math.max(m, o.rotulo.length), 0);
}

/**
 * Situação de cadastro, com os valores que o filtro `ativo` da API entende (`true`/`false`).
 * No filtro de lista, com `vazio="Todas"`.
 */
export const SITUACAO_OPCOES: OpcaoSelect[] = [
  { valor: 'true', rotulo: 'Ativo' },
  { valor: 'false', rotulo: 'Inativo' },
];
