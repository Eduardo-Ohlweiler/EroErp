import { useNavigate, useParams }                                from "react-router-dom"
import { useMessage }                                            from "../../hooks/useMessage"
import { useEffect, useMemo, useRef, useState }                 from "react"
import type { Documento }                                        from "../../types/Documento"
import { api }                                                   from "../../services/api"
import axios                                                     from "axios"
import type { ErrorResponse }                                    from "../../types/ErrorResponse"
import type { AssinaturaDocumento }                              from "../../types/AssinaturaDocumento"
import { displayEmitente }                                       from "../../utils/pessoas"
import { TPage }                                                 from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TButton }                                               from "../../components/tbutton"
import { TRow }                                                  from "../../components/trow"
import { TCol }                                                  from "../../components/tcol"
import { TEntry }                                                from "../../components/tentry"
import { TDbCombo }                                              from "../../components/tdbcombo"
import { TCombo }                                                from "../../components/tcombo"
import { TDate }                                                 from "../../components/tdate"
import { TSpace } from "../../components/tspace"

function formatarDataExtenso(dataStr?: string): string {
    if (!dataStr) return ""
    const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"]
    const partes = dataStr.split("T")[0].split("-")
    return `${parseInt(partes[2])} de ${meses[parseInt(partes[1]) - 1]} de ${partes[0]}`
}

function SignaturePreviewCanvas({ strokeData }: { strokeData: string }) {
    const ref = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = ref.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        try {
            const strokes = JSON.parse(strokeData) as number[][][]
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.strokeStyle = "#111"
            ctx.lineWidth = 2.5
            ctx.lineCap = "round"
            ctx.lineJoin = "round"
            const sx = canvas.width / 800
            const sy = canvas.height / 220
            strokes.forEach(stroke => {
                if (stroke.length < 2) return
                ctx.beginPath()
                ctx.moveTo(stroke[0][0] * sx, stroke[0][1] * sy)
                stroke.slice(1).forEach(([x, y]) => ctx.lineTo(x * sx, y * sy))
                ctx.stroke()
            })
        } catch { /* ignore */ }
    }, [strokeData])

    return (
        <canvas
            ref={ref}
            width={320}
            height={96}
            style={{ width: "100%", height: "96px", display: "block" }}
        />
    )
}

