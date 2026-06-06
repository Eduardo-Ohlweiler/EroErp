import { useEffect, useState }     from "react"
import { useNavigate, useParams }  from "react-router-dom"
import axios                       from "axios"
import { api }                     from "../../../services/api"
import { useMessage }              from "../../../hooks/useMessage"
import type { ContaReceberResponse } from "../../../types/ContaReceber"
import type { ParcelaLocal }       from "../../../types/ContaPagar"
import type { TDataGridColumn }    from "../../../types/TDataGridColumn"
import type { ErrorResponse }      from "../../../types/ErrorResponse"

import { FaMoneyBill, FaFilePdf, FaWhatsapp } from "react-icons/fa6"
import { gerarPdfContaFinanceira } from "../../../utils/geradorPdf"
import { displayPessoa, displayEmitente } from "../../../utils/pessoas"
import { TPage }                   from "../../../components/tpage"
import { TForm, TFormFooter, TFormActionsLeft, TFormActionsRight } from "../../../components/tform"
import { TRow }                    from "../../../components/trow"
import { TCol }                    from "../../../components/tcol"
import { TEntry }                  from "../../../components/tentry"
import { TCombo }                  from "../../../components/tcombo"
import { TDbCombo }                from "../../../components/tdbcombo"
import { TDate }                   from "../../../components/tdate"
import { TButton }                 from "../../../components/tbutton"
import { TPanel }                  from "../../../components/tpanel"
import { TWindow }                 from "../../../components/twindow"
import { TDataGrid }               from "../../../components/tdatagrid"
import { TSpace }                  from "../../../components/tspace"

const STATUS_OPTIONS = [
    { value: "ABERTO",            label: "Aberto"             },
    { value: "PARCIALMENTE_PAGO", label: "Parcialmente Pago"  },
    { value: "PAGO",              label: "Pago"               },
    { value: "CANCELADO",         label: "Cancelado"          },
]

