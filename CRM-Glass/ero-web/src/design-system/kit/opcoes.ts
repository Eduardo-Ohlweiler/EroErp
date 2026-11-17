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
 * Até quantos caracteres o maior rótulo cabe em cada largura do `TCombo` (docs/07 §2.1): `situacao` (192 px, ~132 px
 * úteis depois do X e da seta) e `medio` (320 px). O mesmo `ROTULO_MAX` do `medir-campos.mjs`: mudam juntos.
 */
export const ROTULO_MAX_DO_COMBO = { situacao: 18, medio: 36 } as const;

/**
 * Largura automática do `TCombo` sem `width` (dentro de `TRow`), pelo maior rótulo das opções com o `vazio`: até 18
 * caracteres `situacao`; até 36 `medio` (tipos do banco com o " (inativo)" do valor gravado); acima, `metade`.
 * Necessária porque as opções dos tipos vêm do banco: a tela não sabe o tamanho do maior nome.
 */
export function larguraDoCombo(rotuloMax: number): 'situacao' | 'medio' | 'metade' {
  if (rotuloMax <= ROTULO_MAX_DO_COMBO.situacao) return 'situacao';
  return rotuloMax <= ROTULO_MAX_DO_COMBO.medio ? 'medio' : 'metade';
}

/** O rótulo de uma opção inativa já gravada no registro: aparece no combo, mas o combo não a oferece a quem escolhe de novo. */
export const rotuloInativo = (nome: string) => `${nome} (inativo)`;

/**
 * Situação de cadastro, com os valores que o filtro `ativo` da API entende (`true`/`false`).
 * No filtro de lista, com `vazio="Todas"`.
 */
export const SITUACAO_OPCOES: OpcaoSelect[] = [
  { valor: 'true', rotulo: 'Ativo' },
  { valor: 'false', rotulo: 'Inativo' },
];
