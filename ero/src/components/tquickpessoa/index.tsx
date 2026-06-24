import { useEffect, useState } from "react"
import axios from "axios"

import { api } from "../../services/api"
import { useMessage } from "../../hooks/useMessage"

import type { ErrorResponse } from "../../types/ErrorResponse"
import type { CidadeItem, PessoaResponse, TipoPessoa } from "../../types/Pessoa"

import { TWindow } from "../twindow"
import { TRow } from "../trow"
import { TCol } from "../tcol"
import { TEntry } from "../tentry"
import { TCombo } from "../tcombo"
import { TButton } from "../tbutton"
import { TPanel } from "../tpanel"
import { TDbCheckbox } from "../tdbcheckbox"
import { TUniqueSearch } from "../tuniquesearch"

interface TQuickPessoaProps {
    open:       boolean
    onClose:    () => void
    onCreated:  (pessoa: PessoaResponse) => void
    title?:     string
}

const TELEFONE_REGEX = /^\d{10,11}$/
const EMAIL_REGEX    = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/**
 * Modal de cadastro rápido de Pessoa, reutilizável em qualquer tela
 * (vínculos, vendas, consulta, agenda, etc.). Reusa o endpoint POST /pessoas,
 * portanto aplica as mesmas validações de back-end do cadastro completo.
 *
 * Obrigatórios: nome, tipo de cadastro e tipo de pessoa.
 * Opcionais: data de nascimento, CPF/RG ou CNPJ, um telefone, um e-mail e um endereço.
 */
