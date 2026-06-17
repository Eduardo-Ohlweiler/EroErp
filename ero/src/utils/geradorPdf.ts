import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// ── Formatadores ───────────────────────────────────────────────────────────────

const fmtMoeda = (v: number | string) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const fmtData = (iso: string) => {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

const MESES_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]

function fmtDataPorExtenso(iso: string): string {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return `${parseInt(d, 10)} de ${MESES_PT[parseInt(m, 10) - 1]} de ${y}`
}

// ── Valor por extenso (PT-BR) ──────────────────────────────────────────────────

function inteiroParaExtenso(n: number): string {
  if (n === 0) return "zero"
  const un  = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
                "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis",
                "dezessete", "dezoito", "dezenove"]
  const dez = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"]
  const cen = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos",
               "seiscentos", "setecentos", "oitocentos", "novecentos"]

  if (n < 20)  return un[n]
  if (n < 100) { const d = Math.floor(n / 10), u = n % 10; return u === 0 ? dez[d] : `${dez[d]} e ${un[u]}` }
  if (n === 100) return "cem"
  if (n < 1000)  { const c = Math.floor(n / 100), r = n % 100; return r === 0 ? cen[c] : `${cen[c]} e ${inteiroParaExtenso(r)}` }
  if (n < 1_000_000) {
    const mil = Math.floor(n / 1000), r = n % 1000
    const ms  = mil === 1 ? "mil" : `${inteiroParaExtenso(mil)} mil`
    return r === 0 ? ms : r < 100 ? `${ms} e ${inteiroParaExtenso(r)}` : `${ms} e ${inteiroParaExtenso(r)}`
  }
  if (n < 1_000_000_000) {
    const mi = Math.floor(n / 1_000_000), r = n % 1_000_000
    const ms = mi === 1 ? "um milhão" : `${inteiroParaExtenso(mi)} milhões`
    return r === 0 ? ms : `${ms} e ${inteiroParaExtenso(r)}`
  }
  return String(n)
}

export function numeroPorExtenso(valor: number): string {
  const reais    = Math.floor(valor)
  const centavos = Math.round((valor - reais) * 100)
  const tR = reais === 1 ? `${inteiroParaExtenso(reais)} real` : `${inteiroParaExtenso(reais)} reais`
  if (centavos === 0) { const s = tR; return s.charAt(0).toUpperCase() + s.slice(1) }
  const tC = centavos === 1 ? `${inteiroParaExtenso(centavos)} centavo` : `${inteiroParaExtenso(centavos)} centavos`
  const s  = `${tR} e ${tC}`
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ── Helpers internos ───────────────────────────────────────────────────────────

function blocoTexto(doc: jsPDF, texto: string, x: number, y: number, maxW: number, espaco: number): number {
  const linhas = doc.splitTextToSize(texto, maxW) as string[]
  linhas.forEach((l: string) => { doc.text(l, x, y); y += espaco })
  return y
}

function faixaTopo(doc: jsPDF, emitenteNome: string, subtitulo: string, cor: [number, number, number]): number {
  const L = doc.internal.pageSize.getWidth()
  doc.setFillColor(...cor)
  doc.rect(0, 0, L, 34, "F")

  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text(emitenteNome, L / 2, 14, { align: "center" })

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(subtitulo, L / 2, 23, { align: "center" })

  doc.setTextColor(0, 0, 0)
  return 42
}

// ── RECIBO DE PAGAMENTO ────────────────────────────────────────────────────────

export interface DadosRecibo {
  consultaId:        string | number
  numeroParcela:     number
  emitenteNome:      string
  emitenteDocumento: string | null
  pessoaNome:        string
  pessoaDocumento:   string | null
  valorPago:         string          // string numérica, ex: "1500.00"
  dataPagamento:     string          // YYYY-MM-DD
  descricao:         string
}

export function gerarPdfRecibo(dados: DadosRecibo): string {
  const doc    = new jsPDF({ unit: "mm", format: "a4" })
  const L      = doc.internal.pageSize.getWidth()
  const mg     = 18
  const inner  = L - mg * 2

  // Faixa de topo azul-marinho
  let y = faixaTopo(doc, dados.emitenteNome, "RECIBO DE PAGAMENTO", [30, 65, 120])

  // Referência
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 120, 120)
  doc.text(
    `Ref.: Consulta #${dados.consultaId}  •  Parcela ${dados.numeroParcela}  •  Emitido em ${fmtData(dados.dataPagamento)}`,
    L / 2, y, { align: "center" }
  )
  doc.setTextColor(0, 0, 0)
  y += 10

  // ── Caixa do valor ────────────────────────────────────────────────────────
  const vlr = Number(dados.valorPago)
  doc.setFillColor(240, 247, 255)
  doc.setDrawColor(30, 65, 120)
  doc.setLineWidth(0.4)
  doc.roundedRect(mg, y, inner, 20, 3, 3, "FD")

  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(50, 50, 50)
  doc.text("Valor recebido", mg + 5, y + 8)

  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(30, 65, 120)
  doc.text(fmtMoeda(vlr), L - mg - 5, y + 13, { align: "right" })
  doc.setTextColor(0, 0, 0)

  doc.setFontSize(8)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(100, 100, 100)
  doc.text(numeroPorExtenso(vlr), mg + 5, y + 16)
  doc.setTextColor(0, 0, 0)

  y += 28

  // ── Texto jurídico ────────────────────────────────────────────────────────
  const descr   = dados.descricao || `Consulta #${dados.consultaId}`
  const docPess = dados.pessoaDocumento
    ? `, CPF/CNPJ ${dados.pessoaDocumento},`
    : ","

  const texto =
    `Recebi(emos) de ${dados.pessoaNome}${docPess} a importância de ` +
    `${fmtMoeda(vlr)} (${numeroPorExtenso(vlr)}), referente a ${descr}.`

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  y = blocoTexto(doc, texto, mg, y, inner, 6)

  y += 8

  // ── Linha de dados ────────────────────────────────────────────────────────
  doc.setDrawColor(210, 210, 210)
  doc.setLineWidth(0.3)
  doc.line(mg, y, L - mg, y)
  y += 6

  const dataExt = fmtDataPorExtenso(dados.dataPagamento)

  doc.setFontSize(9)
  const pares: [string, string][] = [
    ["Paciente:",    dados.pessoaNome + (dados.pessoaDocumento ? `  (${dados.pessoaDocumento})` : "")],
    ["Emitente:",   dados.emitenteNome + (dados.emitenteDocumento ? `  (${dados.emitenteDocumento})` : "")],
    ["Data pag.:",  dataExt],
  ]
  for (const [label, valor] of pares) {
    doc.setFont("helvetica", "bold")
    doc.text(label, mg, y)
    doc.setFont("helvetica", "normal")
    doc.text(valor, mg + 24, y)
    y += 6
  }

  return doc.output("datauristring").split(",")[1]
}

