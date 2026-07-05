import { useEffect, useRef, useState } from "react"
import axios from "axios"

import { api } from "../../services/api"
import { useMessage } from "../../hooks/useMessage"

import type { AtendimentoResponse } from "../../types/Atendimento"
import type { ErrorResponse } from "../../types/ErrorResponse"
import type { PessoaBusca, PessoaResponse, TelefoneResponse } from "../../types/Pessoa"

import { TWindow } from "../twindow"
import { TButton } from "../tbutton"
import { TCombo } from "../tcombo"
import { TEntry } from "../tentry"
import { TPaisCombo } from "../tpaiscombo"
import { TQuickPessoa } from "../tquickpessoa"
import { TPessoaSearch } from "../tpessoasearch"

interface IniciarAtendimentoModalProps {
    open:       boolean
    onClose:    () => void
    /** Chamado com o atendimento criado/reaproveitado para o board focá-lo e abrir o chat. */
    onIniciado: (atendimento: AtendimentoResponse) => void
}

type Etapa = "escolha" | "buscar" | "telefone" | "numero" | "novo"

/** Formata dígitos (DDD + número) como (99) 99999-9999 para exibição. */
function formatarNumero(numero: string): string {
    const d = (numero ?? "").replace(/\D/g, "")
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
    return d
}

/**
 * Fluxo de "Entrar em contato" a partir do Kanban: o atendente inicia um atendimento
 * proativamente escolhendo (1) uma pessoa cadastrada e um de seus telefones, (2) digitando
 * um número avulso sem cadastro, ou (3) fazendo o cadastro rápido de uma pessoa.
 * Ao confirmar, cria (ou reaproveita) o atendimento via POST /crm/atendimentos e devolve-o
 * em onIniciado para o board abrir o chat.
 */
