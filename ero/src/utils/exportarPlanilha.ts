// Exportação de planilha CSV (pt-BR), espelhando a lógica usada nas Avaliações Pediátricas.
//
// - Todos os campos vão entre aspas — protege a vírgula decimal (ex.: "7,5") de ser
//   interpretada como separador de coluna no Excel/LibreOffice pt-BR.
// - Separador ";", linhas unidas por "\r\n".
// - Conteúdo prefixado com BOM ("﻿") e Blob "text/csv;charset=utf-8".
// - As células já vêm formatadas como string (decimal com vírgula) pelo chamador.

/**
 * Gera e dispara o download de um arquivo CSV pt-BR.
 *
 * @param nomeArquivo Nome do arquivo de saída (ex.: "suplementos_2026-06-20.csv").
 * @param headers     Cabeçalho das colunas.
 * @param linhas      Linhas de dados — cada célula já formatada como string.
 */
export function exportarCsv(nomeArquivo: string, headers: string[], linhas: string[][]): void {
  const aspas = (v: string) => `"${v.replace(/"/g, '""')}"`

  const conteudo = "﻿" + [
    headers.map(aspas).join(";"),
    ...linhas.map(linha => linha.map(aspas).join(";")),
  ].join("\r\n")

  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8" })
  const link = document.createElement("a")
  link.href     = URL.createObjectURL(blob)
  link.download = nomeArquivo
  link.click()
  URL.revokeObjectURL(link.href)
}