function fmt(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function fmtDate(iso: string | null | undefined) {
    if (!iso) return "—"
    const [y, m, d] = iso.split("-")
    return `${d}/${m}/${y}`
}

export default function ContaReceberForm() {
    const { id: idParam } = useParams()
    const navigate        = useNavigate()
    const { showMessage } = useMessage()

    const [formKey,   setFormKey]   = useState(0)
    const [loading,   setLoading]   = useState(false)
    const [saving,    setSaving]    = useState(false)
    const [conta,     setConta]     = useState<ContaReceberResponse | null>(null)
    const [currentId, setCurrentId] = useState<string | undefined>(idParam)
    const isEdit = !!currentId

    const [emitenteId, setEmitenteId] = useState("")
    const [pessoaId,   setPessoaId]   = useState("")
    const [data,       setData]       = useState("")
    const [status,     setStatus]     = useState("ABERTO")
    const [valorTotal, setValorTotal] = useState("")

    const [parcelas,          setParcelas]          = useState<ParcelaLocal[]>([])
    const [parcelaWindowOpen, setParcelaWindowOpen] = useState(false)
    const [editandoParcela,   setEditandoParcela]   = useState<ParcelaLocal | null>(null)

    const [wpDataVencimento,     setWpDataVencimento]     = useState("")
    const [wpNumParcelas,        setWpNumParcelas]        = useState("1")
    const [wpValor,              setWpValor]              = useState("")
    const [wpFormaPagamentoId,   setWpFormaPagamentoId]   = useState("")
    const [wpFormaPagamentoNome, setWpFormaPagamentoNome] = useState("")
    const [wpContaFinanceiraId,  setWpContaFinanceiraId]  = useState("")
    const [wpContaFinanceiraNome, setWpContaFinanceiraNome] = useState("")
    const [wpObservacao,         setWpObservacao]         = useState("")
    const [windowContentKey,     setWindowContentKey]     = useState(0)
    const [wpValorKey,           setWpValorKey]           = useState(0)

    const valorTotalNum = parseFloat(valorTotal) || 0
    const sumParcelas   = parcelas.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0)
    const saldoRestante = valorTotalNum - sumParcelas

    useEffect(() => {
        if (!currentId) { setConta(null); return }
        setLoading(true)
        api.get(`/financeiro/contas-receber/${currentId}`)
            .then(res => {
                const c: ContaReceberResponse = res.data
                setConta(c)
                setEmitenteId(c.emitenteId ? String(c.emitenteId) : "")
                setPessoaId(String(c.pessoaId))
                setData(c.data)
                setStatus(c.status)
                setValorTotal(String(c.valorTotal))
                setParcelas(c.parcelas.map(p => ({
                    _tempId:             String(p.id),
                    numeroParcela:       p.numeroParcela,
                    dataVencimento:      p.dataVencimento,
                    valor:               String(p.valor),
                    formaPagamentoId:    p.formaPagamentoId ? String(p.formaPagamentoId) : "",
                    formaPagamentoNome:  p.formaPagamentoNome ?? "",
                    contaFinanceiraId:   p.contaFinanceiraId ? String(p.contaFinanceiraId) : "",
                    contaFinanceiraNome: p.contaFinanceiraNome ?? "",
                    observacao:          p.observacao ?? "",
                    status:              p.status,
                })))
                setFormKey(k => k + 1)
            })
            .catch(() => { showMessage("error", "Erro ao carregar conta"); navigate("/financeiro/contas-receber") })
            .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentId])

    function handleNovo() {
        setCurrentId(undefined)
        setConta(null)
        setEmitenteId("")
        setPessoaId("")
        setData("")
        setStatus("ABERTO")
        setValorTotal("")
        setParcelas([])
        setFormKey(k => k + 1)
    }

    function calcRestante(excludeId?: string) {
        const sumAdded = parcelas
            .filter(p => !excludeId || p._tempId !== excludeId)
            .reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0)
        return valorTotalNum - sumAdded
    }

    function abrirNovaParcela() {
        const restante = calcRestante()
        setEditandoParcela(null)
        setWpDataVencimento("")
        setWpNumParcelas("1")
        setWpValor(restante > 0 ? restante.toFixed(2) : "")
        setWpFormaPagamentoId("")
        setWpFormaPagamentoNome("")
        setWpContaFinanceiraId("")
        setWpContaFinanceiraNome("")
        setWpObservacao("")
        setWindowContentKey(k => k + 1)
        setParcelaWindowOpen(true)
    }

    function abrirEditarParcela(p: ParcelaLocal) {
        setEditandoParcela(p)
        setWpDataVencimento(p.dataVencimento)
        setWpNumParcelas("1")
        setWpValor(p.valor)
        setWpFormaPagamentoId(p.formaPagamentoId)
        setWpFormaPagamentoNome(p.formaPagamentoNome)
        setWpContaFinanceiraId(p.contaFinanceiraId)
        setWpContaFinanceiraNome(p.contaFinanceiraNome)
        setWpObservacao(p.observacao)
        setWindowContentKey(k => k + 1)
        setParcelaWindowOpen(true)
    }

    function handleNumParcelasChange(val: string) {
        setWpNumParcelas(val)
        const num = Math.max(1, parseInt(val) || 1)
        const restante = calcRestante(editandoParcela?._tempId)
        const porParcela = restante / num
        setWpValor(porParcela > 0 ? porParcela.toFixed(2) : "")
        setWpValorKey(k => k + 1)
    }

    function handleRegistrarParcela() {
        if (!wpDataVencimento || !wpValor) {
            showMessage("error", "Preencha data de vencimento e valor")
            return
        }
        const num = Math.max(1, parseInt(wpNumParcelas) || 1)

        if (editandoParcela) {
            const nova: ParcelaLocal = {
                _tempId:             editandoParcela._tempId,
                dataVencimento:      wpDataVencimento,
                valor:               wpValor,
                formaPagamentoId:    wpFormaPagamentoId,
                formaPagamentoNome:  wpFormaPagamentoNome,
                contaFinanceiraId:   wpContaFinanceiraId,
                contaFinanceiraNome: wpContaFinanceiraNome,
                observacao:          wpObservacao,
            }
            setParcelas(prev => prev.map(p => p._tempId === editandoParcela._tempId ? nova : p))
        } else {
            const novas: ParcelaLocal[] = []
            const baseNum = parcelas.length + 1
            const [year, month, day] = wpDataVencimento.split("-").map(Number)
            for (let i = 0; i < num; i++) {
                const d = new Date(year, month - 1 + i, day)
                const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
                novas.push({
                    _tempId:             crypto.randomUUID(),
                    numeroParcela:       baseNum + i,
                    dataVencimento:      iso,
                    valor:               wpValor,
                    formaPagamentoId:    wpFormaPagamentoId,
                    formaPagamentoNome:  wpFormaPagamentoNome,
                    contaFinanceiraId:   wpContaFinanceiraId,
                    contaFinanceiraNome: wpContaFinanceiraNome,
                    observacao:          wpObservacao,
                })
            }
            setParcelas(prev => [...prev, ...novas])
        }
        setParcelaWindowOpen(false)
    }

    function handlePagarParcela(parcela: ParcelaLocal) {
        navigate("/financeiro/pagar-contas", {
            state: {
                preItem: {
                    parcelaId:           Number(parcela._tempId),
                    numeroParcela:       parcela.numeroParcela ?? null,
                    tipo:                "RECEBER",
                    contaId:             Number(currentId),
                    descricao:           conta?.descricao ?? null,
                    emitenteId:          conta?.emitenteId ?? null,
                    emitenteNome:        conta?.emitenteNome ?? null,
                    pessoaId:            conta!.pessoaId,
                    pessoaNome:          conta!.pessoaNome,
                    dataVencimento:      parcela.dataVencimento,
                    valor:               parseFloat(parcela.valor),
                    formaPagamentoId:    parcela.formaPagamentoId  ? Number(parcela.formaPagamentoId)  : null,
                    formaPagamentoNome:  parcela.formaPagamentoNome  || null,
                    contaFinanceiraId:   parcela.contaFinanceiraId ? Number(parcela.contaFinanceiraId) : null,
                    contaFinanceiraNome: parcela.contaFinanceiraNome || null,
                    status:              parcela.status ?? "ABERTO",
                }
            }
        })
    }

    function removerParcela(tempId: string) {
        setParcelas(prev => prev.filter(p => p._tempId !== tempId))
    }

    function buildPdfBase64() {
        if (!conta) return null
        return gerarPdfContaFinanceira({
            tipo:              "RECEBER",
            contaId:           conta.id,
            emitenteNome:      conta.emitenteNome,
            emitenteDocumento: conta.emitenteDocumento,
            pessoaNome:        conta.pessoaNome,
            pessoaDocumento:   conta.pessoaDocumento,
            descricao:         conta.descricao,
            data:              conta.data,
            parcelas:          conta.parcelas.map(p => ({
                numeroParcela:  p.numeroParcela,
                dataVencimento: p.dataVencimento,
                valor:          Number(p.valor),
                status:         p.status,
                dataPagamento:  p.dataPagamento,
                valorPago:      p.valorPago != null ? Number(p.valorPago) : null,
            })),
            totalGeral: conta.valorTotal,
        })
    }

    function handleVisualizarPdf() {
        const base64 = buildPdfBase64()
        if (!base64) return
        const blob = new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], { type: "application/pdf" })
        const url  = URL.createObjectURL(blob)
        window.open(url, "_blank")
    }

    async function handleEnviarWhatsapp() {
        const base64 = buildPdfBase64()
        if (!base64 || !conta) return
        try {
            await api.post("/financeiro/pagar-contas/enviar-pdf", {
                pessoaId: conta.pessoaId,
                base64,
                fileName: `conta-receber-${conta.id}.pdf`,
                caption:  `Conta a receber Nº ${conta.id}${conta.descricao ? " — " + conta.descricao : ""}`,
            })
            showMessage("success", "PDF enviado via WhatsApp!")
        } catch {
            showMessage("error", "Erro ao enviar PDF via WhatsApp")
        }
    }

    async function handleSubmit(formData: Record<string, string>) {
        if (parcelas.length === 0) {
            showMessage("error", "Adicione ao menos uma parcela")
            return
        }
        setSaving(true)
        try {
            const payload = {
                emitenteId: emitenteId ? Number(emitenteId) : null,
                pessoaId:   Number(pessoaId),
                data:       formData.data,
                descricao:  formData.descricao || null,
                valorTotal: parseFloat(formData.valorTotal),
                observacao: formData.observacao || null,
                status:     isEdit ? status : undefined,
                ativo:      isEdit ? (formData.ativo === "true") : undefined,
                parcelas: parcelas.map(p => ({
                    dataVencimento:    p.dataVencimento,
                    valor:             parseFloat(p.valor),
                    formaPagamentoId:  p.formaPagamentoId  ? Number(p.formaPagamentoId)  : null,
                    contaFinanceiraId: p.contaFinanceiraId ? Number(p.contaFinanceiraId) : null,
                    observacao:        p.observacao || null,
                })),
            }
            if (isEdit) {
                await api.put(`/financeiro/contas-receber/${currentId}`, payload)
                showMessage("success", "Conta atualizada com sucesso!")
            } else {
                const res = await api.post("/financeiro/contas-receber", payload)
                showMessage("success", "Conta cadastrada com sucesso!")
                setCurrentId(String(res.data.id))
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao salvar conta")
            } else {
                showMessage("error", "Erro inesperado ao salvar")
            }
        } finally {
            setSaving(false)
        }
    }

    const parcelaColumns: TDataGridColumn<ParcelaLocal>[] = [
        { label: "Nº", field: "numeroParcela", width: "50px", align: "center",
          render: (row) => <span>{row.numeroParcela ?? "—"}</span> },
        { label: "Vencimento", field: "dataVencimento", width: "120px",
          render: (row) => <span>{fmtDate(row.dataVencimento)}</span> },
        { label: "Valor",      field: "valor",          width: "120px", align: "right",
          render: (row) => <span>{fmt(parseFloat(row.valor) || 0)}</span> },
        { label: "Forma Pagamento",  field: "formaPagamentoNome",
          render: (row) => <span>{row.formaPagamentoNome || "—"}</span> },
        { label: "Conta Financeira", field: "contaFinanceiraNome",
          render: (row) => <span>{row.contaFinanceiraNome || "—"}</span> },
        { label: "Observação", field: "observacao",
          render: (row) => <span>{row.observacao || "—"}</span> },
    ]

    if (loading) return (
        <TPage title="Carregando..." breadcrumb={["Financeiro", "Contas a Receber"]}>
            <div className="flex justify-center py-12">
                <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
            </div>
        </TPage>
    )

    return (
        <TPage
            title={isEdit ? "Editar Conta a Receber" : "Nova Conta a Receber"}
            breadcrumb={["Financeiro", "Contas a Receber", isEdit ? "Editar" : "Novo"]}
        >
            <TForm key={formKey} onSubmit={handleSubmit}>
                <TRow>
                    <TCol>
                        <TDbCombo
                            name         ="emitenteId"
                            label        ="Emitente"
                            url          ="/emitentes/select"
                            valueField   ="id"
                            displayField ={displayEmitente}
                            value        ={emitenteId}
                            width        ="50%"
                            onChange     ={(val) => setEmitenteId(val)}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TDbCombo
                            name         ="pessoaId"
                            label        ="Pessoa"
                            url          ="/pessoas/select"
                            valueField   ="id"
                            displayField ={displayPessoa}
                            value        ={pessoaId}
                            required
                            width        ="50%"
                            onChange     ={(val) => setPessoaId(val)}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TDate
                            name         ="data"
                            label        ="Data de Emissão"
                            required
                            width        ="160px"
                            defaultValue ={data}
                            onChange     ={setData}
                        />
                    </TCol>
                    <TCol>
                        <TEntry
                            name         ="valorTotal"
                            label        ="Valor Total"
                            mask         ="moeda"
                            required
                            width        ="160px"
                            defaultValue ={conta ? String(conta.valorTotal) : ""}
                            onChange     ={setValorTotal}
                        />
                    </TCol>
                    <TSpace />
                </TRow>
                <TRow>
                    <TCol>
                        <TEntry
                            name         ="descricao"
                            label        ="Descrição"
                            maxLength    ={255}
                            width        ="60%"
                            defaultValue ={conta?.descricao ?? ""}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TEntry
                            name         ="observacao"
                            label        ="Observação"
                            width        ="60%"
                            defaultValue ={conta?.observacao ?? ""}
                        />
                    </TCol>
                </TRow>

                {isEdit && (
                    <TRow>
                        <TCol>
                            <TCombo
                                name         ="status"
                                label        ="Status"
                                width        ="200px"
                                defaultValue ={status}
                                options      ={STATUS_OPTIONS}
                                onChange     ={setStatus}
                            />
                        </TCol>
                        <TCol>
                            <TCombo
                                name         ="ativo"
                                label        ="Situação"
                                width        ="160px"
                                defaultValue ={conta?.ativo ? "true" : "false"}
                                options      ={[
                                    { value: "true",  label: "Ativo"   },
                                    { value: "false", label: "Inativo" },
                                ]}
                            />
                        </TCol>
                        <TSpace />
                    </TRow>
                )}

                <TPanel title="Parcelas">
                    <TDataGrid<ParcelaLocal>
                        keyField     ="_tempId"
                        data         ={parcelas}
                        emptyMessage ="Nenhuma parcela adicionada"
                        onAdd        ={abrirNovaParcela}
                        actionsWidth ="145px"
                        columns      ={parcelaColumns}
                        actions      ={(row) => (
                            <>
                                {isEdit && !isNaN(Number(row._tempId)) && row.status !== "PAGO" && row.status !== "CANCELADO" && (
                                    <TButton
                                        label   =""
                                        variant ="success"
                                        icon    ={<FaMoneyBill size={13} />}
                                        onClick ={(e) => { e?.stopPropagation(); handlePagarParcela(row) }}
                                    />
                                )}
                                <TButton
                                    label   =""
                                    variant ="edit"
                                    onClick ={(e) => { e?.stopPropagation(); abrirEditarParcela(row) }}
                                />
                                <TButton
                                    label   =""
                                    variant ="delete"
                                    onClick ={(e) => { e?.stopPropagation(); removerParcela(row._tempId) }}
                                />
                            </>
                        )}
                    />
                </TPanel>

                {valorTotalNum > 0 && (
                    <div className="flex flex-wrap gap-4 px-1 py-3 my-2 rounded-lg bg-(--metal-100) border border-(--border)">
                        <div className="flex flex-col items-center flex-1 min-w-30">
                            <span className="text-xs text-(--text-secondary) mb-1">Valor Total</span>
                            <span className="text-base font-semibold text-(--text-primary)">{fmt(valorTotalNum)}</span>
                        </div>
                        <div className="flex flex-col items-center flex-1 min-w-30">
                            <span className="text-xs text-(--text-secondary) mb-1">Total Parcelado</span>
                            <span className="text-base font-semibold text-(--accent)">{fmt(sumParcelas)}</span>
                        </div>
                        <div className="flex flex-col items-center flex-1 min-w-30">
                            <span className="text-xs text-(--text-secondary) mb-1">Saldo Restante</span>
                            <span className={`text-base font-semibold ${saldoRestante < 0 ? "text-(--danger)" : saldoRestante === 0 ? "text-(--success)" : "text-(--warning)"}`}>
                                {fmt(saldoRestante)}
                            </span>
                        </div>
                        <div className="flex flex-col items-center flex-1 min-w-20">
                            <span className="text-xs text-(--text-secondary) mb-1">Parcelas</span>
                            <span className="text-base font-semibold text-(--text-primary)">{parcelas.length}</span>
                        </div>
                    </div>
                )}

                <TFormFooter>
                    <TFormActionsLeft>
                        <TButton label="Voltar" variant="cancel" onClick={() => navigate("/financeiro/contas-receber")} />
                        <TButton label="Novo"   variant="new"    onClick={handleNovo} />
                        {isEdit && conta && (
                            <>
                                <TButton
                                    label   ="PDF"
                                    variant ="secondary"
                                    icon    ={<FaFilePdf size={13} />}
                                    onClick ={handleVisualizarPdf}
                                />
                                <TButton
                                    label   ="WhatsApp"
                                    variant ="success"
                                    icon    ={<FaWhatsapp size={13} />}
                                    onClick ={handleEnviarWhatsapp}
                                />
                            </>
                        )}
                    </TFormActionsLeft>
                    <TFormActionsRight>
                        <TButton label="Salvar" variant="save" type="submit" loading={saving} />
                    </TFormActionsRight>
                </TFormFooter>
            </TForm>

            <TWindow
                title   ={editandoParcela ? "Editar Parcela" : "Nova(s) Parcela(s)"}
                open    ={parcelaWindowOpen}
                width   ="600px"
                onClose ={() => setParcelaWindowOpen(false)}
                actions ={
                    <TButton
                        label   ="Registrar"
                        variant ="save"
                        onClick ={handleRegistrarParcela}
                    />
                }
            >
                <div key={windowContentKey} className="flex flex-col gap-4">
                    <TRow>
                        <TCol>
                            <TDate
                                name         ="wpDataVencimento"
                                label        ="Data de Vencimento"
                                required
                                width        ="160px"
                                defaultValue ={wpDataVencimento}
                                onChange     ={setWpDataVencimento}
                            />
                        </TCol>
                        {!editandoParcela && (
                            <TCol>
                                <TEntry
                                    name         ="wpNumParcelas"
                                    label        ="Qtd. de Parcelas"
                                    width        ="130px"
                                    defaultValue ={wpNumParcelas}
                                    onChange     ={handleNumParcelasChange}
                                />
                            </TCol>
                        )}
                    </TRow>
                    <TRow>
                        <TCol>
                            <TEntry
                                key          ={wpValorKey}
                                name         ="wpValor"
                                label        ="Valor da Parcela"
                                mask         ="moeda"
                                required
                                width        ="160px"
                                defaultValue ={wpValor}
                                onChange     ={setWpValor}
                            />
                        </TCol>
                    </TRow>
                    <TRow>
                        <TCol>
                            <TDbCombo
                                name         ="wpFormaPagamentoId"
                                label        ="Forma de Pagamento"
                                url          ="/financeiro/formas-pagamento/select"
                                valueField   ="id"
                                displayField ="nome"
                                value        ={wpFormaPagamentoId}
                                width        ="280px"
                                onChange     ={(val, item) => {
                                    setWpFormaPagamentoId(val)
                                    setWpFormaPagamentoNome((item as { nome?: string })?.nome ?? "")
                                }}
                            />
                        </TCol>
                    </TRow>
                    <TRow>
                        <TCol>
                            <TDbCombo
                                name         ="wpContaFinanceiraId"
                                label        ="Conta Financeira"
                                url          ="/financeiro/contas/select"
                                valueField   ="id"
                                displayField ="nome"
                                value        ={wpContaFinanceiraId}
                                width        ="280px"
                                onChange     ={(val, item) => {
                                    setWpContaFinanceiraId(val)
                                    setWpContaFinanceiraNome((item as { nome?: string })?.nome ?? "")
                                }}
                            />
                        </TCol>
                    </TRow>
                    <TRow>
                        <TCol>
                            <TEntry
                                name         ="wpObservacao"
                                label        ="Observação"
                                defaultValue ={wpObservacao}
                                onChange     ={setWpObservacao}
                            />
                        </TCol>
                    </TRow>
                </div>
            </TWindow>
        </TPage>
    )
}
