import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"

import { api } from "../../../services/api"

import { useMessage } from "../../../hooks/useMessage"

import type { ErrorResponse } from "../../../types/ErrorResponse"
import type { CidadeItem, PessoaResponse, TipoPessoa } from "../../../types/Pessoa"

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
import { TPanel } from "../../../components/tpanel"
import { TFieldList } from "../../../components/tfieldlist"
import { TWindow } from "../../../components/twindow"
import { TDataGrid } from "../../../components/tdatagrid"
import type { TDataGridColumn } from "../../../types/TDataGridColumn"
import { TUniqueSearch } from "../../../components/tuniquesearch"

type EnderecoLocal = {
    _tempId:        string
    id:             string
    tipoEnderecoId: string
    cidadeId:       string
    cidadeNome:     string
    cep:            string
    rua:            string
    numero:         string
    bairro:         string
    complemento:    string
    principal:      string
}

function enderecosParaState(enderecos?: PessoaResponse["enderecos"]): EnderecoLocal[] {
    if (!enderecos?.length) return []
    return enderecos.map(e => ({
        _tempId:        String(e.id),
        id:             String(e.id),
        tipoEnderecoId: String(e.tipoEnderecoId),
        cidadeId:       String(e.cidadeId),
        cidadeNome:     `${e.cidadeNome} - ${e.estadoSigla}`,
        cep:            e.cep         ?? "",
        rua:            e.rua         ?? "",
        numero:         e.numero      ?? "",
        bairro:         e.bairro      ?? "",
        complemento:    e.complemento ?? "",
        principal:      e.principal ? "true" : "false",
    }))
}