// ── COMPROVANTE FINANCEIRO ────────────────────────────────────────────────────

export interface DadosComprovantePagamento {
  tipo:                "PAGAR" | "RECEBER"
  numeroParcela:       number | null
  emitenteNome:        string | null
  emitenteDocumento:   string | null
  pessoaNome:          string
  pessoaDocumento:     string | null
  descricao:           string | null
  dataVencimento:      string | null
  valorOriginal:       number
  dataPagamento:       string | null
  valorPago:           number | null
  formaPagamentoNome:  string | null
  contaFinanceiraNome: string | null
}

export function gerarPdfComprovantePagamento(dados: DadosComprovantePagamento): string {
  const doc   = new jsPDF({ unit: "mm", format: "a4" })
  const L     = doc.internal.pageSize.getWidth()
  const mg    = 18
  const inner = L - mg * 2

  const isReceber  = dados.tipo === "RECEBER"
  const cabNome    = dados.emitenteNome ?? dados.pessoaNome
  const tituloDoc  = isReceber ? "RECIBO DE RECEBIMENTO" : "COMPROVANTE DE PAGAMENTO"
  const corTopo: [number, number, number] = isReceber ? [22, 105, 60] : [140, 40, 40]

  let y = faixaTopo(doc, cabNome, tituloDoc, corTopo)

  // Referência / parcela
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 120, 120)
  const refTexto = [
    dados.numeroParcela ? `Parcela ${dados.numeroParcela}` : null,
    dados.dataPagamento ? `Pago em ${fmtData(dados.dataPagamento)}` : null,
  ].filter(Boolean).join("  •  ")
  if (refTexto) doc.text(refTexto, L / 2, y, { align: "center" })
  doc.setTextColor(0, 0, 0)
  y += 10

  // ── Caixa do valor ────────────────────────────────────────────────────────
  const vlrPago = dados.valorPago ?? dados.valorOriginal

  doc.setFillColor(245, 250, 245)
  doc.setDrawColor(...corTopo)
  doc.setLineWidth(0.4)
  doc.roundedRect(mg, y, inner, 20, 3, 3, "FD")

  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(50, 50, 50)
  doc.text(isReceber ? "Valor recebido" : "Valor pago", mg + 5, y + 8)

  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...corTopo)
  doc.text(fmtMoeda(vlrPago), L - mg - 5, y + 13, { align: "right" })
  doc.setTextColor(0, 0, 0)

  doc.setFontSize(8)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(100, 100, 100)
  doc.text(numeroPorExtenso(vlrPago), mg + 5, y + 16)
  doc.setTextColor(0, 0, 0)

  y += 28

  // ── Texto jurídico ────────────────────────────────────────────────────────
  const descr    = dados.descricao || "serviço/produto conforme acordado"
  const docPess  = dados.pessoaDocumento ? `, CPF/CNPJ ${dados.pessoaDocumento},` : ","

  let textoJur: string
  if (isReceber) {
    textoJur =
      `Recebi(emos) de ${dados.pessoaNome}${docPess} a importância de ` +
      `${fmtMoeda(vlrPago)} (${numeroPorExtenso(vlrPago)}), referente a ${descr}.`
  } else {
    const docEmit = dados.emitenteDocumento ? `, CPF/CNPJ ${dados.emitenteDocumento},` : ","
    textoJur =
      `${dados.emitenteNome ?? "O emitente"}${docEmit} declara ter efetuado o pagamento a ` +
      `${dados.pessoaNome}${docPess} no valor de ` +
      `${fmtMoeda(vlrPago)} (${numeroPorExtenso(vlrPago)}), referente a ${descr}.`
  }

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  y = blocoTexto(doc, textoJur, mg, y, inner, 6)

  y += 8

  // ── Dados complementares ──────────────────────────────────────────────────
  doc.setDrawColor(210, 210, 210)
  doc.setLineWidth(0.3)
  doc.line(mg, y, L - mg, y)
  y += 6

  const dados2: [string, string][] = [
    ["Emitente:",  dados.emitenteNome ?? "—"],
    ["Pessoa:",    dados.pessoaNome + (dados.pessoaDocumento ? `  (${dados.pessoaDocumento})` : "")],
  ]
  if (dados.dataVencimento)      dados2.push(["Vencimento:",  fmtData(dados.dataVencimento)])
  if (dados.dataPagamento)       dados2.push(["Data pag.:",   fmtDataPorExtenso(dados.dataPagamento)])
  if (dados.formaPagamentoNome)  dados2.push(["Forma pag.:",  dados.formaPagamentoNome])
  if (dados.contaFinanceiraNome) dados2.push(["Conta:",       dados.contaFinanceiraNome])
  if (dados.valorOriginal !== vlrPago)
    dados2.push(["Vl. original:", fmtMoeda(dados.valorOriginal)])

  doc.setFontSize(9)
  for (const [label, valor] of dados2) {
    doc.setFont("helvetica", "bold")
    doc.text(label, mg, y)
    doc.setFont("helvetica", "normal")
    doc.text(valor, mg + 26, y)
    y += 5.5
  }

  return doc.output("datauristring").split(",")[1]
}

