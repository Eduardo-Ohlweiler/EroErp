/** Uma opção de combo fixo. */
export type OpcaoSelect = { valor: string; rotulo: string };

/**
 * Situação de cadastro, com os valores que o filtro `ativo` da API entende (`true`/`false`).
 * No filtro de lista, com `vazio="Todas"`.
 */
export const SITUACAO_OPCOES: OpcaoSelect[] = [
  { valor: 'true', rotulo: 'Ativo' },
  { valor: 'false', rotulo: 'Inativo' },
];
