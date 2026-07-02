import { useEffect, useState } from "react"

import { api } from "../../services/api"
import { useMessage } from "../../hooks/useMessage"
import { formatarDocumento } from "../../utils/pessoas"

import type { PessoaBusca } from "../../types/Pessoa"
import type { TDataGridColumn } from "../../types/TDataGridColumn"

import { TWindow } from "../twindow"
import { TRow } from "../trow"
import { TCol } from "../tcol"
import { TEntry } from "../tentry"
import { TButton } from "../tbutton"
import { TForm, TFormActionsLeft, TFormFooter } from "../tform"
import { TDataGrid } from "../tdatagrid"
import { TDataGridFooter } from "../tdatagridfooter"

interface TPessoaSearchProps {
    open:     boolean
    onClose:  () => void
    onSelect: (pessoa: PessoaBusca) => void
}

const PAGE_SIZE = 10

const columns: TDataGridColumn<PessoaBusca>[] = [
    { label: "Nome", field: "nome" },
    {
        label: "Documento",
        width: "170px",
        render: (row) => <span>{formatarDocumento(row.cpf ?? row.cnpj)}</span>,
    },
    {
        label: "Telefone",
        width: "150px",
        render: (row) => <span>{row.telefone ?? "—"}</span>,
        mask: "celular",
    },
    {
        label: "Tipo",
        width: "80px",
        align: "center",
        render: (row) => <span>{row.tipoPessoa === "PESSOA_FISICA" ? "PF" : "PJ"}</span>,
    },
]

/**
 * Modal de busca de pessoas para vínculo. Filtra por nome, documento (CPF/CNPJ)
 * e telefone via GET /pessoas/busca. Ao clicar numa linha, devolve a pessoa
 * selecionada em onSelect.
 */
export function TPessoaSearch({ open, onClose, onSelect }: TPessoaSearchProps) {

    const { showMessage } = useMessage()

    const [nome,      setNome]      = useState("")
    const [documento, setDocumento] = useState("")
    const [telefone,  setTelefone]  = useState("")

    const [data,          setData]          = useState<PessoaBusca[]>([])
    const [loading,       setLoading]       = useState(false)
    const [page,          setPage]          = useState(0)
    const [totalPages,    setTotalPages]    = useState(0)
    const [totalElements, setTotalElements] = useState(0)

    // Reseta ao abrir e carrega a primeira página
    useEffect(() => {
        if (open) {
            setNome("")
            setDocumento("")
            setTelefone("")
            setPage(0)
            load("", "", "", 0)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    useEffect(() => {
        if (open) load(nome, documento, telefone, page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page])

    async function load(n = nome, doc = documento, tel = telefone, pagina = page) {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(pagina), size: String(PAGE_SIZE) })
            if (n)   params.append("nome", n)
            if (doc) params.append("documento", doc)
            if (tel) params.append("telefone", tel)

            const res = await api.get(`/pessoas/busca?${params.toString()}`)
            setData(res.data.content ?? [])
            setTotalPages(res.data.totalPages ?? 1)
            setTotalElements(res.data.totalElements ?? 0)
        } catch {
            showMessage("error", "Erro ao buscar pessoas")
        } finally {
            setLoading(false)
        }
    }

    function handleFiltrar(formData: Record<string, string>) {
        const n   = formData.nome      ?? ""
        const doc = formData.documento ?? ""
        const tel = formData.telefone  ?? ""
        setNome(n)
        setDocumento(doc)
        setTelefone(tel)
        setPage(0)
        load(n, doc, tel, 0)
    }

    return (
        <TWindow title="Buscar pessoa" open={open} width="900px" onClose={onClose}>
            <div className="flex flex-col gap-4">
                <TForm onSubmit={handleFiltrar}>
                    <TRow>
                        <TCol>
                            <TEntry name="nome" label="Nome" placeholder="Filtrar por nome..." width="100%" defaultValue={nome} />
                        </TCol>
                        <TCol>
                            <TEntry name="documento" label="CPF/CNPJ" placeholder="Somente números" width="200px" defaultValue={documento} />
                        </TCol>
                        <TCol>
                            <TEntry name="telefone" label="Telefone" placeholder="Somente números" width="200px" defaultValue={telefone} />
                        </TCol>
                    </TRow>
                    <TFormFooter>
                        <TFormActionsLeft>
                            <TButton type="submit" label="Buscar" />
                        </TFormActionsLeft>
                    </TFormFooter>
                </TForm>

                <TDataGrid
                    columns      ={columns}
                    data         ={data}
                    keyField     ="id"
                    loading      ={loading}
                    emptyMessage ="Nenhuma pessoa encontrada"
                    onRowClick   ={(row) => { onSelect(row); onClose() }}
                />

                <TDataGridFooter
                    page          ={page}
                    totalPages    ={totalPages}
                    totalElements ={totalElements}
                    pageSize      ={PAGE_SIZE}
                    onPageChange  ={setPage}
                />
            </div>
        </TWindow>
    )
}