// ── FATURAMENTO DE CONSULTA ───────────────────────────────────────────────────

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
  const L     = doc.internal.pageSize.getWidth()
  const mg    = 18
  const inner = L - mg * 2

  let y = faixaTopo(doc, dados.emitenteNome, "FATURAMENTO DE CONSULTA", [30, 65, 120])

  // Referência
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 120, 120)
  doc.text(`Consulta Nº ${dados.consultaId}  •  Emitido em ${fmtData(dados.data)}`, L / 2, y, { align: "center" })
  doc.setTextColor(0, 0, 0)
  y += 10

  // Identificação
  doc.setFontSize(9)
  const blocos: [string, string][] = [
    ["Emitente:", dados.emitenteNome + (dados.emitenteDocumento ? `  (${dados.emitenteDocumento})` : "")],
    ["Paciente:", dados.pessoaNome   + (dados.pessoaDocumento   ? `  (${dados.pessoaDocumento})`   : "")],
  ]
  if (dados.descricao) blocos.push(["Descrição:", dados.descricao])

  for (const [label, valor] of blocos) {
    doc.setFont("helvetica", "bold")
    doc.text(label, mg, y)
    doc.setFont("helvetica", "normal")
    y = blocoTexto(doc, valor, mg + 22, y, inner - 22, 5)
    y += 2
  }

  y += 4

  // Tabela de parcelas
  autoTable(doc, {
    startY: y,
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
    headStyles:   { fillColor: [30, 65, 120], fontSize: 9 },
    footStyles:   { fillColor: [235, 240, 255], textColor: [0, 0, 0], fontStyle: "bold", fontSize: 9 },
    bodyStyles:   { fontSize: 9 },
    columnStyles: { 0: { halign: "center", cellWidth: 12 }, 2: { halign: "right" }, 5: { halign: "right" } },
    margin: { left: mg, right: mg },
  })

  const afterTable: number = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 40

  doc.setFontSize(8)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(100, 100, 100)
  doc.text(`Total por extenso: ${numeroPorExtenso(dados.totalGeral)}`, mg, afterTable + 6)
  doc.setTextColor(0, 0, 0)

  return doc.output("datauristring").split(",")[1]
}

// ── CONTA FINANCEIRA (PAGAR / RECEBER) ────────────────────────────────────────

export interface DadosContaFinanceira {
  tipo:              "PAGAR" | "RECEBER"
  contaId:           string | number
  emitenteNome:      string | null
  emitenteDocumento: string | null
  pessoaNome:        string
  pessoaDocumento:   string | null
  descricao:         string | null
  data:              string
  parcelas: {
    numeroParcela:  number
    dataVencimento: string
    valor:          number
    status:         string
    dataPagamento:  string | null
    valorPago:      number | null
  }[]
  totalGeral: number
}

export function gerarPdfContaFinanceira(dados: DadosContaFinanceira): string {
  const doc   = new jsPDF({ unit: "mm", format: "a4" })
  const L     = doc.internal.pageSize.getWidth()
  const mg    = 18
  const inner = L - mg * 2

  const isReceber = dados.tipo === "RECEBER"
  const titulo    = isReceber ? "CONTA A RECEBER" : "CONTA A PAGAR"
  const cabNome   = dados.emitenteNome ?? dados.pessoaNome
  const cor: [number, number, number] = isReceber ? [22, 105, 60] : [140, 40, 40]

  let y = faixaTopo(doc, cabNome, titulo, cor)

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 120, 120)
  doc.text(`Ref. Nº ${dados.contaId}  •  Emitido em ${fmtData(dados.data)}`, L / 2, y, { align: "center" })
  doc.setTextColor(0, 0, 0)
  y += 10

  doc.setFontSize(9)
  const blocos: [string, string][] = []
  if (dados.emitenteNome) blocos.push(["Emitente:", dados.emitenteNome + (dados.emitenteDocumento ? `  (${dados.emitenteDocumento})` : "")])
  blocos.push(["Pessoa:", dados.pessoaNome + (dados.pessoaDocumento ? `  (${dados.pessoaDocumento})` : "")])
  if (dados.descricao) blocos.push(["Descrição:", dados.descricao])

  for (const [label, valor] of blocos) {
    doc.setFont("helvetica", "bold")
    doc.text(label, mg, y)
    doc.setFont("helvetica", "normal")
    y = blocoTexto(doc, valor, mg + 22, y, inner - 22, 5)
    y += 2
  }

  y += 4

  const statusLabel = (s: string) => {
    if (s === "PAGO")              return "Pago"
    if (s === "PARCIALMENTE_PAGO") return "Parc. Pago"
    if (s === "CANCELADO")         return "Cancelado"
    return "Em aberto"
  }

  autoTable(doc, {
    startY: y,
    head: [["Nº", "Vencimento", "Valor", "Status", "Data Pag.", "Valor Pago"]],
    body: dados.parcelas.map(p => [
      String(p.numeroParcela),
      fmtData(p.dataVencimento),
      fmtMoeda(p.valor),
      statusLabel(p.status),
      p.dataPagamento ? fmtData(p.dataPagamento) : "—",
      p.valorPago     ? fmtMoeda(p.valorPago)    : "—",
    ]),
    foot: [["", "", "", "", "Total", fmtMoeda(dados.totalGeral)]],
    headStyles:   { fillColor: cor, fontSize: 9 },
    footStyles:   { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: "bold", fontSize: 9 },
    bodyStyles:   { fontSize: 9 },
    columnStyles: { 0: { halign: "center", cellWidth: 12 }, 2: { halign: "right" }, 5: { halign: "right" } },
    margin: { left: mg, right: mg },
  })

  const afterTableCF: number = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 40

  doc.setFontSize(8)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(100, 100, 100)
  doc.text(`Total por extenso: ${numeroPorExtenso(dados.totalGeral)}`, mg, afterTableCF + 6)
  doc.setTextColor(0, 0, 0)

  return doc.output("datauristring").split(",")[1]
}

