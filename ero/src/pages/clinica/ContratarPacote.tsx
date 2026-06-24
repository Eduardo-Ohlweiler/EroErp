import { useState }                                     from "react"
import { useNavigate }                                   from "react-router-dom"
import axios                                             from "axios"
import { api }                                           from "../../services/api"
import { useMessage }                                    from "../../hooks/useMessage"
import type { ErrorResponse }                            from "../../types/ErrorResponse"
import type { PacoteContratadoResponse, ContratarPacoteRequest } from "../../types/Pacote"
import { TPage }                                         from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TRow }                                          from "../../components/trow"
import { TCol }                                          from "../../components/tcol"
import { TSpace }                                        from "../../components/tspace"
import { TPanel }                                        from "../../components/tpanel"
import { TEntry }                                        from "../../components/tentry"
import { TCombo }                                        from "../../components/tcombo"
import { TDate }                                         from "../../components/tdate"
import { TDateTime }                                     from "../../components/tdatetime"
import { TDbCombo }                                      from "../../components/tdbcombo"
import { TButton }                                       from "../../components/tbutton"
import { ParcelasEditor }                                from "../../components/faturamento/ParcelasEditor"
import { gerarParcelas, todayStr }                       from "../../components/faturamento/parcelas"
import type { ParcelaFaturamento }                       from "../../components/faturamento/parcelas"
import { DocumentoPdfModal }                             from "../../components/documento/DocumentoPdfModal"
import type { DocumentoSummary }                         from "../../types/Documento"
import type { FichaAnamnesesSummary }                    from "../../types/Anamnese"
import { gerarEBaixarPdfFicha }                          from "../../utils/fichaAnamnesePdf"
import { displayPessoa, displayEmitente }                from "../../utils/pessoas"
import { gerarPdfFaturamento }                           from "../../utils/geradorPdf"

interface SlotSessao {
    inicio: string   // "YYYY-MM-DDTHH:mm" (formato do TDateTime)
    fim:    string
}

