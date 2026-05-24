import { useEffect, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import axios from "axios"
import { useMessage } from "../../hooks/useMessage"
import { useQuestion } from "../../hooks/useQuestion"
import { api } from "../../services/api"
import type { ErrorResponse } from "../../types/ErrorResponse"
import { TPage } from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TRow } from "../../components/trow"
import { TCol } from "../../components/tcol"
import { TEntry } from "../../components/tentry"
import { TCombo } from "../../components/tcombo"
import { TSpace } from "../../components/tspace"
import { TPanel } from "../../components/tpanel"
import { TButton } from "../../components/tbutton"
import { TWindow } from "../../components/twindow"
import { TDateTime } from "../../components/tdatetime"
import { TText } from "../../components/ttext"

type TipoRecorrencia =
    | "DIARIO" | "SEMANAL" | "QUINZENAL"
    | "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL"

interface CompromissoResponse {
    id:                    number
    titulo:                string
    descricao:             string | null
    cor:                   string
    inicio:                string
    fim:                   string
    cancelado:             boolean
    concluido:             boolean
    motivoCancelamento:    string | null
    recorrenciaSimNao:     boolean
    tipoRecorrencia:       TipoRecorrencia | null
    quantidadeRecorrencia: number | null
    compromissoPaiId:      number | null
    usuarioId:             number
    usuarioNome:           string
    pessoaId:              number | null
    pessoaNome:            string | null
    createdAt:             string
    createdByNome:         string | null
    updatedAt:             string | null
    updatedByNome:         string | null
}

interface PessoaSelect { id: number; nome: string }

/** "2025-06-10T09:00:00" → "2025-06-10T09:00" (input datetime-local) */
function toInputDT(iso: string | null | undefined) {
    if (!iso) return ""
    return iso.substring(0, 16)
}

/** "2025-06-10T09:00" → "2025-06-10T09:00:00" */
function fromInputDT(val: string) {
    return val ? `${val}:00` : ""
}

