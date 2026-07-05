import { useEffect, useState }                                     from "react"
import { useNavigate, useParams }                                   from "react-router-dom"
import axios                                                        from "axios"
import { api }                                                      from "../../services/api"
import type {
  PedidoResponse,
  PedidoProdutoResponse,
  StatusPedido,
  TipoPedidoSummary,
} from "../../types/Pedido"
import type { ErrorResponse }                                       from "../../types/ErrorResponse"
import { TPage }                                                    from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter }  from "../../components/tform"
import { TRow }                                                     from "../../components/trow"
import { TCol }                                                     from "../../components/tcol"
import { TEntry }                                                   from "../../components/tentry"
import { TCombo }                                                   from "../../components/tcombo"
import { TSpace }                                                   from "../../components/tspace"
import { TPanel }                                                   from "../../components/tpanel"
import { TButton }                                                  from "../../components/tbutton"
import { TWindow }                                                  from "../../components/twindow"
import { TDate }                                                    from "../../components/tdate"
import { TText }                                                    from "../../components/ttext"
import { TDbCombo }                                                 from "../../components/tdbcombo"
import { TDataGrid }                                                from "../../components/tdatagrid"
import type { TDataGridColumn }                                     from "../../types/TDataGridColumn"
import { useMessage }                                               from "../../hooks/useMessage"
import { displayPessoa, displayEmitente }                           from "../../utils/pessoas"
import { gerarPdfFaturamento }                                      from "../../utils/geradorPdf"
import { useQuestion }                                              from "../../hooks/useQuestion"

function baixarPdf(base64: string, nomeArquivo: string) {
  const link = document.createElement("a")
  link.href = `data:application/pdf;base64,${base64}`
  link.download = nomeArquivo
  link.click()
}

function toInputDate(iso: string | null | undefined) {
  return iso ? iso.substring(0, 10) : ""
}
function fromInputDate(val: string) {
  return val ? `${val}T00:00:00` : null
}
function todayDate() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}
function fmtMoeda(v: number | null | undefined) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}
function fmtQtd(v: number) {
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 3 })
}

function calcTotal(
  precoUnitario: number, quantidade: number,
  tipoAjuste: string | null, tipoCalculo: string | null, valorAjuste: number | null
): number {
  const base = precoUnitario * quantidade
  if (!tipoAjuste || valorAjuste == null) return base
  const ajuste = tipoCalculo === "PERCENTUAL" ? base * valorAjuste / 100 : valorAjuste
  return tipoAjuste === "DESCONTO" ? base - ajuste : base + ajuste
}

function fmtAjuste(tipoAjuste: string | null, tipoCalculo: string | null, valorAjuste: number | null) {
  if (!tipoAjuste || valorAjuste == null) return "—"
  const sinal = tipoAjuste === "DESCONTO" ? "−" : "+"
  const valor = tipoCalculo === "PERCENTUAL" ? `${valorAjuste}%` : fmtMoeda(valorAjuste)
  return `${sinal} ${valor}`
}

const STATUS_LABEL: Record<StatusPedido, string> = {
  ABERTO:            "Aberto",
  CONCLUIDO:         "Concluído",
  CANCELADO:         "Cancelado",
  DEVOLVIDO:         "Devolvido",
  DEVOLVIDO_PARCIAL: "Parcialmente devolvido",
}
const STATUS_COLOR: Record<StatusPedido, string> = {
  ABERTO:            "bg-blue-100 text-blue-800 border-blue-200",
  CONCLUIDO:         "bg-green-100 text-green-800 border-green-200",
  CANCELADO:         "bg-red-100 text-red-800 border-red-200",
  DEVOLVIDO:         "bg-orange-100 text-orange-800 border-orange-200",
  DEVOLVIDO_PARCIAL: "bg-amber-100 text-amber-800 border-amber-200",
}

const OPCOES_AJUSTE = [
  { value: "",          label: "Nenhum"    },
  { value: "DESCONTO",  label: "Desconto"  },
  { value: "ACRESCIMO", label: "Acréscimo" },
]
const OPCOES_CALCULO = [
  { value: "FIXO",       label: "Valor fixo (R$)" },
  { value: "PERCENTUAL", label: "Percentual (%)"  },
]

const colsProduto: TDataGridColumn<PedidoProdutoResponse>[] = [
  { label: "Produto",     field: "produtoNome" },
  { label: "Emitente",    field: "emitenteNome", width: "150px" },
  { label: "Qtd.",        width: "80px",  align: "right",
    render: r => <span>{fmtQtd(r.quantidade)}</span> },
  { label: "Preço Unit.", width: "120px", align: "right",
    render: r => <span>{fmtMoeda(r.precoUnitario)}</span> },
  { label: "Ajuste",      width: "130px", align: "right",
    render: r => <span>{fmtAjuste(r.tipoAjuste, r.tipoCalculo, r.valorAjuste)}</span> },
  { label: "Total",       width: "120px", align: "right",
    render: r => <span>{fmtMoeda(r.total)}</span> },
]

