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
  referenciaLabel?:  string          // rótulo da referência: "Consulta" (default) | "Pedido"
  pessoaLabel?:      string          // rótulo da pessoa: "Paciente" (default) | "Pessoa"
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
    `Ref.: ${dados.referenciaLabel ?? "Consulta"} #${dados.consultaId}  •  Parcela ${dados.numeroParcela}  •  Emitido em ${fmtData(dados.dataPagamento)}`,
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
  const descr   = dados.descricao || `${dados.referenciaLabel ?? "Consulta"} #${dados.consultaId}`
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
    [`${dados.pessoaLabel ?? "Paciente"}:`,    dados.pessoaNome + (dados.pessoaDocumento ? `  (${dados.pessoaDocumento})` : "")],
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
  referenciaLabel?:  string   // rótulo da referência: "Consulta" (default) | "Pedido"
  pessoaLabel?:      string   // rótulo da pessoa: "Paciente" (default) | "Pessoa"
  tituloDoc?:        string   // título da faixa: "FATURAMENTO DE CONSULTA" (default)
  itens?: {                   // detalhamento de produtos/serviços (opcional)
    descricao:     string
    tipo?:         string     // ex: "Serviço" | "Produto"
    quantidade:    number
    precoUnitario: number
    total:         number
  }[]
  devolucoes?: {              // produtos devolvidos (opcional)
    produtoNome: string
    quantidade:  number
    valor:       number
  }[]
  totalLiquido?: number       // total após devoluções (default = totalGeral)
}

export function gerarPdfFaturamento(dados: DadosFaturamento): string {
  const doc   = new jsPDF({ unit: "mm", format: "a4" })
  const L     = doc.internal.pageSize.getWidth()
  const mg    = 18
  const inner = L - mg * 2

  let y = faixaTopo(doc, dados.emitenteNome, dados.tituloDoc ?? "FATURAMENTO DE CONSULTA", [30, 65, 120])

  // Referência
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 120, 120)
  doc.text(`${dados.referenciaLabel ?? "Consulta"} Nº ${dados.consultaId}  •  Emitido em ${fmtData(dados.data)}`, L / 2, y, { align: "center" })
  doc.setTextColor(0, 0, 0)
  y += 10

  // Identificação
  doc.setFontSize(9)
  const blocos: [string, string][] = [
    ["Emitente:", dados.emitenteNome + (dados.emitenteDocumento ? `  (${dados.emitenteDocumento})` : "")],
    [`${dados.pessoaLabel ?? "Paciente"}:`, dados.pessoaNome   + (dados.pessoaDocumento   ? `  (${dados.pessoaDocumento})`   : "")],
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

  // Detalhamento dos produtos / serviços (antes das parcelas)
  if (dados.itens && dados.itens.length > 0) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(30, 65, 120)
    doc.text("Produtos e Serviços", mg, y)
    doc.setTextColor(0, 0, 0)
    y += 3

    autoTable(doc, {
      startY: y,
      head: [["Item", "Tipo", "Qtd.", "Preço Unit.", "Total"]],
      body: dados.itens.map(it => [
        it.descricao,
        it.tipo ?? "—",
        it.quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 3 }),
        fmtMoeda(it.precoUnitario),
        fmtMoeda(it.total),
      ]),
      headStyles:   { fillColor: [30, 65, 120], fontSize: 9 },
      bodyStyles:   { fontSize: 9 },
      columnStyles: { 1: { cellWidth: 28 }, 2: { halign: "right", cellWidth: 20 }, 3: { halign: "right" }, 4: { halign: "right" } },
      margin: { left: mg, right: mg },
    })
    y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8
  }

  let afterTable: number

  if (dados.parcelas.length > 0) {
    // Tabela de parcelas (faturamento realizado)
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
    afterTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 40
  } else {
    // Sem parcelas (não faturado): exibe apenas o total geral
    doc.setDrawColor(210, 210, 210)
    doc.setLineWidth(0.3)
    doc.line(mg, y, L - mg, y)
    y += 8
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(30, 65, 120)
    doc.text("Total Geral", mg, y)
    doc.text(fmtMoeda(dados.totalGeral), L - mg, y, { align: "right" })
    doc.setTextColor(0, 0, 0)
    afterTable = y
  }

  // Devoluções (se houver) — após o total do pedido
  if (dados.devolucoes && dados.devolucoes.length > 0) {
    autoTable(doc, {
      startY: afterTable + 8,
      head: [["Produto devolvido", "Qtd.", "Valor"]],
      body: dados.devolucoes.map(d => [
        d.produtoNome,
        d.quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 3 }),
        "− " + fmtMoeda(d.valor),
      ]),
      foot: [
        ["", "Total devolvido", "− " + fmtMoeda(dados.devolucoes.reduce((a, d) => a + d.valor, 0))],
        ["", "Total líquido",   fmtMoeda(dados.totalLiquido ?? dados.totalGeral)],
      ],
      headStyles: { fillColor: [180, 70, 70], fontSize: 9 },
      footStyles: { fillColor: [250, 235, 235], textColor: [0, 0, 0], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { halign: "right", cellWidth: 24 }, 2: { halign: "right", cellWidth: 36 } },
      margin: { left: mg, right: mg },
    })
    afterTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? afterTable
  }

  doc.setFontSize(8)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(100, 100, 100)
  doc.text(`Total por extenso: ${numeroPorExtenso(dados.totalLiquido ?? dados.totalGeral)}`, mg, afterTable + 6)
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

// ── RELATÓRIO DE TERAPIA NUTRICIONAL ──────────────────────────────────────────

