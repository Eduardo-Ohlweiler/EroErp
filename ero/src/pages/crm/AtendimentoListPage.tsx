import { useEffect, useState } from "react"

import { api } from "../../services/api"
import { useMessage } from "../../hooks/useMessage"

import type { AtendimentoListaResponse } from "../../types/Atendimento"
import type { TDataGridColumn } from "../../types/TDataGridColumn"

import { TPage } from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormFooter } from "../../components/tform"
import { TRow } from "../../components/trow"
import { TCol } from "../../components/tcol"
import { TEntry } from "../../components/tentry"
import { TCombo } from "../../components/tcombo"
import { TDate } from "../../components/tdate"
import { TButton } from "../../components/tbutton"
import { TDataGrid } from "../../components/tdatagrid"
import { TDataGridFooter } from "../../components/tdatagridfooter"
import { VincularPessoaModal } from "../../components/vincularpessoamodal"
import { TSpace } from "../../components/tspace"

const PAGE_SIZE = 15

// ── Helpers de data/duração ────────────────────────────────────────────────
function formatDT(iso: string | null): string {
    if (!iso) return "—"
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Duração compacta entre início e fim (fim = agora quando ainda em aberto).
function formatDuracao(inicioIso: string, fimIso: string | null): string {
    const inicio = new Date(inicioIso).getTime()
    const fim    = fimIso ? new Date(fimIso).getTime() : Date.now()
    let mins = Math.max(0, Math.floor((fim - inicio) / 60000))
    const dias  = Math.floor(mins / 1440); mins -= dias * 1440
    const horas = Math.floor(mins / 60);   mins -= horas * 60
    if (dias  > 0) return `${dias}d ${horas}h`
    if (horas > 0) return `${horas}h ${mins}min`
    return `${mins}min`
}

interface OptionItem { id: number; nome: string }

export default function AtendimentoListPage() {

    const { showMessage } = useMessage()

    // Filtros
    const [filtroAndamento, setFiltroAndamento] = useState("")
    const [filtroUsuario,   setFiltroUsuario]   = useState("")
    const [filtroBusca,     setFiltroBusca]     = useState("")
    const [filtroInicio,    setFiltroInicio]    = useState("")
    const [filtroFim,       setFiltroFim]       = useState("")

    // Opções de filtro
    const [andamentos, setAndamentos] = useState<OptionItem[]>([])
    const [usuarios,   setUsuarios]   = useState<OptionItem[]>([])

    // Dados
    const [data,          setData]          = useState<AtendimentoListaResponse[]>([])
    const [loading,       setLoading]       = useState(false)
    const [page,          setPage]          = useState(0)
    const [totalPages,    setTotalPages]    = useState(0)
    const [totalElements, setTotalElements] = useState(0)

    // Modal de vínculo
    const [selecionado, setSelecionado] = useState<AtendimentoListaResponse | null>(null)

    // Carrega opções de filtro uma vez
    useEffect(() => {
        api.get("/crm/andamentos")
            .then((res) => setAndamentos((res.data ?? []).map((a: { id: number; nome: string }) => ({ id: a.id, nome: a.nome }))))
            .catch(() => {})
        api.get("/usuarios/select-personal")
            .then((res) => setUsuarios((res.data?.content ?? res.data ?? []).map((u: { id: number; nome: string }) => ({ id: u.id, nome: u.nome }))))
            .catch(() => {})
    }, [])

    useEffect(() => { load() }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

    async function load(
        andamentoId = filtroAndamento,
        usuarioId   = filtroUsuario,
        busca       = filtroBusca,
        inicio      = filtroInicio,
        fim         = filtroFim,
        pagina      = page
    ) {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(pagina), size: String(PAGE_SIZE) })
            if (andamentoId) params.append("andamentoId", andamentoId)
            if (usuarioId)   params.append("usuarioId", usuarioId)
            if (busca)       params.append("busca", busca)
            if (inicio)      params.append("dataInicio", `${inicio}T00:00:00`)
            if (fim)         params.append("dataFim", `${fim}T23:59:59`)

            const res = await api.get(`/crm/atendimentos/lista?${params.toString()}`)
            setData(res.data.content ?? [])
            setTotalPages(res.data.totalPages ?? 1)
            setTotalElements(res.data.totalElements ?? 0)
        } catch {
            showMessage("error", "Erro ao carregar atendimentos")
        } finally {
            setLoading(false)
        }
    }

    function handleFiltrar(formData: Record<string, string>) {
        const andamentoId = formData.andamentoId ?? ""
        const usuarioId   = formData.usuarioId   ?? ""
        const busca       = formData.busca       ?? ""
        const inicio      = formData.dataInicio  ?? ""
        const fim         = formData.dataFim     ?? ""
        setFiltroAndamento(andamentoId)
        setFiltroUsuario(usuarioId)
        setFiltroBusca(busca)
        setFiltroInicio(inicio)
        setFiltroFim(fim)
        setPage(0)
        load(andamentoId, usuarioId, busca, inicio, fim, 0)
    }

    function handleLimpar() {
        setFiltroAndamento("")
        setFiltroUsuario("")
        setFiltroBusca("")
        setFiltroInicio("")
        setFiltroFim("")
        setPage(0)
        load("", "", "", "", "", 0)
    }

    const columns: TDataGridColumn<AtendimentoListaResponse>[] = [
        {
            label: "Quem chamou",
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.pessoaNome ?? row.contatoNome ?? row.numero}</span>
                    <span className="text-xs text-(--text-muted)">
                        {row.numero}
                        {!row.pessoaId && (
                            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px]">
                                não vinculado
                            </span>
                        )}
                    </span>
                </div>
            ),
        },
        {
            label: "Contato em",
            width: "150px",
            render: (row) => <span>{formatDT(row.dataAbertura)}</span>,
        },
        {
            label: "Duração",
            width: "90px",
            render: (row) => {
                const fim = row.dataConclusao ?? row.dataUltimaMensagem
                return <span className="font-medium">{formatDuracao(row.dataAbertura, fim)}</span>
            },
        },
        {
            label: "Interação",
            width: "160px",
            render: (row) => {
                const fim = row.dataConclusao ?? row.dataUltimaMensagem
                return (
                    <div className="flex flex-col text-xs text-(--text-muted)">
                        <span>{formatDT(row.dataAbertura)}</span>
                        <span>→ {fim ? formatDT(fim) : "em aberto"}</span>
                    </div>
                )
            },
        },
        {
            label: "Responsável",
            width: "150px",
            render: (row) => <span>{row.usuarioNome ?? "—"}</span>,
        },
        {
            label: "Assumido por",
            width: "160px",
            render: (row) => (
                row.assumidoPorNome
                    ? (
                        <div className="flex flex-col">
                            <span>{row.assumidoPorNome}</span>
                            <span className="text-xs text-(--text-muted)">{formatDT(row.dataAssuncao)}</span>
                        </div>
                    )
                    : <span className="text-(--text-muted)">—</span>
            ),
        },
        {
            label: "Status",
            width: "150px",
            align: "center",
            render: (row) => (
                <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: row.andamentoCor ?? "#6b7280" }}
                >
                    {row.andamentoNome ?? "—"}
                </span>
            ),
        },
    ]

    return (
        <TPage title="Atendimentos" breadcrumb={["CRM", "Atendimentos (Lista)"]}>
            <TForm onSubmit={handleFiltrar}>
                <TRow>
                    <TCol>
                        <TEntry
                            name         ="busca"
                            label        ="Buscar"
                            placeholder  ="Nome, contato ou número..."
                            width        ="50%"
                            minWidth     ="200px"
                            defaultValue ={filtroBusca}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TCombo
                            name         ="andamentoId"
                            label        ="Status"
                            width        ="300px"
                            minWidth     ="200px"
                            defaultValue ={filtroAndamento}
                            options      ={[{ value: "", label: "Todos" }, ...andamentos.map(a => ({ value: String(a.id), label: a.nome }))]}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TCombo
                            name         ="usuarioId"
                            label        ="Responsável"
                            width        ="300px"
                            minWidth     ="200px"
                            defaultValue ={filtroUsuario}
                            options      ={[{ value: "", label: "Todos" }, ...usuarios.map(u => ({ value: String(u.id), label: u.nome }))]}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TDate name="dataInicio" label="Contato de"  defaultValue={filtroInicio} />
                    </TCol>
                    <TCol>
                        <TDate name="dataFim"    label="Contato até" defaultValue={filtroFim} />
                    </TCol>
                    <TSpace />
                </TRow>
                <TFormFooter>
                    <TFormActionsLeft>
                        <TButton type="submit" label="Filtrar" />
                        <TButton label="Limpar" variant="cancel" onClick={handleLimpar} />
                    </TFormActionsLeft>
                </TFormFooter>
            </TForm>

            <TDataGrid
                columns      ={columns}
                data         ={data}
                keyField     ="id"
                loading      ={loading}
                emptyMessage ="Nenhum atendimento encontrado"
                onRowClick   ={(row) => setSelecionado(row)}
            />

            <TDataGridFooter
                page          ={page}
                totalPages    ={totalPages}
                totalElements ={totalElements}
                pageSize      ={PAGE_SIZE}
                onPageChange  ={setPage}
            />

            <VincularPessoaModal
                atendimento ={selecionado}
                open        ={selecionado !== null}
                onClose     ={() => setSelecionado(null)}
                onVinculado ={() => load()}
            />
        </TPage>
    )
}