// ── FICHA DE ANAMNESE ─────────────────────────────────────────────────────────

export interface DadosFichaAnamnese {
  fichaId:           string | number
  emitenteNome:      string
  finalidadeLabel:   string       // ex: "Estética"
  templateNome:      string
  pessoaNome:        string
  pessoaDocumento:   string | null
  dataPreenchimento: string       // YYYY-MM-DD
  observacoes:       string | null
  secoes: {
    nome: string
    campos: {
      rotulo: string
      tipo:   string
      valor:  string | null
    }[]
  }[]
}

export function gerarPdfFichaAnamnese(dados: DadosFichaAnamnese): string {
  const doc   = new jsPDF({ unit: "mm", format: "a4" })
  const L     = doc.internal.pageSize.getWidth()
  const mg    = 18
  const inner = L - mg * 2

  let y = faixaTopo(doc, dados.emitenteNome, `FICHA DE ANAMNESE — ${dados.finalidadeLabel.toUpperCase()}`, [44, 62, 80])

  // Referência
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 120, 120)
  doc.text(`Ficha Nº ${dados.fichaId}  •  ${dados.templateNome}  •  Emitido em ${fmtData(dados.dataPreenchimento)}`, L / 2, y, { align: "center" })
  doc.setTextColor(0, 0, 0)
  y += 10

  // Dados do paciente
  const pares: [string, string][] = [
    ["Paciente:", dados.pessoaNome + (dados.pessoaDocumento ? `  (${dados.pessoaDocumento})` : "")],
    ["Data:",     fmtData(dados.dataPreenchimento)],
  ]
  doc.setFontSize(9)
  for (const [label, valor] of pares) {
    doc.setFont("helvetica", "bold")
    doc.text(label, mg, y)
    doc.setFont("helvetica", "normal")
    doc.text(valor, mg + 20, y)
    y += 5.5
  }
  y += 4

  // Seções e campos
  for (const secao of dados.secoes) {
    if (y > 270) { doc.addPage(); y = 20 }

    // Título da seção
    doc.setFillColor(44, 62, 80)
    doc.rect(mg, y - 3, inner, 7, "F")
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 255, 255)
    doc.text(secao.nome, mg + 2, y + 1.5)
    doc.setTextColor(0, 0, 0)
    y += 9

    // Campos da seção
    for (const campo of secao.campos) {
      if (y > 275) { doc.addPage(); y = 20 }

      const valorText = campo.valor
        ? (campo.tipo === "CHECKBOX" ? (campo.valor === "true" ? "Sim" : "Não") : campo.valor)
        : "—"

      doc.setFontSize(8.5)
      doc.setFont("helvetica", "bold")
      doc.text(campo.rotulo + ":", mg + 2, y)

      doc.setFont("helvetica", "normal")
      const linhas = doc.splitTextToSize(valorText, inner - 55) as string[]
      linhas.forEach((l, i) => {
        if (i > 0 && y > 275) { doc.addPage(); y = 20 }
        doc.text(l, mg + 55, y)
        if (i < linhas.length - 1) y += 5
      })
      y += 6
    }
    y += 3
  }

  // Observações
  if (dados.observacoes) {
    if (y > 260) { doc.addPage(); y = 20 }
    doc.setFillColor(240, 240, 240)
    doc.rect(mg, y - 3, inner, 7, "F")
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("OBSERVAÇÕES", mg + 2, y + 1.5)
    y += 9

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    y = blocoTexto(doc, dados.observacoes, mg + 2, y, inner - 4, 5)
    y += 4
  }

  return doc.output("datauristring").split(",")[1]
}

// ── PLANO ALIMENTAR ───────────────────────────────────────────────────────────

export interface DadosPlanoAlimentar {
  nome:          string
  pessoaNome:    string
  emitenteNome?: string
  dataInicio:    string
  dataFim?:      string
  observacao?:   string
  itens: {
    diaSemana:    string
    horario:      string
    refeicaoNome: string
    quantidade?:  string
    peso?:        number
    observacao?:  string
  }[]
}

