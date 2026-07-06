import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { api } from "../../../services/api"
import { useMessage } from "../../../hooks/useMessage"
import axios from "axios"
import type { ErrorResponse } from "../../../types/ErrorResponse"
import type { GrupoAcesso } from "../../../types/GrupoAcesso"
import { TPage } from "../../../components/tpage"
import { TForm, TFormFooter, TFormActionsLeft, TFormActionsRight } from "../../../components/tform"
import { TRow } from "../../../components/trow"
import { TCol } from "../../../components/tcol"
import { TEntry } from "../../../components/tentry"
import { TDbCheckbox } from "../../../components/tdbcheckbox"
import { TButton } from "../../../components/tbutton"

export default function GrupoAcessoForm() {

    const { id: idParam } = useParams()
    const navigate        = useNavigate()
    const { showMessage } = useMessage()

    const [currentId, setCurrentId] = useState<string | undefined>(idParam)
    const isEdit                    = !!currentId

    const [formKey, setFormKey] = useState(0)
    const [loading, setLoading] = useState(false)
    const [saving,  setSaving]  = useState(false)
    const [roleIds, setRoleIds] = useState<string[]>([])
    const [grupo,   setGrupo]   = useState<GrupoAcesso | null>(null)

    useEffect(() => {
        if (!currentId)
            return

        setLoading(true)
        api.get(`/grupos-acesso/${currentId}`)
            .then((response) => {
                setGrupo(response.data)
                setRoleIds(response.data.roles ?? [])
            })
            .catch(() => {
                showMessage("error", "Erro ao carregar grupo de acesso")
                navigate("/grupos-acesso")
            })
            .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentId])

    function handleNovo() {
        setCurrentId(undefined)
        setGrupo(null)
        setRoleIds([])
        setFormKey((prev) => prev + 1)
    }

    async function reload(id: string) {
        try {
            const response = await api.get(`/grupos-acesso/${id}`)
            setGrupo(response.data)
            setRoleIds(response.data.roles ?? [])
            setFormKey((prev) => prev + 1)
        } catch {
            showMessage("error", "Erro ao recarregar grupo de acesso")
        }
    }

    async function handleSubmit(data: Record<string, string>) {
        setSaving(true)
        try {
            const payload = {
                nome:      data.nome,
                descricao: data.descricao,
                roleIds:   data.roleIds ? data.roleIds.split(",") : []
            }

            if (isEdit) {
                await api.patch(`/grupos-acesso/${currentId}`, payload)
                showMessage("success", "Grupo de acesso atualizado com sucesso!")
                await reload(currentId!)
            } else {
                const response = await api.post("/grupos-acesso", payload)
                showMessage("success", "Grupo de acesso cadastrado com sucesso!")
                const novoId = String(response.data.id)
                setCurrentId(novoId)
                await reload(novoId)
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao salvar grupo de acesso")
            } else {
                showMessage("error", "Erro inesperado ao salvar grupo de acesso")
            }
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
        <TPage title="Carregando..." breadcrumb={["Administração", "Grupos de Acesso"]}>
            <div className="flex justify-center py-12">
                <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
            </div>
        </TPage>
        )
    }

    return (
        <TPage
            title={isEdit ? "Editar Grupo de Acesso" : "Novo Grupo de Acesso"}
            breadcrumb={["Administração", "Grupos de Acesso", isEdit ? "Editar" : "Novo"]}
        >
            <TForm key={formKey} onSubmit={handleSubmit}>
                <TRow>
                    <TCol>
                        <TEntry
                            name        ="nome"
                            label       ="Nome"
                            required
                            width       ="50%"
                            minWidth    ="200px"
                            maxLength   ={100}
                            defaultValue={grupo?.nome}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TEntry
                            name        ="descricao"
                            label       ="Descrição"
                            width       ="50%"
                            minWidth    ="200px"
                            maxLength   ={255}
                            defaultValue={grupo?.descricao}
                        />
                    </TCol>
                </TRow>

                <TRow>
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
                </TRow>

                <TFormFooter>
                    <TFormActionsLeft>
                        <TButton label="Voltar" variant="cancel" onClick={() => navigate("/grupos-acesso")} />
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
