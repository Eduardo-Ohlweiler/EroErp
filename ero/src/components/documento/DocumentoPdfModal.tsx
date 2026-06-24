import { useEffect, useState } from "react"
import { api }                 from "../../services/api"
import { useMessage }          from "../../hooks/useMessage"
import type { Documento }      from "../../types/Documento"
import { TWindow }             from "../twindow"
import { TButton }             from "../tbutton"

interface DocumentoPdfModalProps {
    documentoId: number | null
    open:        boolean
    onClose:     () => void
}

export function DocumentoPdfModal({ documentoId, open, onClose }: DocumentoPdfModalProps) {
    const { showMessage } = useMessage()

    const [documento,    setDocumento]    = useState<Documento | null>(null)
    const [loading,      setLoading]      = useState(false)
    const [exportandoPdf, setExportandoPdf] = useState(false)

    const previewId = `doc-preview-${documentoId ?? "x"}`

    useEffect(() => {
        if (!open || documentoId == null) { setDocumento(null); return }
        setLoading(true)
        api.get<Documento>(`/documentos/${documentoId}`)
            .then(r => setDocumento(r.data))
            .catch(() => showMessage("error", "Erro ao carregar o documento"))
            .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, documentoId])

    async function handleExportarPdf() {
        const el = document.getElementById(previewId)
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
            pdf.save(`contrato-${documentoId}.pdf`)
        } catch {
            showMessage("error", "Erro ao exportar PDF")
        } finally {
            setExportandoPdf(false)
        }
    }

    const temConteudo = !!documento?.conteudoGerado

    return (
        <TWindow
            title   ="Contrato"
            open    ={open}
            onClose ={onClose}
            width   ="820px"
            actions ={
                <>
                    <TButton label="Fechar" variant="cancel" type="button" onClick={onClose} />
                    <TButton
                        label   ="Baixar PDF"
                        variant ="new"
                        type    ="button"
                        loading ={exportandoPdf}
                        disabled={!temConteudo || loading}
                        onClick ={handleExportarPdf}
                    />
                </>
            }
        >
            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            ) : temConteudo ? (
                <div
                    id        ={previewId}
                    className ="border border-(--border) rounded-lg p-8 bg-white text-black min-h-100 prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: documento?.conteudoGerado ?? "" }}
                />
            ) : (
                <div className="px-4 py-3 rounded-lg border border-yellow-200 bg-yellow-50 text-sm text-yellow-800">
                    Documento sem conteúdo gerado.
                </div>
            )}
        </TWindow>
    )
}