export function gerarPdfPlanoAlimentar(dados: DadosPlanoAlimentar): string {
  const doc   = new jsPDF({ unit: "mm", format: "a4" })
  const L     = doc.internal.pageSize.getWidth()
  const mg    = 18
  const inner = L - mg * 2

  const COR_TOPO: [number, number, number] = [34, 100, 60]
  const COR_DIA:  [number, number, number] = [34, 100, 60]

  const DIAS_ORDEM = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO", "DOMINGO"]
  const DIA_LABELS: Record<string, string> = {
    SEGUNDA: "Segunda-feira",
    TERCA:   "Terça-feira",
    QUARTA:  "Quarta-feira",
    QUINTA:  "Quinta-feira",
    SEXTA:   "Sexta-feira",
    SABADO:  "Sábado",
    DOMINGO: "Domingo",
  }

  // ── Faixa de topo ────────────────────────────────────────────────────────────
  let y = faixaTopo(doc, dados.emitenteNome ?? dados.pessoaNome, "PLANO ALIMENTAR", COR_TOPO)

  // ── Bloco de informações ──────────────────────────────────────────────────────
  const periodo = dados.dataFim
    ? `${dados.dataInicio} a ${dados.dataFim}`
    : `A partir de ${dados.dataInicio}`

  const infos: [string, string][] = [
    ["Paciente:",  dados.pessoaNome],
    ["Plano:",     dados.nome],
    ["Período:",   periodo],
  ]
  if (dados.emitenteNome) infos.push(["Responsável:", dados.emitenteNome])

  doc.setFontSize(9)
  for (const [label, valor] of infos) {
    doc.setFont("helvetica", "bold")
    doc.text(label, mg, y)
    doc.setFont("helvetica", "normal")
    doc.text(valor, mg + 26, y)
    y += 5.5
  }
  y += 5

  // ── Itens agrupados por dia ───────────────────────────────────────────────────
  for (const dia of DIAS_ORDEM) {
    const itensDia = dados.itens
      .filter(i => i.diaSemana === dia)
      .sort((a, b) => a.horario.localeCompare(b.horario))

    if (itensDia.length === 0) continue

    if (y > 255) { doc.addPage(); y = 20 }

    // Cabeçalho do dia
    doc.setFillColor(...COR_DIA)
    doc.rect(mg, y - 3, inner, 7, "F")
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 255, 255)
    doc.text(DIA_LABELS[dia], mg + 2, y + 1.5)
    doc.setTextColor(0, 0, 0)
    y += 10

    // Tabela de itens do dia
    autoTable(doc, {
      startY: y,
      head:   [["Horário", "Refeição", "Quantidade", "Peso", "Observação"]],
      body:   itensDia.map(item => [
        item.horario,
        item.refeicaoNome,
        item.quantidade ?? "—",
        item.peso != null ? `${item.peso}g` : "—",
        item.observacao ?? "",
      ]),
      headStyles:   { fillColor: [60, 130, 90], fontSize: 8, textColor: 255 },
      bodyStyles:   { fontSize: 8 },
      columnStyles: {
        0: { halign: "center", cellWidth: 20 },
        2: { cellWidth: 38 },
        3: { halign: "center", cellWidth: 20 },
      },
      margin: { left: mg, right: mg },
      theme:  "striped",
    })

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 20
    y += 6
  }

  // ── Observações gerais ────────────────────────────────────────────────────────
  if (dados.observacao) {
    if (y > 260) { doc.addPage(); y = 20 }

    doc.setFillColor(240, 240, 240)
    doc.rect(mg, y - 3, inner, 7, "F")
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("OBSERVAÇÕES GERAIS", mg + 2, y + 1.5)
    y += 9

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    y = blocoTexto(doc, dados.observacao, mg + 2, y, inner - 4, 5)
    y += 4
  }

  return doc.output("datauristring").split(",")[1]
}

// ── PLANO DE TREINO ────────────────────────────────────────────────────────────

export interface DadosPlanoTreino {
  nome:          string
  pessoaNome:    string
  emitenteNome?: string
  dataInicio:    string
  dataFim?:      string
  observacao?:   string
  itens: {
    diaSemana:     string
    ordem:         number
    exercicioNome: string
    series:        number | null
    repeticoes:    string | null
    tipoExecucao:  string | null
    pausaSegundos: number | null
    observacao?:   string
  }[]
}

const TIPO_EXECUCAO_LABEL_PDF: Record<string, string> = {
  NORMAL:            "Normal",
  DROPSET:           "Drop Set",
  DROPSET_INVERTIDO: "Drop Set Invertido",
}

function formatarPausaGym(segundos: number | null): string {
  if (segundos == null) return "—"
  if (segundos < 60) return `${segundos}s`
  const min = Math.floor(segundos / 60)
  const sec = segundos % 60
  return sec === 0 ? `${min}min` : `${min}min ${sec}s`
}

export function gerarPdfPlanoTreino(dados: DadosPlanoTreino): string {
  const doc   = new jsPDF({ unit: "mm", format: "a4" })
  const L     = doc.internal.pageSize.getWidth()
  const mg    = 18
  const inner = L - mg * 2

  const COR_TOPO: [number, number, number] = [40, 60, 120]
  const COR_DIA:  [number, number, number] = [40, 60, 120]

  const DIAS_ORDEM = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO", "DOMINGO"]
  const DIA_LABELS: Record<string, string> = {
    SEGUNDA: "Segunda-feira",
    TERCA:   "Terça-feira",
    QUARTA:  "Quarta-feira",
    QUINTA:  "Quinta-feira",
    SEXTA:   "Sexta-feira",
    SABADO:  "Sábado",
    DOMINGO: "Domingo",
  }

  let y = faixaTopo(doc, dados.emitenteNome ?? dados.pessoaNome, "PLANO DE TREINO", COR_TOPO)

  const periodo = dados.dataFim
    ? `${dados.dataInicio} a ${dados.dataFim}`
    : `A partir de ${dados.dataInicio}`

  const infos: [string, string][] = [
    ["Aluno:",    dados.pessoaNome],
    ["Plano:",    dados.nome],
    ["Período:",  periodo],
  ]
  if (dados.emitenteNome) infos.push(["Personal:", dados.emitenteNome])

  doc.setFontSize(9)
  for (const [label, valor] of infos) {
    doc.setFont("helvetica", "bold")
    doc.text(label, mg, y)
    doc.setFont("helvetica", "normal")
    doc.text(valor, mg + 26, y)
    y += 5.5
  }
  y += 5

  for (const dia of DIAS_ORDEM) {
    const itensDia = dados.itens
      .filter(i => i.diaSemana === dia)
      .sort((a, b) => a.ordem - b.ordem)

    if (itensDia.length === 0) continue

    if (y > 255) { doc.addPage(); y = 20 }

    doc.setFillColor(...COR_DIA)
    doc.rect(mg, y - 3, inner, 7, "F")
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 255, 255)
    doc.text(DIA_LABELS[dia], mg + 2, y + 1.5)
    doc.setTextColor(0, 0, 0)
    y += 10

    autoTable(doc, {
      startY: y,
      head:   [["Exercício", "Séries", "Reps", "Execução", "Pausa", "Observação"]],
      body:   itensDia.map(item => [
        item.exercicioNome,
        item.series != null ? String(item.series) : "—",
        item.repeticoes ?? "—",
        item.tipoExecucao ? (TIPO_EXECUCAO_LABEL_PDF[item.tipoExecucao] ?? item.tipoExecucao) : "—",
        formatarPausaGym(item.pausaSegundos),
        item.observacao ?? "",
      ]),
      headStyles:   { fillColor: [60, 85, 155], fontSize: 8, textColor: 255 },
      bodyStyles:   { fontSize: 8 },
      columnStyles: {
        1: { halign: "center", cellWidth: 18 },
        2: { halign: "center", cellWidth: 18 },
        3: { cellWidth: 38 },
        4: { halign: "center", cellWidth: 22 },
      },
      margin: { left: mg, right: mg },
      theme:  "striped",
    })

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 20
    y += 6
  }

  if (dados.observacao) {
    if (y > 260) { doc.addPage(); y = 20 }

    doc.setFillColor(240, 240, 240)
    doc.rect(mg, y - 3, inner, 7, "F")
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("OBSERVAÇÕES GERAIS", mg + 2, y + 1.5)
    y += 9

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    y = blocoTexto(doc, dados.observacao, mg + 2, y, inner - 4, 5)
    y += 4
  }

  return doc.output("datauristring").split(",")[1]
}

