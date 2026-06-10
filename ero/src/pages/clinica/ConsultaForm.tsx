import { useEffect, useState }                                     from "react"
import { useNavigate, useParams }                                   from "react-router-dom"
import axios                                                        from "axios"
import { api }                                                      from "../../services/api"
import type {
  ConsultaResponse,
  ConsultaServicoResponse,
  ConsultaProdutoResponse,
  StatusConsulta,
} from "../../types/Clinica"
import type { FichaAnamnesesSummary } from "../../types/Anamnese"
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
import { TDateTime }                                                from "../../components/tdatetime"
import { TText }                                                    from "../../components/ttext"
import { TDbCombo }                                                 from "../../components/tdbcombo"
import { TDataGrid }                                                from "../../components/tdatagrid"
import type { TDataGridColumn }                                     from "../../types/TDataGridColumn"
import { useMessage }                                               from "../../hooks/useMessage"
import { displayPessoa, displayEmitente }                          from "../../utils/pessoas"
import { useQuestion }                                              from "../../hooks/useQuestion"

function toInputDT(iso: string | null | undefined) {
  if (!iso) return ""
  return iso.substring(0, 16)
}
function fromInputDT(val: string) {
  return val ? `${val}:00` : ""
}
function defaultDT(offsetHours = 0) {
  const d = new Date()
  d.setHours(d.getHours() + offsetHours, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`
}
function fmtMoeda(v: number | null | undefined) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}
function fmtQtd(v: number) {
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 3 })
}

function calcTotal(
  precoUnitario: number,
  quantidade: number,
  tipoAjuste: string | null,
  tipoCalculo: string | null,
  valorAjuste: number | null
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

const STATUS_LABEL: Record<StatusConsulta, string> = {
  AGENDADA:       "Agendada",
  EM_ATENDIMENTO: "Em Atendimento",
  CONCLUIDA:      "Concluída",
  CANCELADA:      "Cancelada",
}
const STATUS_COLOR: Record<StatusConsulta, string> = {
  AGENDADA:       "bg-blue-100 text-blue-800 border-blue-200",
  EM_ATENDIMENTO: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONCLUIDA:      "bg-green-100 text-green-800 border-green-200",
  CANCELADA:      "bg-red-100 text-red-800 border-red-200",
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

const colsServico: TDataGridColumn<ConsultaServicoResponse>[] = [
  { label: "Serviço",     field: "produtoNome" },
  { label: "Qtd.",        width: "80px",  align: "right",
    render: r => <span>{fmtQtd(r.quantidade)}</span> },
  { label: "Preço Unit.", width: "120px", align: "right",
    render: r => <span>{fmtMoeda(r.precoUnitario)}</span> },
  { label: "Ajuste",      width: "130px", align: "right",
    render: r => <span>{fmtAjuste(r.tipoAjuste, r.tipoCalculo, r.valorAjuste)}</span> },
  { label: "Total",       width: "120px", align: "right",
    render: r => <span>{fmtMoeda(r.total)}</span> },
]

const colsProduto: TDataGridColumn<ConsultaProdutoResponse>[] = [
  { label: "Produto",     field: "produtoNome" },
  { label: "Emitente",   field: "emitenteNome", width: "150px" },
  { label: "Qtd.",        width: "80px",  align: "right",
    render: r => <span>{fmtQtd(r.quantidade)}</span> },
  { label: "Preço Unit.", width: "120px", align: "right",
    render: r => <span>{fmtMoeda(r.precoUnitario)}</span> },
  { label: "Ajuste",      width: "130px", align: "right",
    render: r => <span>{fmtAjuste(r.tipoAjuste, r.tipoCalculo, r.valorAjuste)}</span> },
  { label: "Total",       width: "120px", align: "right",
    render: r => <span>{fmtMoeda(r.total)}</span> },
]

interface ServicoModal {
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

interface ProdutoModal {
  open:         boolean
  editId:       number | null
  produtoId:    string
  emitenteId:   string
  quantidade:   string
  preco:        string
  loadingPreco: boolean
  tipoAjuste:   string
  tipoCalculo:  string
  valorAjuste:  string
  saving:       boolean
}

const emptyServico: ServicoModal = {
  open: false, editId: null, produtoId: "", quantidade: "1", preco: "0",
  loadingPreco: false,
  tipoAjuste: "", tipoCalculo: "FIXO", valorAjuste: "", saving: false,
}
const emptyProduto: ProdutoModal = {
  open: false, editId: null, produtoId: "", emitenteId: "", quantidade: "1",
  preco: "0", loadingPreco: false,
  tipoAjuste: "", tipoCalculo: "FIXO", valorAjuste: "", saving: false,
}

export default function ConsultaForm() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [formKey,      setFormKey]      = useState(0)
  const [loading,      setLoading]      = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [consulta,     setConsulta]     = useState<ConsultaResponse | null>(null)
  const [currentId,    setCurrentId]    = useState<string | undefined>(idParam)

  const [emitenteId,       setEmitenteId]       = useState("")
  const [pessoaId,         setPessoaId]         = useState("")
  const [fichaAnamneseId,  setFichaAnamneseId]  = useState("")
  const [fichaOptions,     setFichaOptions]     = useState<{ value: string; label: string }[]>([])
  const [tipoAjusteGeral,  setTipoAjusteGeral]  = useState("")
  const [tipoCalculoGeral, setTipoCalculoGeral] = useState("FIXO")
  const [valorAjusteGeral, setValorAjusteGeral] = useState("")

  // modais
  const [servicoModal, setServicoModal] = useState<ServicoModal>(emptyServico)
  const [produtoModal, setProdutoModal] = useState<ProdutoModal>(emptyProduto)
  const [cancelModal,  setCancelModal]  = useState(false)
  const [motivoCancel, setMotivoCancel] = useState("")
  const [canceling,    setCanceling]    = useState(false)
  const [reconsultaModal,  setReconsultaModal]  = useState(false)
  const [reconsultaInicio, setReconsultaInicio] = useState("")
  const [reconsultaFim,    setReconsultaFim]    = useState("")
  const [reconsultaSaving, setReconsultaSaving] = useState(false)

  const isEdit   = !!currentId
  const isClosed = consulta?.status === "CONCLUIDA" || consulta?.status === "CANCELADA"

  useEffect(() => {
    if (!currentId) { setConsulta(null); return }
    setLoading(true)
    api.get<ConsultaResponse>(`/consultas/${currentId}`)
      .then(r => loadConsulta(r.data))
      .catch(() => { showMessage("error", "Erro ao carregar consulta"); navigate("/clinica/consultas") })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  async function loadFichaOptions(pId: string) {
    if (!pId) { setFichaOptions([]); return }
    try {
      const r = await api.get<FichaAnamnesesSummary[]>(`/fichas-anamnese/por-pessoa/${pId}`)
      setFichaOptions(r.data.map(f => ({
        value: String(f.id),
        label: `${f.templateNome} — ${new Date(f.dataPreenchimento + "T00:00").toLocaleDateString("pt-BR")}`,
      })))
    } catch {
      setFichaOptions([])
    }
  }

  async function loadConsulta(data: ConsultaResponse) {
    setConsulta(data)
    setEmitenteId(String(data.emitenteId))
    setPessoaId(String(data.pessoaId))
    setFichaAnamneseId(data.fichaAnamneseId ? String(data.fichaAnamneseId) : "")
    setTipoAjusteGeral(data.tipoAjusteGeral ?? "")
    setTipoCalculoGeral(data.tipoCalculoGeral ?? "FIXO")
    setValorAjusteGeral(data.valorAjusteGeral != null ? String(data.valorAjusteGeral) : "")
    await loadFichaOptions(String(data.pessoaId))
    setFormKey(k => k + 1)
  }

  async function reload(id: string) {
    const r = await api.get<ConsultaResponse>(`/consultas/${id}`)
    await loadConsulta(r.data)
  }

  function handleNovo() {
    setCurrentId(undefined)
    setConsulta(null)
    setEmitenteId("")
    setPessoaId("")
    setFichaAnamneseId("")
    setFichaOptions([])
    setTipoAjusteGeral("")
    setTipoCalculoGeral("FIXO")
    setValorAjusteGeral("")
    setFormKey(k => k + 1)
  }

  async function handleSubmit(data: Record<string, string>) {
    if (!emitenteId) { showMessage("error", "Emitente é obrigatório"); return }
    if (!pessoaId)   { showMessage("error", "Paciente é obrigatório");  return }
    setSaving(true)
    try {
      const payload = {
        emitenteId:       Number(emitenteId),
        pessoaId:         Number(pessoaId),
        fichaAnamneseId:  fichaAnamneseId ? Number(fichaAnamneseId) : null,
        inicio:           fromInputDT(data.inicio),
        fim:              fromInputDT(data.fim),
        observacao:       data.observacao?.trim() || null,
        tipoAjusteGeral:  tipoAjusteGeral  || null,
        tipoCalculoGeral: tipoAjusteGeral  ? tipoCalculoGeral : null,
        valorAjusteGeral: tipoAjusteGeral && valorAjusteGeral ? Number(valorAjusteGeral) : null,
      }
      if (isEdit) {
        await api.put(`/consultas/${currentId}`, payload)
        showMessage("success", "Consulta atualizada com sucesso!")
        await reload(currentId!)
      } else {
        const res = await api.post<ConsultaResponse>("/consultas", payload)
        showMessage("success", "Consulta agendada com sucesso!")
        const novoId = String(res.data.id)
        setCurrentId(novoId)
        await reload(novoId)
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao salvar consulta")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Ações de status ────────────────────────────────────────────────────────

  async function handleIniciar() {
    ask("Iniciar o atendimento desta consulta?", [
      { label: "Cancelar", variant: "cancel",  onClick: () => {} },
      { label: "Iniciar",  variant: "confirm", onClick: async () => {
        try {
          await api.patch(`/consultas/${currentId}/iniciar`)
          showMessage("success", "Atendimento iniciado!")
          await reload(currentId!)
        } catch (err) {
          if (axios.isAxiosError(err)) {
            const d = err.response?.data as ErrorResponse
            showMessage("error", d?.erro ?? "Erro ao iniciar")
          }
        }
      }},
    ])
  }

  function handleConcluir(total: number) {
    navigate(`/clinica/consultas/${currentId}/faturamento`, {
      state: {
        pessoaId:          consulta!.pessoaId,
        pessoaNome:        consulta!.pessoaNome,
        pessoaDocumento:   consulta!.pessoaDocumento  ?? null,
        emitenteId:        consulta!.emitenteId       ?? null,
        emitenteNome:      consulta!.emitenteNome     ?? null,
        emitenteDocumento: consulta!.emitenteDocumento ?? null,
        totalGeral:        total,
      }
    })
  }

  async function handleCancelar() {
    setCanceling(true)
    try {
      await api.patch(`/consultas/${currentId}/cancelar`, { motivo: motivoCancel })
      showMessage("success", "Consulta cancelada!")
      setCancelModal(false)
      setMotivoCancel("")
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

  async function handleReconsulta() {
    if (!reconsultaInicio || !reconsultaFim) {
      showMessage("error", "Informe o horário da reconsulta")
      return
    }
    setReconsultaSaving(true)
    try {
      const res = await api.post<ConsultaResponse>(`/consultas/${currentId}/reconsuita`, {
        inicio: fromInputDT(reconsultaInicio),
        fim:    fromInputDT(reconsultaFim),
      })
      showMessage("success", "Reconsulta agendada com sucesso!")
      setReconsultaModal(false)
      setReconsultaInicio("")
      setReconsultaFim("")
      navigate(`/clinica/consultas/${res.data.id}`)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao gerar reconsulta")
      }
    } finally {
      setReconsultaSaving(false)
    }
  }

  // ── Serviços ───────────────────────────────────────────────────────────────

  function openNovoServico() {
    setServicoModal({ ...emptyServico, open: true })
  }

  function openEditServico(s: ConsultaServicoResponse) {
    setServicoModal({
      open:         true,
      editId:       s.id,
      produtoId:    String(s.produtoId),
      quantidade:   String(s.quantidade),
      preco:        String(s.precoUnitario),
      loadingPreco: false,
      tipoAjuste:   s.tipoAjuste  ?? "",
      tipoCalculo:  s.tipoCalculo ?? "FIXO",
      valorAjuste:  s.valorAjuste != null ? String(s.valorAjuste) : "",
      saving:       false,
    })
  }

  async function fetchPrecoEstoqueServico(produtoId: string) {
    if (!produtoId || !emitenteId) return
    setServicoModal(m => ({ ...m, loadingPreco: true }))
    try {
      const res = await api.get<{ precoVenda: number }>("/estoque/preco-venda", {
        params: { emitenteId: Number(emitenteId), produtoId: Number(produtoId) },
      })
      setServicoModal(m => ({ ...m, preco: String(res.data.precoVenda ?? 0), loadingPreco: false }))
    } catch {
      setServicoModal(m => ({ ...m, preco: "0", loadingPreco: false }))
    }
  }

  async function handleSalvarServico() {
    if (!servicoModal.produtoId) { showMessage("error", "Selecione o serviço"); return }
    setServicoModal(m => ({ ...m, saving: true }))
    try {
      const payload = {
        produtoId:     Number(servicoModal.produtoId),
        quantidade:    Number(servicoModal.quantidade),
        precoUnitario: Number(servicoModal.preco),
        tipoAjuste:    servicoModal.tipoAjuste  || null,
        tipoCalculo:   servicoModal.tipoAjuste  ? servicoModal.tipoCalculo : null,
        valorAjuste:   servicoModal.tipoAjuste && servicoModal.valorAjuste
                         ? Number(servicoModal.valorAjuste) : null,
      }
      if (servicoModal.editId) {
        await api.put(`/consultas/${currentId}/servicos/${servicoModal.editId}`, payload)
      } else {
        await api.post(`/consultas/${currentId}/servicos`, payload)
      }
      showMessage("success", servicoModal.editId ? "Serviço atualizado!" : "Serviço adicionado!")
      setServicoModal(emptyServico)
      await reload(currentId!)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao salvar serviço")
      }
      setServicoModal(m => ({ ...m, saving: false }))
    }
  }

  async function handleRemoverServico(s: ConsultaServicoResponse) {
    ask(`Remover o serviço "${s.produtoNome}"?`, [
      { label: "Cancelar", variant: "cancel",  onClick: () => {} },
      { label: "Remover",  variant: "confirm", onClick: async () => {
        try {
          await api.delete(`/consultas/${currentId}/servicos/${s.id}`)
          showMessage("success", "Serviço removido!")
          await reload(currentId!)
        } catch {
          showMessage("error", "Erro ao remover serviço")
        }
      }},
    ])
  }

  // ── Produtos consumidos ───────────────────────────────────────────────────

  function openNovoProduto() {
    setProdutoModal({ ...emptyProduto, open: true })
  }

  function openEditProduto(p: ConsultaProdutoResponse) {
    setProdutoModal({
      open:         true,
      editId:       p.id,
      produtoId:    String(p.produtoId),
      emitenteId:   String(p.emitenteId),
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
      setProdutoModal(m => ({ ...m, preco: "0", loadingPreco: false }))
    }
  }

  async function handleSalvarProduto() {
    if (!produtoModal.produtoId)  { showMessage("error", "Selecione o produto");  return }
    if (!produtoModal.emitenteId) { showMessage("error", "Selecione o emitente"); return }
    setProdutoModal(m => ({ ...m, saving: true }))
    try {
      const payload = {
        produtoId:   Number(produtoModal.produtoId),
        emitenteId:  Number(produtoModal.emitenteId),
        quantidade:  Number(produtoModal.quantidade),
        tipoAjuste:  produtoModal.tipoAjuste  || null,
        tipoCalculo: produtoModal.tipoAjuste  ? produtoModal.tipoCalculo : null,
        valorAjuste: produtoModal.tipoAjuste && produtoModal.valorAjuste
                       ? Number(produtoModal.valorAjuste) : null,
      }
      if (produtoModal.editId) {
        await api.put(`/consultas/${currentId}/produtos/${produtoModal.editId}`, payload)
      } else {
        await api.post(`/consultas/${currentId}/produtos`, payload)
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

  async function handleRemoverProduto(p: ConsultaProdutoResponse) {
    ask(`Remover "${p.produtoNome}" dos consumos?`, [
      { label: "Cancelar", variant: "cancel",  onClick: () => {} },
      { label: "Remover",  variant: "confirm", onClick: async () => {
        try {
          await api.delete(`/consultas/${currentId}/produtos/${p.id}`)
          showMessage("success", "Produto removido!")
          await reload(currentId!)
        } catch {
          showMessage("error", "Erro ao remover produto")
        }
      }},
    ])
  }

  // ── Cálculos do resumo ─────────────────────────────────────────────────────

  const servicos      = consulta?.servicos ?? []
  const produtos      = consulta?.produtos  ?? []
  const totalServicos = servicos.reduce((acc, s) => acc + s.total, 0)
  const totalProdutos = produtos.reduce((acc, p) => acc + p.total, 0)
  const subtotal      = totalServicos + totalProdutos

  const valorAjusteGeralNum = valorAjusteGeral ? Number(valorAjusteGeral) : null
  const totalGeral = calcTotal(subtotal, 1, tipoAjusteGeral || null, tipoCalculoGeral, valorAjusteGeralNum)

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <TPage title="Carregando..." breadcrumb={["Clínica", "Consultas"]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title     ={isEdit ? "Consulta" : "Nova Consulta"}
      breadcrumb={["Clínica", "Consultas", isEdit ? "Editar" : "Nova"]}
    >
      {/* Banner de status */}
      {consulta && (
        <div className={`mb-4 px-4 py-2 rounded-lg border text-sm font-medium ${STATUS_COLOR[consulta.status]}`}>
          Status: {STATUS_LABEL[consulta.status]}
          {consulta.motivoCancelamento && (
            <span className="ml-2 font-normal">— Motivo: {consulta.motivoCancelamento}</span>
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
              width        ="100%"
              disabled     ={isClosed}
              value        ={emitenteId}
              onChange     ={(val) => setEmitenteId(val)}
            />
          </TCol>
          <TSpace />
        </TRow>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="pessoaId"
              label        ="Paciente (*)"
              url          ="/pessoas/select"
              valueField   ="id"
              displayField ={displayPessoa}
              searchField  ="nome"
              placeholder  ="Selecione o paciente..."
              required
              width        ="100%"
              disabled     ={isClosed}
              value        ={pessoaId}
              onChange     ={(val) => {
                setPessoaId(val)
                setFichaAnamneseId("")
                loadFichaOptions(val)
              }}
            />
          </TCol>
          <TSpace />
        </TRow>

        {pessoaId && (
          <TRow>
            <TCol>
              <TCombo
                name         ="fichaAnamneseId"
                label        ="Ficha de Anamnese (opcional)"
                width        ="100%"
                disabled     ={isClosed}
                defaultValue ={fichaAnamneseId}
                onChange     ={(val) => setFichaAnamneseId(val)}
                options      ={[
                  { value: "", label: "Nenhuma" },
                  ...fichaOptions,
                ]}
              />
            </TCol>
            <TSpace />
          </TRow>
        )}

        <TPanel title="Horário">
          <TRow>
            <TCol>
              <TDateTime
                name         ="inicio"
                label        ="Início (*)"
                required
                disabled     ={isClosed}
                width        ="260px"
                defaultValue ={consulta ? toInputDT(consulta.inicio) : defaultDT(0)}
              />
            </TCol>
            <TCol>
              <TDateTime
                name         ="fim"
                label        ="Fim (*)"
                required
                disabled     ={isClosed}
                width        ="260px"
                defaultValue ={consulta ? toInputDT(consulta.fim) : defaultDT(1)}
              />
            </TCol>
            <TSpace />
          </TRow>
        </TPanel>

        <TRow>
          <TCol>
            <TText
              name        ="observacao"
              label       ="Observação"
              placeholder ="Observações sobre a consulta..."
              maxLength   ={2000}
              disabled    ={isClosed}
              defaultValue={consulta?.observacao ?? ""}
              width       ="100%"
              height      ="80px"
              resize      ="vertical"
            />
          </TCol>
          <TSpace />
        </TRow>

        {/* ── Serviços ── */}
        {isEdit && (
          <TPanel title={`Serviços${servicos.length ? ` (${servicos.length})` : ""}`}>
            {!isClosed && (
              <div className="mb-2">
                <TButton label="Adicionar Serviço" variant="new" type="button" onClick={openNovoServico} />
              </div>
            )}
            <TDataGrid
              columns      ={colsServico}
              data         ={servicos}
              keyField     ="id"
              emptyMessage ="Nenhum serviço adicionado"
              actionsWidth ={isClosed ? "0px" : "80px"}
              actions      ={isClosed ? undefined : (row) => (
                <>
                  <TButton label="" variant="edit"   onClick={(e) => { e?.stopPropagation(); openEditServico(row) }} />
                  <TButton label="" variant="delete" onClick={(e) => { e?.stopPropagation(); handleRemoverServico(row) }} />
                </>
              )}
            />
          </TPanel>
        )}

        {/* ── Produtos consumidos ── */}
        {isEdit && (
          <TPanel title={`Produtos Consumidos${produtos.length ? ` (${produtos.length})` : ""}`}>
            {!isClosed && (
              <div className="mb-2">
                <TButton label="Adicionar Produto" variant="new" type="button" onClick={openNovoProduto} />
              </div>
            )}
            <TDataGrid
              columns      ={colsProduto}
              data         ={produtos}
              keyField     ="id"
              emptyMessage ="Nenhum produto consumido"
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
        {isEdit && (servicos.length > 0 || produtos.length > 0) && (
          <TPanel title="Resumo Financeiro">
            <div className="flex flex-col gap-1 text-sm">
              {/* Linhas de serviços */}
              {servicos.map(s => (
                <div key={s.id} className="flex justify-between text-(--text-muted)">
                  <span>{s.produtoNome} × {fmtQtd(s.quantidade)}</span>
                  <span className="flex gap-4">
                    {s.tipoAjuste && (
                      <span className={s.tipoAjuste === "DESCONTO" ? "text-red-600" : "text-green-600"}>
                        {fmtAjuste(s.tipoAjuste, s.tipoCalculo, s.valorAjuste)}
                      </span>
                    )}
                    <span className="w-28 text-right">{fmtMoeda(s.total)}</span>
                  </span>
                </div>
              ))}
              {/* Linhas de produtos */}
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

              {/* Subtotal */}
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

              {/* Total geral */}
              <hr className="border-(--border) my-1" />
              <div className="flex justify-between text-base font-bold text-(--accent)">
                <span>Total Geral</span>
                <span>{fmtMoeda(totalGeral)}</span>
              </div>
            </div>
          </TPanel>
        )}

        {/* ── Auditoria ── */}
        {isEdit && consulta && (
          <TRow>
            <TCol>
              <TEntry name="createdByNome" label="Criado por" disabled
                defaultValue={consulta.createdByNome ?? "—"} />
            </TCol>
            <TCol>
              <TEntry name="createdAt" label="Criado em" disabled width="180px"
                defaultValue={consulta.createdAt ? new Date(consulta.createdAt).toLocaleString("pt-BR") : "—"} />
            </TCol>
            <TSpace />
          </TRow>
        )}

        {/* ── Rodapé ── */}
        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Voltar" variant="cancel" onClick={() => navigate("/clinica/consultas")} />
            <TButton label="Novo"   variant="new"    onClick={handleNovo} />
          </TFormActionsLeft>
          <TFormActionsRight>
            {isEdit && consulta?.status === "AGENDADA" && (
              <TButton label="Cancelar Consulta"   variant="cancel" onClick={() => setCancelModal(true)} />
            )}
            {isEdit && consulta?.status === "EM_ATENDIMENTO" && (
              <TButton label="Cancelar Consulta"   variant="cancel" onClick={() => setCancelModal(true)} />
            )}
            {isEdit && consulta?.status === "AGENDADA" && (
              <TButton label="Iniciar Atendimento" variant="save"   onClick={handleIniciar} />
            )}
            {isEdit && consulta?.status === "EM_ATENDIMENTO" && (
              <TButton label="Concluir"            variant="save"   onClick={() => handleConcluir(totalGeral)} />
            )}
            {isEdit && (consulta?.status === "CONCLUIDA" || consulta?.status === "EM_ATENDIMENTO") && (
              <TButton label="Gerar Reconsulta" variant="new" onClick={() => {
                setReconsultaInicio(defaultDT(24))
                setReconsultaFim(defaultDT(25))
                setReconsultaModal(true)
              }} />
            )}
            {!isClosed && (
              <TButton label="Salvar" variant="save" type="submit" loading={saving} />
            )}
          </TFormActionsRight>
        </TFormFooter>
      </TForm>

      {/* ── Modal: cancelar consulta ─────────────────────────────────────── */}
      <TWindow
        title   ="Cancelar Consulta"
        open    ={cancelModal}
        onClose ={() => { setCancelModal(false); setMotivoCancel("") }}
        width   ="460px"
        actions ={
          <>
            <TButton label="Voltar" variant="cancel"
              onClick={() => { setCancelModal(false); setMotivoCancel("") }} />
            <TButton label="Confirmar Cancelamento" variant="save"
              loading={canceling} onClick={handleCancelar} />
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-(--text-muted)">Informe o motivo do cancelamento (opcional):</p>
          <textarea
            rows      ={4}
            maxLength ={500}
            value     ={motivoCancel}
            onChange  ={e => setMotivoCancel(e.target.value)}
            placeholder="Motivo do cancelamento..."
            className ="border border-(--border) rounded px-3 py-2 text-sm
                        bg-(--bg-surface) text-(--text-primary) resize-none
                        focus:outline-none focus:ring-1 focus:ring-(--accent) w-full"
          />
        </div>
      </TWindow>

      {/* ── Modal: gerar reconsulta ───────────────────────────────────────── */}
      <TWindow
        title   ="Gerar Reconsulta"
        open    ={reconsultaModal}
        onClose ={() => { setReconsultaModal(false); setReconsultaInicio(""); setReconsultaFim("") }}
        width   ="500px"
        actions ={
          <>
            <TButton label="Cancelar" variant="cancel"
              onClick={() => { setReconsultaModal(false); setReconsultaInicio(""); setReconsultaFim("") }} />
            <TButton label="Agendar Reconsulta" variant="save"
              loading={reconsultaSaving} onClick={handleReconsulta} />
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <p className="text-sm text-(--text-muted)">
            Defina o horário da próxima consulta. Os serviços serão copiados automaticamente.
          </p>
          <div className="flex gap-4 flex-wrap">
            <TDateTime
              name         ="reconsultaInicio"
              label        ="Início (*)"
              width        ="220px"
              defaultValue ={reconsultaInicio || defaultDT(24)}
              onChange     ={(val) => setReconsultaInicio(val)}
            />
            <TDateTime
              name         ="reconsultaFim"
              label        ="Fim (*)"
              width        ="220px"
              defaultValue ={reconsultaFim || defaultDT(25)}
              onChange     ={(val) => setReconsultaFim(val)}
            />
          </div>
        </div>
      </TWindow>

      {/* ── Modal: adicionar/editar serviço ──────────────────────────────── */}
      <TWindow
        title   ={servicoModal.editId ? "Editar Serviço" : "Adicionar Serviço"}
        open    ={servicoModal.open}
        onClose ={() => setServicoModal(emptyServico)}
        width   ="520px"
        actions ={
          <>
            <TButton label="Cancelar" variant="cancel" onClick={() => setServicoModal(emptyServico)} />
            <TButton label="Salvar"   variant="save"   loading={servicoModal.saving} onClick={handleSalvarServico} />
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <TDbCombo
            name         ="servico_produtoId"
            label        ="Serviço (*)"
            url          ="/produtos/select"
            valueField   ="id"
            displayField ="nome"
            searchField  ="nome"
            placeholder  ="Buscar serviço..."
            width        ="100%"
            extraParams  ={{ classificacao: "SERVICO" }}
            value        ={servicoModal.produtoId}
            onChange     ={(val) => {
              setServicoModal(m => ({ ...m, produtoId: val }))
              fetchPrecoEstoqueServico(val)
            }}
          />
          <div className="flex gap-4 flex-wrap">
            <TEntry
              name        ="servico_quantidade"
              label       ="Quantidade (*)"
              mask        ="numerodecimal"
              width       ="130px"
              defaultValue={servicoModal.quantidade}
              onChange    ={(val) => setServicoModal(m => ({ ...m, quantidade: val }))}
            />
            <TEntry
              key         ={`sp_${servicoModal.preco}`}
              name        ="servico_preco"
              label       ={servicoModal.loadingPreco ? "Preço (carregando...)" : "Preço do Estoque"}
              mask        ="moeda"
              width       ="150px"
              defaultValue={servicoModal.preco}
              disabled
            />
          </div>
          {/* Ajuste por item */}
          <div className="flex gap-3 flex-wrap items-end">
            <TCombo
              name         ="servico_tipoAjuste"
              label        ="Ajuste"
              width        ="150px"
              defaultValue ={servicoModal.tipoAjuste}
              onChange     ={(val) => setServicoModal(m => ({ ...m, tipoAjuste: val, valorAjuste: "" }))}
              options      ={OPCOES_AJUSTE}
            />
            {servicoModal.tipoAjuste && (
              <>
                <TCombo
                  name         ="servico_tipoCalculo"
                  label        ="Tipo"
                  width        ="155px"
                  defaultValue ={servicoModal.tipoCalculo}
                  onChange     ={(val) => setServicoModal(m => ({ ...m, tipoCalculo: val }))}
                  options      ={OPCOES_CALCULO}
                />
                <TEntry
                  name         ="servico_valorAjuste"
                  label        ={servicoModal.tipoCalculo === "PERCENTUAL" ? "Percentual (%)" : "Valor (R$)"}
                  mask         ="numerodecimal"
                  width        ="130px"
                  defaultValue ={servicoModal.valorAjuste}
                  onChange     ={(val) => setServicoModal(m => ({ ...m, valorAjuste: val }))}
                />
              </>
            )}
          </div>
          {/* Preview do total */}
          {servicoModal.produtoId && (
            <div className="text-sm text-right text-(--text-muted)">
              Total estimado:{" "}
              <span className="font-semibold text-(--text-primary)">
                {fmtMoeda(calcTotal(
                  Number(servicoModal.preco), Number(servicoModal.quantidade),
                  servicoModal.tipoAjuste || null, servicoModal.tipoCalculo,
                  servicoModal.valorAjuste ? Number(servicoModal.valorAjuste) : null
                ))}
              </span>
            </div>
          )}
        </div>
      </TWindow>

      {/* ── Modal: adicionar/editar produto consumido ────────────────────── */}
      <TWindow
        title   ={produtoModal.editId ? "Editar Produto Consumido" : "Adicionar Produto Consumido"}
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
              if (produtoModal.emitenteId) fetchPrecoEstoque(val, produtoModal.emitenteId)
            }}
          />
          <TDbCombo
            name         ="produto_emitenteId"
            label        ="Emitente (origem do estoque) (*)"
            url          ="/emitentes/select"
            valueField   ="id"
            displayField ={displayEmitente}
            searchField  ="nome"
            placeholder  ="Selecione o emitente..."
            width        ="100%"
            value        ={produtoModal.emitenteId}
            onChange     ={(val) => {
              setProdutoModal(m => ({ ...m, emitenteId: val }))
              if (produtoModal.produtoId) fetchPrecoEstoque(produtoModal.produtoId, val)
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
              label       ={produtoModal.loadingPreco ? "Preço (carregando...)" : "Preço do Estoque"}
              mask        ="moeda"
              width       ="160px"
              defaultValue={produtoModal.preco}
              disabled
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
          {produtoModal.produtoId && produtoModal.emitenteId && (
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
