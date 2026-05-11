import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"

import { api } from "../../../services/api"

import { useMessage } from "../../../hooks/useMessage"

import type { ErrorResponse } from "../../../types/ErrorResponse"
import type { PessoaResponse, TipoPessoa } from "../../../types/Pessoa"

import { TPage } from "../../../components/tpage"
import {
    TForm,
    TFormFooter,
    TFormActionsLeft,
    TFormActionsRight
} from "../../../components/tform"

import { TRow } from "../../../components/trow"
import { TCol } from "../../../components/tcol"

import { TEntry } from "../../../components/tentry"
import { TCombo } from "../../../components/tcombo"
import { TDbCheckbox } from "../../../components/tdbcheckbox"

import { TButton } from "../../../components/tbutton"
import { TSpace } from "../../../components/tspace"

export default function PessoaForm() {

    const { id: idParam } = useParams()

    const navigate        = useNavigate()
    const { showMessage } = useMessage()

    const [currentId,  setCurrentId]  = useState<string | undefined>(idParam)
    const isEdit                       = !!currentId

    const [formKey,     setFormKey]     = useState(0)
    const [loading,     setLoading]     = useState(false)
    const [saving,      setSaving]      = useState(false)

    const [pessoa,      setPessoa]      = useState<PessoaResponse | null>(null)

    const [tipoPessoa,  setTipoPessoa]  = useState<TipoPessoa>("PESSOA_FISICA")

    useEffect(() => {

        if (!currentId) {
            setPessoa(null)
            setTipoPessoa("PESSOA_FISICA")
            return
        }

        setLoading(true)

        api.get(`/pessoas/${currentId}`)
            .then((response) => {

                setPessoa(response.data)

                setTipoPessoa(response.data.tipoPessoa)

            })
            .catch(() => {
                showMessage("error", "Erro ao carregar pessoa")
                navigate("/pessoas")
            })
            .finally(() => setLoading(false))

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentId])

    function handleNovo() {

        setCurrentId(undefined)

        setPessoa(null)

        setTipoPessoa("PESSOA_FISICA")

        setFormKey((prev) => prev + 1)
    }

    async function reload(id: string) {

        try {

            const response = await api.get(`/pessoas/${id}`)

            setPessoa(response.data)

            setTipoPessoa(response.data.tipoPessoa)

            setFormKey((prev) => prev + 1)

        } catch {
            showMessage("error", "Erro ao recarregar pessoa")
        }
    }

    async function handleSubmit(data: Record<string, string>) {

        setSaving(true)

        try {

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                createdById,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                createdAt,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                updatedById,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                updatedAt,
                tiposCadastroIds,
                ...rest
            } = data

            const payload = {
                ...rest,

                ativo: data.ativo === "true",

                tiposCadastroIds: tiposCadastroIds
                    ? tiposCadastroIds
                        .split(",")
                        .filter(Boolean)
                        .map(Number)
                    : []
            }

            if (isEdit) {

                await api.put(`/pessoas/${currentId}`, payload)

                showMessage("success", "Pessoa atualizada com sucesso!")

                await reload(currentId!)

            } else {

                const response = await api.post("/pessoas", payload)

                showMessage("success", "Pessoa cadastrada com sucesso!")

                const novoId = String(response.data.id)

                setCurrentId(novoId)

                await reload(novoId)
            }

        } catch (err) {

            if (axios.isAxiosError(err)) {

                const errData = err.response?.data as ErrorResponse

                showMessage(
                    "error",
                    errData?.erro ?? "Erro ao salvar pessoa"
                )

            } else {

                showMessage("error", "Erro inesperado ao salvar pessoa")
            }

        } finally {

            setSaving(false)
        }
    }

    if (loading) {
        return (
            <TPage
                title="Carregando..."
                breadcrumb={["Cadastros", "Pessoas"]}
            >
                <div className="flex justify-center py-12">
                    <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            </TPage>
        )
    }

    return (
        <TPage
            title={isEdit ? "Editar Pessoa" : "Nova Pessoa"}
            breadcrumb={["Cadastros", "Pessoas", isEdit ? "Editar" : "Novo"]}
        >

            <TForm
                key={formKey}
                onSubmit={handleSubmit}
            >

                <TRow>
                    <TCol>
                        <TCombo
                            name="tipoPessoa"
                            label="Tipo de Pessoa"
                            required
                            width="250px"
                            defaultValue={tipoPessoa}
                            onChange={(value) => {
                                setTipoPessoa(value as TipoPessoa)
                                setFormKey((prev) => prev + 1)
                            }}
                            options={[
                                {
                                    value: "PESSOA_FISICA",
                                    label: "Pessoa Física"
                                },
                                {
                                    value: "PESSOA_JURIDICA",
                                    label: "Pessoa Jurídica"
                                }
                            ]}
                        />
                    </TCol>

                    <TCol>
                        <TDbCheckbox
                            name="tiposCadastroIds"
                            label="Tipos de Cadastro"
                            url="/tipos/cadastro/select"
                            valueField="id"
                            labelField="nome"
                            direction="column"
                            defaultValues={
                                pessoa?.tiposCadastro?.map((tc) => String(tc.id)) ?? []
                            }
                        />
                    </TCol>

                    <TSpace />
                </TRow>

                <TRow>
                    <TCol>
                        <TEntry
                            name="nome"
                            label="Nome"
                            required
                            maxLength={255}
                            defaultValue={pessoa?.nome}
                        />
                    </TCol>
                </TRow>

                {tipoPessoa === "PESSOA_FISICA" && (
                    <>
                        <TRow>

                            <TCol>
                                <TEntry
                                    name="dataNascimento"
                                    label="Data de Nascimento"
                                    mask="data"
                                    defaultValue={pessoa?.dataNascimento ?? ""}
                                    width="180px"
                                />
                            </TCol>

                            <TCol>
                                <TEntry
                                    name="cpf"
                                    label="CPF"
                                    mask="cpf"
                                    maxLength={11}
                                    defaultValue={pessoa?.cpf ?? ""}
                                    width="180px"
                                />
                            </TCol>

                            <TCol>
                                <TEntry
                                    name="rg"
                                    label="RG"
                                    maxLength={20}
                                    defaultValue={pessoa?.rg ?? ""}
                                    width="180px"
                                />
                            </TCol>

                            <TSpace />

                        </TRow>

                        <TRow>

                            <TCol>
                                <TEntry
                                    name="cnh"
                                    label="CNH"
                                    maxLength={11}
                                    defaultValue={pessoa?.cnh ?? ""}
                                    width="180px"
                                />
                            </TCol>

                            <TCol>
                                <TEntry
                                    name="cnhCategoria"
                                    label="Categoria CNH"
                                    maxLength={5}
                                    defaultValue={pessoa?.cnhCategoria ?? ""}
                                    width="120px"
                                />
                            </TCol>

                            <TCol>
                                <TEntry
                                    name="cnhValidade"
                                    label="Validade CNH"
                                    mask="data"
                                    defaultValue={pessoa?.cnhValidade ?? ""}
                                    width="180px"
                                />
                            </TCol>

                            <TSpace />

                        </TRow>
                    </>
                )}

                {tipoPessoa === "PESSOA_JURIDICA" && (
                    <>
                        <TRow>

                            <TCol>
                                <TEntry
                                    name="cnpj"
                                    label="CNPJ"
                                    mask="cnpj"
                                    maxLength={14}
                                    defaultValue={pessoa?.cnpj ?? ""}
                                    width="220px"
                                />
                            </TCol>

                            <TCol>
                                <TEntry
                                    name="inscricaoEstadual"
                                    label="Inscrição Estadual"
                                    maxLength={50}
                                    defaultValue={pessoa?.inscricaoEstadual ?? ""}
                                    width="220px"
                                />
                            </TCol>

                            <TCol>
                                <TEntry
                                    name="inscricaoMunicipal"
                                    label="Inscrição Municipal"
                                    maxLength={50}
                                    defaultValue={pessoa?.inscricaoMunicipal ?? ""}
                                    width="220px"
                                />
                            </TCol>

                            <TSpace />

                        </TRow>

                        <TRow>

                            <TCol>
                                <TEntry
                                    name="nomeFantasia"
                                    label="Nome Fantasia"
                                    maxLength={255}
                                    defaultValue={pessoa?.nomeFantasia ?? ""}
                                />
                            </TCol>

                            <TCol>
                                <TEntry
                                    name="razaoSocial"
                                    label="Razão Social"
                                    maxLength={255}
                                    defaultValue={pessoa?.razaoSocial ?? ""}
                                />
                            </TCol>

                        </TRow>
                    </>
                )}

                <TRow>

                    <TCol>
                        <TCombo
                            name="ativo"
                            label="Status"
                            width="200px"
                            defaultValue={
                                pessoa
                                    ? pessoa.ativo
                                        ? "true"
                                        : "false"
                                    : "true"
                            }
                            options={[
                                {
                                    value: "true",
                                    label: "Ativo"
                                },
                                {
                                    value: "false",
                                    label: "Bloqueado"
                                }
                            ]}
                        />
                    </TCol>

                    <TSpace />

                </TRow>

                {isEdit && (
                    <TRow>

                        <TCol>
                            <TEntry
                                name="createdById"
                                label="Criado por"
                                disabled
                                defaultValue={pessoa?.createdByNome ?? "—"}
                            />
                        </TCol>

                        <TCol>
                            <TEntry
                                name="createdAt"
                                label="Criado em"
                                disabled
                                width="180px"
                                defaultValue={
                                    pessoa?.createdAt
                                        ? new Date(pessoa.createdAt)
                                            .toLocaleString("pt-BR")
                                        : "—"
                                }
                            />
                        </TCol>

                        <TSpace />

                    </TRow>
                )}

                {isEdit && pessoa?.updatedAt && (
                    <TRow>

                        <TCol>
                            <TEntry
                                name="updatedById"
                                label="Alterado por"
                                disabled
                                defaultValue={pessoa?.updatedByNome ?? "—"}
                            />
                        </TCol>

                        <TCol>
                            <TEntry
                                name="updatedAt"
                                label="Alterado em"
                                disabled
                                width="180px"
                                defaultValue={
                                    pessoa?.updatedAt
                                        ? new Date(pessoa.updatedAt)
                                            .toLocaleString("pt-BR")
                                        : "—"
                                }
                            />
                        </TCol>

                        <TSpace />

                    </TRow>
                )}

                <TFormFooter>

                    <TFormActionsLeft>

                        <TButton
                            label="Voltar"
                            variant="cancel"
                            onClick={() => navigate("/pessoas")}
                        />

                        <TButton
                            label="Novo"
                            variant="new"
                            onClick={handleNovo}
                        />

                    </TFormActionsLeft>

                    <TFormActionsRight>

                        <TButton
                            label="Salvar"
                            variant="save"
                            type="submit"
                            loading={saving}
                        />

                    </TFormActionsRight>

                </TFormFooter>

            </TForm>

        </TPage>
    )
}