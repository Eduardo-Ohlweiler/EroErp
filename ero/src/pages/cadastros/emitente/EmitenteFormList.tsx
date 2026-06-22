import { useEffect, useState }          from "react";
import { useMessage }                   from "../../../hooks/useMessage";
import { useQuestion }                  from "../../../hooks/useQuestion";
import { api }                          from "../../../services/api";
import axios                            from "axios";

import type { TDataGridColumn }         from "../../../types/TDataGridColumn";
import type { EmitenteResponse }        from "../../../types/Emitente";
import type { PessoaSelect }            from "../../../types/Pessoa";
import type { ErrorResponse }           from "../../../types/ErrorResponse";

import { TPage }                                from "../../../components/tpage";
import { TForm, TFormActionsLeft, TFormFooter } from "../../../components/tform";
import { TRow }                                 from "../../../components/trow";
import { TCol }                                 from "../../../components/tcol";
import { TCombo }                               from "../../../components/tcombo";
import { TDbCombo }                             from "../../../components/tdbcombo";
//import { TEntry }                               from "../../../components/tentry";
import { TButton }                              from "../../../components/tbutton";
import { TDataGrid }                            from "../../../components/tdatagrid";
import { TDataGridFooter }                      from "../../../components/tdatagridfooter";
import { TColor } from "../../../components/tcolor";

