import { useState, useEffect }                  from "react"
import axios                                     from "axios"
import { api }                                   from "../../../services/api"
import { useMessage }                            from "../../../hooks/useMessage"
import type { ErrorResponse }                    from "../../../types/ErrorResponse"
import type { ConfiguracaoPendencias }           from "../../../types/ConfiguracaoPendencias"
import { TPage }                                 from "../../../components/tpage"
import { TForm, TFormFooter, TFormActionsRight } from "../../../components/tform"
import { TRow }                                  from "../../../components/trow"
import { TCol }                                  from "../../../components/tcol"
import { TPanel }                                from "../../../components/tpanel"
//import { TSpace }                                from "../../../components/tspace"
import { TButton }                               from "../../../components/tbutton"
import { TEntry }                                from "../../../components/tentry"
//import { TCombo }                                from "../../../components/tcombo"
//import { TText }                                 from "../../../components/ttext"

export default function ConfiguracaoPendenciasForm() {
    const { showMessage } = useMessage()

    const [config,      setConfig]      = useState<ConfiguracaoPendencias | null>(null)
    const [loading,     setLoading]     = useState(false)
    const [saving,      setSaving]      = useState(false)
    const [formKey,     setFormKey]     = useState(0)
    //const [notificar,   setNotificar]   = useState<string>("NAO")

    useEffect(() => {
        setLoading(true)
        api.get("/dashboards/configuracao-pendencias")
            .then((r) => {
                setConfig(r.data)
                //setNotificar(r.data.notificarClientesVencimento ?? "NAO")
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    async function reload() {
        try {
            const r = await api.get("/dashboards/configuracao-pendencias")
            setConfig(r.data)
            //setNotificar(r.data.notificarClientesVencimento ?? "NAO")
            setFormKey((k) => k + 1)
        } catch {
            showMessage("error", "Erro ao recarregar configuração")
        }
    }

    async function handleSubmit(data: Record<string, string>) {
        setSaving(true)
        try {
            await api.put("/dashboards/configuracao-pendencias", data)
            showMessage("success", "Configuração salva com sucesso!")
            await reload()
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
            <TPage title="Carregando..." breadcrumb={["Dashboards", "Auxiliar Dashboards", "Config. de Pendências"]}>
                <div className="flex justify-center py-12">
                    <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            </TPage>
        )
    }

    return (
        <TPage
            title     ="Configuração de Pendências"
            breadcrumb={["Dashboards", "Auxiliar Dashboards", "Config. de Pendências"]}
        >
            <TForm key={formKey} onSubmit={handleSubmit}>

                <TPanel title="Configuração de Pendências">
                    <TRow>
                        <TCol>
                            <TEntry
                                name         ="diasAntes"
                                label        ="Mostrar quantos dias antes?"
                                mask         ="numero"
                                width        ="160px"
                                defaultValue ={config?.diasAntes != null ? String(config.diasAntes) : ""}
                            />
                        </TCol>
                    </TRow>
                    {/* <TRow>
                        <TCol>
                            <TCombo
                                name         ="notificarClientesVencimento"
                                label        ="Notificar clientes no dia do vencimento?"
                                width        ="100%"
                                defaultValue ={config?.notificarClientesVencimento ?? "NAO"}
                                onChange     ={setNotificar}
                                options      ={[
                                    { value: "SIM", label: "Sim" },
                                    { value: "NAO", label: "Não" },
                                ]}
                            />
                        </TCol>
                    </TRow>
                    {notificar === "SIM" && (
                        <TRow>
                            <TCol>
                                <TText
                                    name         ="mensagemAviso"
                                    label        ="Mensagem de aviso"
                                    width        ="100%"
                                    defaultValue ={config?.mensagemAviso ?? ""}
                                />
                            </TCol>
                            <TSpace />
                        </TRow>
                    )} */}
                </TPanel>

                <TFormFooter>
                    <TFormActionsRight>
                        <TButton label="Salvar" variant="save" type="submit" loading={saving} />
                    </TFormActionsRight>
                </TFormFooter>

            </TForm>
        </TPage>
    )
}