interface ProdutoModal {
  open:         boolean
  editId:       number | null
  produtoId:    string
  quantidade:   string
  preco:        string
  loadingPreco: boolean
  tipoAjuste:   string
  tipoCalculo:  string
  valorAjuste:  string
  saving:       boolean
}

const emptyProduto: ProdutoModal = {
  open: false, editId: null, produtoId: "", quantidade: "1",
  preco: "0", loadingPreco: false,
  tipoAjuste: "", tipoCalculo: "FIXO", valorAjuste: "", saving: false,
}

export default function PedidoForm() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [formKey,   setFormKey]   = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [pedido,    setPedido]    = useState<PedidoResponse | null>(null)
  const [currentId, setCurrentId] = useState<string | undefined>(idParam)

  const [tiposPedido, setTiposPedido] = useState<TipoPedidoSummary[]>([])

  const [emitenteId,   setEmitenteId]   = useState("")
  const [pessoaId,     setPessoaId]     = useState("")
  const [tipoPedidoId, setTipoPedidoId] = useState("")
  const [vendedorId,   setVendedorId]   = useState("")
  const [dataPedido,   setDataPedido]   = useState(todayDate())
  const [dataEntrega,  setDataEntrega]  = useState("")

  const [tipoAjusteGeral,  setTipoAjusteGeral]  = useState("")
  const [tipoCalculoGeral, setTipoCalculoGeral] = useState("FIXO")
  const [valorAjusteGeral, setValorAjusteGeral] = useState("")

  const [produtoModal, setProdutoModal] = useState<ProdutoModal>(emptyProduto)
  const [cancelModal,  setCancelModal]  = useState(false)
  const [motivoCancel, setMotivoCancel] = useState("")
  const [cancelStatus, setCancelStatus] = useState("CANCELADO")
  const [canceling,    setCanceling]    = useState(false)
  const [devTipo,      setDevTipo]      = useState<"TOTAL" | "PARCIAL">("TOTAL")
  const [devItens,     setDevItens]     = useState<Record<number, string>>({})
  const [devolveCredito, setDevolveCredito] = useState(true)

  // Configuração "Faturar ao concluir": SIM | NAO | PERGUNTAR (fallback PERGUNTAR)
  const [faturarConfig, setFaturarConfig] = useState<"SIM" | "NAO" | "PERGUNTAR">("PERGUNTAR")

  const isEdit   = !!currentId
  const isClosed = pedido?.status === "CONCLUIDO" || pedido?.status === "CANCELADO"
                || pedido?.status === "DEVOLVIDO" || pedido?.status === "DEVOLVIDO_PARCIAL"

  useEffect(() => {
    api.get<TipoPedidoSummary[]>("/tipos-pedido/ativos")
      .then(r => setTiposPedido(r.data))
      .catch(() => {})
  }, [])

  // Carrega a configuração "Faturar ao concluir" (fallback PERGUNTAR quando não há registro)
  useEffect(() => {
    api.get("/pedidos/configuracao")
      .then(r => {
        if (r.data?.faturarAoConcluir) setFaturarConfig(r.data.faturarAoConcluir)
        setDevolveCredito(r.data?.devolucaoGerarCredito !== "NAO")
      })
      .catch(() => {})
  }, [])

  // Pré-carrega o vendedor com o usuário logado (somente ao criar um novo pedido)
  useEffect(() => {
    if (idParam) return
    api.get("/usuarios/me")
      .then(r => { if (r.data?.id) setVendedorId(String(r.data.id)) })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!currentId) { setPedido(null); return }
    setLoading(true)
    api.get<PedidoResponse>(`/pedidos/${currentId}`)
      .then(r => loadPedido(r.data))
      .catch(() => { showMessage("error", "Erro ao carregar pedido"); navigate("/pedidos") })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  function loadPedido(data: PedidoResponse) {
    setPedido(data)
    setEmitenteId(String(data.emitenteId))
    setPessoaId(String(data.pessoaId))
    setTipoPedidoId(String(data.tipoPedidoId))
    setVendedorId(data.vendedorId ? String(data.vendedorId) : "")
    setDataPedido(toInputDate(data.dataPedido) || todayDate())
    setDataEntrega(toInputDate(data.dataEntrega))
    setTipoAjusteGeral(data.tipoAjusteGeral ?? "")
    setTipoCalculoGeral(data.tipoCalculoGeral ?? "FIXO")
    setValorAjusteGeral(data.valorAjusteGeral != null ? String(data.valorAjusteGeral) : "")
    setFormKey(k => k + 1)
  }

  async function reload(id: string) {
    const r = await api.get<PedidoResponse>(`/pedidos/${id}`)
    loadPedido(r.data)
  }

  function handleNovo() {
    setCurrentId(undefined)
    setPedido(null)
    setEmitenteId("")
    setPessoaId("")
    setTipoPedidoId("")
    setDataPedido(todayDate())
    setDataEntrega("")
    setTipoAjusteGeral("")
    setTipoCalculoGeral("FIXO")
    setValorAjusteGeral("")
    api.get("/usuarios/me").then(r => { if (r.data?.id) setVendedorId(String(r.data.id)) }).catch(() => {})
    setFormKey(k => k + 1)
  }

  async function handleSubmit(data: Record<string, string>) {
    if (!tipoPedidoId) { showMessage("error", "Tipo de pedido é obrigatório"); return }
    if (!pessoaId)     { showMessage("error", "Pessoa é obrigatória");         return }
    if (!emitenteId)   { showMessage("error", "Emitente é obrigatório");       return }
    if (!dataPedido)   { showMessage("error", "Data do pedido é obrigatória"); return }
    setSaving(true)
    try {
      const base = {
        emitenteId:   Number(emitenteId),
        pessoaId:     Number(pessoaId),
        tipoPedidoId: Number(tipoPedidoId),
        vendedorId:   vendedorId ? Number(vendedorId) : null,
        dataPedido:   fromInputDate(dataPedido),
        dataEntrega:  dataEntrega ? fromInputDate(dataEntrega) : null,
        observacao:   data.observacao?.trim() || null,
      }
      if (isEdit) {
        await api.put(`/pedidos/${currentId}`, {
          ...base,
          tipoAjusteGeral:  tipoAjusteGeral  || null,
          tipoCalculoGeral: tipoAjusteGeral  ? tipoCalculoGeral : null,
          valorAjusteGeral: tipoAjusteGeral && valorAjusteGeral ? Number(valorAjusteGeral) : null,
        })
        showMessage("success", "Pedido atualizado com sucesso!")
        await reload(currentId!)
      } else {
        const res = await api.post<PedidoResponse>("/pedidos", { ...base, produtos: [] })
        const novoId = String(res.data.id)
        showMessage("success", "Pedido criado com sucesso!")
        setCurrentId(novoId)
        await reload(novoId)
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao salvar pedido")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Ações de status ────────────────────────────────────────────────────────

  function irParaFaturamento(total: number) {
    const itens = (pedido!.produtos ?? []).map(p => ({
      descricao: p.produtoNome, tipo: "Produto",
      quantidade: p.quantidade, precoUnitario: p.precoUnitario, total: p.total,
    }))
    navigate(`/pedidos/${currentId}/faturamento`, {
      state: {
        pessoaId:          pedido!.pessoaId,
        pessoaNome:        pedido!.pessoaNome,
        pessoaDocumento:   pedido!.pessoaDocumento  ?? null,
        emitenteId:        pedido!.emitenteId,
        emitenteNome:      pedido!.emitenteNome,
        emitenteDocumento: pedido!.emitenteDocumento ?? null,
        geraFinanceiro:    pedido!.geraFinanceiro,
        totalGeral:        total,
        itens,
      }
    })
  }

  async function concluirSemFaturar() {
    try {
      await api.patch(`/pedidos/${currentId}/concluir`)
      showMessage("success", "Pedido concluído!")
      await reload(currentId!)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao concluir")
      }
    }
  }

  async function handleGerarPdf() {
    if (!pedido) return
    const itens = (pedido.produtos ?? []).map(p => ({
      descricao: p.produtoNome, tipo: "Produto",
      quantidade: p.quantidade, precoUnitario: p.precoUnitario, total: p.total,
    }))
    let parcelas: {
      numeroParcela: number; dataVencimento: string; valor: string
      pago: boolean; dataPagamento: string; valorPago: string
    }[] = []
    if (pedido.faturado && pedido.contaId && pedido.geraFinanceiro !== "NENHUM") {
      const base = pedido.geraFinanceiro === "CONTAS_PAGAR"
        ? "/financeiro/contas-pagar"
        : "/financeiro/contas-receber"
      try {
        const r = await api.get(`${base}/${pedido.contaId}`)
        parcelas = (r.data?.parcelas ?? []).map((pp: Record<string, unknown>) => ({
          numeroParcela:  Number(pp.numeroParcela),
          dataVencimento: String(pp.dataVencimento ?? ""),
          valor:          String(pp.valor ?? "0"),
          pago:           pp.status === "PAGO",
          dataPagamento:  pp.dataPagamento ? String(pp.dataPagamento) : "",
          valorPago:      pp.valorPago != null ? String(pp.valorPago) : "",
        }))
      } catch { /* segue sem parcelas */ }
    }
    const pdf = gerarPdfFaturamento({
      consultaId:        pedido.id,
      tituloDoc:         "RESUMO DO PEDIDO",
      referenciaLabel:   "Pedido",
      pessoaLabel:       "Pessoa",
      emitenteNome:      pedido.emitenteNome      ?? "Emitente",
      emitenteDocumento: pedido.emitenteDocumento ?? null,
      pessoaNome:        pedido.pessoaNome,
      pessoaDocumento:   pedido.pessoaDocumento   ?? null,
      descricao:         `Pedido #${pedido.id}`,
      data:              new Date().toISOString().slice(0, 10),
      parcelas,
      totalGeral,
      itens,
      devolucoes,
      totalLiquido,
    })
    baixarPdf(pdf, `pedido-${pedido.id}.pdf`)
  }

  function handleConcluir(total: number) {
    const gera = pedido?.geraFinanceiro ?? "NENHUM"
    // Tipo de pedido que não gera financeiro: concluir é terminal.
    if (gera === "NENHUM") { concluirSemFaturar(); return }
    if (faturarConfig === "NAO") { concluirSemFaturar(); return }
    if (faturarConfig === "PERGUNTAR") {
      ask("Deseja faturar o pedido agora?", [
        { label: "Apenas concluir", variant: "cancel",  onClick: () => concluirSemFaturar() },
        { label: "Faturar",         variant: "confirm", onClick: () => irParaFaturamento(total) },
      ])
      return
    }
    irParaFaturamento(total)
  }

  function fecharCancelModal() {
    setCancelModal(false)
    setMotivoCancel("")
    setCancelStatus("CANCELADO")
    setDevTipo("TOTAL")
    setDevItens({})
  }

  function abrirCancelModal() {
    setCancelStatus(pedido?.status === "DEVOLVIDO_PARCIAL" ? "DEVOLUCAO" : "CANCELADO")
    setDevTipo("TOTAL")
    setDevItens({})
    setMotivoCancel("")
    setCancelModal(true)
  }

  async function handleCancelar() {
    setCanceling(true)
    try {
      await api.patch(`/pedidos/${currentId}/cancelar`, { motivo: motivoCancel, status: cancelStatus })
      showMessage("success", "Pedido cancelado!")
      fecharCancelModal()
      await reload(currentId!)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao cancelar")
      }
    } finally {
      setCanceling(false)
    }
  }

  async function handleDevolver() {
    let payload: { tipo: string; motivo: string; itens: { pedidoProdutoId: number; quantidade: number }[] }
    if (devTipo === "TOTAL") {
      payload = { tipo: "TOTAL", motivo: motivoCancel, itens: [] }
    } else {
      const itens = (pedido?.produtos ?? [])
        .map(p => ({ pedidoProdutoId: p.id, quantidade: parseFloat(devItens[p.id] ?? "0") || 0 }))
        .filter(it => it.quantidade > 0)
      if (itens.length === 0) {
        showMessage("error", "Informe a quantidade a devolver de ao menos um produto")
        return
      }
      payload = { tipo: "PARCIAL", motivo: motivoCancel, itens }
    }
    setCanceling(true)
    try {
      await api.patch(`/pedidos/${currentId}/devolver`, payload)
      showMessage("success", "Devolução registrada!")
      fecharCancelModal()
      await reload(currentId!)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao registrar devolução")
      }
    } finally {
      setCanceling(false)
    }
  }

  // ── Produtos ───────────────────────────────────────────────────────────────

  function openNovoProduto() {
    setProdutoModal({ ...emptyProduto, open: true })
  }

  function openEditProduto(p: PedidoProdutoResponse) {
    setProdutoModal({
      open:         true,
      editId:       p.id,
      produtoId:    String(p.produtoId),
      quantidade:   String(p.quantidade),
      preco:        String(p.precoUnitario),
      loadingPreco: false,
      tipoAjuste:   p.tipoAjuste  ?? "",
      tipoCalculo:  p.tipoCalculo ?? "FIXO",
      valorAjuste:  p.valorAjuste != null ? String(p.valorAjuste) : "",
      saving:       false,
    })
  }

  async function fetchPrecoEstoque(produtoId: string, emitenteId: string) {
    if (!produtoId || !emitenteId) return
    setProdutoModal(m => ({ ...m, loadingPreco: true }))
    try {
      const res = await api.get<{ precoVenda: number }>("/estoque/preco-venda", {
        params: { emitenteId: Number(emitenteId), produtoId: Number(produtoId) },
      })
      setProdutoModal(m => ({ ...m, preco: String(res.data.precoVenda ?? 0), loadingPreco: false }))
    } catch {
      setProdutoModal(m => ({ ...m, loadingPreco: false }))
    }
  }

  async function handleSalvarProduto() {
    if (!produtoModal.produtoId) { showMessage("error", "Selecione o produto"); return }
    if (!emitenteId)             { showMessage("error", "Informe o emitente no pedido"); return }
    setProdutoModal(m => ({ ...m, saving: true }))
    try {
      const payload = {
        produtoId:     Number(produtoModal.produtoId),
        emitenteId:    Number(emitenteId),
        quantidade:    Number(produtoModal.quantidade),
        precoUnitario: Number(produtoModal.preco),
        tipoAjuste:    produtoModal.tipoAjuste  || null,
        tipoCalculo:   produtoModal.tipoAjuste  ? produtoModal.tipoCalculo : null,
        valorAjuste:   produtoModal.tipoAjuste && produtoModal.valorAjuste
                          ? Number(produtoModal.valorAjuste) : null,
      }
      if (produtoModal.editId) {
        await api.put(`/pedidos/${currentId}/produtos/${produtoModal.editId}`, payload)
      } else {
        await api.post(`/pedidos/${currentId}/produtos`, payload)
      }
      showMessage("success", produtoModal.editId ? "Produto atualizado!" : "Produto adicionado!")
      setProdutoModal(emptyProduto)
      await reload(currentId!)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao salvar produto")
      }
      setProdutoModal(m => ({ ...m, saving: false }))
    }
  }

  async function handleRemoverProduto(p: PedidoProdutoResponse) {
    ask(`Remover "${p.produtoNome}" do pedido?`, [
      { label: "Cancelar", variant: "cancel",  onClick: () => {} },
      { label: "Remover",  variant: "confirm", onClick: async () => {
        try {
          await api.delete(`/pedidos/${currentId}/produtos/${p.id}`)
          showMessage("success", "Produto removido!")
          await reload(currentId!)
        } catch {
          showMessage("error", "Erro ao remover produto")
        }
      }},
    ])
  }

  // ── Cálculos do resumo ─────────────────────────────────────────────────────

  const produtos    = pedido?.produtos ?? []
  const subtotal    = produtos.reduce((acc, p) => acc + p.total, 0)
  const valorAjusteGeralNum = valorAjusteGeral ? Number(valorAjusteGeral) : null
  const totalGeral  = calcTotal(subtotal, 1, tipoAjusteGeral || null, tipoCalculoGeral, valorAjusteGeralNum)

  // Devoluções por produto — valor de venda devolvido, rateando o ajuste geral
  const ratioGeral     = subtotal > 0 ? totalGeral / subtotal : 1
  const devolucoes     = produtos
    .filter(p => (p.quantidadeDevolvida ?? 0) > 0)
    .map(p => ({
      produtoNome: p.produtoNome,
      quantidade:  p.quantidadeDevolvida,
      valor: Math.round(
        calcTotal(p.precoUnitario, p.quantidadeDevolvida, p.tipoAjuste, p.tipoCalculo, p.valorAjuste)
        * ratioGeral * 100) / 100,
    }))
  const totalDevolvido = devolucoes.reduce((acc, d) => acc + d.valor, 0)
  const totalLiquido   = Math.round((totalGeral - totalDevolvido) * 100) / 100

  const podeFaturar = isEdit && pedido?.status === "CONCLUIDO" && !pedido?.faturado && pedido?.geraFinanceiro !== "NENHUM"

  const tipoOptions = [
    { value: "", label: "Selecione o tipo..." },
    ...tiposPedido.map(t => ({ value: String(t.id), label: t.nome })),
    ...(pedido && !tiposPedido.some(t => t.id === pedido.tipoPedidoId)
        ? [{ value: String(pedido.tipoPedidoId), label: pedido.tipoPedidoNome }]
        : []),
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <TPage title="Carregando..." breadcrumb={["Pedidos", "Venda PDV"]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title     ={isEdit ? "Pedido" : "Novo Pedido"}
      breadcrumb={["Pedidos", "Venda PDV", isEdit ? "Editar" : "Novo"]}
    >
      {/* Banner de status */}
      {pedido && (
        <div className={`mb-4 px-4 py-2 rounded-lg border text-sm font-medium ${STATUS_COLOR[pedido.status]}`}>
          Status: {STATUS_LABEL[pedido.status]}
          {pedido.motivoCancelamento && (
            <span className="ml-2 font-normal">— Motivo: {pedido.motivoCancelamento}</span>
          )}
        </div>
      )}

      <TForm key={formKey} onSubmit={handleSubmit}>
        {/* ── Info básica ── */}
        <TRow>
          <TCol>
            <TDbCombo
              name         ="emitenteId"
              label        ="Emitente (*)"
              url          ="/emitentes/select"
              valueField   ="id"
              displayField ={displayEmitente}
              searchField  ="nome"
              placeholder  ="Selecione o emitente..."
              required
              width        ="50%"
              minWidth     ="200px"
              disabled     ={isClosed}
              value        ={emitenteId}
              onChange     ={(val) => setEmitenteId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TCombo
              key          ={`tipo_${tiposPedido.length}_${tipoPedidoId}`}
              name         ="tipoPedidoId"
              label        ="Tipo de Pedido (*)"
              width        ="50%"
              minWidth     ="200px"
              disabled     ={isClosed}
              defaultValue ={tipoPedidoId}
              onChange     ={(val) => setTipoPedidoId(val)}
              options      ={tipoOptions}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="pessoaId"
              label        ="Pessoa (cliente/fornecedor) (*)"
              url          ="/pessoas/select"
              valueField   ="id"
              displayField ={displayPessoa}
              searchField  ="nome"
              placeholder  ="Selecione a pessoa..."
              required
              width        ="50%"
              minWidth     ="200px"
              disabled     ={isClosed}
              value        ={pessoaId}
              onChange     ={(val) => setPessoaId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="vendedorId"
              label        ="Vendedor"
              url          ="/usuarios/select-personal"
              valueField   ="id"
              displayField ="nome"
              searchField  ="nome"
              placeholder  ="Selecione o vendedor..."
              width        ="50%"
              minWidth     ="200px"
              disabled     ={isClosed}
              value        ={vendedorId}
              onChange     ={(val) => setVendedorId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TDate
              name         ="dataPedido"
              label        ="Data do Pedido (*)"
              width        ="200px"
              disabled     ={isClosed}
              defaultValue ={dataPedido}
              onChange     ={(val) => setDataPedido(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TDate
              name         ="dataEntrega"
              label        ="Data de Entrega"
              width        ="200px"
              disabled     ={isClosed}
              defaultValue ={dataEntrega}
              onChange     ={(val) => setDataEntrega(val)}
            />
          </TCol>
          <TSpace />
        </TRow>
        <TRow>
          <TCol>
            <TText
              name        ="observacao"
              label       ="Observação"
              placeholder ="Observações sobre o pedido..."
              maxLength   ={2000}
              disabled    ={isClosed}
              defaultValue={pedido?.observacao ?? ""}
              width       ="50%"
              minWidth    ="200px"
              height      ="80px"
              resize      ="vertical"
            />
          </TCol>
        </TRow>

        {/* ── Produtos ── */}
        {isEdit && (
          <TPanel title={`Produtos${produtos.length ? ` (${produtos.length})` : ""}`}>
            {!isClosed && (
              <div className="mb-2">
                <TButton label="Adicionar Produto" variant="new" type="button" onClick={openNovoProduto} />
              </div>
            )}
            <TDataGrid
              columns      ={colsProduto}
              data         ={produtos}
              keyField     ="id"
              emptyMessage ="Nenhum produto adicionado"
              actionsWidth ={isClosed ? "0px" : "80px"}
              actions      ={isClosed ? undefined : (row) => (
                <>
                  <TButton label="" variant="edit"   onClick={(e) => { e?.stopPropagation(); openEditProduto(row) }} />
                  <TButton label="" variant="delete" onClick={(e) => { e?.stopPropagation(); handleRemoverProduto(row) }} />
                </>
              )}
            />
          </TPanel>
        )}

        {/* ── Resumo financeiro ── */}
        {isEdit && produtos.length > 0 && (
          <TPanel title="Resumo Financeiro">
            <div className="flex flex-col gap-1 text-sm">
              {produtos.map(p => (
                <div key={p.id} className="flex justify-between text-(--text-muted)">
                  <span>{p.produtoNome} × {fmtQtd(p.quantidade)}</span>
                  <span className="flex gap-4">
                    {p.tipoAjuste && (
                      <span className={p.tipoAjuste === "DESCONTO" ? "text-red-600" : "text-green-600"}>
                        {fmtAjuste(p.tipoAjuste, p.tipoCalculo, p.valorAjuste)}
                      </span>
                    )}
                    <span className="w-28 text-right">{fmtMoeda(p.total)}</span>
                  </span>
                </div>
              ))}

              <hr className="border-(--border) my-1" />

              <div className="flex justify-between font-medium text-(--text-primary)">
                <span>Subtotal</span>
                <span>{fmtMoeda(subtotal)}</span>
              </div>

              {/* Ajuste global */}
              {!isClosed ? (
                <div className="mt-2 flex flex-wrap items-end gap-3">
                  <TCombo
                    name         ="tipoAjusteGeral"
                    label        ="Ajuste geral"
                    width        ="160px"
                    defaultValue ={tipoAjusteGeral}
                    onChange     ={setTipoAjusteGeral}
                    options      ={OPCOES_AJUSTE}
                  />
                  {tipoAjusteGeral && (
                    <>
                      <TCombo
                        name         ="tipoCalculoGeral"
                        label        ="Tipo"
                        width        ="160px"
                        defaultValue ={tipoCalculoGeral}
                        onChange     ={setTipoCalculoGeral}
                        options      ={OPCOES_CALCULO}
                      />
                      <TEntry
                        name         ="valorAjusteGeral"
                        label        ={tipoCalculoGeral === "PERCENTUAL" ? "Percentual (%)" : "Valor (R$)"}
                        mask         ="numerodecimal"
                        width        ="150px"
                        defaultValue ={valorAjusteGeral}
                        onChange     ={setValorAjusteGeral}
                      />
                    </>
                  )}
                </div>
              ) : (
                tipoAjusteGeral && (
                  <div className="flex justify-between text-(--text-muted)">
                    <span>
                      {tipoAjusteGeral === "DESCONTO" ? "Desconto" : "Acréscimo"} geral{" "}
                      ({tipoCalculoGeral === "PERCENTUAL" ? `${valorAjusteGeral}%` : "fixo"})
                    </span>
                    <span className={tipoAjusteGeral === "DESCONTO" ? "text-red-600" : "text-green-600"}>
                      {fmtAjuste(tipoAjusteGeral, tipoCalculoGeral, valorAjusteGeralNum)}
                    </span>
                  </div>
                )
              )}

              <hr className="border-(--border) my-1" />
              <div className="flex justify-between text-base font-bold text-(--accent)">
                <span>Total Geral</span>
                <span>{fmtMoeda(totalGeral)}</span>
              </div>

              {devolucoes.length > 0 && (
                <>
                  <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
                    Devoluções
                  </div>
                  {devolucoes.map((d, i) => (
                    <div key={i} className="flex justify-between text-(--text-muted)">
                      <span>{d.produtoNome} × {fmtQtd(d.quantidade)} (devolvido)</span>
                      <span className="text-red-600 w-28 text-right">− {fmtMoeda(d.valor)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium text-red-600">
                    <span>Total devolvido</span>
                    <span>− {fmtMoeda(totalDevolvido)}</span>
                  </div>
                  <hr className="border-(--border) my-1" />
                  <div className="flex justify-between text-base font-bold text-(--accent)">
                    <span>Total líquido</span>
                    <span>{fmtMoeda(totalLiquido)}</span>
                  </div>
                </>
              )}
            </div>
          </TPanel>
        )}

        {/* ── Auditoria ── */}
        {isEdit && pedido && (
          <TRow>
            <TCol>
              <TEntry name="createdByNome" label="Criado por" disabled
                defaultValue={pedido.createdByNome ?? "—"} />
            </TCol>
            <TCol>
              <TEntry name="createdAt" label="Criado em" disabled width="180px"
                defaultValue={pedido.createdAt ? new Date(pedido.createdAt).toLocaleString("pt-BR") : "—"} />
            </TCol>
            <TSpace />
          </TRow>
        )}

        {/* ── Rodapé ── */}
        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Voltar" variant="cancel" onClick={() => navigate("/pedidos")} />
            <TButton label="Novo"   variant="new"    onClick={handleNovo} />
            {isEdit && (
              <TButton label="Gerar PDF" type="button" onClick={handleGerarPdf} />
            )}
          </TFormActionsLeft>
          <TFormActionsRight>
            {isEdit && pedido && (pedido.status === "ABERTO" || pedido.status === "CONCLUIDO" || pedido.status === "DEVOLVIDO_PARCIAL") && (
              <TButton label="Cancelar / Devolver" variant="cancel" onClick={abrirCancelModal} />
            )}
            {isEdit && pedido?.status === "ABERTO" && (
              <TButton label="Concluir" variant="save" onClick={() => handleConcluir(totalGeral)} />
            )}
            {podeFaturar && (
              <TButton label="Faturar" variant="save" onClick={() => irParaFaturamento(totalGeral)} />
            )}
            {!isClosed && (
              <TButton label="Salvar" variant="save" type="submit" loading={saving} />
            )}
          </TFormActionsRight>
        </TFormFooter>
      </TForm>

      {/* ── Modal: cancelar / devolver pedido ────────────────────────────── */}
      <TWindow
        title   ="Cancelar / Devolver Pedido"
        open    ={cancelModal}
        onClose ={fecharCancelModal}
        width   ="480px"
        actions ={
          <>
            <TButton label="Voltar" variant="cancel" onClick={fecharCancelModal} />
            <TButton
              label   ={cancelStatus === "DEVOLUCAO" ? "Confirmar Devolução" : "Confirmar Cancelamento"}
              variant ="save"
              loading ={canceling}
              onClick ={cancelStatus === "DEVOLUCAO" ? handleDevolver : handleCancelar}
            />
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <TCombo
            key         ={`cancel-status-${cancelModal}-${pedido?.status}`}
            name        ="cancelStatus"
            label       ="Status"
            defaultValue={cancelStatus}
            onChange    ={setCancelStatus}
            options     ={
              pedido?.status === "DEVOLVIDO_PARCIAL"
                ? [{ value: "DEVOLUCAO", label: "Devolução" }]
                : pedido?.status === "CONCLUIDO"
                  ? [{ value: "CANCELADO", label: "Cancelado" }, { value: "DEVOLUCAO", label: "Devolução" }]
                  : [{ value: "CANCELADO", label: "Cancelado" }]
            }
          />

          {cancelStatus === "DEVOLUCAO" ? (
            <>
              <TCombo
                key         ={`dev-tipo-${cancelModal}`}
                name        ="devTipo"
                label       ="Tipo de devolução"
                defaultValue="TOTAL"
                onChange    ={(v) => setDevTipo(v === "PARCIAL" ? "PARCIAL" : "TOTAL")}
                options     ={[
                  { value: "TOTAL",   label: "Total (todos os produtos restantes)" },
                  { value: "PARCIAL", label: "Parcial (escolher quantidades)"      },
                ]}
              />

              {devTipo === "PARCIAL" && (
                <div className="flex flex-col gap-2 border border-(--border) rounded p-2 max-h-60 overflow-y-auto">
                  {(pedido?.produtos ?? []).map(p => {
                    const restante = p.quantidade - p.quantidadeDevolvida
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{p.produtoNome}</div>
                          <div className="text-xs text-(--text-muted)">Disponível: {fmtQtd(restante)}</div>
                        </div>
                        <input
                          type       ="number"
                          min        ="0"
                          max        ={restante}
                          step       ="0.001"
                          disabled   ={restante <= 0}
                          value      ={devItens[p.id] ?? ""}
                          onChange   ={e => setDevItens(prev => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder="0"
                          className  ="w-24 border border-(--border) rounded px-2 py-1 text-sm
                                       bg-(--bg-surface) text-(--text-primary) disabled:opacity-50
                                       focus:outline-none focus:ring-1 focus:ring-(--accent)"
                        />
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex flex-col gap-1">
                <span>⚠️ O estoque dos produtos devolvidos será <strong>retornado</strong>.</span>
                {pedido?.geraFinanceiro === "CONTAS_RECEBER" && devolveCredito && (
                  <span>Será gerado <strong>crédito</strong> para o cliente no valor devolvido.</span>
                )}
              </div>
            </>
          ) : (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex flex-col gap-1">
              <span>⚠️ Esta ação <strong>não poderá ser desfeita</strong>.</span>
              {pedido?.status === "CONCLUIDO" && (
                <span>O estoque movimentado por este pedido será <strong>estornado</strong>.</span>
              )}
              {pedido?.faturado && (
                <span>O <strong>faturamento</strong> deste pedido (parcelas e pagamentos já lançados) será <strong>excluído</strong>.</span>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm text-(--text-muted)">Motivo (opcional):</label>
            <textarea
              rows      ={3}
              maxLength ={500}
              value     ={motivoCancel}
              onChange  ={e => setMotivoCancel(e.target.value)}
              placeholder="Motivo..."
              className ="border border-(--border) rounded px-3 py-2 text-sm
                          bg-(--bg-surface) text-(--text-primary) resize-none
                          focus:outline-none focus:ring-1 focus:ring-(--accent) w-full"
            />
          </div>
        </div>
      </TWindow>

      {/* ── Modal: adicionar/editar produto ──────────────────────────────── */}
      <TWindow
        title   ={produtoModal.editId ? "Editar Produto" : "Adicionar Produto"}
        open    ={produtoModal.open}
        onClose ={() => setProdutoModal(emptyProduto)}
        width   ="560px"
        actions ={
          <>
            <TButton label="Cancelar" variant="cancel" onClick={() => setProdutoModal(emptyProduto)} />
            <TButton label="Salvar"   variant="save"   loading={produtoModal.saving} onClick={handleSalvarProduto} />
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <TDbCombo
            name         ="produto_produtoId"
            label        ="Produto (*)"
            url          ="/produtos/select"
            valueField   ="id"
            displayField ="nome"
            searchField  ="nome"
            placeholder  ="Buscar produto..."
            width        ="100%"
            extraParams  ={{ classificacao: "PRODUTO" }}
            value        ={produtoModal.produtoId}
            onChange     ={(val) => {
              setProdutoModal(m => ({ ...m, produtoId: val }))
              if (emitenteId) fetchPrecoEstoque(val, emitenteId)
            }}
          />
          <div className="flex gap-4 flex-wrap">
            <TEntry
              name        ="produto_quantidade"
              label       ="Quantidade (*)"
              mask        ="numerodecimal"
              width       ="130px"
              defaultValue={produtoModal.quantidade}
              onChange    ={(val) => setProdutoModal(m => ({ ...m, quantidade: val }))}
            />
            <TEntry
              key         ={`pp_${produtoModal.preco}`}
              name        ="produto_preco"
              label       ={produtoModal.loadingPreco ? "Preço (carregando...)" : "Preço Unitário"}
              mask        ="moeda"
              width       ="160px"
              defaultValue={produtoModal.preco}
              onChange    ={(val) => setProdutoModal(m => ({ ...m, preco: val }))}
            />
          </div>
          {/* Ajuste por item */}
          <div className="flex gap-3 flex-wrap items-end">
            <TCombo
              name         ="produto_tipoAjuste"
              label        ="Ajuste"
              width        ="150px"
              defaultValue ={produtoModal.tipoAjuste}
              onChange     ={(val) => setProdutoModal(m => ({ ...m, tipoAjuste: val, valorAjuste: "" }))}
              options      ={OPCOES_AJUSTE}
            />
            {produtoModal.tipoAjuste && (
              <>
                <TCombo
                  name         ="produto_tipoCalculo"
                  label        ="Tipo"
                  width        ="155px"
                  defaultValue ={produtoModal.tipoCalculo}
                  onChange     ={(val) => setProdutoModal(m => ({ ...m, tipoCalculo: val }))}
                  options      ={OPCOES_CALCULO}
                />
                <TEntry
                  name         ="produto_valorAjuste"
                  label        ={produtoModal.tipoCalculo === "PERCENTUAL" ? "Percentual (%)" : "Valor (R$)"}
                  mask         ="numerodecimal"
                  width        ="130px"
                  defaultValue ={produtoModal.valorAjuste}
                  onChange     ={(val) => setProdutoModal(m => ({ ...m, valorAjuste: val }))}
                />
              </>
            )}
          </div>
          {/* Preview do total */}
          {produtoModal.produtoId && (
            <div className="text-sm text-right text-(--text-muted)">
              Total estimado:{" "}
              <span className="font-semibold text-(--text-primary)">
                {fmtMoeda(calcTotal(
                  Number(produtoModal.preco), Number(produtoModal.quantidade),
                  produtoModal.tipoAjuste || null, produtoModal.tipoCalculo,
                  produtoModal.valorAjuste ? Number(produtoModal.valorAjuste) : null
                ))}
              </span>
            </div>
          )}
        </div>
      </TWindow>
    </TPage>
  )
}