export default function DocumentoForm() {

    const { id: idParam } = useParams()
    const navigate        = useNavigate()
    const { showMessage } = useMessage()

    const [modeloDocumentoId, setModeloDocumentoId] = useState("")
    const [emitenteId,        setEmitenteId]        = useState("")
    const [clientePessoaId,   setClientePessoaId]   = useState("")
    const [estoqueId,         setEstoqueId]         = useState("")
    const [valor,             setValor]             = useState("")
    const [tipoAjuste,        setTipoAjuste]        = useState<"DESCONTO" | "ACRESCIMO">("DESCONTO")
    const [tipoValorAjuste,   setTipoValorAjuste]   = useState<"VALOR" | "PERCENTUAL">("VALOR")
    const [ajuste,            setAjuste]            = useState("0")
    const [numeroParcelas,    setNumeroParcelas]     = useState("1")
    const [documento,         setDocumento]         = useState<Documento | null>(null)
    const [formaPagamentoId,  setFormaPagamentoId]  = useState("")
    const [saving,             setSaving]             = useState(false)
    const [loading,            setLoading]            = useState(false)
    const [exportandoPdf,     setExportandoPdf]     = useState(false)
    const [formKey,           setFormKey]           = useState(0)
    const [currentId,         setCurrentId]         = useState<string | undefined>(idParam)
    const [assinaturaConfig,  setAssinaturaConfig]  = useState<{ assinaturaDigital?: string } | null>(null)
    const [assinatura,        setAssinatura]        = useState<AssinaturaDocumento | null>(null)
    const [linkGerado,        setLinkGerado]        = useState<string | null>(null)
    const [solicitando,       setSolicitando]       = useState(false)
    const [aceitando,         setAceitando]         = useState(false)
    const [rejeitando,        setRejeitando]        = useState(false)
    const [enviandoWhatsapp,  setEnviandoWhatsapp]  = useState(false)

    const isEdit = !!currentId

    const valorFinal = useMemo(() => {
        const v = parseFloat(valor.replace(",", "."))  || 0
        const a = parseFloat(ajuste.replace(",", ".")) || 0
        const ajusteEfetivo = tipoValorAjuste === "PERCENTUAL" ? v * a / 100 : a
        return tipoAjuste === "DESCONTO" ? v - ajusteEfetivo : v + ajusteEfetivo
    }, [valor, ajuste, tipoAjuste, tipoValorAjuste])

    useEffect(() => {
        // Sempre busca config de assinatura
        api.get("/documentos/configuracao")
            .then((r) => setAssinaturaConfig(r.data))
            .catch(() => setAssinaturaConfig(null))

        if (!currentId) {
            setModeloDocumentoId("")
            setEmitenteId("")
            setClientePessoaId("")
            setEstoqueId("")
            setValor("")
            setTipoAjuste("DESCONTO")
            setTipoValorAjuste("VALOR")
            setAjuste("0")
            setNumeroParcelas("1")
            return
        }

        // Busca assinatura atual (silencia 404)
        api.get(`/documentos/${currentId}/assinatura`)
            .then((r) => setAssinatura(r.data))
            .catch(() => setAssinatura(null))

        setLoading(true)
        api.get(`/documentos/${currentId}`)
            .then((response) => {
                const doc: Documento = response.data
                setDocumento(doc)
                setModeloDocumentoId(String(doc.modeloDocumentoId))
                setEmitenteId(String(doc.emitenteId))
                setClientePessoaId(String(doc.clientePessoaId))
                setEstoqueId(doc.estoqueId ? String(doc.estoqueId) : "")
                setValor(doc.valor != null ? String(doc.valor) : "")
                if ((doc.acrescimo ?? 0) > 0 && !(doc.desconto ?? 0)) {
                    setTipoAjuste("ACRESCIMO")
                    setTipoValorAjuste(doc.tipoAcrescimo ?? "VALOR")
                    setAjuste(String(doc.acrescimo))
                } else {
                    setTipoAjuste("DESCONTO")
                    setTipoValorAjuste(doc.tipoDesconto ?? "VALOR")
                    setAjuste(String(doc.desconto ?? 0))
                }
                setFormaPagamentoId(doc.formaPagamentoId ? String(doc.formaPagamentoId) : "")
                setNumeroParcelas(String(doc.numeroParcelas ?? 1))
                setFormKey((k) => k + 1)
            })
            .catch(() => {
                showMessage("error", "Erro ao carregar documento")
                navigate("/documentos")
            })
            .finally(() => setLoading(false))
    }, [currentId]) // eslint-disable-line

    // Quando estoqueId muda (e não está vazio), busca preço de venda
    useEffect(() => {
        if (!estoqueId) return

        api.get(`/estoque/${estoqueId}`)
            .then((response) => {
                const preco = response.data.precoVenda
                if (preco != null) {
                    setValor(String(preco))
                    setFormKey((k) => k + 1)
                }
            })
            .catch(() => {})
    }, [estoqueId]) // eslint-disable-line

    function handleNovo() {
        setCurrentId(undefined)
        setDocumento(null)
        setModeloDocumentoId("")
        setEmitenteId("")
        setClientePessoaId("")
        setEstoqueId("")
        setValor("")
        setTipoAjuste("DESCONTO")
        setTipoValorAjuste("VALOR")
        setAjuste("0")
        setFormaPagamentoId("")
        setNumeroParcelas("1")
        setFormKey((k) => k + 1)
    }

    async function reload(id: string) {
        try {
            const response = await api.get(`/documentos/${id}`)
            const doc: Documento = response.data
            setDocumento(doc)
            setModeloDocumentoId(String(doc.modeloDocumentoId))
            setEmitenteId(String(doc.emitenteId))
            setClientePessoaId(String(doc.clientePessoaId))
            setEstoqueId(doc.estoqueId ? String(doc.estoqueId) : "")
            setValor(doc.valor != null ? String(doc.valor) : "")
            if ((doc.acrescimo ?? 0) > 0 && !(doc.desconto ?? 0)) {
                setTipoAjuste("ACRESCIMO")
                setTipoValorAjuste(doc.tipoAcrescimo ?? "VALOR")
                setAjuste(String(doc.acrescimo))
            } else {
                setTipoAjuste("DESCONTO")
                setTipoValorAjuste(doc.tipoDesconto ?? "VALOR")
                setAjuste(String(doc.desconto ?? 0))
            }
            setFormaPagamentoId(doc.formaPagamentoId ? String(doc.formaPagamentoId) : "")
            setNumeroParcelas(String(doc.numeroParcelas ?? 1))
            setFormKey((k) => k + 1)
        } catch {
            showMessage("error", "Erro ao recarregar o documento")
        }
    }

    async function handleSubmit(data: Record<string, string>) {
        setSaving(true)
        try {
            const payload = {
                modeloDocumentoId: Number(modeloDocumentoId),
                emitenteId:        Number(emitenteId),
                clientePessoaId:   Number(clientePessoaId),
                estoqueId:         estoqueId ? Number(estoqueId) : undefined,
                dataEmissao:       data.dataEmissao,
                valor:             valor ? parseFloat(valor.replace(",", ".")) : undefined,
                desconto:          tipoAjuste === "DESCONTO"  ? parseFloat(ajuste.replace(",", ".")) || 0 : 0,
                tipoDesconto:      tipoAjuste === "DESCONTO"  ? tipoValorAjuste : "VALOR",
                acrescimo:         tipoAjuste === "ACRESCIMO" ? parseFloat(ajuste.replace(",", ".")) || 0 : 0,
                tipoAcrescimo:     tipoAjuste === "ACRESCIMO" ? tipoValorAjuste : "VALOR",
                formaPagamentoId:  formaPagamentoId ? Number(formaPagamentoId) : undefined,
                numeroParcelas:    Number(numeroParcelas) || 1,
                observacoes:       data.observacoes || undefined,
            }

            if (isEdit) {
                await api.patch(`/documentos/${currentId}`, payload)
                showMessage("success", "Documento salvo com sucesso!")
                await reload(currentId!)
            } else {
                const response = await api.post("/documentos", payload)
                showMessage("success", "Documento criado com sucesso!")
                const novoId = String(response.data.id)
                setCurrentId(novoId)
                await reload(novoId)
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao salvar documento")
            } else {
                showMessage("error", "Erro inesperado ao salvar documento")
            }
        } finally {
            setSaving(false)
        }
    }

    async function handleEmitir() {
        try {
            await api.patch(`/documentos/${currentId}/emitir`)
            showMessage("success", "Documento emitido com sucesso!")
            await reload(currentId!)
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao emitir documento")
            } else {
                showMessage("error", "Erro inesperado ao emitir documento")
            }
        }
    }

    async function handleCancelarDoc() {
        try {
            await api.patch(`/documentos/${currentId}/cancelar`)
            showMessage("success", "Documento cancelado com sucesso!")
            await reload(currentId!)
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao cancelar documento")
            } else {
                showMessage("error", "Erro inesperado ao cancelar documento")
            }
        }
    }

    async function handleSolicitarAssinatura() {
        setSolicitando(true)
        try {
            const res = await api.post(`/documentos/${currentId}/solicitar-assinatura`)
            const link = `${window.location.origin}/assinar/${res.data.token}`
            setLinkGerado(link)
            // Recarrega assinatura
            const aRes = await api.get(`/documentos/${currentId}/assinatura`)
            setAssinatura(aRes.data)
            showMessage("success", "Link de assinatura gerado!")
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao solicitar assinatura")
            } else {
                showMessage("error", "Erro inesperado ao solicitar assinatura")
            }
        } finally {
            setSolicitando(false)
        }
    }

    async function handleAceitar() {
        setAceitando(true)
        try {
            await api.patch(`/documentos/${currentId}/assinatura/aceitar`)
            const aRes = await api.get(`/documentos/${currentId}/assinatura`)
            setAssinatura(aRes.data)
            showMessage("success", "Assinatura aceita!")
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao aceitar assinatura")
            } else {
                showMessage("error", "Erro inesperado")
            }
        } finally {
            setAceitando(false)
        }
    }

    async function handleRejeitar() {
        setRejeitando(true)
        try {
            await api.patch(`/documentos/${currentId}/assinatura/rejeitar`)
            const aRes = await api.get(`/documentos/${currentId}/assinatura`)
            setAssinatura(aRes.data)
            setLinkGerado(null)
            showMessage("success", "Assinatura rejeitada")
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao rejeitar assinatura")
            } else {
                showMessage("error", "Erro inesperado")
            }
        } finally {
            setRejeitando(false)
        }
    }

    async function handleEnviarWhatsapp() {
        const link = linkGerado ?? (assinatura ? `${window.location.origin}/assinar/${assinatura.token}` : null)
        if (!link) return
        setEnviandoWhatsapp(true)
        try {
            await api.post(`/documentos/${currentId}/assinatura/enviar-whatsapp`, { link })
            showMessage("success", "Link enviado por WhatsApp!")
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao enviar WhatsApp")
            } else {
                showMessage("error", "Erro inesperado ao enviar WhatsApp")
            }
        } finally {
            setEnviandoWhatsapp(false)
        }
    }

    async function handleExportarPdf() {
        const el = document.getElementById("documento-preview")
        if (!el) return
        setExportandoPdf(true)
        try {
            const html2canvas = (await import("html2canvas")).default
            const { jsPDF }   = await import("jspdf")
            const canvas      = await html2canvas(el, { scale: 2, useCORS: true })
            const imgData     = canvas.toDataURL("image/png")
            const pdf         = new jsPDF("p", "mm", "a4")
            const pdfWidth    = pdf.internal.pageSize.getWidth()
            const pdfHeight   = (canvas.height * pdfWidth) / canvas.width
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
            pdf.save(`documento-${documento?.id}.pdf`)
        } catch {
            showMessage("error", "Erro ao exportar PDF")
        } finally {
            setExportandoPdf(false)
        }
    }

    if (loading) {
        return (
            <TPage title="Carregando..." breadcrumb={["Documentos", "Documentos"]}>
                <div className="flex justify-center py-12">
                    <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            </TPage>
        )
    }

    const estoqueUrl = emitenteId
        ? `/estoque?emitenteId=${emitenteId}`
        : "/estoque"

    return (
        <TPage
            title     ={isEdit ? "Editar Documento" : "Novo Documento"}
            breadcrumb={["Documentos", "Documentos"]}
        >
            <TForm key={formKey} onSubmit={handleSubmit}>

                {/* Linha 1 — Modelo de Documento */}
                <TRow>
                    <TCol>
                        <TDbCombo
                            name        ="modeloDocumentoId"
                            label       ="Modelo de Documento *"
                            url         ="/modelos-documento/select"
                            valueField  ="id"
                            displayField="nome"
                            searchField ="nome"
                            required
                            width       ="50%"
                            value       ={modeloDocumentoId}
                            onChange    ={setModeloDocumentoId}
                        />
                    </TCol>
                </TRow>

                {/* Linha 2 — Emitente */}
                <TRow>
                    <TCol>
                        <TDbCombo
                            name        ="emitenteId"
                            label       ="Emitente *"
                            url         ="/emitentes/select"
                            valueField  ="id"
                            displayField={displayEmitente}
                            searchField ="nome"
                            required
                            width       ="50%"
                            value       ={emitenteId}
                            onChange    ={(val) => { setEmitenteId(val); setEstoqueId("") }}
                        />
                    </TCol>
                </TRow>

                {/* Linha 3 — Cliente */}
                <TRow>
                    <TCol>
                        <TDbCombo
                            name        ="clientePessoaId"
                            label       ="Cliente (Contratante) *"
                            url         ="/pessoas/select"
                            valueField  ="id"
                            displayField="nome"
                            searchField ="nome"
                            required
                            width       ="50%"
                            value       ={clientePessoaId}
                            onChange    ={setClientePessoaId}
                        />
                    </TCol>
                </TRow>

                {/* Linha 4 — Produto/Serviço (estoque) */}
                <TRow>
                    <TCol>
                        <TDbCombo
                            name        ="estoqueId"
                            label       ="Produto/Serviço"
                            url         ={estoqueUrl}
                            valueField  ="id"
                            displayField="produtoNome"
                            searchField ="produtoNome"
                            width       ="50%"
                            value       ={estoqueId}
                            onChange    ={setEstoqueId}
                        />
                    </TCol>
                </TRow>

                {/* Linha 5 — Valor, Ajuste e Valor Final */}
                <TRow>
                    <TCol>
                        <div className="flex items-end gap-3 flex-wrap">
                            <TEntry
                                name        ="valor"
                                label       ="Valor (R$) *"
                                mask        ="moeda"
                                width       ="180px"
                                defaultValue={valor}
                                onChange    ={setValor}
                            />
                            <TCombo
                                name        ="tipoAjuste"
                                label       ="Ajuste"
                                width       ="140px"
                                defaultValue={tipoAjuste}
                                onChange    ={(v) => setTipoAjuste(v as "DESCONTO" | "ACRESCIMO")}
                                options     ={[
                                    { value: "DESCONTO",  label: "Desconto"  },
                                    { value: "ACRESCIMO", label: "Acréscimo" },
                                ]}
                            />
                            <TCombo
                                name        ="tipoValorAjuste"
                                label       =" "
                                width       ="80px"
                                defaultValue={tipoValorAjuste}
                                onChange    ={(v) => setTipoValorAjuste(v as "VALOR" | "PERCENTUAL")}
                                options     ={[
                                    { value: "VALOR",      label: "R$" },
                                    { value: "PERCENTUAL", label: "%"  },
                                ]}
                            />
                            <TEntry
                                name        ="ajuste"
                                label       =" "
                                mask        ="moeda"
                                width       ="140px"
                                defaultValue={ajuste}
                                onChange    ={setAjuste}
                            />
                            <div className="flex flex-col gap-1 pb-0.5">
                                <span className="text-sm text-(--text-secondary)">Valor Final</span>
                                <span className="h-9.5 flex items-center text-base font-semibold text-(--text-primary)">
                                    {valorFinal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </span>
                            </div>
                        </div>
                    </TCol>
                </TRow>

                {/* Linha 7 — Nº Parcelas e Data de Emissão */}
                <TRow>
                    <TCol>
                        <TEntry
                            name        ="numeroParcelas"
                            label       ="Nº Parcelas"
                            mask        ="numero"
                            width       ="200px"
                            defaultValue={numeroParcelas}
                            onChange    ={setNumeroParcelas}
                        />
                    </TCol>
                    <TCol>
                        <TDate
                            name        ="dataEmissao"
                            label       ="Data de Emissão *"
                            required
                            //width       ="200px"
                            defaultValue={documento?.dataEmissao}
                        />
                    </TCol>
                    <TSpace />
                </TRow>

                {/* Linha 8 — Forma de Pagamento */}
                <TRow>
                    <TCol>
                        <TDbCombo
                            name        ="formaPagamentoId"
                            label       ="Forma de Pagamento"
                            url         ="/financeiro/formas-pagamento/select"
                            valueField  ="id"
                            displayField="nome"
                            searchField ="nome"
                            width       ="300px"
                            value       ={formaPagamentoId}
                            onChange    ={setFormaPagamentoId}
                        />
                    </TCol>
                </TRow>

                {/* Linha 9 — Observações */}
                <TRow>
                    <TCol>
                        <TEntry
                            name        ="observacoes"
                            label       ="Observações"
                            maxLength   ={1000}
                            width       ="100%"
                            defaultValue={documento?.observacoes}
                        />
                    </TCol>
                </TRow>

                <TFormFooter>
                    <TFormActionsLeft>
                        <TButton label="Voltar" variant="cancel" type="button" onClick={() => navigate("/documentos")} />
                        <TButton label="Novo"   variant="new"    type="button" onClick={handleNovo} />
                    </TFormActionsLeft>
                    <TFormActionsRight>
                        {isEdit && documento?.status === "RASCUNHO" && (
                            <TButton
                                label  ="Emitir"
                                variant="save"
                                type   ="button"
                                onClick={handleEmitir}
                            />
                        )}
                        {isEdit && documento?.status !== "CANCELADO" && (
                            <TButton
                                label  ="Cancelar Doc."
                                variant="block"
                                type   ="button"
                                onClick={handleCancelarDoc}
                            />
                        )}
                        {assinaturaConfig?.assinaturaDigital === "SIM" && isEdit && documento?.status === "EMITIDO" &&
                         (!assinatura || assinatura.status === "REJEITADO") && (
                            <TButton
                                label  ="Solicitar Assinatura"
                                variant="new"
                                type   ="button"
                                loading={solicitando}
                                onClick={handleSolicitarAssinatura}
                            />
                        )}
                        <TButton label="Salvar" variant="save" type="submit" loading={saving} />
                        {isEdit && documento?.status !== "RASCUNHO" && (
                            <TButton
                                label  ="Exportar PDF"
                                variant="new"
                                type   ="button"
                                loading={exportandoPdf}
                                onClick={handleExportarPdf}
                            />
                        )}
                    </TFormActionsRight>
                </TFormFooter>

            </TForm>

            {/* Área de status da assinatura */}
            {isEdit && assinaturaConfig?.assinaturaDigital === "SIM" && (
                <div className="mt-4">
                    {/* Link gerado - PENDENTE */}
                    {assinatura?.status === "PENDENTE" && (
                        <div className="border border-(--border) rounded-lg p-4 bg-(--bg-surface)">
                            <p className="text-sm font-semibold text-(--text-primary) mb-2">Aguardando assinatura do cliente</p>
                            <p className="text-xs text-(--text-secondary) mb-2">Envie o link abaixo para o cliente assinar:</p>
                            <div className="flex items-center gap-2">
                                <input
                                    readOnly
                                    value={linkGerado ?? `${window.location.origin}/assinar/${assinatura.token}`}
                                    className="flex-1 text-xs border border-(--border) rounded px-2 py-1 bg-white text-(--text-primary)"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const link = linkGerado ?? `${window.location.origin}/assinar/${assinatura.token}`
                                        navigator.clipboard.writeText(link)
                                        showMessage("success", "Link copiado!")
                                    }}
                                    className="text-xs px-3 py-1 border border-(--border) rounded hover:bg-(--bg-hover) whitespace-nowrap"
                                >
                                    Copiar
                                </button>
                                <TButton
                                    label  ={enviandoWhatsapp ? "Enviando..." : "Enviar Link"}
                                    variant="save"
                                    type   ="button"
                                    loading={enviandoWhatsapp}
                                    onClick={handleEnviarWhatsapp}
                                />
                            </div>
                        </div>
                    )}

                    {/* ASSINADO - aguardando revisão */}
                    {assinatura?.status === "ASSINADO" && (
                        <div className="border border-(--border) rounded-lg p-4">
                            <p className="text-sm font-semibold text-(--text-primary) mb-3">Assinatura recebida — revise abaixo</p>
                            <div className="max-w-xs border border-(--border) rounded bg-white">
                                {assinatura.dadosAssinatura && (
                                    <SignaturePreviewCanvas strokeData={assinatura.dadosAssinatura} />
                                )}
                            </div>
                            <div className="flex gap-2 mt-3">
                                <TButton label="Aceitar Assinatura"  variant="save"  type="button" loading={aceitando}  onClick={handleAceitar}  />
                                <TButton label="Rejeitar Assinatura" variant="block" type="button" loading={rejeitando} onClick={handleRejeitar} />
                            </div>
                        </div>
                    )}

                    {/* ACEITO */}
                    {assinatura?.status === "ACEITO" && (
                        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                            <p className="text-sm font-semibold text-green-700 mb-2">Documento assinado e aceito</p>
                            {assinatura.dadosAssinatura && (
                                <div className="max-w-xs border border-green-300 rounded bg-white">
                                    <SignaturePreviewCanvas strokeData={assinatura.dadosAssinatura} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* REJEITADO */}
                    {assinatura?.status === "REJEITADO" && (
                        <div className="border border-orange-200 rounded-lg p-3 bg-orange-50">
                            <p className="text-sm text-orange-700">Assinatura rejeitada. Clique em "Solicitar Assinatura" para gerar um novo link.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Prévia do documento */}
            {isEdit && documento?.conteudoGerado && (
                <div className="mt-6">
                    <h3 className="text-base font-semibold text-(--text-primary) mb-3">
                        Prévia do Documento
                    </h3>
                    <div
                        id        ="documento-preview"
                        className ="border border-(--border) rounded-lg p-8 bg-white text-black min-h-100 prose max-w-none"
                    >
                        <div dangerouslySetInnerHTML={{ __html: documento.conteudoGerado }} />

                        {assinaturaConfig?.assinaturaDigital === "SIM" && (
                            <div className="mt-16 flex justify-center not-prose">
                                <div className="w-72 flex flex-col items-center">
                                    <div className="w-full h-24">
                                        {assinatura?.status === "ACEITO" && assinatura.dadosAssinatura
                                            ? <SignaturePreviewCanvas strokeData={assinatura.dadosAssinatura} />
                                            : <div className="w-full h-24" />
                                        }
                                    </div>
                                    <div className="w-full border-t border-black" />
                                    <p className="text-sm font-medium mt-1 text-center tracking-wide text-black">
                                        {documento.clientePessoaNome.toUpperCase()}
                                    </p>
                                    <p className="text-xs text-center mt-0.5 text-black">
                                        {formatarDataExtenso(documento.dataEmissao)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </TPage>
    )
}
