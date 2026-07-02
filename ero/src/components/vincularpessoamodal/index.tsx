import { useEffect, useState } from "react"
import axios from "axios"

import { api } from "../../services/api"
import { useMessage } from "../../hooks/useMessage"

import type { AtendimentoListaResponse } from "../../types/Atendimento"
import type { ErrorResponse } from "../../types/ErrorResponse"
import type { PessoaBusca, PessoaResponse } from "../../types/Pessoa"

import { TWindow } from "../twindow"
import { TButton } from "../tbutton"
import { TQuickPessoa } from "../tquickpessoa"
import { TPessoaSearch } from "../tpessoasearch"

interface VincularPessoaModalProps {
    atendimento:  AtendimentoListaResponse | null
    open:         boolean
    onClose:      () => void
    onVinculado:  () => void
}

type Etapa = "escolha" | "buscar" | "novo"

/**
 * Fluxo de vínculo de pessoa a um atendimento. Ao abrir, pergunta se o usuário
 * quer vincular a um cadastro existente (busca) ou criar um novo (cadastro rápido,
 * pré-preenchido com nome/telefone do contato do WhatsApp). Em ambos os casos,
 * grava o vínculo via PUT /crm/atendimentos/{id}/pessoa.
 */
export function VincularPessoaModal({ atendimento, open, onClose, onVinculado }: VincularPessoaModalProps) {

    const { showMessage } = useMessage()
    const [etapa, setEtapa] = useState<Etapa>("escolha")

    useEffect(() => {
        if (open) setEtapa("escolha")
    }, [open])

    async function vincular(pessoaId: number) {
        if (!atendimento) return
        try {
            await api.put(`/crm/atendimentos/${atendimento.id}/pessoa`, { pessoaId })
            showMessage("success", "Pessoa vinculada ao atendimento!")
            onVinculado()
            onClose()
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao vincular pessoa")
            } else {
                showMessage("error", "Erro inesperado ao vincular pessoa")
            }
        }
    }

    if (!open || !atendimento) return null

    // Telefone do WhatsApp → best-effort para DDD + número (remove código do país).
    const digitos  = (atendimento.numero ?? "").replace(/\D/g, "")
    const telefone = digitos.length > 11 ? digitos.slice(-11) : digitos
    const nome     = atendimento.contatoNome ?? ""

    return (
        <>
            {etapa === "escolha" && (
                <TWindow title="Vincular pessoa ao atendimento" open width="480px" onClose={onClose}>
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-(--text-secondary)">
                            Contato: <span className="font-medium text-(--text-primary)">{nome || atendimento.numero}</span>
                        </p>
                        <p className="text-sm text-(--text-secondary)">
                            Como deseja associar este atendimento a uma pessoa?
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <TButton label="Vincular a cadastro existente" variant="primary" width="100%" onClick={() => setEtapa("buscar")} />
                            <TButton label="Cadastrar nova pessoa"          variant="new"     width="100%" onClick={() => setEtapa("novo")} />
                        </div>
                    </div>
                </TWindow>
            )}

            <TPessoaSearch
                open     ={etapa === "buscar"}
                onClose  ={onClose}
                onSelect ={(p: PessoaBusca) => vincular(p.id)}
            />

            <TQuickPessoa
                open            ={etapa === "novo"}
                onClose         ={onClose}
                onCreated       ={(p: PessoaResponse) => vincular(p.id)}
                title           ="Cadastrar e vincular pessoa"
                defaultNome     ={nome}
                defaultTelefone ={telefone}
            />
        </>
    )
}