// Adiciona N minutos a um datetime no formato "YYYY-MM-DDTHH:mm"
function addMinutesDT(dt: string, minutes: number): string {
    if (!dt) return ""
    const d = new Date(dt.length === 16 ? dt + ":00" : dt)
    if (isNaN(d.getTime())) return ""
    d.setMinutes(d.getMinutes() + minutes)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Acrescenta dias mantendo a hora
function addDaysDT(dt: string, days: number): string {
    if (!dt) return ""
    const d = new Date(dt.length === 16 ? dt + ":00" : dt)
    if (isNaN(d.getTime())) return ""
    d.setDate(d.getDate() + days)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function addMonthsDT(dt: string, months: number): string {
    if (!dt) return ""
    const d = new Date(dt.length === 16 ? dt + ":00" : dt)
    if (isNaN(d.getTime())) return ""
    d.setMonth(d.getMonth() + months)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function defaultDT(offsetDays = 0, hour = 8): string {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    d.setHours(hour, 0, 0, 0)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// "YYYY-MM-DDTHH:mm" -> "YYYY-MM-DDTHH:mm:ss" (formato esperado pela API)
function toApiDT(dt: string): string {
    if (!dt) return ""
    return dt.length === 16 ? `${dt}:00` : dt
}

function fmtMoeda(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function ContratarPacote() {
    const navigate        = useNavigate()
    const { showMessage } = useMessage()

    // ── Cabeçalho ──────────────────────────────────────────────────────────────
    const [emitenteId,        setEmitenteId]        = useState("")
    const [emitenteNome,      setEmitenteNome]      = useState<string | null>(null)
    const [emitenteDocumento, setEmitenteDocumento] = useState<string | null>(null)
    const [pessoaId,          setPessoaId]          = useState("")
    const [pessoaNome,        setPessoaNome]        = useState<string | null>(null)
    const [pessoaDocumento,   setPessoaDocumento]   = useState<string | null>(null)
    const [produtoId,         setProdutoId]         = useState("")
    const [nome,              setNome]              = useState("")
    const [quantidade,        setQuantidade]        = useState("1")
    const [valorTotal,        setValorTotal]        = useState("0")
    const [observacao,        setObservacao]        = useState("")
    const [loadingPreco,      setLoadingPreco]      = useState(false)

    // ── Contrato (Documento) e Ficha de Anamnese do paciente ──────────────────────
    const [documentoId,      setDocumentoId]      = useState("")
    const [fichaAnamneseId,  setFichaAnamneseId]  = useState("")
    const [documentoOptions, setDocumentoOptions] = useState<{ value: string; label: string }[]>([])
    const [fichaOptions,     setFichaOptions]     = useState<{ value: string; label: string }[]>([])
    const [docPdfOpen,       setDocPdfOpen]       = useState(false)

    // Bumps p/ forçar TEntry de nome/qtd/valor a reler defaultValue quando muda por código
    const [nomeKey,  setNomeKey]  = useState(0)
    const [qtdKey,   setQtdKey]   = useState(0)
    const [valorKey, setValorKey] = useState(0)

    // ── Sessões (datas) ──────────────────────────────────────────────────────────
    const [slots,    setSlots]    = useState<SlotSessao[]>([{ inicio: defaultDT(1, 8), fim: defaultDT(1, 9) }])
    const [slotsKey, setSlotsKey] = useState(0)   // bump força os TDateTime a relerem defaultValue

    // "Sugerir datas"
    const [sugDataInicial, setSugDataInicial] = useState(todayStr())
    const [sugFrequencia,  setSugFrequencia]  = useState("SEMANAL")
    const [sugHora,        setSugHora]        = useState("08:00")

    // ── Parcelas (pré-pago) ──────────────────────────────────────────────────────
    const [data,     setData]     = useState(todayStr())
    const [numParc,  setNumParc]  = useState("1")
    const [parcelas, setParcelas] = useState<ParcelaFaturamento[]>(() => gerarParcelas(0, 1, todayStr()))

    const [saving, setSaving] = useState(false)

    const valorTotalNum = parseFloat(valorTotal) || 0

    // ── Redimensiona o array de slots preservando o que já foi digitado ───────────
    function resizeSlots(novaQtd: number) {
        setSlots(prev => {
            const next: SlotSessao[] = []
            for (let i = 0; i < novaQtd; i++) {
                next.push(prev[i] ?? { inicio: defaultDT(1 + i, 8), fim: defaultDT(1 + i, 9) })
            }
            return next
        })
        setSlotsKey(k => k + 1)
    }

    function handleQuantidadeChange(val: string) {
        setQuantidade(val)
        const n = parseInt(val, 10)
        if (n >= 1 && n <= 60) resizeSlots(n)
    }

    async function fetchPreco(prodId: string, emitId: string) {
        if (!prodId || !emitId) return
        setLoadingPreco(true)
        try {
            const res = await api.get<{ precoVenda: number }>("/estoque/preco-venda", {
                params: { emitenteId: Number(emitId), produtoId: Number(prodId) },
            })
            const preco = res.data.precoVenda ?? 0
            setValorTotal(String(preco))
            setValorKey(k => k + 1)
        } catch {
            // mantém o valor atual em caso de erro
        } finally {
            setLoadingPreco(false)
        }
    }

    // dd/MM/yyyy a partir de "YYYY-MM-DD"
    function fmtDataBr(iso: string): string {
        if (!iso) return ""
        return new Date(iso + "T00:00").toLocaleDateString("pt-BR")
    }

    async function loadDocumentoOptions(pId: string) {
        if (!pId) { setDocumentoOptions([]); return }
        try {
            const r = await api.get<DocumentoSummary[]>(`/documentos/por-pessoa/${pId}`)
            setDocumentoOptions(r.data.map(d => ({
                value: String(d.id),
                label: `${d.modeloDocumentoNome} — ${fmtDataBr(d.dataEmissao)} (${d.status})`,
            })))
        } catch {
            setDocumentoOptions([])
        }
    }

    async function loadFichaOptions(pId: string) {
        if (!pId) { setFichaOptions([]); return }
        try {
            const r = await api.get<FichaAnamnesesSummary[]>(`/fichas-anamnese/por-pessoa/${pId}`)
            setFichaOptions(r.data.map(f => ({
                value: String(f.id),
                label: `${f.templateNome} — ${fmtDataBr(f.dataPreenchimento)}`,
            })))
        } catch {
            setFichaOptions([])
        }
    }

    async function handleVerFichaPdf() {
        if (!fichaAnamneseId) return
        try {
            await gerarEBaixarPdfFicha(Number(fichaAnamneseId))
        } catch {
            showMessage("error", "Erro ao gerar PDF da ficha")
        }
    }

    function handleServicoChange(val: string, item?: Record<string, unknown>) {
        setProdutoId(val)
        if (item) {
            const nomeServico = String(item.nome ?? "")
            setNome(nomeServico)
            setNomeKey(k => k + 1)

            const padrao = item.quantidadeSessoesPadrao
            const qtd = padrao != null && Number(padrao) >= 1 ? Number(padrao) : 1
            setQuantidade(String(qtd))
            setQtdKey(k => k + 1)
            resizeSlots(qtd)
        }
        if (val && emitenteId) fetchPreco(val, emitenteId)
    }

    function updateSlot(index: number, changes: Partial<SlotSessao>) {
        setSlots(prev => prev.map((s, i) => i === index ? { ...s, ...changes } : s))
    }

    function handleSugerirDatas() {
        const n = parseInt(quantidade, 10)
        if (!n || n < 1) { showMessage("error", "Defina a quantidade de sessões"); return }
        if (!sugDataInicial) { showMessage("error", "Informe a data inicial"); return }

        const baseInicio = `${sugDataInicial}T${sugHora || "08:00"}`
        const novos: SlotSessao[] = Array.from({ length: n }, (_, i) => {
            let inicio = baseInicio
            if (sugFrequencia === "SEMANAL")    inicio = addDaysDT(baseInicio,  7 * i)
            if (sugFrequencia === "QUINZENAL")  inicio = addDaysDT(baseInicio, 14 * i)
            if (sugFrequencia === "MENSAL")     inicio = addMonthsDT(baseInicio,     i)
            return { inicio, fim: addMinutesDT(inicio, 60) }
        })
        setSlots(novos)
        setSlotsKey(k => k + 1)
    }

    async function handleSubmit() {
        // ── Validações de cabeçalho ──
        if (!emitenteId)         { showMessage("error", "Emitente é obrigatório"); return }
        if (!pessoaId)           { showMessage("error", "Paciente é obrigatório"); return }
        if (!produtoId)          { showMessage("error", "Serviço é obrigatório"); return }
        if (!nome.trim())        { showMessage("error", "Informe o nome do pacote"); return }

        const qtd = parseInt(quantidade, 10)
        if (!qtd || qtd < 1)     { showMessage("error", "Quantidade de sessões deve ser ao menos 1"); return }
        if (valorTotalNum <= 0)  { showMessage("error", "Valor total deve ser positivo"); return }

        // ── Validação dos slots ──
        if (slots.length !== qtd) {
            showMessage("error", "Defina a data/hora de todas as sessões")
            return
        }
        for (let i = 0; i < slots.length; i++) {
            const s = slots[i]
            if (!s.inicio || !s.fim) {
                showMessage("error", `Informe início e fim da sessão ${i + 1}`)
                return
            }
            const ini = new Date(toApiDT(s.inicio))
            const fim = new Date(toApiDT(s.fim))
            if (fim <= ini) {
                showMessage("error", `Na sessão ${i + 1}, o fim deve ser posterior ao início`)
                return
            }
        }

        // ── Validação das parcelas (espelha FaturamentoConsulta) ──
        if (parcelas.length === 0) {
            showMessage("error", "Defina o número de parcelas e clique em Distribuir")
            return
        }
        for (const p of parcelas) {
            if (!p.dataVencimento) {
                showMessage("error", `Informe o vencimento da parcela ${p.numeroParcela}`)
                return
            }
            if (!p.valor || parseFloat(p.valor) <= 0) {
                showMessage("error", `Informe o valor da parcela ${p.numeroParcela}`)
                return
            }
            if (p.pago) {
                if (!p.formaPagamentoId || !p.contaFinanceiraId) {
                    showMessage("error", `Parcela ${p.numeroParcela}: preencha forma de pagamento e conta financeira para marcar como paga`)
                    return
                }
                if (!p.dataPagamento) {
                    showMessage("error", `Informe a data de pagamento da parcela ${p.numeroParcela}`)
                    return
                }
                if (!p.valorPago || parseFloat(p.valorPago) <= 0) {
                    showMessage("error", `Informe o valor pago da parcela ${p.numeroParcela}`)
                    return
                }
            }
        }

        setSaving(true)
        try {
            const payload: ContratarPacoteRequest = {
                emitenteId:        Number(emitenteId),
                pessoaId:          Number(pessoaId),
                produtoId:         Number(produtoId),
                nome:              nome.trim(),
                quantidadeSessoes: qtd,
                valorTotal:        valorTotalNum,
                observacao:        observacao.trim() || null,
                documentoId:       documentoId ? Number(documentoId) : null,
                fichaAnamneseId:   fichaAnamneseId ? Number(fichaAnamneseId) : null,
                sessoes:           slots.map(s => ({
                    inicio: toApiDT(s.inicio),
                    fim:    toApiDT(s.fim),
                })),
                parcelas:          parcelas.map(p => ({
                    dataVencimento:    p.dataVencimento,
                    valor:             parseFloat(p.valor),
                    formaPagamentoId:  p.formaPagamentoId  ? Number(p.formaPagamentoId)  : null,
                    contaFinanceiraId: p.contaFinanceiraId ? Number(p.contaFinanceiraId) : null,
                    observacao:        null,
                    dataPagamento:     p.pago ? p.dataPagamento         : null,
                    valorPago:         p.pago ? parseFloat(p.valorPago) : null,
                })),
            }

            const res = await api.post<PacoteContratadoResponse>("/pacotes", payload)
            const pacote = res.data

            // ── PDF de faturamento (opcional, MVP: baixa local) ──
            try {
                const pdf = gerarPdfFaturamento({
                    consultaId:        pacote.id,
                    tituloDoc:         "CONTRATAÇÃO DE PACOTE",
                    referenciaLabel:   "Pacote",
                    pessoaLabel:       "Paciente",
                    emitenteNome:      emitenteNome   ?? "Emitente",
                    emitenteDocumento: emitenteDocumento,
                    pessoaNome:        pessoaNome     ?? "",
                    pessoaDocumento:   pessoaDocumento,
                    descricao:         `${pacote.nome} — ${qtd} sessão(ões)`,
                    data,
                    parcelas,
                    totalGeral:        valorTotalNum,
                })
                const link = document.createElement("a")
                link.href = `data:application/pdf;base64,${pdf}`
                link.download = `pacote-${pacote.id}.pdf`
                link.click()
            } catch {
                // PDF é opcional — não bloqueia o fluxo
            }

            showMessage("success", "Pacote contratado com sucesso!")
            navigate(`/clinica/pacotes/${pacote.id}`)
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const d = err.response?.data as ErrorResponse
                showMessage("error", d?.erro ?? "Erro ao contratar pacote")
            } else {
                showMessage("error", "Erro inesperado")
            }
        } finally {
            setSaving(false)
        }
    }

    return (
        <TPage title="Contratar Pacote" breadcrumb={["Clínica", "Pacotes", "Contratar"]}>
            <TForm onSubmit={() => handleSubmit()}>

                {/* ── Dados do pacote ── */}
                <TPanel title="Dados do Pacote">
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
                                value        ={emitenteId}
                                onChange     ={(val, item) => {
                                    setEmitenteId(val)
                                    setEmitenteNome(item ? String(item.pessoaNome ?? "") : null)
                                    setEmitenteDocumento(item?.pessoaDocumento ? String(item.pessoaDocumento) : null)
                                    if (val && produtoId) fetchPreco(produtoId, val)
                                }}
                            />
                        </TCol>
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
                                width        ="50%"
                                minWidth     ="200px"
                                value        ={pessoaId}
                                onChange     ={(val, item) => {
                                    setPessoaId(val)
                                    setPessoaNome(item ? String(item.nome ?? "") : null)
                                    const cpf  = item?.cpf  ? String(item.cpf)  : null
                                    const cnpj = item?.cnpj ? String(item.cnpj) : null
                                    setPessoaDocumento(cpf ?? cnpj ?? null)
                                    setDocumentoId("")
                                    setFichaAnamneseId("")
                                    if (val) {
                                        loadDocumentoOptions(val)
                                        loadFichaOptions(val)
                                    } else {
                                        setDocumentoOptions([])
                                        setFichaOptions([])
                                    }
                                }}
                            />
                        </TCol>
                    </TRow>
                    <TRow>
                        <TCol>
                            <TDbCombo
                                name         ="produtoId"
                                label        ="Serviço (*)"
                                url          ="/produtos/select"
                                valueField   ="id"
                                displayField ="nome"
                                searchField  ="nome"
                                placeholder  ="Buscar serviço..."
                                required
                                width        ="50%"
                                minWidth     ="200px"
                                extraParams  ={{ classificacao: "SERVICO" }}
                                value        ={produtoId}
                                onChange     ={handleServicoChange}
                            />
                        </TCol>
                    </TRow>
                    <TRow>
                        <TCol>
                            <TEntry
                                key         ={`nome-${nomeKey}`}
                                name        ="nome"
                                label       ="Nome do Pacote (*)"
                                maxLength   ={255}
                                width       ="60%"
                                minWidth    ="200px"
                                defaultValue={nome}
                                onChange    ={setNome}
                            />
                        </TCol>
                    </TRow>
                    <TRow>
                        <TCol>
                            <TEntry
                                key         ={`qtd-${qtdKey}`}
                                name        ="quantidadeSessoes"
                                label       ="Quantidade de Sessões (*)"
                                mask        ="numero"
                                width       ="220px"
                                defaultValue={quantidade}
                                onChange    ={handleQuantidadeChange}
                            />
                        </TCol>
                        <TCol>
                            <TEntry
                                key         ={`valor-${valorKey}`}
                                name        ="valorTotal"
                                label       ={loadingPreco ? "Valor Total (carregando...)" : "Valor Total (*)"}
                                mask        ="moeda"
                                width       ="200px"
                                defaultValue={valorTotal}
                                onChange    ={setValorTotal}
                            />
                        </TCol>
                        <TSpace />
                    </TRow>
                    <TRow>
                        <TCol>
                            <TEntry
                                name        ="observacao"
                                label       ="Observação"
                                maxLength   ={2000}
                                width       ="100%"
                                minWidth    ="200px"
                                defaultValue={observacao}
                                onChange    ={setObservacao}
                            />
                        </TCol>
                    </TRow>
                </TPanel>

                {/* ── Contrato e Ficha do Paciente ── */}
                {pessoaId && (
                    <TPanel key={`anexos-${pessoaId}`} title="Contrato e Ficha do Paciente">
                        <p className="text-xs text-(--text-muted)">
                            Vincule um contrato (documento) e/ou uma ficha de anamnese já cadastrados para este paciente.
                        </p>
                        <TRow>
                            <TCol>
                                <TCombo
                                    name         ="documentoId"
                                    label        ="Contrato"
                                    width        ="100%"
                                    minWidth     ="200px"
                                    disabled     ={documentoOptions.length === 0}
                                    defaultValue ={documentoId}
                                    onChange     ={setDocumentoId}
                                    options      ={[{ value: "", label: "Nenhum" }, ...documentoOptions]}
                                    hint         ={documentoOptions.length === 0 ? "Paciente não possui contrato cadastrado" : undefined}
                                />
                            </TCol>
                            <div className="flex items-end pb-0.5">
                                <TButton
                                    label   ="Visualizar/Gerar PDF"
                                    variant ="secondary"
                                    type    ="button"
                                    disabled={!documentoId}
                                    onClick ={() => setDocPdfOpen(true)}
                                />
                            </div>
                            <TSpace />
                        </TRow>
                        <TRow>
                            <TCol>
                                <TCombo
                                    name         ="fichaAnamneseId"
                                    label        ="Ficha de Anamnese"
                                    width        ="100%"
                                    minWidth     ="200px"
                                    disabled     ={fichaOptions.length === 0}
                                    defaultValue ={fichaAnamneseId}
                                    onChange     ={setFichaAnamneseId}
                                    options      ={[{ value: "", label: "Nenhuma" }, ...fichaOptions]}
                                    hint         ={fichaOptions.length === 0 ? "Paciente não possui ficha de anamnese" : undefined}
                                />
                            </TCol>
                            <div className="flex items-end pb-0.5">
                                <TButton
                                    label   ="Visualizar/Gerar PDF"
                                    variant ="secondary"
                                    type    ="button"
                                    disabled={!fichaAnamneseId}
                                    onClick ={handleVerFichaPdf}
                                />
                            </div>
                            <TSpace />
                        </TRow>
                    </TPanel>
                )}

                {/* ── Sessões (datas) ── */}
                <TPanel title={`Sessões (${slots.length})`}>
                    <p className="text-xs text-(--text-muted) mb-2">
                        Cada sessão gera uma consulta na agenda. As datas podem ser ajustadas individualmente.
                    </p>

                    {/* Sugerir datas */}
                    <div className="flex flex-wrap items-end gap-3 mb-4 p-3 rounded-lg border border-dashed border-(--border)">
                        <TDate
                            name        ="sugDataInicial"
                            label       ="Data inicial"
                            width       ="160px"
                            defaultValue={sugDataInicial}
                            onChange    ={setSugDataInicial}
                        />
                        <TEntry
                            name        ="sugHora"
                            label       ="Horário"
                            mask        ="hora"
                            width       ="110px"
                            defaultValue={sugHora}
                            onChange    ={setSugHora}
                        />
                        <TCombo
                            name        ="sugFrequencia"
                            label       ="Frequência"
                            width       ="180px"
                            defaultValue={sugFrequencia}
                            onChange    ={setSugFrequencia}
                            options     ={[
                                { value: "SEMANAL",   label: "Semanal"   },
                                { value: "QUINZENAL", label: "Quinzenal" },
                                { value: "MENSAL",    label: "Mensal"    },
                            ]}
                        />
                        <TButton label="Sugerir datas" variant="new" type="button" onClick={handleSugerirDatas} />
                    </div>

                    {/* Slots por sessão */}
                    <div className="flex flex-col gap-3">
                        {slots.map((s, i) => (
                            <div key={`${slotsKey}-${i}`} className="flex flex-wrap items-end gap-3 p-3 rounded-lg border border-(--border) bg-(--surface)">
                                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-(--surface-secondary) text-xs font-bold text-(--text-secondary) mb-1 shrink-0 self-end">
                                    {i + 1}
                                </div>
                                <TDateTime
                                    name        ={`sessaoInicio${i}`}
                                    label       ="Início (*)"
                                    width       ="220px"
                                    defaultValue={s.inicio}
                                    onChange    ={(val) => {
                                        updateSlot(i, {
                                            inicio: val,
                                            // se o fim estiver vazio/antes, sugere +1h
                                            ...(s.fim && new Date(toApiDT(s.fim)) > new Date(toApiDT(val))
                                                ? {}
                                                : { fim: addMinutesDT(val, 60) }),
                                        })
                                    }}
                                />
                                <TDateTime
                                    name        ={`sessaoFim${i}`}
                                    label       ="Fim (*)"
                                    width       ="220px"
                                    defaultValue={s.fim}
                                    onChange    ={(val) => updateSlot(i, { fim: val })}
                                />
                            </div>
                        ))}
                    </div>
                </TPanel>

                {/* ── Pagamento (pré-pago) ── */}
                <TPanel title="Pagamento (pré-pago)">
                    <div className="mb-3 px-3 py-2 rounded-lg bg-(--accent-light) text-sm text-(--text-secondary)">
                        Total do pacote: <strong className="text-(--accent)">{fmtMoeda(valorTotalNum)}</strong>.
                        O cliente paga adiantado — gera uma única conta a receber.
                    </div>
                    <ParcelasEditor
                        total           ={valorTotalNum}
                        value           ={parcelas}
                        onChange        ={setParcelas}
                        data            ={data}
                        onDataChange    ={setData}
                        numParc         ={numParc}
                        onNumParcChange ={setNumParc}
                        onValidationError={(msg) => showMessage("error", msg)}
                    />
                </TPanel>

                {/* ── Rodapé ── */}
                <TFormFooter>
                    <TFormActionsLeft>
                        <TButton label="Cancelar" variant="cancel" type="button"
                            onClick={() => navigate("/clinica/pacotes")} />
                    </TFormActionsLeft>
                    <TFormActionsRight>
                        <TButton label="Contratar Pacote" variant="save" type="submit" loading={saving} />
                    </TFormActionsRight>
                </TFormFooter>
            </TForm>

            <DocumentoPdfModal
                documentoId={documentoId ? Number(documentoId) : null}
                open        ={docPdfOpen}
                onClose     ={() => setDocPdfOpen(false)}
            />
        </TPage>
    )
}
