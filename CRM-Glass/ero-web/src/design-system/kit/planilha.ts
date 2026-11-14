/**
 * Exportação para planilha (portada do EroErp 2.0, `utils/planilha.ts`).
 *
 * CSV, não XLSX: as listas não têm fórmula nem aba, e o CSV com BOM e ponto e vírgula abre no Excel em português
 * com um duplo clique. Três detalhes decidem se abre certo no Brasil: BOM UTF-8 (sem ele "Situação" vira
 * "SituaÃ§Ã£o"), `;` como separador (a vírgula é o nosso decimal) e decimal com vírgula.
 *
 * O arquivo é montado no navegador, com os dados que já vieram pela API com o token: não há rota de exportação
 * nem link de download que escape da sessão.
 */

const SEPARADOR = ';';

/**
 * Gatilho de fórmula no começo da célula. Antes dele podem vir brancos que a planilha descarta ao abrir: o `\s` do
 * JavaScript (espaço, tab, quebras, NBSP U+00A0, U+1680, U+2000–U+200A, U+2028/9, U+202F, U+205F, U+3000, BOM U+FEFF)
 * e os invisíveis de largura zero que ele não cobre (U+180E, U+200B–U+200D, U+2060). O gatilho é `=` `+` `-` `@`,
 * tab, CR ou LF, ou a mesma letra nas formas de largura total (`＝ ＋ － ＠`) e pequena (`﹦ ﹢ ﹣ ﹫`), que a planilha
 * em alguns idiomas normaliza para a forma comum.
 */
const FORMULA = /^[\s᠎​-‍⁠]*[=+\-@\t\r\n＝＋－＠﹦﹢﹣﹫]/;

/**
 * Negativo pt-BR puro, como os formatadores escrevem: "-3", "-1.234,56", "-12,5%". Só hífen, dígitos, pontos de
 * milhar, vírgula decimal e o "%" final; mais nada (nem espaço, nem letra, nem operador).
 */
const NEGATIVO_PT_BR = /^-(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?%?$/;

/**
 * Escapa uma célula. Além das aspas e do separador, trata a **injeção de fórmula** (OWASP): célula que começa com
 * `=`, `+`, `-`, `@`, tab, CR ou LF (também depois de brancos Unicode, e nas formas de largura total) vira fórmula ao
 * abrir a planilha; o apóstrofo à frente a mantém como texto.
 *
 * A exceção é a **coluna numérica** (`numerica: true`): ali o negativo pt-BR puro ("-1.234,56") segue como número,
 * para a planilha somar a coluna. Só passa o que casa inteiro com `NEGATIVO_PT_BR`: "-1+cmd|x" leva o apóstrofo como
 * qualquer texto. Fora da coluna numérica, "-1" é texto e leva o apóstrofo.
 */
export function celulaCsv(valor: string, numerica = false): string {
  const perigoso = FORMULA.test(valor) && !(numerica && NEGATIVO_PT_BR.test(valor));
  const texto = perigoso ? `'${valor}` : valor;
  return /["\n\r;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export type ColunaExportavel<T> = {
  titulo: string;
  /** o texto da célula, já formatado em pt-BR */
  valor: (linha: T) => string;
  /** alinha à direita na folha impressa; no CSV, deixa o negativo pt-BR seguir como número */
  numerica?: boolean;
  /** não quebra a linha na folha impressa (CPF/CNPJ, data) */
  semQuebra?: boolean;
  /**
   * onde a célula quebra na folha impressa (não muda o CSV). `'email'`: nos pontos naturais, depois do `@` e de cada
   * `.` ("contato@" / "demomarina.test"); o meio de um pedaço só se parte se ele sozinho não couber na coluna.
   */
  quebra?: 'email';
};

/** O conteúdo do CSV (sem o BOM), linhas separadas por CRLF. Função pura. O título é sempre texto. */
export function montarCsv<T>(colunas: ColunaExportavel<T>[], linhas: T[]): string {
  return [
    colunas.map((c) => celulaCsv(c.titulo)).join(SEPARADOR),
    ...linhas.map((l) => colunas.map((c) => celulaCsv(c.valor(l), c.numerica)).join(SEPARADOR)),
  ].join('\r\n');
}

/** Monta o CSV e entrega ao navegador como download. */
export function baixarCsv<T>(nomeArquivo: string, colunas: ColunaExportavel<T>[], linhas: T[]): void {
  const blob = new Blob([`﻿${montarCsv(colunas, linhas)}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${nomeArquivo}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Nome de arquivo com a data de hoje (local), sem acento e sem espaço: "contratantes-2026-11-13". */
export function nomeDeArquivo(base: string, hoje = new Date()): string {
  const data = hoje.toLocaleDateString('sv-SE');
  const limpo = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `${limpo}-${data}`;
}