function formatarCPF(cpf: string): string {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatarCNPJ(cnpj: string): string {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function formatarDocumento(cpf: string | null, cnpj: string | null): string {
    if (cpf)  
        return formatarCPF(cpf.replace(/\D/g, ""));
    if (cnpj) 
        return formatarCNPJ(cnpj.replace(/\D/g, ""));
    return "—";
}

function displayPessoa(item: Record<string, unknown>): string {
    const p    = item as unknown as PessoaSelect;
    const doc  = formatarDocumento(p.cpf, p.cnpj);
    return `${p.nome} (${doc})`;
}

const columns: TDataGridColumn<EmitenteResponse>[] = [
    { label: "ID",        field: "id",              width: "60px",  align: "center" },
    { label: "Pessoa",    field: "pessoaNome" },
    { label: "Documento", field: "pessoaDocumento",  width: "160px" },
    {
        label: "Tipo",
        field: "tipo",
        width: "100px",
        align: "center",
        render: (row) => (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white
                ${row.tipo === "MATRIZ" ? "bg-(--accent)" : "bg-(--info)"}`}>
                {row.tipo === "MATRIZ" ? "Matriz" : "Filial"}
            </span>
        ),
    },
    {
        label: "Matriz",
        field: "pessoaMatrizNome",
        render: (row) => <span>{row.pessoaMatrizNome ?? "—"}</span>,
    },
    {
        label: "Cor",
        field: "cor",
        width: "60px",
        align: "center",
        render: (row) => (
            <span
                title     ={row.cor}
                style     ={{ backgroundColor: row.cor }}
                className ="inline-block w-5 h-5 rounded-full border border-(--border)"
            />
        ),
    },
    {
        label: "Status",
        field: "bloqueado",
        width: "110px",
        align: "center",
        render: (row) => (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white
                ${!row.bloqueado ? "bg-(--success)" : "bg-(--danger)"}`}>
                {!row.bloqueado ? "Ativo" : "Bloqueado"}
            </span>
        ),
    },
];

export default function EmitenteFormList() {

    const { showMessage }                               = useMessage();
    const { ask }                                       = useQuestion();

    const [formKey,             setFormKey]             = useState(0);
    const [saving,              setSaving]              = useState(false);
    const [currentId,           setCurrentId]           = useState<number | null>(null);

    const [pessoaId,            setPessoaId]            = useState("");
    const [tipo,                setTipo]                = useState<"MATRIZ" | "FILIAL">("MATRIZ");
    const [pessoaMatrizId,      setPessoaMatrizId]      = useState("");
    const [cor,                 setCor]                 = useState("#3B82F6");
    const [bloqueado,           setBloqueado]           = useState("false");

    const [data,                setData]                = useState<EmitenteResponse[]>([]);
    const [loading,             setLoading]             = useState(false);
    const [page,                setPage]                = useState(0);
    const [totalPages,          setTotalPages]          = useState(0);
    const [totalElements,       setTotalElements]       = useState(0);
    const pageSize = 15;

    useEffect(() => {
        loadGrid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    async function loadGrid(pagina = page) {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(pagina),
                size: String(pageSize),
                sort: "pessoa.nome",
            });
            const response = await api.get(`/emitentes?${params.toString()}`);
            setData(response.data.content);
            setTotalPages(response.data.totalPages);
            setTotalElements(response.data.totalElements);
        } catch {
            showMessage("error", "Erro ao carregar emitentes");
        } finally {
            setLoading(false);
        }
    }

    function handleClear() {
        setCurrentId(null);
        setPessoaId("");
        setTipo("MATRIZ");
        setPessoaMatrizId("");
        setCor("#3B82F6");
        setBloqueado("false");
        setFormKey((prev) => prev + 1);
    }

    function handleEdit(row: EmitenteResponse) {
        setCurrentId(row.id);
        setPessoaId(String(row.pessoaId));
        setTipo(row.tipo);
        setPessoaMatrizId(row.pessoaMatrizId ? String(row.pessoaMatrizId) : "");
        setCor(row.cor);
        setBloqueado(row.bloqueado ? "true" : "false");
        setFormKey((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function handleTipo(value: string) {
        const t = value as "MATRIZ" | "FILIAL";
        setTipo(t);
        if (t === "MATRIZ") {
            setPessoaMatrizId("");
            setFormKey((prev) => prev + 1);
        }
    }

    async function handleSubmit(formData: Record<string, string>) {
        if (!formData.pessoaId) {
            showMessage("error", "Selecione uma pessoa para o emitente");
            return;
        }
        if (tipo === "FILIAL" && !formData.pessoaMatrizId) {
            showMessage("error", "Selecione a pessoa da matriz para emitentes do tipo Filial");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                pessoaId:       Number(formData.pessoaId),
                tipo:           formData.tipo,
                pessoaMatrizId: formData.pessoaMatrizId ? Number(formData.pessoaMatrizId) : null,
                cor:            formData.cor,
                bloqueado:      formData.bloqueado === "true",
            };

            if (currentId) {
                await api.put(`/emitentes/${currentId}`, payload);
                showMessage("success", "Emitente atualizado com sucesso!");
            } else {
                await api.post("/emitentes", payload);
                showMessage("success", "Emitente cadastrado com sucesso!");
            }

            handleClear();
            loadGrid(0);
            setPage(0);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse;
                showMessage("error", errData?.erro ?? "Erro ao salvar emitente");
            } else {
                showMessage("error", "Erro inesperado ao salvar emitente");
            }
        } finally {
            setSaving(false);
        }
    }

    async function handleToggleBloqueado(id: number, bloqueadoAtual: boolean) {
        try {
            const row      = data.find((e) => e.id === id)!;
            const payload  = {
                pessoaId:       row.pessoaId,
                tipo:           row.tipo,
                pessoaMatrizId: row.pessoaMatrizId ?? null,
                cor:            row.cor,
                bloqueado:      !bloqueadoAtual,
            };
            await api.put(`/emitentes/${id}`, payload);
            showMessage("success", bloqueadoAtual ? "Emitente desbloqueado!" : "Emitente bloqueado!");
            loadGrid();
        } catch {
            showMessage("error", "Erro ao atualizar emitente");
        }
    }

    return (
        <TPage
            title      ="Emitentes"
            breadcrumb ={["Cadastros", "Emitentes"]}
        >
            <TForm key={formKey} onSubmit={handleSubmit}>

                <TRow>
                    <TCol>
                        <TDbCombo
                            name         ="pessoaId"
                            label        ="Pessoa (CPF / CNPJ)"
                            url          ="/pessoas/select"
                            valueField   ="id"
                            displayField ={displayPessoa}
                            searchField  ="nome"
                            placeholder  ="Selecione a pessoa emitente..."
                            required
                            width        ="50%"
                            value        ={pessoaId}
                            onChange     ={(val) => setPessoaId(val)}
                        />
                    </TCol>
                </TRow>

                {/* Tipo */}
                <TRow>
                    <TCol>
                        <TCombo
                            name         ="tipo"
                            label        ="Tipo"
                            width        ="200px"
                            required
                            defaultValue ={tipo}
                            onChange     ={handleTipo}
                            options      ={[
                                { value: "MATRIZ", label: "Matriz" },
                                { value: "FILIAL", label: "Filial" },
                            ]}
                        />
                    </TCol>
                </TRow>

                {/* Pessoa Matriz — só aparece quando tipo = FILIAL */}
                {tipo === "FILIAL" && (
                    <TRow>
                        <TCol>
                            <TDbCombo
                                name         ="pessoaMatrizId"
                                label        ="Pessoa da Matriz"
                                url          ="/pessoas/select"
                                valueField   ="id"
                                displayField ={displayPessoa}
                                searchField  ="nome"
                                placeholder  ="Selecione a pessoa da matriz..."
                                required
                                width        ="60%"
                                value        ={pessoaMatrizId}
                                onChange     ={(val) => setPessoaMatrizId(val)}
                            />
                        </TCol>
                    </TRow>
                )}

                {/* Cor */}
                <TRow>
                    <TCol>
                        <TColor
                            name="cor"
                            label="Cor de identificação"
                            width="180px"
                            value={cor}
                            onChange={setCor}
                        />
                    </TCol>
                </TRow>

                {/* Status — só no edit */}
                {currentId && (
                    <TRow>
                        <TCol>
                            <TCombo
                                name         ="bloqueado"
                                label        ="Status"
                                width        ="200px"
                                defaultValue ={bloqueado}
                                onChange     ={setBloqueado}
                                options      ={[
                                    { value: "false", label: "Ativo"     },
                                    { value: "true",  label: "Bloqueado" },
                                ]}
                            />
                        </TCol>
                    </TRow>
                )}

                <TFormFooter>
                    <TFormActionsLeft>
                        <TButton
                            label   ="Limpar"
                            variant ="cancel"
                            type    ="button"
                            onClick ={handleClear}
                        />
                        <TButton
                            label   ="Salvar"
                            variant ="save"
                            type    ="submit"
                            loading ={saving}
                        />
                    </TFormActionsLeft>
                </TFormFooter>

            </TForm>

            <TDataGrid
                columns      ={columns}
                data         ={data}
                keyField     ="id"
                loading      ={loading}
                emptyMessage ="Nenhum emitente encontrado"
                actionsWidth ="160px"
                actions      ={(row) => (
                    <>
                        <TButton
                            label   =""
                            variant ="edit"
                            onClick ={(e) => {
                                e?.stopPropagation();
                                handleEdit(row);
                            }}
                        />
                        <TButton
                            label   =""
                            variant ={row.bloqueado ? "unblock" : "block"}
                            onClick ={(e) => {
                                e?.stopPropagation();
                                ask(
                                    `Deseja ${row.bloqueado ? "desbloquear" : "bloquear"} o emitente "${row.pessoaNome}"?`,
                                    [
                                        { label: "Cancelar", variant: "cancel",  onClick: () => {} },
                                        {
                                            label:   row.bloqueado ? "Desbloquear" : "Bloquear",
                                            variant: row.bloqueado ? "unblock"     : "block",
                                            onClick: () => handleToggleBloqueado(row.id, row.bloqueado),
                                        },
                                    ],
                                );
                            }}
                        />
                    </>
                )}
            />

            <TDataGridFooter
                page          ={page}
                totalPages    ={totalPages}
                totalElements ={totalElements}
                pageSize      ={pageSize}
                onPageChange  ={setPage}
            />

        </TPage>
    );
}