export interface DadosRelatorioNutricional {
  dataEmissao:   string         // YYYY-MM-DD
  pacienteNome:  string | null
  usuarioNome:   string | null
  sexo:          string         // "M" | "F"
  idade:         number | null  // anos
  pesoAtual:     number | null
  altura:        number | null
  // Antropometria
  imc:                number | null
  classifImcOms:      string | null
  classifImcOpas:     string | null
  pesoIdeal:          number | null
  pesoAjustado:       number | null
  percPerdaPeso:      number | null
  classifPerdaPeso:   string | null
  percAdequacaoCb:    number | null
  classifAdequacaoCb: string | null
  classifDeplecaoCp:  string | null
  // Necessidades
  kcalMin:   number | null
  kcalMax:   number | null
  ptnMin:    number | null
  ptnMax:    number | null
  kcalTotal: number | null
  ptnTotal:  number | null
  // Dieta enteral
  formulaNome:  string | null
  modoDieta:    string | null  // "CONTINUO" | "INTERMITENTE"
  vt:           number | null
  kcalDieta:    number | null
  ptnDieta:     number | null
  percVct:      number | null
  percPtn:      number | null
  volumePleno:  number | null
  ptnPleno?:       number | null
  ptnSuplementar?: number | null
  progressao?:     { dia: number; pct: number; kcalDia: number; volume: number | null }[]
  moduloProteico?: { nome: string; gramas: number; kcalAdicionada: number }[]
  // Hidratação
  necHidricaMin:   number | null
  necHidricaIdeal: number | null
  aguaDieta:       number | null
  aguaExtraIdeal:  number | null
  observacoes?:    string | null
}