export default function PessoaForm() {

    const { id: idParam } = useParams()
    const navigate        = useNavigate()
    const { showMessage } = useMessage()
    
    const [formKey,            setFormKey]            = useState(0)
    const [loading,            setLoading]            = useState(false)
    const [saving,             setSaving]             = useState(false)
    const [pessoa,             setPessoa]             = useState<PessoaResponse | null>(null)
    const [tipoPessoa,         setTipoPessoa]         = useState<TipoPessoa>("PESSOA_FISICA")
    const [cpf,                setCpf]                = useState(pessoa?.cpf                ?? "")
    const [rg,                 setRg]                 = useState(pessoa?.rg                 ?? "")
    const [cnh,                setCnh]                = useState(pessoa?.cnh                ?? "")
    const [cnhCategoria,       setCnhCategoria]       = useState(pessoa?.cnhCategoria       ?? "")
    const [cnhValidade,        setCnhValidade]        = useState(pessoa?.cnhValidade        ?? "")
    const [dataNascimento,     setDataNascimento]     = useState(pessoa?.dataNascimento     ?? "")
    const [cnpj,               setCnpj]               = useState(pessoa?.cnpj               ?? "")
    const [inscricaoEstadual,  setInscricaoEstadual]  = useState(pessoa?.inscricaoEstadual  ?? "")
    const [inscricaoMunicipal, setInscricaoMunicipal] = useState(pessoa?.inscricaoMunicipal ?? "")
    const [nomeFantasia,       setNomeFantasia]       = useState(pessoa?.nomeFantasia       ?? "")
    const [razaoSocial,        setRazaoSocial]        = useState(pessoa?.razaoSocial        ?? "")
    const [tiposEmail,         setTiposEmail]         = useState<{ id: number; nome: string }[]>([])
    const [tiposTelefone,      setTiposTelefone]      = useState<{ id: number; nome: string }[]>([])
    const [tiposRedeSocial,    setTiposRedeSocial]    = useState<{ id: number; nome: string }[]>([])
    const [tiposEndereco,      setTiposEndereco]      = useState<{ id: number; nome: string }[]>([])
    const [tiposCadastroIds,   setTiposCadastroIds]   = useState<string[]>([])
    const [currentId,          setCurrentId]          = useState<string | undefined>(idParam)
    const isEdit                                      = !!currentId

    const [enderecos,          setEnderecos]          = useState<EnderecoLocal[]>([])
    const [enderecoWindowOpen, setEnderecoWindowOpen] = useState(false)
    const [editandoEndereco,   setEditandoEndereco]   = useState<EnderecoLocal | null>(null)
    const [cidadeIdWindow,     setCidadeIdWindow]      = useState("")
    const [cidadeNomeWindow,   setCidadeNomeWindow]    = useState("")

    //useEffect(() => {
    //    api.get("/tipos/email/select").then(r => setTiposEmail(r.data))
    //}, [])

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [tiposEmailRes, tiposTelefoneRes, tiposRedeSocialRes, tiposEnderecoRes] = await Promise.all([
                    api.get("/tipos/email/select"),
                    api.get("/tipos/telefone/select"),
                    api.get("/tipos/redesocial/select"),
                    api.get("/tipos/endereco/select")
                ])

                setTiposEmail(tiposEmailRes.data)
                setTiposTelefone(tiposTelefoneRes.data)
                setTiposRedeSocial(tiposRedeSocialRes.data)
                setTiposEndereco(tiposEnderecoRes.data)

            } catch {
                showMessage("error", "Erro ao carregar dados auxiliares")
            }
        }
        loadInitialData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {

        if (!currentId) {
            setPessoa(null)
            setTipoPessoa("PESSOA_FISICA")
            return
        }
        setLoading(true)
        api.get(`/pessoas/${currentId}`)
            .then((response) => {
                const p = response.data

                setPessoa(p)
                setTipoPessoa(p.tipoPessoa)
                setTiposCadastroIds(p.tiposCadastro?.map((tc: { id: number }) => String(tc.id)) ?? [])
                setCpf(p.cpf ?? "")
                setRg(p.rg ?? "")
                setCnh(p.cnh ?? "")
                setCnhCategoria(p.cnhCategoria ?? "")
                setCnhValidade(p.cnhValidade ?? "")
                setDataNascimento(p.dataNascimento ?? "")

                setCnpj(p.cnpj ?? "")
                setInscricaoEstadual(p.inscricaoEstadual ?? "")
                setInscricaoMunicipal(p.inscricaoMunicipal ?? "")
                setNomeFantasia(p.nomeFantasia ?? "")
                setRazaoSocial(p.razaoSocial ?? "")

                setFormKey((prev) => prev + 1)
                setEnderecos(enderecosParaState(p.enderecos))
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

        setCpf("")
        setRg("")
        setCnh("")
        setCnhCategoria("")
        setCnhValidade("")
        setDataNascimento("")

        setCnpj("")
        setInscricaoEstadual("")
        setInscricaoMunicipal("")
        setNomeFantasia("")
        setRazaoSocial("")
        setTiposCadastroIds([])
        setEnderecos([])

        setFormKey((prev) => prev + 1)
    }

    function handleTipoPessoa(value: string) {
        const tipo = value as TipoPessoa
        setTipoPessoa(tipo)

        if (tipo === "PESSOA_FISICA") {
            // limpa jurídica
            setCnpj("")
            setInscricaoEstadual("")
            setInscricaoMunicipal("")
            setNomeFantasia("")
            setRazaoSocial("")
        } else if (tipo === "PESSOA_JURIDICA") {
            // limpa física
            setCpf("")
            setRg("")
            setCnh("")
            setCnhCategoria("")
            setCnhValidade("")
            setDataNascimento("")
        }
        setFormKey((prev) => prev + 1)
    }

    async function reload(id: string) {
        try {
            const response = await api.get(`/pessoas/${id}`)
            setPessoa(response.data)
            setTipoPessoa(response.data.tipoPessoa)
            setTiposCadastroIds(response.data.tiposCadastro?.map((tc: { id: number }) => String(tc.id)) ?? [])
            setFormKey((prev) => prev + 1)
        } catch {
            showMessage("error", "Erro ao recarregar pessoa")
        }
    }

    function parseArray(data: Record<string, string>, prefix: string) {
        const result: Record<string, string>[] = []
        Object.entries(data).forEach(([key, value]) => {
            const match = key.match(new RegExp(`^${prefix}\\[(\\d+)\\]\\[(.+)\\]$`))
            if (match) {
                const idx   = Number(match[1])
                const field = match[2]
                if (!result[idx]) 
                    result[idx] = {}
                result[idx][field] = value
            }
        })
        return result
    }

    async function handleSubmit(data: Record<string, string>) {
        setSaving(true)
        try {
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

            const emailsArray       = parseArray(data, "emails")
            const telefonesArray    = parseArray(data, "telefones")
            const redesSociaisArray = parseArray(data, "redesSociais")

            const cleanRest = Object.fromEntries(
                Object.entries(rest).filter(([k]) =>
                    !/^emails\[/.test(k)       &&
                    !/^telefones\[/.test(k)    &&
                    !/^redesSociais\[/.test(k) &&
                    !/^enderecos\[/.test(k)
                )
            )

            const payload = {
                ...cleanRest,                
                ativo: data.ativo === "true",
                tiposCadastroIds: tiposCadastroIds
                    ? tiposCadastroIds
                        .split(",")
                        .filter(Boolean)
                        .map(Number)
                    : [],
                emails: emailsArray
                    .filter(e => e.email?.trim())
                    .map(e => ({
                        id:          e.id ? Number(e.id) : null,
                        tipoEmailId: Number(e.tipoEmailId),
                        email:       e.email,
                        observacao:  e.observacao || null,
                        principal:   e.principal === "true",
                })),
                telefones: telefonesArray
                    .filter(e => e.numero?.trim())
                    .map(e => ({
                        id:             e.id ? Number(e.id) : null,
                        tipoTelefoneId: String(e.tipoTelefoneId),
                        numero:         e.numero,
                        observacao:     e.observacao ?? "",
                        principal:      e.principal === "true",
                })),
                redesSociais: redesSociaisArray
                    .filter(r => r.usuario?.trim() || r.url?.trim())
                    .map(r => ({
                        id:               r.id ? Number(r.id) : null,
                        tipoRedeSocialId: Number(r.tipoRedeSocialId),
                        usuario:          r.usuario    || null,
                        url:              r.url        || null,
                        observacao:       r.observacao || null,
                })),
                enderecos: enderecos
                    .filter(e => e.cidadeId && e.rua?.trim())
                    .map(e => ({
                        id:             e.id ? Number(e.id) : null,
                        tipoEnderecoId: Number(e.tipoEnderecoId),
                        cidadeId:       Number(e.cidadeId),
                        cep:            e.cep         || null,
                        rua:            e.rua         || null,
                        numero:         e.numero      || null,
                        bairro:         e.bairro      || null,
                        complemento:    e.complemento || null,
                        principal:      e.principal   === "true",
                    })),
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
            console.log("payload tiposCadastroIds:", payload)
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

    function handleAbrirNovoEndereco() {
        setEditandoEndereco(null)
        setCidadeIdWindow("")
        setCidadeNomeWindow("")
        setEnderecoWindowOpen(true)
    }

    function handleAbrirEditarEndereco(e: EnderecoLocal) {
        setEditandoEndereco(e)
        setCidadeIdWindow(e.cidadeId)
        setCidadeNomeWindow(e.cidadeNome)
        setEnderecoWindowOpen(true)
    }

    function handleSalvarEndereco(data: Record<string, string>) {
        const novo: EnderecoLocal = {
            _tempId:        editandoEndereco?._tempId ?? crypto.randomUUID(),
            id:             editandoEndereco?.id      ?? "",
            tipoEnderecoId: data.tipoEnderecoId       ?? "",
            cidadeId:       cidadeIdWindow,
            cidadeNome:     cidadeNomeWindow,
            cep:            data.cep                  ?? "",
            rua:            data.rua                  ?? "",
            numero:         data.numero               ?? "",
            bairro:         data.bairro               ?? "",
            complemento:    data.complemento          ?? "",
            principal:      data.principal === "true" ? "true" : "false",
        }
        setEnderecos(prev =>
            editandoEndereco
                ? prev.map(e => e._tempId === editandoEndereco._tempId ? novo : e)
                : [...prev, novo]
        )
        setEnderecoWindowOpen(false)
    }

    function handleRemoverEndereco(tempId: string) {
        setEnderecos(prev => prev.filter(e => e._tempId !== tempId))
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

    function emailsParaInitialData(emails?: PessoaResponse["emails"]) {
        if (!emails || emails.length === 0)
            return undefined
        return emails.map(e => ({
            id:          String(e.id),
            tipoEmailId: String(e.tipoEmailId),
            email:       e.email,
            observacao:  e.observacao ?? "",
            principal:   e.principal ? "true" : "false",
        }))
    }

    function telefonesParaInitialData(telefones?: PessoaResponse["telefones"]){
        if (!telefones || telefones.length === 0)
            return undefined;
        return telefones.map(e => ({
            id:             String(e.id),
            tipoTelefoneId: String(e.tipoTelefoneId),
            numero:         e.numero,
            observacao:     e.observacao ?? "",
            principal:      e.principal ? "true" : "false",
        }))
    }

    function redesSociaisParaInitialData(redes?: PessoaResponse["redesSociais"]) {
        if (!redes?.length) 
            return undefined
        return redes.map(r => ({
            id:               String(r.id),
            tipoRedeSocialId: String(r.tipoRedeSocialId),
            usuario:          r.usuario    ?? "",
            url:              r.url        ?? "",
            observacao:       r.observacao ?? "",
        }))
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
                            name         ="tipoPessoa"
                            label        ="Tipo de Pessoa"
                            required
                            width        ="250px"
                            defaultValue ={tipoPessoa}
                            onChange     ={handleTipoPessoa}
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
                            name="tiposCadastroIds"
                            label="Tipos de Cadastro"
                            url="/tipos/cadastro/select"
                            valueField="id"
                            labelField="nome"
                            direction="column"
                            values={tiposCadastroIds}
                            onChange={setTiposCadastroIds}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TEntry
                            name="nome"
                            label="Nome"
                            required
                            maxLength={255}
                            width="60%"
                            defaultValue={pessoa?.nome}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TEntry
                            name="dataNascimento"
                            label="Data de Nascimento"
                            mask="data"
                            defaultValue={dataNascimento}
                            width="180px"
                        />
                    </TCol>
                </TRow>
                <TPanel title="Pessoa Física">
                    <TRow>
                        <TCol>
                            <TEntry
                                name         ="cpf"
                                label        ="CPF"
                                mask         ="cpf"
                                disabled     ={tipoPessoa !== "PESSOA_FISICA"}
                                defaultValue ={cpf}
                                onChange     ={setCpf}
                                width        ="180px"
                            />
                        </TCol>
                    </TRow>
                    <TRow>
                        <TCol>
                            <TEntry
                                name         ="rg"
                                label        ="RG"
                                maxLength    ={20}
                                disabled     ={tipoPessoa !== "PESSOA_FISICA"}
                                defaultValue ={rg}
                                onChange     ={setRg}
                                width        ="160px"
                            />
                        </TCol>
                    </TRow>
                    <TRow>
                        <TCol>
                            <TEntry
                                name         ="cnh"
                                label        ="CNH"
                                maxLength    ={11}
                                disabled     ={tipoPessoa !== "PESSOA_FISICA"}
                                defaultValue ={cnh}
                                onChange     ={setCnh}
                                width        ="180px"
                            />
                        </TCol>
                        <TCol>
                            <TEntry
                                name         ="cnhCategoria"
                                label        ="Categoria CNH"
                                maxLength    ={2}
                                disabled     ={tipoPessoa !== "PESSOA_FISICA"}
                                defaultValue ={cnhCategoria}
                                onChange     ={setCnhCategoria}
                                width        ="120px"
                            />
                        </TCol>
                        <TCol>
                            <TEntry
                                name         ="cnhValidade"
                                label        ="Validade CNH"
                                mask         ="data"
                                disabled     ={tipoPessoa !== "PESSOA_FISICA"}
                                defaultValue ={cnhValidade}
                                onChange     ={setCnhValidade}
                                width        ="180px"
                            />
                        </TCol>
                        <TSpace />
                    </TRow>
                </TPanel>
                <TPanel title="Pessoa Jurídica">
                    <TRow>
                        <TCol>
                            <TEntry
                                name         ="cnpj"
                                label        ="CNPJ"
                                mask         ="cnpj"
                                disabled     ={tipoPessoa !== "PESSOA_JURIDICA"}
                                defaultValue ={cnpj}
                                onChange     ={setCnpj}
                                width        ="220px"
                            />
                        </TCol>
                    </TRow>
                    <TRow>
                        <TCol>
                            <TEntry
                                name         ="inscricaoEstadual"
                                label        ="Inscrição Estadual"
                                maxLength    ={50}
                                width        ="220px"
                                disabled     ={tipoPessoa !== "PESSOA_JURIDICA"}
                                defaultValue ={inscricaoEstadual}
                                onChange     ={setInscricaoEstadual}
                            />
                        </TCol>
                    </TRow>
                    <TRow>
                        <TCol>
                            <TEntry
                                name         ="inscricaoMunicipal"
                                label        ="Inscrição Municipal"
                                maxLength    ={50}
                                width        ="220px"
                                disabled     ={tipoPessoa !== "PESSOA_JURIDICA"}
                                defaultValue ={inscricaoMunicipal}
                                onChange     ={setInscricaoMunicipal}
                            />
                        </TCol>
                    </TRow>
                    <TRow>
                        <TCol>
                            <TEntry
                                name         ="razaoSocial"
                                label        ="Razão Social"
                                maxLength    ={255}
                                width="60%"
                                disabled     ={tipoPessoa !== "PESSOA_JURIDICA"}
                                defaultValue ={razaoSocial}
                                onChange     ={setRazaoSocial}
                            />
                        </TCol>
                    </TRow>
                    <TRow>
                        <TCol>
                            <TEntry
                                name         ="nomeFantasia"
                                label        ="Nome Fantasia"
                                maxLength    ={255}
                                width="60%"
                                disabled     ={tipoPessoa !== "PESSOA_JURIDICA"}
                                defaultValue ={nomeFantasia}
                                onChange     ={setNomeFantasia}
                            />
                        </TCol>
                    </TRow> 
                </TPanel>
                <TPanel title="E-mails">
                    <TFieldList
                        name        ="emails"
                        initialData ={emailsParaInitialData(pessoa?.emails)}
                        columns     ={[
                            {
                                component: "hidden",
                                label:     "ID",
                                name:      "id",
                            },
                            {
                                component: "combo",
                                label:     "Tipo",
                                name:      "tipoEmailId",
                                width:     "160px",
                                options:   tiposEmail.map(t => ({ value: String(t.id), label: t.nome })),
                            },
                            {
                                component: "entry",
                                label:     "E-mail",
                                name:      "email",
                                type:      "email",
                                width:     "400px",
                            },
                            {
                                component: "entry",
                                label:     "Observação",
                                name:      "observacao",
                            },
                            {
                                component: "checkbox",
                                label:     "Principal",
                                name:      "principal",
                                width:     "80px",
                            },
                        ]}
                    />
                </TPanel>
                <TPanel title="Telefones">
                    <TFieldList
                        name        ="telefones"
                        initialData ={telefonesParaInitialData(pessoa?.telefones)}
                        columns     ={[
                            {
                                component: "hidden",
                                label:     "ID",
                                name:      "id",
                            },
                            {
                                component: "combo",
                                label:     "Tipo",
                                name:      "tipoTelefoneId",
                                width:     "160px",
                                options:   tiposTelefone.map(t => ({ value: String(t.id), label: t.nome })),
                            },
                            {
                                component: "entry",
                                label:     "Número",
                                name:      "numero",
                                mask:      "celular",
                                width:     "200px",
                            },
                            {
                                component: "entry",
                                label:     "Observação",
                                name:      "observacao",
                            },
                            {
                                component: "checkbox",
                                label:     "Principal",
                                name:      "principal",
                                width:     "80px",
                            },
                        ]}
                    />
                </TPanel>
                <TPanel title="Redes Sociais">
                    <TFieldList
                        name        ="redesSociais"
                        initialData ={redesSociaisParaInitialData(pessoa?.redesSociais)}
                        columns     ={[
                            { 
                                component:  "hidden", 
                                label:      "ID",         
                                name:       "id"                
                            },
                            { 
                                component: "combo",  
                                label: "Tipo",       
                                name: "tipoRedeSocialId",  
                                width: "160px",
                                options: tiposRedeSocial.map(t => ({ value: String(t.id), label: t.nome })) 
                            },
                            { 
                                component: "entry",  
                                label: "Usuário",    
                                name: "usuario",           
                                width: "250px" 
                            },
                            { 
                                component: "entry",  
                                label: "URL",        
                                name: "url"               
                            },
                            { 
                                component: "entry",  
                                label: "Observação", 
                                name: "observacao"        
                            },
                        ]}
                    />
                </TPanel>
                <TDataGrid<EnderecoLocal>
                        keyField     ="_tempId"
                        data         ={enderecos}
                        emptyMessage ="Nenhum endereço cadastrado"
                        onAdd        ={handleAbrirNovoEndereco}
                        actionsWidth ="100px"
                        columns      ={[
                            {
                                label:  "Tipo",
                                width:  "130px",
                                render: (row) => tiposEndereco.find(t => String(t.id) === row.tipoEnderecoId)?.nome ?? "—",
                            },
                            { label: "Cidade",      field: "cidadeNome" },
                            { label: "CEP",         field: "cep",    width: "110px" },
                            { label: "Rua",         field: "rua" },
                            { label: "Nº",          field: "numero", width: "70px" },
                            { label: "Bairro",      field: "bairro" },
                            { label: "Complemento", field: "complemento" },
                            {
                                label:  "Principal",
                                width:  "90px",
                                align:  "center",
                                render: (row) => row.principal === "true" ? "✓" : "",
                            },
                        ] as TDataGridColumn<EnderecoLocal>[]}
                        actions={(row) => (
                            <>
                                <TButton
                                    label   =""
                                    variant ="edit"
                                    onClick ={(e) => { e?.stopPropagation(); handleAbrirEditarEndereco(row) }}
                                />
                                <TButton
                                    label   =""
                                    variant ="delete"
                                    onClick ={(e) => { e?.stopPropagation(); handleRemoverEndereco(row._tempId) }}
                                />
                            </>
                        )}
                    />
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

            <TWindow
                title   ={editandoEndereco ? "Editar Endereço" : "Novo Endereço"}
                open    ={enderecoWindowOpen}
                width   ="780px"
                onClose ={() => setEnderecoWindowOpen(false)}
                actions ={
                    <TButton
                        label   ={editandoEndereco ? "Salvar" : "Adicionar"}
                        variant ="save"
                        type    ="submit"
                        form    ="endereco-form"
                    />
                }
            >
                <form
                    id        ="endereco-form"
                    key       ={editandoEndereco?._tempId ?? "novo"}
                    className ="flex flex-col gap-4"
                    onSubmit  ={(e) => {
                        e.preventDefault()
                        const inputs = e.currentTarget.querySelectorAll<
                            HTMLInputElement | HTMLSelectElement
                        >("input, select")
                        const data: Record<string, string> = {}
                        inputs.forEach((el) => {
                            if (!el.name) return
                            if (el instanceof HTMLInputElement && el.type === "checkbox") {
                                data[el.name] = el.checked ? el.value : "false"
                                return
                            }
                            data[el.name] = el.value
                        })
                        handleSalvarEndereco(data)
                    }}
                >
                    <TRow>
                        <TCol>
                            <TCombo
                                name         ="tipoEnderecoId"
                                label        ="Tipo de Endereço"
                                required
                                width        ="220px"
                                defaultValue ={editandoEndereco?.tipoEnderecoId ?? ""}
                                options      ={tiposEndereco.map(t => ({ value: String(t.id), label: t.nome }))}
                            />
                        </TCol>
                    </TRow>
                    <TRow>
                        <TCol>
                            <TUniqueSearch
                                name          ="cidadeNome"
                                label         ="Cidade"
                                url           ="/cidades/select"
                                valueField    ="id"
                                displayField  ={(item) => {
                                    const cidade = item as unknown as CidadeItem
                                    return `${cidade.nome} - ${cidade.estado?.sigla ?? ""}`
                                }}
                                searchField   ="nome"
                                placeholder   ="Buscar cidade..."
                                minLength     ={2}
                                width         ="100%"
                                defaultValue  ={editandoEndereco?.cidadeId   || undefined}
                                defaultDisplay={editandoEndereco?.cidadeNome || undefined}
                                onChange      ={(value, item) => {
                                    setCidadeIdWindow(value)
                                    if (item) {
                                        const cidade = item as unknown as CidadeItem
                                        setCidadeNomeWindow(`${cidade.nome} - ${cidade.estado?.sigla ?? ""}`)
                                    } else {
                                        setCidadeNomeWindow("")
                                    }
                                }}
                            />
                        </TCol>
                    </TRow>
                    <TRow>
                        <TCol>
                            <TEntry
                                name         ="cep"
                                label        ="CEP"
                                mask         ="cep"
                                width        ="130px"
                                defaultValue ={editandoEndereco?.cep ?? ""}
                            />
                        </TCol>
                        <TCol>
                            <TEntry
                                name         ="rua"
                                label        ="Rua"
                                maxLength    ={255}
                                defaultValue ={editandoEndereco?.rua ?? ""}
                            />
                        </TCol>
                        <TCol>
                            <TEntry
                                name         ="numero"
                                label        ="Número"
                                maxLength    ={20}
                                width        ="100px"
                                defaultValue ={editandoEndereco?.numero ?? ""}
                            />
                        </TCol>
                    </TRow>
                    <TRow>
                        <TCol>
                            <TEntry
                                name         ="bairro"
                                label        ="Bairro"
                                maxLength    ={100}
                                defaultValue ={editandoEndereco?.bairro ?? ""}
                            />
                        </TCol>
                        <TCol>
                            <TEntry
                                name         ="complemento"
                                label        ="Complemento"
                                maxLength    ={100}
                                defaultValue ={editandoEndereco?.complemento ?? ""}
                            />
                        </TCol>
                    </TRow>
                    <TRow>
                        <TCol>
                            <label className="flex items-center gap-2 text-sm text-(--text-secondary) cursor-pointer">
                                <input
                                    type           ="checkbox"
                                    name           ="principal"
                                    value          ="true"
                                    defaultChecked ={editandoEndereco?.principal === "true"}
                                    className      ="w-4 h-4 cursor-pointer accent-(--accent)"
                                />
                                Principal
                            </label>
                        </TCol>
                    </TRow>
                </form>
            </TWindow>
        </TPage>
    )
}