// ── AVALIAÇÃO FÍSICA ───────────────────────────────────────────────────────────

export interface DadosAvaliacaoFisica {
  pessoaNome:    string
  usuarioNome:   string | null
  dataAvaliacao: string
  peso:          number
  altura:        number
  imc:           number | null
  idade:         number
  sexo:          string
  objetivo:      string
  metaDescricao: string | null
  pesoAlvo:      number | null
  observacoes:   string | null
  medidas:       { label: string; valorCm: number }[]
  composicao: {
    percentualGordura:      number | null
    massaMuscularKg:        number | null
    massaGordaKg:           number | null
    massaOsseaKg:           number | null
    aguaCorporalPercentual: number | null
    metabolismoBasal:       number | null
    idadeMetabolica:        number | null
  } | null
}

export function gerarPdfAvaliacaoFisica(dados: DadosAvaliacaoFisica): string {
  const doc   = new jsPDF({ unit: "mm", format: "a4" })
  const L     = doc.internal.pageSize.getWidth()
  const mg    = 18
  const inner = L - mg * 2
  const COR: [number, number, number] = [22, 115, 105]

  let y = faixaTopo(doc, dados.pessoaNome, "AVALIAÇÃO FÍSICA", COR)

  doc.setFontSize(9)
  const pares: [string, string][] = [
    ["Data da Avaliação:", fmtData(dados.dataAvaliacao)],
    ["Sexo:",              dados.sexo === "M" ? "Masculino" : "Feminino"],
    ["Idade:",             `${dados.idade} anos`],
  ]
  if (dados.usuarioNome) pares.push(["Profissional:", dados.usuarioNome])

  for (const [label, valor] of pares) {
    doc.setFont("helvetica", "bold")
    doc.text(label, mg, y)
    doc.setFont("helvetica", "normal")
    doc.text(valor, mg + 36, y)
    y += 5.5
  }
  y += 5

  const h      = dados.altura / 100
  const imcVal = dados.imc ? dados.imc.toFixed(1) : (dados.peso / (h * h)).toFixed(1)

  const metrics: { label: string; valor: string }[] = [
    { label: "Peso",   valor: `${dados.peso.toFixed(1)} kg` },
    { label: "Altura", valor: `${dados.altura} cm` },
    { label: "IMC",    valor: imcVal },
  ]
  if (dados.pesoAlvo != null) metrics.push({ label: "Peso Alvo", valor: `${dados.pesoAlvo.toFixed(1)} kg` })

  doc.setFillColor(235, 250, 248)
  doc.setDrawColor(...COR)
  doc.setLineWidth(0.4)
  doc.roundedRect(mg, y, inner, 20, 3, 3, "FD")

  const cellW = inner / metrics.length
  metrics.forEach((m, i) => {
    const cx = mg + i * cellW + cellW / 2
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(80, 80, 80)
    doc.text(m.label, cx, y + 7, { align: "center" })
    doc.setFontSize(13)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...COR)
    doc.text(m.valor, cx, y + 15, { align: "center" })
  })
  doc.setTextColor(0, 0, 0)
  y += 27

  if (dados.objetivo) {
    doc.setFillColor(44, 62, 80)
    doc.rect(mg, y - 3, inner, 7, "F")
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 255, 255)
    doc.text("OBJETIVO E META", mg + 2, y + 1.5)
    doc.setTextColor(0, 0, 0)
    y += 9

    const objPares: [string, string][] = [["Objetivo:", dados.objetivo]]
    if (dados.metaDescricao) objPares.push(["Meta:", dados.metaDescricao])

    doc.setFontSize(9)
    for (const [label, valor] of objPares) {
      doc.setFont("helvetica", "bold")
      doc.text(label, mg + 2, y)
      doc.setFont("helvetica", "normal")
      y = blocoTexto(doc, valor, mg + 22, y, inner - 24, 5)
      y += 2
    }
    y += 4
  }

  if (dados.medidas.length > 0) {
    if (y > 240) { doc.addPage(); y = 20 }

    const rows: string[][] = []
    for (let i = 0; i < dados.medidas.length; i += 2) {
      const a = dados.medidas[i]
      const b = dados.medidas[i + 1]
      rows.push([a.label, a.valorCm.toFixed(1), b ? b.label : "", b ? b.valorCm.toFixed(1) : ""])
    }

    autoTable(doc, {
      startY:       y,
      head:         [["Medida Corporal", "cm", "Medida Corporal", "cm"]],
      body:         rows,
      headStyles:   { fillColor: COR, fontSize: 9 },
      bodyStyles:   { fontSize: 9 },
      columnStyles: { 1: { halign: "right", cellWidth: 22 }, 3: { halign: "right", cellWidth: 22 } },
      margin:       { left: mg, right: mg },
    })

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 30
    y += 5
  }

  if (dados.composicao) {
    const c = dados.composicao
    const compRows: [string, string][] = []
    if (c.percentualGordura      != null) compRows.push(["% Gordura Corporal",  `${c.percentualGordura.toFixed(1)}%`])
    if (c.massaMuscularKg        != null) compRows.push(["Massa Muscular",       `${c.massaMuscularKg.toFixed(1)} kg`])
    if (c.massaGordaKg           != null) compRows.push(["Massa Gorda",          `${c.massaGordaKg.toFixed(1)} kg`])
    if (c.massaOsseaKg           != null) compRows.push(["Massa Óssea",          `${c.massaOsseaKg.toFixed(1)} kg`])
    if (c.aguaCorporalPercentual != null) compRows.push(["Água Corporal",        `${c.aguaCorporalPercentual.toFixed(1)}%`])
    if (c.metabolismoBasal       != null) compRows.push(["Metabolismo Basal",    `${c.metabolismoBasal} kcal`])
    if (c.idadeMetabolica        != null) compRows.push(["Idade Metabólica",     `${c.idadeMetabolica} anos`])

    if (compRows.length > 0) {
      if (y > 240) { doc.addPage(); y = 20 }

      autoTable(doc, {
        startY:       y,
        head:         [["Composição Corporal (Bioimpedância)", "Valor"]],
        body:         compRows,
        headStyles:   { fillColor: [100, 60, 150] as [number,number,number], fontSize: 9 },
        bodyStyles:   { fontSize: 9 },
        columnStyles: { 1: { halign: "right" } },
        margin:       { left: mg, right: mg },
      })

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 30
      y += 5
    }
  }

  if (dados.observacoes) {
    if (y > 260) { doc.addPage(); y = 20 }

    doc.setFillColor(245, 245, 245)
    doc.rect(mg, y - 3, inner, 7, "F")
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("OBSERVAÇÕES", mg + 2, y + 1.5)
    y += 9

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    blocoTexto(doc, dados.observacoes, mg + 2, y, inner - 4, 5)
  }

  return doc.output("datauristring").split(",")[1]
}