/** hoje às hora H, formato datetime-local */
function defaultDT(offsetHours = 0) {
    const d = new Date()
    d.setHours(d.getHours() + offsetHours, 0, 0, 0)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`
}

const RECORRENCIA_OPTIONS = [
    { value: "DIARIO",     label: "Diário"     },
    { value: "SEMANAL",    label: "Semanal"    },
    { value: "QUINZENAL",  label: "Quinzenal"  },
    { value: "MENSAL",     label: "Mensal"     },
    { value: "TRIMESTRAL", label: "Trimestral" },
    { value: "SEMESTRAL",  label: "Semestral"  },
    { value: "ANUAL",      label: "Anual"      },
]

export default function CompromissoForm() {
    const { id: idParam }      = useParams()
    const [searchParams]       = useSearchParams()
    const navigate             = useNavigate()
    const { showMessage }      = useMessage()
    const { ask }              = useQuestion()

    const [formKey,        setFormKey]        = useState(0)
    const [loading,        setLoading]        = useState(false)
    const [saving,         setSaving]         = useState(false)
    const [compromisso,    setCompromisso]    = useState<CompromissoResponse | null>(null)
    const [currentId,      setCurrentId]      = useState<string | undefined>(idParam)
    const [pessoas,        setPessoas]        = useState<PessoaSelect[]>([])
    const [temRecorrencia, setTemRecorrencia] = useState(false)

    // modal cancelamento
    const [cancelModal,  setCancelModal]  = useState(false)
    const [motivoCancel, setMotivoCancel] = useState("")
    const [canceling,    setCanceling]    = useState(false)
    const [concluding,   setConcluding]   = useState(false)

    const isEdit   = !!currentId
    const isClosed = !!(compromisso?.cancelado || compromisso?.concluido)

    const dataParam = searchParams.get("data")

    // ── carrega pessoas ──
    useEffect(() => {
        api.get<PessoaSelect[]>("/pessoas/select")
            .then(r => setPessoas(r.data))
            .catch(() => showMessage("error", "Erro ao carregar pessoas"))
    }, []) // eslint-disable-line

    useEffect(() => {
        if (!currentId) {
            setCompromisso(null)
            setTemRecorrencia(false)
            return
        }
        setLoading(true)
        api.get<CompromissoResponse>(`/compromissos/${currentId}`)
            .then(r => {
                setCompromisso(r.data)
                setTemRecorrencia(r.data.recorrenciaSimNao)
                setFormKey(k => k + 1)
            })
            .catch(() => {
                showMessage("error", "Erro ao carregar compromisso")
                navigate("/agenda")
            })
            .finally(() => setLoading(false))
    }, [currentId]) // eslint-disable-line

    function handleNovo() {
        setCurrentId(undefined)
        setCompromisso(null)
        setTemRecorrencia(false)
        setFormKey(k => k + 1)
    }

    async function reload(id: string) {
        const r = await api.get<CompromissoResponse>(`/compromissos/${id}`)
        setCompromisso(r.data)
        setTemRecorrencia(r.data.recorrenciaSimNao)
        setFormKey(k => k + 1)
    }

    async function handleSubmit(data: Record<string, string>) {
        setSaving(true)
        try {
            const payload = {
                titulo:                data.titulo?.trim(),
                descricao:             data.descricao?.trim() || null,
                cor:                   data.cor || "#3a87ad",
                inicio:                fromInputDT(data.inicio),
                fim:                   fromInputDT(data.fim),
                pessoaId:              data.pessoaId ? Number(data.pessoaId) : null,
                recorrenciaSimNao:     temRecorrencia,
                tipoRecorrencia:       temRecorrencia && data.tipoRecorrencia
                                            ? data.tipoRecorrencia : null,
                quantidadeRecorrencia: temRecorrencia && data.quantidadeRecorrencia
                                            ? Number(data.quantidadeRecorrencia) : null,
            }

            if (isEdit) {
                await api.put(`/compromissos/${currentId}`, payload)
                showMessage("success", "Compromisso atualizado com sucesso!")
                await reload(currentId!)
            } else {
                const res = await api.post<CompromissoResponse[]>("/compromissos", payload)
                const qtd = res.data.length
                showMessage("success",
                    qtd > 1 ? `${qtd} compromissos criados na série!` : "Compromisso criado com sucesso!")
                const novoId = String(res.data[0].id)
                setCurrentId(novoId)
                await reload(novoId)
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const d = err.response?.data as ErrorResponse
                showMessage("error", d?.erro ?? "Erro ao salvar compromisso")
            } else {
                showMessage("error", "Erro inesperado")
            }
        } finally {
            setSaving(false)
        }
    }

    async function handleCancelar() {
        setCanceling(true)
        try {
            await api.patch(`/compromissos/${currentId}/cancelar`, { motivo: motivoCancel })
            showMessage("success", "Compromisso cancelado!")
            setCancelModal(false)
            setMotivoCancel("")
            await reload(currentId!)
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const d = err.response?.data as ErrorResponse
                showMessage("error", d?.erro ?? "Erro ao cancelar")
            }
        } finally {
            setCanceling(false)
        }
    }

    async function handleConcluir() {
        ask("Marcar este compromisso como concluído?", [
            { label: "Cancelar",  variant: "cancel",  onClick: () => {} },
            { label: "Concluir",  variant: "confirm", onClick: () => executarConcluir() },
        ])
    }

    async function executarConcluir() {
        setConcluding(true)
        try {
            await api.patch(`/compromissos/${currentId}/concluir`)
            showMessage("success", "Compromisso concluído!")
            await reload(currentId!)
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const d = err.response?.data as ErrorResponse
                showMessage("error", d?.erro ?? "Erro ao concluir")
            }
        } finally {
            setConcluding(false)
        }
    }
    if (loading) {
        return (
            <TPage title="Carregando..." breadcrumb={["Agenda", "Compromissos"]}>
                <div className="flex justify-center py-12">
                    <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
                </div>
            </TPage>
        )
    }

    return (
        <TPage
            title      ={isEdit ? "Editar Compromisso" : "Novo Compromisso"}
            breadcrumb ={["Agenda", "Compromissos", isEdit ? "Editar" : "Novo"]}
        >
            {/* banners de status */}
            {compromisso?.cancelado && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200
                                text-red-700 text-sm flex flex-col gap-1">
                    <span className="font-semibold">Compromisso cancelado</span>
                    {compromisso.motivoCancelamento && (
                        <span>Motivo: {compromisso.motivoCancelamento}</span>
                    )}
                </div>
            )}
            {compromisso?.concluido && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-200
                                text-green-700 text-sm font-semibold">
                    ✔ Compromisso concluído
                </div>
            )}
            <TForm key={formKey} onSubmit={handleSubmit}>
                <TRow>
                    <TCol>
                        <TEntry
                            name         ="titulo"
                            label        ="Título (*)"
                            required
                            maxLength    ={255}
                            width        ="50%"
                            defaultValue ={compromisso?.titulo}
                            disabled     ={isClosed}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TCombo
                            name         ="pessoaId"
                            label        ="Pessoa"
                            width        ="50%"
                            disabled     ={isClosed}
                            defaultValue ={compromisso?.pessoaId ? String(compromisso.pessoaId) : ""}
                            options      ={[
                                { value: "", label: "— Nenhuma —" },
                                ...pessoas.map(p => ({ value: String(p.id), label: p.nome }))
                            ]}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-(--text-primary)">Cor</label>
                            <input
                                type         ="color"
                                name         ="cor"
                                defaultValue ={compromisso?.cor ?? "#3a87ad"}
                                disabled     ={isClosed}
                                className    ="h-9 w-14 cursor-pointer rounded border border-(--border)
                                                bg-(--bg-surface) p-0.5 disabled:opacity-50"
                            />
                        </div>
                    </TCol>
                </TRow>
                <TPanel title="Horário">
                    <TRow>
                        <TCol>
                            <TDateTime
                                name         ="inicio"
                                label        ="Início (*)"
                                required
                                disabled     ={isClosed}
                                width        ="260px"
                                defaultValue ={
                                    compromisso
                                        ? toInputDT(compromisso.inicio)
                                        : dataParam
                                            ? toInputDT(dataParam)
                                            : defaultDT(0)
                                }
                            />
                        </TCol>
                        <TCol>
                            <TDateTime
                                name         ="fim"
                                label        ="Fim (*)"
                                required
                                disabled     ={isClosed}
                                width        ="260px"
                                defaultValue ={
                                    compromisso
                                        ? toInputDT(compromisso.fim)
                                        : dataParam
                                            ? toInputDT(
                                                dataParam.substring(0, 11) +
                                                String(Number(dataParam.substring(11, 13)) + 1).padStart(2, "0") +
                                                dataParam.substring(13)
                                                )
                                            : defaultDT(1)
                                }
                            />
                        </TCol>
                        <TSpace />
                    </TRow>
                </TPanel>
                <TRow>
                    <TCol>
                        <TText
                            name         ="descricao"
                            label        ="Descrição"
                            placeholder  ="Detalhes do compromisso..."
                            maxLength    ={2000}
                            disabled     ={isClosed}
                            defaultValue ={compromisso?.descricao ?? ""}
                            width        ="50%"
                            height       ="100px"
                            resize       ="vertical"
                        />
                    </TCol>
                </TRow>
                {(!isEdit || compromisso?.recorrenciaSimNao) && (
                    <TPanel title="Recorrência">
                        {!isEdit && (
                            <TRow>
                                <TCol>
                                    <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                                        <input
                                            type     ="checkbox"
                                            checked  ={temRecorrencia}
                                            disabled ={isClosed}
                                            onChange ={e => setTemRecorrencia(e.target.checked)}
                                            className="w-4 h-4 accent-(--accent)"
                                        />
                                        <span className="text-sm text-(--text-primary)">
                                            Este compromisso se repete
                                        </span>
                                    </label>
                                </TCol>
                            </TRow>
                        )}

                        {temRecorrencia && (
                            <TRow>
                                <TCol>
                                    <TCombo
                                        name         ="tipoRecorrencia"
                                        label        ="Tipo de recorrência (*)"
                                        width        ="220px"
                                        disabled     ={isClosed || isEdit}
                                        defaultValue ={compromisso?.tipoRecorrencia ?? ""}
                                        options      ={RECORRENCIA_OPTIONS}
                                    />
                                </TCol>
                                <TCol>
                                    <TEntry
                                        name         ="quantidadeRecorrencia"
                                        label        ="Qtd. de ocorrências (*)"
                                        width        ="160px"
                                        disabled     ={isClosed || isEdit}
                                        defaultValue ={
                                            compromisso?.quantidadeRecorrencia
                                                ? String(compromisso.quantidadeRecorrencia)
                                                : ""
                                        }
                                    />
                                </TCol>
                                <TSpace />
                            </TRow>
                        )}

                        {isEdit && compromisso?.recorrenciaSimNao && (
                            <p className="text-xs text-(--text-muted) mt-1 italic">
                                Tipo e quantidade não podem ser alterados após a criação.
                                Para mudar, exclua a série e recrie.
                            </p>
                        )}
                    </TPanel>
                )}

                {/* ── auditoria ── */}
                {isEdit && (
                    <>
                        <TRow>
                            <TCol>
                                <TEntry name="createdByNome" label="Criado por" disabled
                                    defaultValue={compromisso?.createdByNome ?? "—"} />
                            </TCol>
                            <TCol>
                                <TEntry name="createdAt" label="Criado em" disabled width="180px"
                                    defaultValue={
                                        compromisso?.createdAt
                                            ? new Date(compromisso.createdAt).toLocaleString("pt-BR")
                                            : "—"
                                    } />
                            </TCol>
                            <TSpace />
                        </TRow>
                        {compromisso?.updatedAt && (
                            <TRow>
                                <TCol>
                                    <TEntry name="updatedByNome" label="Alterado por" disabled
                                        defaultValue={compromisso?.updatedByNome ?? "—"} />
                                </TCol>
                                <TCol>
                                    <TEntry name="updatedAt" label="Alterado em" disabled width="180px"
                                        defaultValue={new Date(compromisso.updatedAt).toLocaleString("pt-BR")} />
                                </TCol>
                                <TSpace />
                            </TRow>
                        )}
                    </>
                )}

                {/* ── rodapé ── */}
                <TFormFooter>
                    <TFormActionsLeft>
                        <TButton label="Voltar"  variant="cancel" onClick={() => navigate("/agenda")} />
                        <TButton label="Novo"    variant="new"    onClick={handleNovo} />
                    </TFormActionsLeft>

                    <TFormActionsRight>
                        {isEdit && !isClosed && (
                            <>
                                <TButton
                                    label   ="Cancelar Compromisso"
                                    variant ="cancel"
                                    onClick ={() => setCancelModal(true)}
                                />
                                <TButton
                                    label   ="Concluir"
                                    variant ="save"
                                    loading ={concluding}
                                    onClick ={handleConcluir}
                                />
                            </>
                        )}
                        {!isClosed && (
                            <TButton label="Salvar" variant="save" type="submit" loading={saving} />
                        )}
                    </TFormActionsRight>
                </TFormFooter>
            </TForm>

            {/* ── modal cancelamento ── */}
            <TWindow
                title   ="Cancelar Compromisso"
                open    ={cancelModal}
                onClose ={() => { setCancelModal(false); setMotivoCancel("") }}
                width   ="460px"
                actions ={
                    <>
                        <TButton label="Voltar" variant="cancel"
                            onClick={() => { setCancelModal(false); setMotivoCancel("") }} />
                        <TButton label="Confirmar Cancelamento" variant="save"
                            loading={canceling} onClick={handleCancelar} />
                    </>
                }
            >
                <div className="flex flex-col gap-3">
                    <p className="text-sm text-(--text-muted)">
                        Informe o motivo do cancelamento (opcional):
                    </p>
                    <textarea
                        rows        ={4}
                        maxLength   ={500}
                        value       ={motivoCancel}
                        onChange    ={e => setMotivoCancel(e.target.value)}
                        placeholder ="Motivo do cancelamento..."
                        className   ="border border-(--border) rounded px-3 py-2 text-sm
                                        bg-(--bg-surface) text-(--text-primary) resize-none
                                        focus:outline-none focus:ring-1 focus:ring-(--accent) w-full"
                    />
                </div>
            </TWindow>
        </TPage>
    )
}