export function gerarPdfNutricional(dados: DadosRelatorioNutricional): string {
  const doc   = new jsPDF({ unit: "mm", format: "a4" })
  const L     = doc.internal.pageSize.getWidth()
  const mg    = 18
  const inner = L - mg * 2
  const COR: [number, number, number] = [60, 90, 150]

  const fmt = (v: number | null, dec = 1, suf = "") =>
    v == null || Number.isNaN(v) ? "—" : `${v.toFixed(dec)}${suf}`

  let y = faixaTopo(doc, "RELATÓRIO DE TERAPIA NUTRICIONAL",
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

  // ── Caixa de métricas ───────────────────────────────────────────────────────
  const metrics: { label: string; valor: string }[] = [
    { label: "Sexo",   valor: dados.sexo === "M" ? "Masculino" : "Feminino" },
    { label: "Idade",  valor: dados.idade != null ? `${dados.idade} anos` : "—" },
    { label: "Peso",   valor: fmt(dados.pesoAtual, 1, " kg") },
    { label: "Altura", valor: fmt(dados.altura, 1, " cm") },
    { label: "IMC",    valor: fmt(dados.imc, 1) },
  ]

  doc.setFillColor(238, 242, 250)
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

  // ── Antropometria & estado nutricional ──────────────────────────────────────
  autoTable(doc, {
    startY: y,
    head: [["Antropometria & Estado Nutricional", "Valor"]],
    body: [
      ["Classificação IMC (OMS)",   dados.classifImcOms ?? "—"],
      ["Classificação IMC (OPAS)",  dados.classifImcOpas ?? "—"],
      ["Peso ideal",                fmt(dados.pesoIdeal, 1, " kg")],
      ["Peso ajustado",             fmt(dados.pesoAjustado, 1, " kg")],
      ["% Perda de peso",           fmt(dados.percPerdaPeso, 1, " %")],
      ["Classif. perda de peso",    dados.classifPerdaPeso ?? "—"],
      ["% Adequação CB",            fmt(dados.percAdequacaoCb, 1, " %")],
      ["Classif. CB",               dados.classifAdequacaoCb ?? "—"],
      ["Depleção da panturrilha",   dados.classifDeplecaoCp ?? "—"],
    ],
    headStyles:   { fillColor: COR, fontSize: 9 },
    bodyStyles:   { fontSize: 9 },
    columnStyles: { 1: { halign: "right" } },
    margin:       { left: mg, right: mg },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 30
  y += 5

  // ── Necessidades nutricionais ───────────────────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20 }
  autoTable(doc, {
    startY: y,
    head: [["Necessidades Nutricionais", "Valor"]],
    body: [
      ["Energia (mínima)",        fmt(dados.kcalMin, 0, " kcal/dia")],
      ["Energia (máxima)",        fmt(dados.kcalMax, 0, " kcal/dia")],
      ["Proteína (mínima)",       fmt(dados.ptnMin, 1, " g/dia")],
      ["Proteína (máxima)",       fmt(dados.ptnMax, 1, " g/dia")],
      ["Energia personalizada",   fmt(dados.kcalTotal, 0, " kcal/dia")],
      ["Proteína personalizada",  fmt(dados.ptnTotal, 1, " g/dia")],
    ],
    headStyles:   { fillColor: COR, fontSize: 9 },
    bodyStyles:   { fontSize: 9 },
    columnStyles: { 1: { halign: "right" } },
    margin:       { left: mg, right: mg },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 30
  y += 5

  // ── Dieta enteral ───────────────────────────────────────────────────────────
  if (dados.formulaNome) {
    if (y > 220) { doc.addPage(); y = 20 }
    autoTable(doc, {
      startY: y,
      head: [["Dieta Enteral", "Valor"]],
      body: [
        ["Fórmula",            dados.formulaNome],
        ["Modo de infusão",    dados.modoDieta === "CONTINUO" ? "Contínuo" : dados.modoDieta === "INTERMITENTE" ? "Intermitente" : "—"],
        ["Volume total (dia)", fmt(dados.vt, 0, " ml")],
        ["Calorias",           fmt(dados.kcalDieta, 0, " kcal/dia")],
        ["Proteína",           fmt(dados.ptnDieta, 1, " g/dia")],
        ["% VCT (da meta)",    fmt(dados.percVct, 1, " %")],
        ["% PTN (da meta)",    fmt(dados.percPtn, 1, " %")],
        ["Volume pleno",       fmt(dados.volumePleno, 0, " ml")],
        ["Proteína no vol. pleno", fmt(dados.ptnPleno ?? null, 1, " g/dia")],
        ["Proteína suplementar",   fmt(dados.ptnSuplementar ?? null, 1, " g/dia")],
      ],
      headStyles:   { fillColor: COR, fontSize: 9 },
      bodyStyles:   { fontSize: 9 },
      columnStyles: { 1: { halign: "right" } },
      margin:       { left: mg, right: mg },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 30
    y += 5

    // Modelo de progressão (1º–4º dia)
    const prog = dados.progressao ?? []
    if (prog.length > 0) {
      if (y > 220) { doc.addPage(); y = 20 }
      const diaLabel: Record<number, string> = { 25: "1º dia", 50: "2º dia", 75: "3º dia", 100: "4º dia" }
      autoTable(doc, {
        startY: y,
        head: [["Progressão", "% da meta", "Calorias do dia", "Volume"]],
        body: prog.map(p => [
          diaLabel[p.pct] ?? `Dia ${p.dia}`,
          `${p.pct}%`,
          fmt(p.kcalDia, 0, " kcal"),
          fmt(p.volume, 1, " ml"),
        ]),
        headStyles:   { fillColor: COR, fontSize: 9 },
        bodyStyles:   { fontSize: 9 },
        columnStyles: { 1: { halign: "center" }, 2: { halign: "right" }, 3: { halign: "right" } },
        margin:       { left: mg, right: mg },
      })
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 30
      y += 5
    }

    // Módulo proteico sugerido
    const mods = dados.moduloProteico ?? []
    if (mods.length > 0 && dados.ptnSuplementar != null && dados.ptnSuplementar > 0) {
      if (y > 220) { doc.addPage(); y = 20 }
      autoTable(doc, {
        startY: y,
        head: [["Módulo proteico sugerido", "Quantidade/dia", "Calorias adicionais"]],
        body: mods.map(m => [m.nome, fmt(m.gramas, 1, " g"), fmt(m.kcalAdicionada, 0, " kcal")]),
        headStyles:   { fillColor: COR, fontSize: 9 },
        bodyStyles:   { fontSize: 9 },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
        margin:       { left: mg, right: mg },
      })
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 30
      y += 5
    }
  }

  // ── Hidratação ──────────────────────────────────────────────────────────────
  if (y > 230) { doc.addPage(); y = 20 }
  autoTable(doc, {
    startY: y,
    head: [["Hidratação", "Valor"]],
    body: [
      ["Necessidade hídrica (mínima)", fmt(dados.necHidricaMin, 0, " ml/dia")],
      ["Necessidade hídrica (ideal)",  fmt(dados.necHidricaIdeal, 0, " ml/dia")],
      ["Água proveniente da dieta",    fmt(dados.aguaDieta, 0, " ml/dia")],
      ["Água extra (ideal)",           fmt(dados.aguaExtraIdeal, 0, " ml/dia")],
    ],
    headStyles:   { fillColor: COR, fontSize: 9 },
    bodyStyles:   { fontSize: 9 },
    columnStyles: { 1: { halign: "right" } },
    margin:       { left: mg, right: mg },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 30
  y += 5

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
    "Estimativas baseadas em equações de Chumlea, Jung e Rabito e nas classificações OMS/OPAS. " +
    "Este relatório não substitui a avaliação de um profissional de saúde.",
    mg, y + 2, inner, 4)
  doc.setTextColor(0, 0, 0)

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

// ── LISTAGEM GENÉRICA (relatório de qualquer lista) ───────────────────────────

export interface ColunaLista {
  header: string
  align?: "left" | "right" | "center"
}

export interface DadosListaGenerica {
  titulo:      string
  dataEmissao: string          // YYYY-MM-DD
  filtros:     string
  colunas:     ColunaLista[]
  linhas:      string[][]       // células já formatadas como string pelo chamador
}

/**
 * Gera um PDF de listagem genérico, no mesmo visual de gerarPdfAvaliacoesPediatricas:
 * faixa de topo com título + data de emissão, linha de filtros e um autoTable.
 * Quando há muitas colunas, reduz a fonte e habilita quebra de linha para caber em A4.
 */
export function gerarPdfLista(dados: DadosListaGenerica): string {
  // Em paisagem cabem mais colunas; usamos landscape quando há muitas colunas.
  const muitasColunas = dados.colunas.length > 8
  const doc   = new jsPDF({ unit: "mm", format: "a4", orientation: muitasColunas ? "landscape" : "portrait" })
  const L     = doc.internal.pageSize.getWidth()
  const mg    = muitasColunas ? 10 : 18
  const inner = L - mg * 2
  const COR: [number, number, number] = [22, 130, 130]

  let y = faixaTopo(doc, dados.titulo, `Emitido em ${fmtData(dados.dataEmissao)}`, COR)

  // Resumo dos filtros aplicados
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 120, 120)
  y = blocoTexto(doc, `Filtros: ${dados.filtros}`, mg, y, inner, 5)
  doc.setTextColor(0, 0, 0)
  y += 4

  const fontSize = muitasColunas ? 7 : 8

  const columnStyles: Record<number, { halign: "left" | "right" | "center" }> = {}
  dados.colunas.forEach((c, i) => {
    if (c.align && c.align !== "left") columnStyles[i] = { halign: c.align }
  })

  autoTable(doc, {
    startY:       y,
    head:         [dados.colunas.map(c => c.header)],
    body:         dados.linhas,
    headStyles:   { fillColor: COR, fontSize },
    bodyStyles:   { fontSize },
    styles:       { overflow: "linebreak", cellPadding: 1.5 },
    columnStyles,
    margin:       { left: mg, right: mg },
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

// ── LAUDO DE AUDIOMETRIA ───────────────────────────────────────────────────────

interface LimiarAudiometria {
  orelha:      "OD" | "OE"
  via:         "AEREA" | "OSSEA"
  frequencia:  number
  limiarDb:    number | null
  mascarado:   boolean
  semResposta: boolean
}

export interface DadosRelatorioAudiometria {
  dataEmissao:  string          // YYYY-MM-DD
  pacienteNome: string | null
  usuarioNome:  string | null
  dataExame:    string          // YYYY-MM-DD
  srtOdDb:      number | null
  srtOeDb:      number | null
  irfOdPerc:    number | null
  irfOePerc:    number | null
  mediaOd:      number | null
  mediaOe:      number | null
  grauOd:       string | null
  grauOe:       string | null
  tipoPerdaOd:  string | null
  tipoPerdaOe:  string | null
  norma:        string | null
  observacao:   string | null
  limiares:     LimiarAudiometria[]
}

// Frequências do audiograma (categórico, igualmente espaçadas)
const AUDIO_FREQS  = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000]
const AUDIO_LABELS = ["250", "500", "1k", "2k", "3k", "4k", "6k", "8k"]

const COR_OD_PDF: [number, number, number] = [239, 68, 68]  // vermelho
const COR_OE_PDF: [number, number, number] = [59, 130, 246] // azul

/**
 * Desenha UM audiograma de uma orelha numa área (x, y, w, h) em mm.
 * Eixo X categórico (frequências); eixo Y de dB invertido (-10 topo, 120 base).
 * Via aérea: linha sólida + símbolo (O para OD, X para OE).
 * Via óssea:  linha tracejada + símbolo (< para OD, > para OE).
 * Sem resposta: símbolo com seta para baixo, sem conectar.
 */
function desenharAudiograma(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  limiares: LimiarAudiometria[],
  orelha: "OD" | "OE",
  cor: [number, number, number],
) {
  const DB_MIN = -10
  const DB_MAX = 120

  // área de plotagem interna (margem para rótulos do eixo Y à esquerda e do X embaixo)
  const padL = 9   // espaço p/ rótulos dB
  const padB = 6   // espaço p/ rótulos de frequência
  const padT = 2
  const padR = 3
  const plotX = x + padL
  const plotY = y + padT
  const plotW = w - padL - padR
  const plotH = h - padT - padB

  // mapeia (freq, dB) → ponto (mm) dentro da área de plotagem
  const idxFreq = (f: number) => AUDIO_FREQS.indexOf(f)
  const px = (f: number) => {
    const i = idxFreq(f)
    return plotX + (i / (AUDIO_FREQS.length - 1)) * plotW
  }
  const py = (db: number) =>
    plotY + ((db - DB_MIN) / (DB_MAX - DB_MIN)) * plotH

  // ── Grade horizontal (a cada 10 dB) + rótulos ──────────────────────────────
  doc.setLineWidth(0.15)
  doc.setFontSize(5.5)
  doc.setFont("helvetica", "normal")
  for (let db = DB_MIN; db <= DB_MAX; db += 10) {
    const yy = py(db)
    // linha de grade — mais clara nos intermediários, um pouco mais forte a cada 20
    if (db % 20 === 0) doc.setDrawColor(190, 190, 190)
    else               doc.setDrawColor(225, 225, 225)
    doc.line(plotX, yy, plotX + plotW, yy)
    // rótulo dB (apenas a cada 20 p/ não poluir)
    if (db % 20 === 0) {
      doc.setTextColor(130, 130, 130)
      doc.text(String(db), plotX - 1.5, yy + 1.2, { align: "right" })
    }
  }

  // ── Grade vertical (em cada frequência) + rótulos ──────────────────────────
  AUDIO_FREQS.forEach((f, i) => {
    const xx = px(f)
    doc.setDrawColor(225, 225, 225)
    doc.line(xx, plotY, xx, plotY + plotH)
    doc.setTextColor(130, 130, 130)
    doc.text(AUDIO_LABELS[i], xx, plotY + plotH + 4, { align: "center" })
  })

  // ── Moldura ─────────────────────────────────────────────────────────────────
  doc.setDrawColor(120, 120, 120)
  doc.setLineWidth(0.3)
  doc.rect(plotX, plotY, plotW, plotH)

  // ── Símbolos ──────────────────────────────────────────────────────────────
  const s = 1.6 // meio-tamanho do símbolo em mm

  const simboloVA = (cx: number, cy: number) => {
    doc.setDrawColor(...cor)
    doc.setLineWidth(0.5)
    if (orelha === "OD") {
      doc.circle(cx, cy, s, "S")                 // "O"
    } else {
      doc.line(cx - s, cy - s, cx + s, cy + s)   // "X"
      doc.line(cx - s, cy + s, cx + s, cy - s)
    }
  }
  const simboloVO = (cx: number, cy: number) => {
    doc.setDrawColor(...cor)
    doc.setLineWidth(0.5)
    if (orelha === "OD") {
      // "<" (abre p/ direita)
      doc.line(cx + s, cy - s, cx - s, cy)
      doc.line(cx - s, cy, cx + s, cy + s)
    } else {
      // ">" (abre p/ esquerda)
      doc.line(cx - s, cy - s, cx + s, cy)
      doc.line(cx + s, cy, cx - s, cy + s)
    }
  }
  const setaParaBaixo = (cx: number, cy: number) => {
    doc.setDrawColor(...cor)
    doc.setLineWidth(0.4)
    const a = cy + s + 0.5
    const b = a + 2.5
    doc.line(cx, a, cx, b)
    doc.line(cx, b, cx - 1, b - 1)
    doc.line(cx, b, cx + 1, b - 1)
  }

  // pontos da orelha, separados por via
  const pontos = (via: "AEREA" | "OSSEA") =>
    limiares
      .filter(l => l.orelha === orelha && l.via === via)
      .sort((p, q) => idxFreq(p.frequencia) - idxFreq(q.frequencia))

  // desenha uma via: linha conectando os pontos válidos + símbolos
  const desenharVia = (via: "AEREA" | "OSSEA") => {
    const ps = pontos(via)
    // segmentos de linha apenas entre pontos com valor e com resposta
    const conectaveis = ps.filter(l => l.limiarDb != null && !l.semResposta)

    if (conectaveis.length > 1) {
      doc.setDrawColor(...cor)
      doc.setLineWidth(0.4)
      if (via === "OSSEA") doc.setLineDashPattern([1, 1], 0)
      for (let i = 0; i < conectaveis.length - 1; i++) {
        const a = conectaveis[i], b = conectaveis[i + 1]
        doc.line(px(a.frequencia), py(a.limiarDb as number),
                 px(b.frequencia), py(b.limiarDb as number))
      }
      if (via === "OSSEA") doc.setLineDashPattern([], 0)
    }

    // símbolos
    for (const l of ps) {
      if (l.semResposta) {
        // posiciona no fundo da escala quando sem resposta e sem valor
        const db = l.limiarDb != null ? l.limiarDb : DB_MAX
        const cx = px(l.frequencia), cy = py(db)
        if (via === "AEREA") simboloVA(cx, cy)
        else                 simboloVO(cx, cy)
        setaParaBaixo(cx, cy)
        continue
      }
      if (l.limiarDb == null) continue
      const cx = px(l.frequencia), cy = py(l.limiarDb)
      if (via === "AEREA") simboloVA(cx, cy)
      else                 simboloVO(cx, cy)
    }
  }

  desenharVia("AEREA")
  desenharVia("OSSEA")

  // restaura padrões
  doc.setLineDashPattern([], 0)
  doc.setTextColor(0, 0, 0)
}

const GRAU_LABEL_PDF: Record<string, string> = {
  NORMAL: "Normal", LEVE: "Leve", MODERADA: "Moderada", SEVERA: "Severa", PROFUNDA: "Profunda",
}
const TIPO_LABEL_PDF: Record<string, string> = {
  NORMAL: "Normal", CONDUTIVA: "Condutiva", NEUROSSENSORIAL: "Neurossensorial", MISTA: "Mista",
}

export function gerarPdfAudiometria(dados: DadosRelatorioAudiometria): string {
  const doc   = new jsPDF({ unit: "mm", format: "a4" })
  const L     = doc.internal.pageSize.getWidth()
  const mg    = 18
  const inner = L - mg * 2
  const COR: [number, number, number] = [37, 99, 235]

  const fmt = (v: number | null, dec = 1, suf = "") =>
    v == null || Number.isNaN(v) ? "—" : `${v.toFixed(dec)}${suf}`
  const fmtGrau = (g: string | null) => (g ? GRAU_LABEL_PDF[g] ?? g : "—")
  const fmtTipo = (t: string | null) => (t ? TIPO_LABEL_PDF[t] ?? t : "—")

  // célula da tabela de limiares
  const celula = (orelha: "OD" | "OE", via: "AEREA" | "OSSEA", freq: number): string => {
    const l = dados.limiares.find(
      x => x.orelha === orelha && x.via === via && x.frequencia === freq)
    if (!l) return "—"
    let base: string
    if (l.semResposta)            base = "SR"
    else if (l.limiarDb == null)  base = "—"
    else                          base = String(l.limiarDb)
    return l.mascarado ? `${base} *` : base
  }

  // 1. Faixa de topo
  let y = faixaTopo(doc, "LAUDO DE AUDIOMETRIA", dados.pacienteNome ?? "—", COR)

  // 2. Referência centralizada
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 120, 120)
  const ref = [
    `Exame em ${fmtData(dados.dataExame)}`,
    `Emitido em ${fmtData(dados.dataEmissao)}`,
    dados.usuarioNome ? `Profissional: ${dados.usuarioNome}` : null,
  ].filter(Boolean).join("  •  ")
  doc.text(ref, L / 2, y, { align: "center" })
  doc.setTextColor(0, 0, 0)
  y += 8

  // 3. Audiogramas lado a lado (OD à esquerda, OE à direita)
  const gap     = 8
  const graphW  = (inner - gap) / 2
  const graphH  = 60

  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...COR_OD_PDF)
  doc.text("Orelha Direita (OD)", mg + graphW / 2, y, { align: "center" })
  doc.setTextColor(...COR_OE_PDF)
  doc.text("Orelha Esquerda (OE)", mg + graphW + gap + graphW / 2, y, { align: "center" })
  doc.setTextColor(0, 0, 0)
  y += 3

  desenharAudiograma(doc, mg, y, graphW, graphH, dados.limiares, "OD", COR_OD_PDF)
  desenharAudiograma(doc, mg + graphW + gap, y, graphW, graphH, dados.limiares, "OE", COR_OE_PDF)
  y += graphH + 3

  // legenda dos símbolos
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 120, 120)
  doc.text(
    "O / <  Via aérea/óssea OD     X / >  Via aérea/óssea OE     SR  sem resposta     *  mascarado",
    L / 2, y, { align: "center" })
  doc.setTextColor(0, 0, 0)
  y += 6

  // 4. Tabela de limiares
  autoTable(doc, {
    startY: y,
    head: [["Via", ...AUDIO_LABELS]],
    body: [
      ["OD · Aérea", ...AUDIO_FREQS.map(f => celula("OD", "AEREA", f))],
      ["OD · Óssea", ...AUDIO_FREQS.map(f => celula("OD", "OSSEA", f))],
      ["OE · Aérea", ...AUDIO_FREQS.map(f => celula("OE", "AEREA", f))],
      ["OE · Óssea", ...AUDIO_FREQS.map(f => celula("OE", "OSSEA", f))],
    ],
    headStyles:   { fillColor: COR, fontSize: 8, halign: "center" },
    bodyStyles:   { fontSize: 8 },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold" },
      1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "center" },
      4: { halign: "center" }, 5: { halign: "center" }, 6: { halign: "center" },
      7: { halign: "center" }, 8: { halign: "center" },
    },
    margin: { left: mg, right: mg },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 30
  y += 5

  // 5. Resultados por orelha
  if (y > 230) { doc.addPage(); y = 20 }
  autoTable(doc, {
    startY: y,
    head: [["Resultado", "Orelha Direita (OD)", "Orelha Esquerda (OE)"]],
    body: [
      ["Média (dB)",     fmt(dados.mediaOd, 1), fmt(dados.mediaOe, 1)],
      ["Grau da perda",  fmtGrau(dados.grauOd), fmtGrau(dados.grauOe)],
      ["Tipo de perda",  fmtTipo(dados.tipoPerdaOd), fmtTipo(dados.tipoPerdaOe)],
    ],
    headStyles:   { fillColor: COR, fontSize: 9, halign: "center" },
    bodyStyles:   { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: "bold" },
      1: { halign: "center" },
      2: { halign: "center" },
    },
    margin: { left: mg, right: mg },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 30

  if (dados.norma) {
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "italic")
    doc.setTextColor(120, 120, 120)
    doc.text(`Classificação: ${dados.norma}`, mg, y + 4)
    doc.setTextColor(0, 0, 0)
    y += 4
  }
  y += 5

  // 6. Logoaudiometria (SRT / IRF)
  if (y > 235) { doc.addPage(); y = 20 }
  autoTable(doc, {
    startY: y,
    head: [["Logoaudiometria", "Orelha Direita (OD)", "Orelha Esquerda (OE)"]],
    body: [
      ["SRT (dB)", fmt(dados.srtOdDb, 0), fmt(dados.srtOeDb, 0)],
      ["IRF (%)",  fmt(dados.irfOdPerc, 0), fmt(dados.irfOePerc, 0)],
    ],
    headStyles:   { fillColor: COR, fontSize: 9, halign: "center" },
    bodyStyles:   { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: "bold" },
      1: { halign: "center" },
      2: { halign: "center" },
    },
    margin: { left: mg, right: mg },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 30
  y += 5

  // 7. Observações
  if (dados.observacao) {
    if (y > 255) { doc.addPage(); y = 20 }
    doc.setFillColor(245, 245, 245)
    doc.rect(mg, y - 3, inner, 7, "F")
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("OBSERVAÇÕES", mg + 2, y + 1.5)
    y += 9
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    y = blocoTexto(doc, dados.observacao, mg + 2, y, inner - 4, 5)
    y += 4
  }

  // 8. Nota de rodapé
  if (y > 270) { doc.addPage(); y = 20 }
  doc.setFontSize(7.5)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(120, 120, 120)
  blocoTexto(doc,
    "Limiares em dB NA. Símbolos conforme convenção ASHA. " +
    "Este laudo não substitui a avaliação de um profissional de saúde habilitado.",
    mg, y + 2, inner, 4)
  doc.setTextColor(0, 0, 0)

  return doc.output("datauristring").split(",")[1]
}

// ── LAUDO DESCRITIVO OTORRINO (Nasofibroscopia / Laringoscopia / etc.) ──────────

export interface DadosLaudoOtorrino {
  dataEmissao:  string          // YYYY-MM-DD
  pacienteNome: string
  usuarioNome:  string | null
  dataExame:    string          // YYYY-MM-DD
  tipoExame:    string          // label amigável
  laudo:        string | null
  conclusao:    string | null
  cid:          string | null
}

export function gerarPdfLaudoOtorrino(dados: DadosLaudoOtorrino): string {
  const doc   = new jsPDF({ unit: "mm", format: "a4" })
  const L     = doc.internal.pageSize.getWidth()
  const mg    = 18
  const inner = L - mg * 2
  const COR: [number, number, number] = [37, 99, 235]

  // 1. Faixa de topo
  let y = faixaTopo(doc, `LAUDO — ${dados.tipoExame}`, dados.pacienteNome ?? "—", COR)

  // 2. Referência centralizada
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 120, 120)
  const ref = [
    `Exame em ${fmtData(dados.dataExame)}`,
    `Emitido em ${fmtData(dados.dataEmissao)}`,
    dados.usuarioNome ? `Profissional: ${dados.usuarioNome}` : null,
  ].filter(Boolean).join("  •  ")
  doc.text(ref, L / 2, y, { align: "center" })
  doc.setTextColor(0, 0, 0)
  y += 10

  // 3. Seção Laudo
  doc.setFillColor(245, 245, 245)
  doc.rect(mg, y - 3, inner, 7, "F")
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("LAUDO", mg + 2, y + 1.5)
  y += 9
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  y = blocoTexto(doc, dados.laudo?.trim() || "—", mg + 2, y, inner - 4, 5)
  y += 6

  // 4. Seção Conclusão
  if (y > 250) { doc.addPage(); y = 20 }
  doc.setFillColor(245, 245, 245)
  doc.rect(mg, y - 3, inner, 7, "F")
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("CONCLUSÃO", mg + 2, y + 1.5)
  y += 9
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  y = blocoTexto(doc, dados.conclusao?.trim() || "—", mg + 2, y, inner - 4, 5)
  y += 6

  // 5. CID (se houver)
  if (dados.cid && dados.cid.trim()) {
    if (y > 265) { doc.addPage(); y = 20 }
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...COR)
    doc.text(`CID: ${dados.cid.trim()}`, mg + 2, y + 1.5)
    doc.setTextColor(0, 0, 0)
    y += 8
  }

  // 6. Nota de rodapé
  if (y > 272) { doc.addPage(); y = 20 }
  doc.setFontSize(7.5)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(120, 120, 120)
  blocoTexto(doc,
    "Este laudo não substitui a avaliação de um profissional de saúde habilitado.",
    mg, y + 2, inner, 4)
  doc.setTextColor(0, 0, 0)

  return doc.output("datauristring").split(",")[1]
}

// ── IMITANCIOMETRIA / TIMPANOMETRIA ──────────────────────────────────────────────

export interface DadosImitanciometria {
  dataEmissao:       string          // YYYY-MM-DD
  pacienteNome:      string
  usuarioNome:       string | null
  dataExame:         string          // YYYY-MM-DD
  curvaOd:           string | null   // A | As | Ad | B | C
  curvaOe:           string | null
  picoPressaoOdDapa: number | null
  picoPressaoOeDapa: number | null
  complacenciaOdMl:  number | null
  complacenciaOeMl:  number | null
  volumeCanalOdMl:   number | null
  volumeCanalOeMl:   number | null
  reflexoIpsiOd:     string | null   // PRESENTE | AUSENTE | NAO_TESTADO
  reflexoContraOd:   string | null
  reflexoIpsiOe:     string | null
  reflexoContraOe:   string | null
  observacao:        string | null
}

export function gerarPdfImitanciometria(dados: DadosImitanciometria): string {
  const doc   = new jsPDF({ unit: "mm", format: "a4" })
  const L     = doc.internal.pageSize.getWidth()
  const mg    = 18
  const COR: [number, number, number] = [37, 99, 235]

  const curvaLabel = (c: string | null) =>
    c == null || c === "" ? "—" : `Tipo ${c}`
  const reflexoLabel = (r: string | null) =>
    r === "PRESENTE" ? "Presente" : r === "AUSENTE" ? "Ausente" : r === "NAO_TESTADO" ? "Não testado" : "—"
  const fmt = (v: number | null, suf = "") =>
    v == null || Number.isNaN(v) ? "—" : `${v}${suf}`

  // 1. Faixa de topo
  let y = faixaTopo(doc, "IMITANCIOMETRIA", dados.pacienteNome ?? "—", COR)

  // 2. Referência centralizada
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 120, 120)
  const ref = [
    `Exame em ${fmtData(dados.dataExame)}`,
    `Emitido em ${fmtData(dados.dataEmissao)}`,
    dados.usuarioNome ? `Profissional: ${dados.usuarioNome}` : null,
  ].filter(Boolean).join("  •  ")
  doc.text(ref, L / 2, y, { align: "center" })
  doc.setTextColor(0, 0, 0)
  y += 8

  // 3. Timpanometria (por orelha)
  autoTable(doc, {
    startY: y,
    head: [["Timpanometria", "Orelha Direita (OD)", "Orelha Esquerda (OE)"]],
    body: [
      ["Curva (Jerger)",         curvaLabel(dados.curvaOd),                 curvaLabel(dados.curvaOe)],
      ["Pico de pressão (daPa)", fmt(dados.picoPressaoOdDapa),              fmt(dados.picoPressaoOeDapa)],
      ["Complacência (ml)",      fmt(dados.complacenciaOdMl),               fmt(dados.complacenciaOeMl)],
      ["Volume do CAE (ml)",     fmt(dados.volumeCanalOdMl),                fmt(dados.volumeCanalOeMl)],
    ],
    headStyles:   { fillColor: COR, fontSize: 9 },
    bodyStyles:   { fontSize: 9 },
    columnStyles: { 0: { fontStyle: "bold" }, 1: { halign: "center" }, 2: { halign: "center" } },
    margin:       { left: mg, right: mg },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 30
  y += 6

  // 4. Reflexo estapédico
  autoTable(doc, {
    startY: y,
    head: [["Reflexo estapédico", "Orelha Direita (OD)", "Orelha Esquerda (OE)"]],
    body: [
      ["Ipsilateral",   reflexoLabel(dados.reflexoIpsiOd),   reflexoLabel(dados.reflexoIpsiOe)],
      ["Contralateral", reflexoLabel(dados.reflexoContraOd), reflexoLabel(dados.reflexoContraOe)],
    ],
    headStyles:   { fillColor: COR, fontSize: 9 },
    bodyStyles:   { fontSize: 9 },
    columnStyles: { 0: { fontStyle: "bold" }, 1: { halign: "center" }, 2: { halign: "center" } },
    margin:       { left: mg, right: mg },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 30
  y += 6

  // 5. Observações
  if (dados.observacao && dados.observacao.trim()) {
    const inner = L - mg * 2
    if (y > 255) { doc.addPage(); y = 20 }
    doc.setFillColor(245, 245, 245)
    doc.rect(mg, y - 3, inner, 7, "F")
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("OBSERVAÇÕES", mg + 2, y + 1.5)
    y += 9
    doc.setFont("helvetica", "normal")
    y = blocoTexto(doc, dados.observacao.trim(), mg + 2, y, inner - 4, 5)
  }

  return doc.output("datauristring").split(",")[1]
}

// ── ESCALA / QUESTIONÁRIO APLICADO ──────────────────────────────────────────────

export interface DadosEscalaOtorrino {
  dataEmissao:      string          // YYYY-MM-DD
  pacienteNome:     string
  usuarioNome:      string | null
  dataAplicacao:    string          // YYYY-MM-DD
  questionarioNome: string
  scoreTotal:       number | null
  classificacao:    string | null
  interpretacao:    string | null
  respostas:        { enunciado: string; valor: number }[]
}

export function gerarPdfEscala(dados: DadosEscalaOtorrino): string {
  const doc   = new jsPDF({ unit: "mm", format: "a4" })
  const L     = doc.internal.pageSize.getWidth()
  const mg    = 18
  const inner = L - mg * 2
  const COR: [number, number, number] = [37, 99, 235]

  // 1. Faixa de topo
  let y = faixaTopo(doc, `ESCALA — ${dados.questionarioNome}`, dados.pacienteNome ?? "—", COR)

  // 2. Referência centralizada
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 120, 120)
  const ref = [
    `Aplicada em ${fmtData(dados.dataAplicacao)}`,
    `Emitido em ${fmtData(dados.dataEmissao)}`,
    dados.usuarioNome ? `Profissional: ${dados.usuarioNome}` : null,
  ].filter(Boolean).join("  •  ")
  doc.text(ref, L / 2, y, { align: "center" })
  doc.setTextColor(0, 0, 0)
  y += 10

  // 3. Caixa de resultado (Score / Classificação)
  const metrics: { label: string; valor: string }[] = [
    { label: "Score total",   valor: dados.scoreTotal != null ? String(dados.scoreTotal) : "—" },
    { label: "Classificação", valor: dados.classificacao ?? "—" },
  ]

  doc.setFillColor(240, 247, 255)
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

  // 4. Interpretação
  if (dados.interpretacao && dados.interpretacao.trim()) {
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    y = blocoTexto(doc, dados.interpretacao.trim(), mg, y, inner, 5)
    y += 5
  }

  // 5. Tabela de respostas
  if (y > 240) { doc.addPage(); y = 20 }
  autoTable(doc, {
    startY: y,
    head: [["#", "Item", "Resposta"]],
    body: dados.respostas.map((r, idx) => [
      String(idx + 1),
      r.enunciado,
      String(r.valor),
    ]),
    headStyles:   { fillColor: COR, fontSize: 8 },
    bodyStyles:   { fontSize: 8 },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "left" },
      2: { halign: "center", cellWidth: 22, fontStyle: "bold" },
    },
    margin: { left: mg, right: mg },
  })

  return doc.output("datauristring").split(",")[1]
}

// ── RESUMO DO PACOTE ───────────────────────────────────────────────────────────

export interface DadosPacotePdf {
  pacoteId:          number
  nome:              string
  statusLabel:       string
  emitenteNome:      string
  emitenteDocumento?: string | null
  pessoaNome:        string
  pessoaDocumento?:  string | null
  produtoNome:       string
  valorTotal:        number
  quantidadeSessoes: number
  sessoesUsadas:     number
  sessoesRestantes:  number
  dataEmissao:       string   // YYYY-MM-DD
  observacao?:       string | null
  sessoes: {
    sessao:      number
    statusLabel: string
    inicio:      string       // ISO datetime
    fim:         string       // ISO datetime
  }[]
  financeiro?: {
    parcelas: {
      numeroParcela:  number
      dataVencimento: string
      valor:          number
      statusLabel:    string
      dataPagamento:  string | null
      valorPago:      number | null
    }[]
    totalGeral: number
  } | null
}

export function gerarPdfPacote(dados: DadosPacotePdf): string {
  const doc   = new jsPDF({ unit: "mm", format: "a4" })
  const L     = doc.internal.pageSize.getWidth()
  const mg    = 18
  const inner = L - mg * 2
  const COR: [number, number, number] = [30, 65, 120]

  // Formata ISO datetime → dd/mm/yyyy HH:mm (fmtData só trata YYYY-MM-DD)
  const fmtDataHora = (iso: string): string => {
    if (!iso) return "—"
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return "—"
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  // 1. Faixa de topo
  let y = faixaTopo(doc, dados.emitenteNome, "RESUMO DO PACOTE", COR)

  // 2. Linha de referência
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 120, 120)
  doc.text(`Pacote Nº ${dados.pacoteId}  •  ${dados.nome}  •  Emitido em ${fmtData(dados.dataEmissao)}`, L / 2, y, { align: "center" })
  doc.setTextColor(0, 0, 0)
  y += 10

  // 3. Identificação
  doc.setFontSize(9)
  const blocos: [string, string][] = [
    ["Emitente:", dados.emitenteNome + (dados.emitenteDocumento ? `  (${dados.emitenteDocumento})` : "")],
    ["Paciente:", dados.pessoaNome   + (dados.pessoaDocumento   ? `  (${dados.pessoaDocumento})`   : "")],
  ]
  for (const [label, valor] of blocos) {
    doc.setFont("helvetica", "bold")
    doc.text(label, mg, y)
    doc.setFont("helvetica", "normal")
    y = blocoTexto(doc, valor, mg + 22, y, inner - 22, 5)
    y += 2
  }
  y += 4

  // 4. Caixa de resumo (valor em destaque)
  doc.setFillColor(240, 247, 255)
  doc.setDrawColor(...COR)
  doc.setLineWidth(0.4)
  doc.roundedRect(mg, y, inner, 26, 3, 3, "FD")

  // Coluna esquerda: serviço, status, sessões
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(50, 50, 50)
  doc.text("Serviço:", mg + 5, y + 8)
  doc.setFont("helvetica", "normal")
  doc.text(doc.splitTextToSize(dados.produtoNome, inner / 2 - 26)[0] ?? dados.produtoNome, mg + 28, y + 8)

  doc.setFont("helvetica", "bold")
  doc.text("Status:", mg + 5, y + 15)
  doc.setFont("helvetica", "normal")
  doc.text(dados.statusLabel, mg + 28, y + 15)

  doc.setFont("helvetica", "bold")
  doc.text("Sessões:", mg + 5, y + 22)
  doc.setFont("helvetica", "normal")
  doc.text(`${dados.sessoesUsadas} de ${dados.quantidadeSessoes} usadas  •  ${dados.sessoesRestantes} restantes`, mg + 28, y + 22)

  // Coluna direita: valor total em destaque
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(80, 80, 80)
  doc.text("Valor Total", L - mg - 5, y + 9, { align: "right" })
  doc.setFontSize(17)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...COR)
  doc.text(fmtMoeda(dados.valorTotal), L - mg - 5, y + 18, { align: "right" })
  doc.setTextColor(0, 0, 0)

  y += 34

  // 5. Agendamentos
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...COR)
  doc.text("Agendamentos", mg, y)
  doc.setTextColor(0, 0, 0)
  y += 3

  autoTable(doc, {
    startY: y,
    head: [["Sessão", "Início", "Fim", "Status"]],
    body: dados.sessoes.length > 0
      ? dados.sessoes.map(s => [
          `${s.sessao}/${dados.quantidadeSessoes}`,
          fmtDataHora(s.inicio),
          fmtDataHora(s.fim),
          s.statusLabel,
        ])
      : [["—", "Nenhuma sessão", "", ""]],
    headStyles:   { fillColor: COR, fontSize: 9 },
    bodyStyles:   { fontSize: 9 },
    columnStyles: { 0: { halign: "center", cellWidth: 22 } },
    margin: { left: mg, right: mg },
  })
  y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 30) + 8

  // 6. Financeiro (somente se houver)
  if (dados.financeiro) {
    if (y > 230) { doc.addPage(); y = 20 }
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...COR)
    doc.text("Financeiro", mg, y)
    doc.setTextColor(0, 0, 0)
    y += 3

    autoTable(doc, {
      startY: y,
      head: [["Nº", "Vencimento", "Valor", "Status", "Data Pag.", "Valor Pago"]],
      body: dados.financeiro.parcelas.map(p => [
        String(p.numeroParcela),
        fmtData(p.dataVencimento),
        fmtMoeda(p.valor),
        p.statusLabel,
        p.dataPagamento ? fmtData(p.dataPagamento) : "—",
        p.valorPago != null ? fmtMoeda(p.valorPago) : "—",
      ]),
      foot: [["", "", "", "", "Total", fmtMoeda(dados.financeiro.totalGeral)]],
      headStyles:   { fillColor: COR, fontSize: 9 },
      footStyles:   { fillColor: [235, 240, 255], textColor: [0, 0, 0], fontStyle: "bold", fontSize: 9 },
      bodyStyles:   { fontSize: 9 },
      columnStyles: { 0: { halign: "center", cellWidth: 12 }, 2: { halign: "right" }, 5: { halign: "right" } },
      margin: { left: mg, right: mg },
    })
    y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 40) + 8
  }

  // 7. Total por extenso
  if (y > 270) { doc.addPage(); y = 20 }
  doc.setFontSize(8)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(100, 100, 100)
  doc.text(`Total por extenso: ${numeroPorExtenso(dados.valorTotal)}`, mg, y)
  doc.setTextColor(0, 0, 0)
  y += 8

  // 8. Observação
  if (dados.observacao) {
    if (y > 260) { doc.addPage(); y = 20 }
    doc.setFillColor(245, 245, 245)
    doc.rect(mg, y - 3, inner, 7, "F")
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("OBSERVAÇÃO", mg + 2, y + 1.5)
    y += 9
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    blocoTexto(doc, dados.observacao, mg + 2, y, inner - 4, 5)
  }

  return doc.output("datauristring").split(",")[1]
}
