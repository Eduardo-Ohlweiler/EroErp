import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const fmtMoeda = (v: number | string) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const fmtData = (iso: string) => {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

function cabecalho(doc: jsPDF, emitenteNome: string, titulo: string) {
  const largura = doc.internal.pageSize.getWidth()

  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(emitenteNome, largura / 2, 18, { align: "center" })

  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text(titulo, largura / 2, 26, { align: "center" })

  doc.setDrawColor(180, 180, 180)
  doc.line(14, 30, largura - 14, 30)

  return 36
}

export interface DadosComprovantePagamento {
  tipo:               "PAGAR" | "RECEBER"
  numeroParcela:      number | null
  emitenteNome:       string | null
  emitenteDocumento:  string | null
  pessoaNome:         string
  pessoaDocumento:    string | null
  descricao:          string | null
  dataVencimento:     string | null
  valorOriginal:      number
  dataPagamento:      string | null
  valorPago:          number | null
  formaPagamentoNome: string | null
  contaFinanceiraNome: string | null
}

export function gerarPdfComprovantePagamento(dados: DadosComprovantePagamento): string {
  const doc    = new jsPDF({ unit: "mm", format: "a4" })
  const largura = doc.internal.pageSize.getWidth()

  const tituloTipo = dados.tipo === "RECEBER" ? "COMPROVANTE DE RECEBIMENTO" : "COMPROVANTE DE PAGAMENTO"
  const cabNome    = dados.emitenteNome ?? (dados.tipo === "RECEBER" ? dados.pessoaNome : "—")

  let curY = cabecalho(doc, cabNome, tituloTipo)

  // Badge tipo
  const badgeLabel  = dados.tipo === "RECEBER" ? "A Receber" : "A Pagar"
  const badgeColor: [number, number, number] = dados.tipo === "RECEBER" ? [34, 139, 34] : [200, 50, 50]
  doc.setFillColor(...badgeColor)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  const badgeW = 28
  doc.roundedRect(largura - 14 - badgeW, curY - 5, badgeW, 7, 2, 2, "F")
  doc.text(badgeLabel, largura - 14 - badgeW / 2, curY, { align: "center" })
  doc.setTextColor(0, 0, 0)

  // Dados principais
  doc.setFontSize(9)
  const linhas: [string, string][] = [
    ["Emitente:",    dados.emitenteNome ?? "—"],
    ["Pessoa:",      dados.pessoaNome   + (dados.pessoaDocumento ? `  (${dados.pessoaDocumento})` : "")],
    ["Descrição:",   dados.descricao    ?? "—"],
    ["Vencimento:",  dados.dataVencimento  ? fmtData(dados.dataVencimento)  : "—"],
    ["Data pag.:",   dados.dataPagamento   ? fmtData(dados.dataPagamento)   : "—"],
    ["Forma pag.:",  dados.formaPagamentoNome  ?? "—"],
    ["Conta:",       dados.contaFinanceiraNome ?? "—"],
  ]

  curY += 4
  for (const [label, valor] of linhas) {
    doc.setFont("helvetica", "bold")
    doc.text(label, 14, curY)
    doc.setFont("helvetica", "normal")
    doc.text(valor, 48, curY)
    curY += 6
  }

  // Caixa de valor destaque
  curY += 4
  doc.setFillColor(240, 248, 255)
  doc.setDrawColor(50, 100, 160)
  doc.roundedRect(14, curY, largura - 28, 22, 3, 3, "FD")

  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(80, 80, 80)
  doc.text("Valor original:", 20, curY + 7)
  doc.setFont("helvetica", "normal")
  doc.text(fmtMoeda(dados.valorOriginal), largura - 20, curY + 7, { align: "right" })

  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(30, 70, 130)
  doc.text("Valor pago:", 20, curY + 16)
  doc.text(fmtMoeda(dados.valorPago ?? dados.valorOriginal), largura - 20, curY + 16, { align: "right" })
  doc.setTextColor(0, 0, 0)

  // Número da parcela, se houver
  if (dados.numeroParcela != null) {
    curY += 30
    doc.setFontSize(8)
    doc.setFont("helvetica", "italic")
    doc.setTextColor(120, 120, 120)
    doc.text(`Parcela ${dados.numeroParcela}`, largura / 2, curY, { align: "center" })
    doc.setTextColor(0, 0, 0)
  }

  // Linha assinatura
  curY += 20
  doc.setDrawColor(150, 150, 150)
  doc.line(14, curY, largura / 2 - 10, curY)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("Assinatura do responsável", 14, curY + 5)

  return doc.output("datauristring").split(",")[1]
}

export interface DadosFaturamento {
  consultaId:        string | number
  emitenteNome:      string
  emitenteDocumento: string | null
  pessoaNome:        string
  pessoaDocumento:   string | null
  descricao:         string
  data:              string
  parcelas: {
    numeroParcela:  number
    dataVencimento: string
    valor:          string
    pago:           boolean
    dataPagamento:  string
    valorPago:      string
  }[]
  totalGeral: number
}

export function gerarPdfFaturamento(dados: DadosFaturamento): string {
  const doc   = new jsPDF({ unit: "mm", format: "a4" })
  let   curY  = cabecalho(doc, dados.emitenteNome, "FATURAMENTO DE CONSULTA")

  // Bloco de identificação
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("Consulta Nº:", 14, curY)
  doc.setFont("helvetica", "normal")
  doc.text(String(dados.consultaId), 40, curY)

  doc.setFont("helvetica", "bold")
  doc.text("Data:", 80, curY)
  doc.setFont("helvetica", "normal")
  doc.text(fmtData(dados.data), 92, curY)

  curY += 6

  doc.setFont("helvetica", "bold")
  doc.text("Paciente:", 14, curY)
  doc.setFont("helvetica", "normal")
  doc.text(
    dados.pessoaNome + (dados.pessoaDocumento ? `  (${dados.pessoaDocumento})` : ""),
    38,
    curY
  )

  curY += 6

  doc.setFont("helvetica", "bold")
  doc.text("Emitente:", 14, curY)
  doc.setFont("helvetica", "normal")
  doc.text(
    dados.emitenteNome + (dados.emitenteDocumento ? `  (${dados.emitenteDocumento})` : ""),
    38,
    curY
  )

  curY += 6

  if (dados.descricao) {
    doc.setFont("helvetica", "bold")
    doc.text("Descrição:", 14, curY)
    doc.setFont("helvetica", "normal")
    doc.text(dados.descricao, 38, curY)
    curY += 6
  }

  curY += 2

  // Tabela de parcelas
  autoTable(doc, {
    startY: curY,
    head: [["Nº", "Vencimento", "Valor", "Status", "Pagamento", "Valor Pago"]],
    body: dados.parcelas.map(p => [
      String(p.numeroParcela),
      fmtData(p.dataVencimento),
      fmtMoeda(p.valor),
      p.pago ? "Pago" : "Em aberto",
      p.pago ? fmtData(p.dataPagamento) : "—",
      p.pago ? fmtMoeda(p.valorPago)    : "—",
    ]),
    foot: [["", "", "", "", "Total Geral", fmtMoeda(dados.totalGeral)]],
    headStyles:  { fillColor: [50, 100, 160], fontSize: 9 },
    footStyles:  { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold", fontSize: 9 },
    bodyStyles:  { fontSize: 9 },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      2: { halign: "right" },
      5: { halign: "right" },
    },
    margin: { left: 14, right: 14 },
  })

  return doc.output("datauristring").split(",")[1]
}

export interface DadosRecibo {
  consultaId:        string | number
  numeroParcela:     number
  emitenteNome:      string
  emitenteDocumento: string | null
  pessoaNome:        string
  pessoaDocumento:   string | null
  valorPago:         string
  dataPagamento:     string
  descricao:         string
}

export function gerarPdfRecibo(dados: DadosRecibo): string {
  const doc    = new jsPDF({ unit: "mm", format: "a4" })
  const largura = doc.internal.pageSize.getWidth()
  let   curY   = cabecalho(doc, dados.emitenteNome, "RECIBO DE PAGAMENTO")

  // Número do recibo
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text(
    `Recibo — Consulta #${dados.consultaId}  /  Parcela ${dados.numeroParcela}`,
    largura / 2,
    curY,
    { align: "center" }
  )
  curY += 10

  // Bloco de dados
  const linhas = [
    ["Emitente:",      dados.emitenteNome + (dados.emitenteDocumento ? `  (${dados.emitenteDocumento})` : "")],
    ["Paciente:",      dados.pessoaNome   + (dados.pessoaDocumento   ? `  (${dados.pessoaDocumento})`   : "")],
    ["Descrição:",     dados.descricao || `Consulta #${dados.consultaId}`],
    ["Data pag.:",     fmtData(dados.dataPagamento)],
  ]

  doc.setFontSize(10)
  for (const [label, valor] of linhas) {
    doc.setFont("helvetica", "bold")
    doc.text(label, 14, curY)
    doc.setFont("helvetica", "normal")
    doc.text(valor, 48, curY)
    curY += 7
  }

  // Caixa de valor destacado
  curY += 4
  doc.setFillColor(240, 248, 255)
  doc.setDrawColor(50, 100, 160)
  doc.roundedRect(14, curY, largura - 28, 20, 3, 3, "FD")

  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(30, 70, 130)
  doc.text("Valor recebido:", 20, curY + 8)
  doc.setFontSize(16)
  doc.text(fmtMoeda(dados.valorPago), largura - 20, curY + 11, { align: "right" })
  doc.setTextColor(0, 0, 0)

  // Linha de assinatura
  curY += 40
  doc.setDrawColor(120, 120, 120)
  doc.line(14, curY, largura / 2 - 10, curY)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("Assinatura do responsável", 14, curY + 5)

  return doc.output("datauristring").split(",")[1]
}