export function IniciarAtendimentoModal({ open, onClose, onIniciado }: IniciarAtendimentoModalProps) {

    const { showMessage } = useMessage()

    const [etapa,   setEtapa]   = useState<Etapa>("escolha")
    const [criando, setCriando] = useState(false)

    // pessoa selecionada + telefone escolhido (etapa "telefone")
    const [pessoaSel,   setPessoaSel]   = useState<PessoaResponse | null>(null)
    const [telefoneIdx, setTelefoneIdx] = useState("0")

    // entrada manual (etapa "numero")
    const [codigoPais,   setCodigoPais]   = useState("55")
    const [numeroManual, setNumeroManual] = useState("")

    // evita que o onClose disparado pelo TPessoaSearch (após selecionar) feche o fluxo inteiro
    const indoParaTelefone = useRef(false)

    useEffect(() => {
        if (open) {
            setEtapa("escolha")
            setCriando(false)
            setPessoaSel(null)
            setTelefoneIdx("0")
            setCodigoPais("55")
            setNumeroManual("")
        }
    }, [open])

    async function criar(numero: string, pessoaId?: number) {
        setCriando(true)
        try {
            const res = await api.post("/crm/atendimentos", { numero, pessoaId: pessoaId ?? null })
            showMessage("success", "Atendimento iniciado!")
            onIniciado(res.data as AtendimentoResponse)
            onClose()
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao iniciar atendimento")
            } else {
                showMessage("error", "Erro inesperado ao iniciar atendimento")
            }
        } finally {
            setCriando(false)
        }
    }

    /** Ao escolher uma pessoa na busca: carrega os telefones e decide a próxima etapa. */
    async function selecionarPessoa(pessoaId: number) {
        try {
            const res = await api.get(`/pessoas/${pessoaId}`)
            const pessoa = res.data as PessoaResponse
            const telefones = pessoa.telefones ?? []

            if (telefones.length === 0) {
                showMessage("error", "Esta pessoa não possui telefone cadastrado, verifique!")
                setEtapa("escolha")
                return
            }

            setPessoaSel(pessoa)
            if (telefones.length === 1) {
                const t = telefones[0]
                criar(t.codigoPais + t.numero, pessoa.id)
                return
            }
            const principalIdx = telefones.findIndex(t => t.principal)
            setTelefoneIdx(String(principalIdx >= 0 ? principalIdx : 0))
            setEtapa("telefone")
        } catch {
            showMessage("error", "Erro ao carregar telefones da pessoa")
            setEtapa("escolha")
        }
    }

    function confirmarTelefone() {
        if (!pessoaSel) return
        const t = pessoaSel.telefones[Number(telefoneIdx)]
        if (!t) { showMessage("error", "Selecione um telefone, verifique!"); return }
        criar(t.codigoPais + t.numero, pessoaSel.id)
    }

    function confirmarManual() {
        const digitos = numeroManual.replace(/\D/g, "")
        if (digitos.length < 10) { showMessage("error", "Informe um número válido com DDD, verifique!"); return }
        criar((codigoPais || "55") + digitos)
    }

    /** Cadastro rápido concluído: usa o telefone principal (ou o primeiro) da pessoa criada. */
    function aposCadastroRapido(pessoa: PessoaResponse) {
        const telefones = pessoa.telefones ?? []
        const t: TelefoneResponse | undefined = telefones.find(x => x.principal) ?? telefones[0]
        if (!t) {
            showMessage("error", "Pessoa cadastrada sem telefone — edite o cadastro para contatá-la.")
            return
        }
        criar(t.codigoPais + t.numero, pessoa.id)
    }

    if (!open) return null

    return (
        <>
            {etapa === "escolha" && (
                <TWindow title="Entrar em contato" open width="480px" onClose={onClose}>
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-(--text-secondary)">
                            Como deseja iniciar o atendimento?
                        </p>
                        <div className="flex flex-col gap-2">
                            <TButton label="Selecionar pessoa cadastrada" variant="primary" width="100%" onClick={() => setEtapa("buscar")} />
                            <TButton label="Digitar número"               variant="save"    width="100%" onClick={() => setEtapa("numero")} />
                            <TButton label="Cadastro rápido de pessoa"     variant="new"     width="100%" onClick={() => setEtapa("novo")} />
                        </div>
                    </div>
                </TWindow>
            )}

            {etapa === "telefone" && pessoaSel && (
                <TWindow
                    title   ="Escolher telefone"
                    open
                    width   ="480px"
                    onClose ={onClose}
                    actions ={
                        <>
                            <TButton label="Voltar"  variant="cancel"  onClick={() => setEtapa("escolha")} />
                            <TButton label="Iniciar" variant="confirm" loading={criando} onClick={confirmarTelefone} />
                        </>
                    }
                >
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-(--text-secondary)">
                            Pessoa: <span className="font-medium text-(--text-primary)">{pessoaSel.nome}</span>
                        </p>
                        <TCombo
                            name         ="telefone"
                            label        ="Telefone"
                            width        ="100%"
                            defaultValue ={telefoneIdx}
                            onChange     ={setTelefoneIdx}
                            options      ={pessoaSel.telefones.map((t, i) => ({
                                value: String(i),
                                label: `+${t.codigoPais} ${formatarNumero(t.numero)}`
                                     + (t.tipoTelefoneNome ? ` · ${t.tipoTelefoneNome}` : "")
                                     + (t.principal ? " (principal)" : ""),
                            }))}
                        />
                    </div>
                </TWindow>
            )}

            {etapa === "numero" && (
                <TWindow
                    title   ="Digitar número"
                    open
                    width   ="480px"
                    onClose ={onClose}
                    actions ={
                        <>
                            <TButton label="Voltar"  variant="cancel"  onClick={() => setEtapa("escolha")} />
                            <TButton label="Iniciar" variant="confirm" loading={criando} onClick={confirmarManual} />
                        </>
                    }
                >
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-(--text-secondary)">
                            Informe o número para entrar em contato (sem cadastro).
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <TPaisCombo name="codigoPais" width="200px" defaultValue={codigoPais} onChange={setCodigoPais} />
                            <TEntry name="numero" label="Número" mask="celular" width="220px" onChange={setNumeroManual} />
                        </div>
                    </div>
                </TWindow>
            )}

            <TPessoaSearch
                open     ={etapa === "buscar"}
                onClose  ={() => { if (indoParaTelefone.current) { indoParaTelefone.current = false; return } onClose() }}
                onSelect ={(p: PessoaBusca) => { indoParaTelefone.current = true; selecionarPessoa(p.id) }}
            />

            <TQuickPessoa
                open      ={etapa === "novo"}
                onClose   ={onClose}
                onCreated ={aposCadastroRapido}
                title     ="Cadastrar pessoa e entrar em contato"
            />
        </>
    )
}