// ── LISTAGEM DE AVALIAÇÕES PEDIÁTRICAS ────────────────────────────────────────

export interface DadosListaAvaliacoesPediatricas {
  dataEmissao: string
  filtros:     string
  linhas: {
    dataAvaliacao:   string
    pessoaNome:      string
    idadeMeses:      number | null
    peso:            number | null
    imc:             number | null
    classifImcIdade: string | null
    formulaNome:     string | null
  }[]
}

export function gerarPdfAvaliacoesPediatricas(dados: DadosListaAvaliacoesPediatricas): string {
  const doc   = new jsPDF({ unit: "mm", format: "a4" })
  const L     = doc.internal.pageSize.getWidth()
  const mg    = 18
  const inner = L - mg * 2
  const COR: [number, number, number] = [22, 130, 130]

  const fmt = (v: number | null, dec = 1) =>
    v == null || Number.isNaN(v) ? "—" : v.toFixed(dec)

  let y = faixaTopo(doc, "AVALIAÇÕES PEDIÁTRICAS", `Emitido em ${fmtData(dados.dataEmissao)}`, COR)

  // Resumo dos filtros aplicados
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 120, 120)
  y = blocoTexto(doc, `Filtros: ${dados.filtros}`, mg, y, inner, 5)
  doc.setTextColor(0, 0, 0)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [["Data", "Paciente", "Idade (m)", "Peso", "IMC", "Classif. IMC", "Fórmula"]],
    body: dados.linhas.map(l => [
      fmtData(l.dataAvaliacao),
      l.pessoaNome,
      l.idadeMeses != null ? String(l.idadeMeses) : "—",
      fmt(l.peso, 1),
      fmt(l.imc, 1),
      l.classifImcIdade ?? "—",
      l.formulaNome ?? "—",
    ]),
    headStyles:   { fillColor: COR, fontSize: 8 },
    bodyStyles:   { fontSize: 8 },
    columnStyles: {
      2: { halign: "center" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    margin: { left: mg, right: mg },
  })

  return doc.output("datauristring").split(",")[1]
}

// ── RELATÓRIO NUTRICIONAL PEDIÁTRICO ──────────────────────────────────────────

export interface DadosRelatorioPediatrico {
  dataEmissao:          string          // YYYY-MM-DD
  pacienteNome:         string | null   // opcional (Calculadora não tem paciente)
  usuarioNome:          string | null
  sexo:                 string          // "M" | "F"
  idadeMeses:           number | null
  pesoKg:               number | null
  estaturaCm:           number | null
  imc:                  number | null
  classifPesoIdade:     string | null
  classifEstaturaIdade: string | null
  classifImcIdade:      string | null
  vet:                  number | null
  proteinaNecessidade:  number | null
  formulaNome:          string | null
  volumeMl:             number | null
  frequenciaHoras:      number | null
  vezesDia:             number | null
  volumeTotal:          number | null
  caloriasTotais:       number | null
  proteinaTotal:        number | null
  percCalorico:         number | null
  percProteico:         number | null
  observacoes?:         string | null
}

