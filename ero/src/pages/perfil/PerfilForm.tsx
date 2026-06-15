import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../../services/api"
import { useMessage } from "../../hooks/useMessage"
import { useAuth } from "../../hooks/useAuth"
import axios from "axios"
import type { ErrorResponse } from "../../types/ErrorResponse"
import type { Usuario } from "../../types/Usuario"
import { TPage } from "../../components/tpage"
import { TForm, TFormFooter, TFormActionsLeft, TFormActionsRight } from "../../components/tform"
import { TRow } from "../../components/trow"
import { TCol } from "../../components/tcol"
import { TEntry } from "../../components/tentry"
import { TPanel } from "../../components/tpanel"
import { TButton } from "../../components/tbutton"

export default function PerfilForm() {

    const navigate          = useNavigate()
    const { showMessage }   = useMessage()
    const { updateUser }    = useAuth()

    const [formKey, setFormKey] = useState(0)
    const [loading, setLoading] = useState(false)
    const [saving,  setSaving]  = useState(false)
    const [usuario, setUsuario] = useState<Usuario | null>(null)

    useEffect(() => {
        setLoading(true)
        api.get("/usuarios/me")
            .then((response) => setUsuario(response.data))
            .catch(() => {
                showMessage("error", "Erro ao carregar seus dados")
                navigate("/")
            })
            .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function reload() {
        try {
            const response = await api.get("/usuarios/me")
            setUsuario(response.data)
            setFormKey((prev) => prev + 1)
        } catch {
            showMessage("error", "Erro ao recarregar seus dados")
        }
    }

    async function handleSubmit(data: Record<string, string>) {

        const { senhaAtual, novaSenha, confirmarNovaSenha } = data

        if (novaSenha && novaSenha !== confirmarNovaSenha) {
            showMessage("error", "A nova senha e a confirmação não conferem")
            return
        }

        if (novaSenha && !senhaAtual) {
            showMessage("error", "Informe sua senha atual para alterar a senha")
            return
        }

        setSaving(true)
        try {
            const payload: Record<string, string> = {
                nome:     data.nome,
                email:    data.email,
                telefone: data.telefone
            }

            if (novaSenha) {
                payload.senhaAtual = senhaAtual
                payload.novaSenha  = novaSenha
            }

            await api.patch("/usuarios/me", payload)
            updateUser({ nome: data.nome, email: data.email })
            showMessage("success", "Dados atualizados com sucesso!")
            await reload()
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao salvar seus dados")
            } else {
                showMessage("error", "Erro inesperado ao salvar seus dados")
            }
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
        <TPage title="Carregando..." breadcrumb={["Meu Perfil"]}>
            <div className="flex justify-center py-12">
                <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
            </div>
        </TPage>
        )
    }

    return (
        <TPage title="Meu Perfil" breadcrumb={["Meu Perfil"]}>
            <TForm key={formKey} onSubmit={handleSubmit}>

                <TRow>
                    <TCol>
                        <TEntry
                            name        ="nome"
                            label       ="Nome"
                            required
                            width       ="60%"
                            maxLength   ={255}
                            defaultValue={usuario?.nome}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TEntry
                            name        ="email"
                            label       ="E-mail"
                            type        ="email"
                            required
                            width       ="60%"
                            maxLength   ={255}
                            defaultValue={usuario?.email}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TEntry
                            name        ="telefone"
                            label       ="Telefone"
                            mask        ="celular"
                            width       ="200px"
                            required
                            defaultValue={usuario?.telefone}
                        />
                    </TCol>
                </TRow>

                <TPanel title="Alterar senha" collapsed>
                    <TRow>
                        <TCol>
                            <TEntry
                                name ="senhaAtual"
                                label="Senha atual"
                                type ="password"
                                width="200px"
                            />
                        </TCol>
                    </TRow>
                    <TRow>
                        <TCol>
                            <TEntry
                                name ="novaSenha"
                                label="Nova senha"
                                type ="password"
                                width="200px"
                            />
                        </TCol>
                        <TCol>
                            <TEntry
                                name ="confirmarNovaSenha"
                                label="Confirmar nova senha"
                                type ="password"
                                width="200px"
                            />
                        </TCol>
                    </TRow>
                </TPanel>

                <TFormFooter>
                    <TFormActionsLeft>
                        <TButton label="Voltar" variant="cancel" onClick={() => navigate("/")} />
                    </TFormActionsLeft>
                    <TFormActionsRight>
                        <TButton label="Salvar" variant="save" type="submit" loading={saving} />
                    </TFormActionsRight>
                </TFormFooter>

            </TForm>
        </TPage>
    )
}
