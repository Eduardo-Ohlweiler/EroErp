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
import { TPaisCombo } from "../../../components/tpaiscombo"
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
    const [roleIds,  setRoleIds]  = useState<string[]>([])
    const [grupoIds, setGrupoIds] = useState<string[]>([])
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
                setRoleIds(response.data.roles ?? [])
                setGrupoIds((response.data.grupoIds ?? []).map(String))
                setClienteId(String(response.data.clienteId))
            })
            .catch(() => {
                showMessage("error", "Erro ao carregar usuário")
                navigate("/usuarios")
            })
            .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentId])

    function handleNovo() {
        setCurrentId(undefined)
        setUsuario(null)
        setClienteId("")
        setRoleIds([])
        setGrupoIds([])
        setFormKey((prev) => prev + 1)
    }

    async function reload(id: string) {
        try {
            const response = await api.get(`/usuarios/${id}`)
            setUsuario(response.data)
            setClienteId(String(response.data.clienteId))
            setRoleIds(response.data.roles ?? [])
            setGrupoIds((response.data.grupoIds ?? []).map(String))
            setFormKey((prev) => prev + 1)
        } catch {
            showMessage("error", "Erro ao recarregar usuário")
        }
    }

    async function handleSubmit(data: Record<string, string>) {
        setSaving(true)
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { createdById, createdAt, updatedById, updatedAt, ...rest } = data
            const payload = {
                ...rest,
                ativo:    data.ativo === "true",
                roleIds:  data.roleIds  ? data.roleIds.split(",")  : [],
                grupoIds: data.grupoIds ? data.grupoIds.split(",") : []
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
                        <TDbCombo
                            name        ="clienteId"
                            label       ="Cliente"
                            width       ="50%"
                            minWidth    ="200px"
                            url         ="/clientes/select"
                            valueField  ="id"
                            displayField="nome"
                            searchField ="nome"
                            required    ={!isEdit}
                            //disabled    ={isEdit}
                            value       ={clienteId}                 
                            onChange    ={setClienteId} 
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TEntry
                            name     ="nome"
                            label    ="Nome"
                            required
                            width    ="50%"
                            minWidth ="200px"
                            maxLength={255}
                            defaultValue={usuario?.nome}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TEntry
                            name     ="email"
                            label    ="E-mail"
                            type     ="email"
                            width    ="50%"
                            minWidth ="200px"
                            required
                            maxLength={255}
                            defaultValue={usuario?.email}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TPaisCombo
                            name         ="codigoPais"
                            defaultValue ={usuario?.codigoPais ?? "55"}
                        />
                    </TCol>
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
                    <TSpace />
                </TRow>
                <TRow>
                    <TCol>
                        <TEntry
                            name    ="senha"
                            label   ={isEdit ? "Nova Senha (deixe vazio para manter)" : "Senha"}
                            type    ="password"
                            width   ="200px"
                            required={!isEdit}
                        />
                    </TCol>
                </TRow>
                <TRow>
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
                            name="grupoIds"
                            label="Grupos de acesso"
                            url="/grupos-acesso/select"
                            valueField="id"
                            labelField="nome"
                            direction="column"
                            values={grupoIds}
                            onChange={setGrupoIds}
                        />
                    </TCol>
                    <TCol>
                        <TDbCheckbox
                            name="roleIds"
                            label="Perfis de acesso"
                            url="/roles/select"
                            valueField="nome"
                            labelField="nome"
                            direction="column"
                            values={roleIds}
                            onChange={setRoleIds}
                        />
                    </TCol>
                    <TSpace />
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