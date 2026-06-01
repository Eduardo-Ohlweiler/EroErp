import { useState, useEffect }                  from "react"
import axios                                     from "axios"
import { api }                                   from "../../../services/api"
import { useMessage }                            from "../../../hooks/useMessage"
import type { ErrorResponse }                    from "../../../types/ErrorResponse"
import type { ConfiguracaoMensagem }             from "../../../types/ConfiguracaoMensagem"
import { TPage }                                 from "../../../components/tpage"
import { TForm, TFormFooter, TFormActionsRight } from "../../../components/tform"
import { TRow }                                  from "../../../components/trow"
import { TCol }                                  from "../../../components/tcol"
import { TText }                                 from "../../../components/ttext"
import { TPanel }                                from "../../../components/tpanel"
import { TSpace }                                from "../../../components/tspace"
import { TButton }                               from "../../../components/tbutton"

export default function ConfiguracaoMensagemForm() {
    const { showMessage } = useMessage()

    const [config,  setConfig]  = useState<ConfiguracaoMensagem | null>(null)
    const [loading, setLoading] = useState(false)
    const [saving,  setSaving]  = useState(false)
    const [formKey, setFormKey] = useState(0)

    useEffect(() => {
        setLoading(true)
        api.get("/whatsapp/configuracao-mensagem")
            .then((r) => setConfig(r.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    async function reload() {
        try {
            const r = await api.get("/whatsapp/configuracao-mensagem")
            setConfig(r.data)
            setFormKey((k) => k + 1)
        } catch {
            showMessage("error", "Erro ao recarregar configuração")
        }
    }

    async function handleSubmit(data: Record<string, string>) {
        setSaving(true)
        try {
            await api.put("/whatsapp/configuracao-mensagem", data)
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
            <TPage title="Carregando..." breadcrumb={["Agenda", "Auxiliares", "Config. de Mensagens"]}>
                <div className="flex justify-center py-12">
                    <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            </TPage>
        )
    }

    return (
        <TPage
            title      ="Configuração de Mensagens WhatsApp"
            breadcrumb ={["Agenda", "Auxiliares", "Config. de Mensagens"]}
        >
            <TForm key={formKey} onSubmit={handleSubmit}>

                <TPanel title="📅 Agendamento — mensagem enviada ao criar um compromisso">
                    <TRow>
                        <TCol>
                            <TText
                                name         ="cabecalhoAgendamento"
                                label        ="Cabeçalho"
                                placeholder  ="Ex: Olá! Seu agendamento foi confirmado."
                                defaultValue ={config?.cabecalhoAgendamento ?? ""}
                                height       ="90px"
                                maxLength    ={500}
                                width        ="100%"
                            />
                        </TCol>
                        <TSpace />
                    </TRow>
                    <TRow>
                        <TCol>
                            <TText
                                name         ="rodapeAgendamento"
                                label        ="Rodapé"
                                placeholder  ="Ex: Em caso de dúvidas, entre em contato conosco."
                                defaultValue ={config?.rodapeAgendamento ?? ""}
                                height       ="90px"
                                maxLength    ={500}
                                width        ="100%"
                            />
                        </TCol>
                        <TSpace />
                    </TRow>
                </TPanel>

                <TPanel title="🔔 Lembrete — enviado automaticamente antes do horário" collapsed>
                    <TRow>
                        <TCol>
                            <TText
                                name         ="cabecalhoLembrete"
                                label        ="Cabeçalho"
                                placeholder  ="Ex: Lembrete: você tem um compromisso chegando!"
                                defaultValue ={config?.cabecalhoLembrete ?? ""}
                                height       ="90px"
                                maxLength    ={500}
                                width        ="100%"
                            />
                        </TCol>
                        <TSpace />
                    </TRow>
                    <TRow>
                        <TCol>
                            <TText
                                name         ="rodapeLembrete"
                                label        ="Rodapé"
                                placeholder  ="Ex: Até logo!"
                                defaultValue ={config?.rodapeLembrete ?? ""}
                                height       ="90px"
                                maxLength    ={500}
                                width        ="100%"
                            />
                        </TCol>
                        <TSpace />
                    </TRow>
                </TPanel>

                <TPanel title="❌ Cancelamento — enviado ao cancelar um compromisso" collapsed>
                    <TRow>
                        <TCol>
                            <TText
                                name         ="cabecalhoCancelamento"
                                label        ="Cabeçalho"
                                placeholder  ="Ex: Informamos que seu compromisso foi cancelado."
                                defaultValue ={config?.cabecalhoCancelamento ?? ""}
                                height       ="90px"
                                maxLength    ={500}
                                width        ="100%"
                            />
                        </TCol>
                        <TSpace />
                    </TRow>
                    <TRow>
                        <TCol>
                            <TText
                                name         ="rodapeCancelamento"
                                label        ="Rodapé"
                                placeholder  ="Ex: Se precisar reagendar, estamos à disposição."
                                defaultValue ={config?.rodapeCancelamento ?? ""}
                                height       ="90px"
                                maxLength    ={500}
                                width        ="100%"
                            />
                        </TCol>
                        <TSpace />
                    </TRow>
                </TPanel>

                <TPanel title="✅ Conclusão — enviado ao concluir um compromisso" collapsed>
                    <TRow>
                        <TCol>
                            <TText
                                name         ="cabecalhoConclusao"
                                label        ="Cabeçalho"
                                placeholder  ="Ex: Seu atendimento foi concluído. Obrigado!"
                                defaultValue ={config?.cabecalhoConclusao ?? ""}
                                height       ="90px"
                                maxLength    ={500}
                                width        ="100%"
                            />
                        </TCol>
                        <TSpace />
                    </TRow>
                    <TRow>
                        <TCol>
                            <TText
                                name         ="rodapeConclusao"
                                label        ="Rodapé"
                                placeholder  ="Ex: Esperamos vê-lo em breve."
                                defaultValue ={config?.rodapeConclusao ?? ""}
                                height       ="90px"
                                maxLength    ={500}
                                width        ="100%"
                            />
                        </TCol>
                        <TSpace />
                    </TRow>
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