export function TQuickPessoa({ open, onClose, onCreated, title = "Cadastro rápido" }: TQuickPessoaProps) {

    const { showMessage } = useMessage()

    const [saving,  setSaving]  = useState(false)
    const [formKey, setFormKey] = useState(0)

    const [tipoPessoa,       setTipoPessoa]       = useState<TipoPessoa>("PESSOA_FISICA")
    const [tiposCadastroIds, setTiposCadastroIds] = useState<string[]>([])

    const [tiposEmail,    setTiposEmail]    = useState<{ id: number; nome: string }[]>([])
    const [tiposTelefone, setTiposTelefone] = useState<{ id: number; nome: string }[]>([])
    const [tiposEndereco, setTiposEndereco] = useState<{ id: number; nome: string }[]>([])

    const [cidadeId,   setCidadeId]   = useState("")
    const [cidadeNome, setCidadeNome] = useState("")

    // Carrega os tipos auxiliares ao abrir
    useEffect(() => {
        if (!open) return
        Promise.all([
            api.get("/tipos/email/select"),
            api.get("/tipos/telefone/select"),
            api.get("/tipos/endereco/select"),
        ])
            .then(([emailRes, telefoneRes, enderecoRes]) => {
                setTiposEmail(emailRes.data)
                setTiposTelefone(telefoneRes.data)
                setTiposEndereco(enderecoRes.data)
            })
            .catch(() => showMessage("error", "Erro ao carregar dados auxiliares"))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    // Reseta o formulário ao abrir
    useEffect(() => {
        if (open) {
            setTipoPessoa("PESSOA_FISICA")
            setTiposCadastroIds([])
            setCidadeId("")
            setCidadeNome("")
            setFormKey(prev => prev + 1)
        }
    }, [open])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const form = e.currentTarget

        const val = (name: string) => {
            const el = form.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`)
            return (el?.value ?? "").trim()
        }

        const nome = val("nome")
        if (!nome) {
            showMessage("error", "Informe o nome")
            return
        }
        if (tiposCadastroIds.length === 0) {
            showMessage("error", "Selecione ao menos um tipo de cadastro")
            return
        }

        const isFisica = tipoPessoa === "PESSOA_FISICA"

        const telTipo   = val("telTipo")
        const telNumero = val("telNumero")
        const emailTipo = val("emailTipo")
        const emailVal  = val("emailValor")
        const endTipo   = val("endTipo")

        // Mesmas validações do cadastro completo
        if (telNumero) {
            if (!telTipo)                        { showMessage("error", "Selecione o tipo do telefone"); return }
            if (!TELEFONE_REGEX.test(telNumero)) { showMessage("error", "Telefone deve conter DDD + número (10 ou 11 dígitos)"); return }
        }
        if (emailVal) {
            if (!emailTipo)                  { showMessage("error", "Selecione o tipo do e-mail"); return }
            if (!EMAIL_REGEX.test(emailVal)) { showMessage("error", "E-mail inválido"); return }
        }
        if (cidadeId && !endTipo) {
            showMessage("error", "Selecione o tipo do endereço")
            return
        }

        const payload = {
            nome,
            tipoPessoa,
            dataNascimento: val("dataNascimento") || null,
            cpf:  isFisica ? (val("cpf") || null) : null,
            rg:   isFisica ? (val("rg")  || null) : null,
            cnpj: !isFisica ? (val("cnpj") || null) : null,
            tiposCadastroIds: tiposCadastroIds.map(Number),
            ativo: true,
            emails: emailVal
                ? [{ id: null, tipoEmailId: Number(emailTipo), email: emailVal, observacao: null, principal: true }]
                : [],
            telefones: telNumero
                ? [{ id: null, tipoTelefoneId: Number(telTipo), numero: telNumero, observacao: null, principal: true }]
                : [],
            enderecos: cidadeId
                ? [{
                    id:             null,
                    tipoEnderecoId: Number(endTipo),
                    cidadeId:       Number(cidadeId),
                    cep:            val("endCep")         || null,
                    rua:            val("endRua")         || null,
                    numero:         val("endNumero")      || null,
                    bairro:         val("endBairro")      || null,
                    complemento:    val("endComplemento") || null,
                    principal:      true,
                }]
                : [],
            vinculos: [],
        }

        setSaving(true)
        try {
            const response = await api.post("/pessoas", payload)
            showMessage("success", "Pessoa cadastrada com sucesso!")
            onCreated(response.data as PessoaResponse)
            onClose()
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao salvar pessoa")
            } else {
                showMessage("error", "Erro inesperado ao salvar pessoa")
            }
        } finally {
            setSaving(false)
        }
    }

    return (
        <TWindow
            title   ={title}
            open    ={open}
            width   ="820px"
            onClose ={onClose}
            actions ={
                <TButton
                    label   ="Adicionar"
                    variant ="save"
                    type    ="submit"
                    form    ="quick-pessoa-form"
                    loading ={saving}
                />
            }
        >
            <form
                id        ="quick-pessoa-form"
                key       ={formKey}
                className ="flex flex-col gap-4"
                onSubmit  ={handleSubmit}
            >
                <TRow>
                    <TCol>
                        <TCombo
                            name         ="tipoPessoa"
                            label        ="Tipo de Pessoa"
                            required
                            width        ="220px"
                            defaultValue ={tipoPessoa}
                            onChange     ={(v) => setTipoPessoa(v as TipoPessoa)}
                            options      ={[
                                { value: "PESSOA_FISICA",   label: "Pessoa Física"   },
                                { value: "PESSOA_JURIDICA", label: "Pessoa Jurídica" },
                            ]}
                        />
                    </TCol>
                </TRow>

                <TRow>
                    <TCol>
                        <TDbCheckbox
                            name       ="tiposCadastroIds"
                            label      ="Tipos de Cadastro"
                            url        ="/tipos/cadastro/select"
                            valueField ="id"
                            labelField ="nome"
                            direction  ="row"
                            required
                            values     ={tiposCadastroIds}
                            onChange   ={setTiposCadastroIds}
                        />
                    </TCol>
                </TRow>

                <TRow>
                    <TCol>
                        <TEntry
                            name      ="nome"
                            label     ="Nome"
                            required
                            maxLength ={255}
                            width     ="100%"
                        />
                    </TCol>
                    <TCol>
                        <TEntry
                            name  ="dataNascimento"
                            label ="Data de Nascimento"
                            mask  ="data"
                            width ="200px"
                        />
                    </TCol>
                </TRow>

                {tipoPessoa === "PESSOA_FISICA" ? (
                    <TRow>
                        <TCol>
                            <TEntry name="cpf" label="CPF" mask="cpf" width="200px" />
                        </TCol>
                        <TCol>
                            <TEntry name="rg" label="RG" maxLength={20} width="200px" />
                        </TCol>
                    </TRow>
                ) : (
                    <TRow>
                        <TCol>
                            <TEntry name="cnpj" label="CNPJ" mask="cnpj" width="220px" />
                        </TCol>
                    </TRow>
                )}

                <TPanel title="Telefone">
                    <TRow>
                        <TCol>
                            <TCombo
                                name        ="telTipo"
                                label       ="Tipo"
                                width       ="160px"
                                placeholder ="Selecione..."
                                options     ={tiposTelefone.map(t => ({ value: String(t.id), label: t.nome }))}
                            />
                        </TCol>
                        <TCol>
                            <TEntry name="telNumero" label="Número" mask="celular" width="200px" />
                        </TCol>
                    </TRow>
                </TPanel>

                <TPanel title="E-mail">
                    <TRow>
                        <TCol>
                            <TCombo
                                name        ="emailTipo"
                                label       ="Tipo"
                                width       ="160px"
                                placeholder ="Selecione..."
                                options     ={tiposEmail.map(t => ({ value: String(t.id), label: t.nome }))}
                            />
                        </TCol>
                        <TCol>
                            <TEntry name="emailValor" label="E-mail" type="email" maxLength={255} width="320px" />
                        </TCol>
                    </TRow>
                </TPanel>

                <TPanel title="Endereço">
                    <TRow>
                        <TCol>
                            <TCombo
                                name        ="endTipo"
                                label       ="Tipo"
                                width       ="160px"
                                placeholder ="Selecione..."
                                options     ={tiposEndereco.map(t => ({ value: String(t.id), label: t.nome }))}
                            />
                        </TCol>
                        <TCol>
                            <TUniqueSearch
                                name         ="cidadeNome"
                                label        ="Cidade"
                                url          ="/cidades/select"
                                valueField   ="id"
                                displayField ={(item) => {
                                    const cidade = item as unknown as CidadeItem
                                    return `${cidade.nome} - ${cidade.estado?.sigla ?? ""}`
                                }}
                                searchField  ="nome"
                                placeholder  ="Buscar cidade..."
                                minLength    ={2}
                                width        ="100%"
                                defaultValue ={cidadeId   || undefined}
                                defaultDisplay={cidadeNome || undefined}
                                onChange     ={(value, item) => {
                                    setCidadeId(value)
                                    if (item) {
                                        const cidade = item as unknown as CidadeItem
                                        setCidadeNome(`${cidade.nome} - ${cidade.estado?.sigla ?? ""}`)
                                    } else {
                                        setCidadeNome("")
                                    }
                                }}
                            />
                        </TCol>
                    </TRow>
                    <TRow>
                        <TCol>
                            <TEntry name="endCep" label="CEP" mask="cep" width="130px" />
                        </TCol>
                        <TCol>
                            <TEntry name="endRua" label="Rua" maxLength={255} />
                        </TCol>
                        <TCol>
                            <TEntry name="endNumero" label="Número" maxLength={20} width="100px" />
                        </TCol>
                    </TRow>
                    <TRow>
                        <TCol>
                            <TEntry name="endBairro" label="Bairro" maxLength={100} />
                        </TCol>
                        <TCol>
                            <TEntry name="endComplemento" label="Complemento" maxLength={100} />
                        </TCol>
                    </TRow>
                </TPanel>
            </form>
        </TWindow>
    )
}
