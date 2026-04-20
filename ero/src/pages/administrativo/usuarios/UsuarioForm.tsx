import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { api } from "../../../services/api"
import { useMessage } from "../../../hooks/useMessage"
import axios from "axios"
import type { ErrorResponse } from "../../../types/ErrorResponse"
import type { Usuario } from "../../../types/Usuario"
import { TPage } from "../../../components/tpage"
import { TForm, TFormFooter, TFormActionsLeft, TFormActionsRight } from "../../../components/tform"
import { TRow } from "../../../components/trow"
import { TCol } from "../../../components/tcol"
import { TEntry } from "../../../components/tentry"
import { TCombo } from "../../../components/tcombo"
import { TDbCombo } from "../../../components/tdbcombo"
import { TDbCheckbox } from "../../../components/tdbcheckbox"
import { TButton } from "../../../components/tbutton"
import { TSpace } from "../../../components/tspace"

export default function UsuarioForm() {

    const { id: idParam } = useParams()
    const navigate        = useNavigate()
    const { showMessage } = useMessage()

    const [clienteId, setClienteId] = useState("")
    const [currentId, setCurrentId] = useState<string | undefined>(idParam)
    const isEdit                    = !!currentId

    const [formKey,  setFormKey]  = useState(0)
    const [loading,  setLoading]  = useState(false)
    const [saving,   setSaving]   = useState(false)
    const [usuario,  setUsuario]  = useState<Usuario | null>(null)

    useEffect(() => {
    if (!currentId) {
        setClienteId("")
        return
    }

    setLoading(true)
    api.get(`/usuarios/${currentId}`)
        .then((response) => {
        setUsuario(response.data)
        setClienteId(String(response.data.clienteId))
        })
        .catch(() => {
        showMessage("error", "Erro ao carregar usuário")
        navigate("/usuarios")
        })
        .finally(() => setLoading(false))
    }, [currentId])

    function handleNovo() {
        setCurrentId(undefined)
        setUsuario(null)
        setClienteId("")
        setFormKey((prev) => prev + 1)
    }

    async function reload(id: string) {
    try {
        const response = await api.get(`/usuarios/${id}`)
        setUsuario(response.data)
        setClienteId(String(response.data.clienteId))
        setFormKey((prev) => prev + 1)
    } catch {
        showMessage("error", "Erro ao recarregar usuário")
    }
    }

    async function handleSubmit(data: Record<string, string>) {
        setSaving(true)
        try {
            const { createdById, createdAt, updatedById, updatedAt, ...rest } = data
            const payload = {
                ...rest,
                ativo:   data.ativo === "true",
                roleIds: data.roleIds ? data.roleIds.split(",") : []
            }

            if (isEdit) {
                await api.patch(`/usuarios/${currentId}`, payload)
                showMessage("success", "Usuário atualizado com sucesso!")
                await reload(currentId!)
            } else {
                const response = await api.post(
                `/usuarios/cliente/${data.clienteId}`,
                payload
                )
                showMessage("success", "Usuário cadastrado com sucesso!")
                const novoId = String(response.data.id)
                setCurrentId(novoId)
                await reload(novoId)
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao salvar usuário")
            } else {
                showMessage("error", "Erro inesperado ao salvar usuário")
            }
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
        <TPage title="Carregando..." breadcrumb={["Administração", "Usuários"]}>
            <div className="flex justify-center py-12">
            <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
            </div>
        </TPage>
        )
    }

    return (
        <TPage
        title={isEdit ? "Editar Usuário" : "Novo Usuário"}
        breadcrumb={["Administração", "Usuários", isEdit ? "Editar" : "Novo"]}
        >
        <TForm key={formKey} onSubmit={handleSubmit}>

            <TRow>
            <TCol>
                <TEntry
                name="nome"
                label="Nome"
                required
                maxLength={255}
                defaultValue={usuario?.nome}
                />
            </TCol>
            <TCol>
                <TEntry
                name="email"
                label="E-mail"
                type="email"
                required
                maxLength={255}
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
                defaultValue={usuario?.telefone}
                />
            </TCol>
            <TCol>
                <TEntry
                name    ="senha"
                label   ={isEdit ? "Nova Senha (deixe vazio para manter)" : "Senha"}
                type    ="password"
                required={!isEdit}
                />
            </TCol>
            </TRow>

            <TRow>
                <TCol>
                    <TDbCombo
                        name        ="clienteId"
                        label       ="Cliente"
                        url         ="/clientes"
                        valueField  ="id"
                        displayField="nome"
                        searchField ="nome"
                        required    ={!isEdit}
                        disabled    ={isEdit}
                        value       ={clienteId}                 
                        onChange    ={setClienteId} 
                    />
                </TCol>
                <TCol>
                    <TCombo
                        name        ="ativo"
                        label       ="Status"
                        width       ="200px"
                        defaultValue={usuario ? (usuario.ativo ? "true" : "false") : "true"}
                            options ={[
                                { value: "true",  label: "Ativo"     },
                                { value: "false", label: "Bloqueado"  },
                            ]}
                    />
                </TCol>
            </TRow>

            <TRow>
            <TCol>
                <TDbCheckbox
                name            ="roleIds"
                label           ="Perfis de acesso"
                url             ="/roles"
                valueField      ="nome"
                labelField      ="nome"
                direction       ="row"
                defaultValues   ={usuario?.roles ?? []}
                />
            </TCol>
            </TRow>
            
            {isEdit && (
                <TRow>
                    <TCol>
                    <TEntry
                        name         ="createdById"
                        label        ="Criado por"
                        disabled
                        defaultValue ={usuario?.createdByNome ?? "—"}
                    />
                    </TCol>
                    <TCol>
                    <TEntry
                        name         ="createdAt"
                        label        ="Criado em"
                        disabled
                        width="160px"
                        defaultValue ={usuario?.createdAt
                                        ? new Date(usuario.createdAt).toLocaleString("pt-BR")
                                        : "—"}
                    />
                    </TCol>
                    <TSpace />
                </TRow>
            )}

            {isEdit && usuario?.updatedAt && (
                <TRow>
                    <TCol>
                    <TEntry
                        name         ="updatedById"
                        label        ="Alterado por"
                        disabled
                        defaultValue ={usuario?.updatedByNome ?? "—"}
                    />
                    </TCol>
                    <TCol>
                    <TEntry
                        name         ="updatedAt"
                        label        ="Alterado em"
                        disabled
                        width="160px"
                        defaultValue ={usuario?.updatedAt
                                        ? new Date(usuario.updatedAt).toLocaleString("pt-BR")
                                        : "—"}
                    />
                    </TCol>
                    <TSpace />
                </TRow>
            )}

            <TFormFooter>
            <TFormActionsLeft>
                <TButton label="Voltar" variant="cancel" onClick={() => navigate("/usuarios")} />
                <TButton label="Novo"   variant="new"    onClick={handleNovo} />
            </TFormActionsLeft>
            <TFormActionsRight>
                <TButton label="Salvar" variant="save" type="submit" loading={saving} />
            </TFormActionsRight>
            </TFormFooter>

        </TForm>
        </TPage>
    )
}