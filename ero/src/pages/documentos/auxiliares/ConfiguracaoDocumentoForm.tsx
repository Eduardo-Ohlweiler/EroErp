import { useState, useEffect }                  from "react"
import axios                                     from "axios"
import { api }                                   from "../../../services/api"
import { useMessage }                            from "../../../hooks/useMessage"
import type { ErrorResponse }                    from "../../../types/ErrorResponse"
import { TPage }                                 from "../../../components/tpage"
import { TFormFooter, TFormActionsRight }        from "../../../components/tform"
import { TRow }                                  from "../../../components/trow"
import { TCol }                                  from "../../../components/tcol"
import { TPanel }                                from "../../../components/tpanel"
import { TButton }                               from "../../../components/tbutton"
import { TCombo }                                from "../../../components/tcombo"

export default function ConfiguracaoDocumentoForm() {
    const { showMessage } = useMessage()

    const [assinaturaDigital, setAssinaturaDigital] = useState("NAO")
    const [loading, setLoading] = useState(false)
    const [saving,  setSaving]  = useState(false)

    useEffect(() => {
        setLoading(true)
        api.get("/documentos/configuracao")
            .then((r) => {
                if (r.data?.assinaturaDigital) {
                    setAssinaturaDigital(r.data.assinaturaDigital)
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    async function handleSalvar() {
        setSaving(true)
        try {
            await api.put("/documentos/configuracao", { assinaturaDigital })
            showMessage("success", "Configuração salva com sucesso!")
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const d = err.response?.data as ErrorResponse
                showMessage("error", d?.erro ?? "Erro ao salvar configuração")
            } else {
                showMessage("error", "Erro inesperado ao salvar configuração")
            }
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <TPage title="Carregando..." breadcrumb={["Documentos", "Auxiliares", "Config. de Documentos"]}>
                <div className="flex justify-center py-12">
                    <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            </TPage>
        )
    }

    return (
        <TPage
            title      ="Configuração de Documentos"
            breadcrumb ={["Documentos", "Auxiliares", "Config. de Documentos"]}
        >
            <TPanel title="Assinatura Digital">
                <TRow>
                    <TCol>
                        <TCombo
                            name        ="assinaturaDigital"
                            label       ="Assinatura Digital"
                            width       ="200px"
                            defaultValue={assinaturaDigital}
                            onChange    ={setAssinaturaDigital}
                            options     ={[
                                { value: "NAO", label: "Não" },
                                { value: "SIM", label: "Sim" },
                            ]}
                        />
                    </TCol>
                </TRow>
            </TPanel>

            <TFormFooter>
                <TFormActionsRight>
                    <TButton label="Salvar" variant="save" type="button" loading={saving} onClick={handleSalvar} />
                </TFormActionsRight>
            </TFormFooter>
        </TPage>
    )
}