export function gerarPdfPediatria(dados: DadosRelatorioPediatrico): string {
  const doc   = new jsPDF({ unit: "mm", format: "a4" })
  const L     = doc.internal.pageSize.getWidth()
  const mg    = 18
  const inner = L - mg * 2
  const COR: [number, number, number] = [22, 130, 130]

  const fmt = (v: number | null, dec = 1, suf = "") =>
    v == null || Number.isNaN(v) ? "—" : `${v.toFixed(dec)}${suf}`

  let y = faixaTopo(doc, "RELATÓRIO NUTRICIONAL PEDIÁTRICO",
    dados.pacienteNome ?? "Cálculo rápido", COR)

  // Referência
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 120, 120)
  const ref = [
    `Emitido em ${fmtData(dados.dataEmissao)}`,
    dados.usuarioNome ? `Profissional: ${dados.usuarioNome}` : null,
  ].filter(Boolean).join("  •  ")
  doc.text(ref, L / 2, y, { align: "center" })
  doc.setTextColor(0, 0, 0)
  y += 10

  // ── Caixa de métricas (Sexo / Idade / Peso / Estatura / IMC) ────────────────
  const metrics: { label: string; valor: string }[] = [
    { label: "Sexo",     valor: dados.sexo === "M" ? "Masculino" : "Feminino" },
    { label: "Idade",    valor: dados.idadeMeses != null ? `${dados.idadeMeses} m` : "—" },
    { label: "Peso",     valor: fmt(dados.pesoKg, 2, " kg") },
    { label: "Estatura", valor: fmt(dados.estaturaCm, 1, " cm") },
    { label: "IMC",      valor: fmt(dados.imc, 1) },
  ]

  doc.setFillColor(235, 248, 248)
  doc.setDrawColor(...COR)
  doc.setLineWidth(0.4)
  doc.roundedRect(mg, y, inner, 20, 3, 3, "FD")

  const cellW = inner / metrics.length
  metrics.forEach((m, i) => {
    const cx = mg + i * cellW + cellW / 2
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(80, 80, 80)
    doc.text(m.label, cx, y + 7, { align: "center" })
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...COR)
    doc.text(m.valor, cx, y + 15, { align: "center" })
  })
  doc.setTextColor(0, 0, 0)
  y += 27

  // ── Estado Nutricional (OMS) ────────────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    head: [["Estado Nutricional (OMS)", "Classificação"]],
    body: [
      ["Peso para a idade",     dados.classifPesoIdade     ?? "—"],
      ["Estatura para a idade", dados.classifEstaturaIdade ?? "—"],
      ["IMC para a idade",      dados.classifImcIdade      ?? "—"],
    ],
    headStyles:   { fillColor: COR, fontSize: 9 },
    bodyStyles:   { fontSize: 9 },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    margin:       { left: mg, right: mg },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 30
  y += 5

  // ── Necessidades Nutricionais (DRIs) ────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    head: [["Necessidades Nutricionais (DRIs)", "Valor"]],
    body: [
      ["VET — Valor Energético Total", fmt(dados.vet, 0, " kcal/dia")],
      ["Proteína",                     fmt(dados.proteinaNecessidade, 1, " g/dia")],
    ],
    headStyles:   { fillColor: COR, fontSize: 9 },
    bodyStyles:   { fontSize: 9 },
    columnStyles: { 1: { halign: "right" } },
    margin:       { left: mg, right: mg },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 30
  y += 5

  // ── Dieta Prescrita (se houver fórmula) ─────────────────────────────────────
  if (dados.formulaNome) {
    if (y > 230) { doc.addPage(); y = 20 }
    autoTable(doc, {
      startY: y,
      head: [["Dieta Prescrita", "Valor"]],
      body: [
        ["Fórmula láctea",        dados.formulaNome],
        ["Volume por mamada",     fmt(dados.volumeMl, 0, " ml")],
        ["Frequência",            fmt(dados.frequenciaHoras, 0, " h")],
        ["Vezes ao dia",          fmt(dados.vezesDia, 0)],
        ["Volume total",          fmt(dados.volumeTotal, 0, " ml/dia")],
        ["Calorias totais",       fmt(dados.caloriasTotais, 0, " kcal/dia")],
        ["Proteína total",        fmt(dados.proteinaTotal, 1, " g/dia")],
        ["% Calórico (do VET)",   fmt(dados.percCalorico, 1, "%")],
        ["% Proteico (da nec.)",  fmt(dados.percProteico, 1, "%")],
      ],
      headStyles:   { fillColor: COR, fontSize: 9 },
      bodyStyles:   { fontSize: 9 },
      columnStyles: { 1: { halign: "right" } },
      margin:       { left: mg, right: mg },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 30
    y += 5
  }

  // ── Observações ─────────────────────────────────────────────────────────────
  if (dados.observacoes) {
    if (y > 255) { doc.addPage(); y = 20 }
    doc.setFillColor(245, 245, 245)
    doc.rect(mg, y - 3, inner, 7, "F")
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("OBSERVAÇÕES", mg + 2, y + 1.5)
    y += 9
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    y = blocoTexto(doc, dados.observacoes, mg + 2, y, inner - 4, 5)
    y += 4
  }

  // ── Nota de rodapé ──────────────────────────────────────────────────────────
  if (y > 265) { doc.addPage(); y = 20 }
  doc.setFontSize(7.5)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(120, 120, 120)
  y = blocoTexto(doc,
    "Estimativas baseadas nas curvas de crescimento da OMS e nas DRIs (2002). " +
    "Estado nutricional calculado até 60 meses; VET até 35 meses; proteína até 36 meses. " +
    "Este relatório não substitui a avaliação de um profissional de saúde.",
    mg, y + 2, inner, 4)
  doc.setTextColor(0, 0, 0)

  return doc.output("datauristring").split(",")[1]
}
