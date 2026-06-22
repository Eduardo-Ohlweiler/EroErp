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

export default function ConfiguracaoPedidoForm() {
    const { showMessage } = useMessage()

    const [faturarAoConcluir, setFaturarAoConcluir] = useState("PERGUNTAR")
    const [loading, setLoading] = useState(false)
    const [saving,  setSaving]  = useState(false)

    useEffect(() => {
        setLoading(true)
        api.get("/pedidos/configuracao")
            .then((r) => {
                if (r.data?.faturarAoConcluir) {
                    setFaturarAoConcluir(r.data.faturarAoConcluir)
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    async function handleSalvar() {
        setSaving(true)
        try {
            await api.put("/pedidos/configuracao", { faturarAoConcluir })
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
            <TPage title="Carregando..." breadcrumb={["Pedidos", "Auxiliar Pedidos", "Config. Pedido"]}>
                <div className="flex justify-center py-12">
                    <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            </TPage>
        )
    }

    return (
        <TPage
            title      ="Configuração de Pedido"
            breadcrumb ={["Pedidos", "Auxiliar Pedidos", "Config. Pedido"]}
        >
            <TPanel title="Pedido">
                <TRow>
                    <TCol>
                        <TCombo
                            name        ="faturarAoConcluir"
                            label       ="Faturar ao concluir"
                            width       ="220px"
                            defaultValue={faturarAoConcluir}
                            onChange    ={setFaturarAoConcluir}
                            options     ={[
                                { value: "SIM",       label: "Sim"       },
                                { value: "NAO",       label: "Não"       },
                                { value: "PERGUNTAR", label: "Perguntar" },
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
