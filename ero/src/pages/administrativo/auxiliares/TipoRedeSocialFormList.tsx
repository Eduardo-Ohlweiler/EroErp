import { useEffect, useState } from "react";
import type { TDataGridColumn } from "../../../types/TDataGridColumn";
import type { TipoRedeSocial } from "../../../types/TipoRedeSocial";
import { api } from "../../../services/api";
import axios from "axios";
import type { ErrorResponse } from "../../../types/ErrorResponse";
import { TPage } from "../../../components/tpage";
import { TForm, TFormActionsLeft, TFormFooter } from "../../../components/tform";
import { TRow } from "../../../components/trow";
import { TCol } from "../../../components/tcol";
import { TEntry } from "../../../components/tentry";
import { TCombo } from "../../../components/tcombo";
import { TButton } from "../../../components/tbutton";
import { TDataGrid } from "../../../components/tdatagrid";
import { TDataGridFooter } from "../../../components/tdatagridfooter";
import { useMessage } from "../../../hooks/useMessage";
import { useQuestion } from "../../../hooks/useQuestion";

const columns: TDataGridColumn<TipoRedeSocial>[] = [
    { label: "ID",   field: "id", width: "60px", align: "center" },
    { label: "Nome", field: "nome" },
    {
        label: "Status",
        field: "ativo",
        width: "100px",
        align: "center",
        render: (row) => (
        <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium text-white
            ${row.ativo ? "bg-(--success)" : "bg-(--danger)"}`}
        >
            {row.ativo ? "Ativo" : "Inativo"}
        </span>
        ),
    },
];

export default function TipoRedeSocialFormList() {

    const { showMessage }                     = useMessage();
    const { ask }                             = useQuestion();
    const [formKey,         setFormKey]       = useState(0);
    const [saving,          setSaving]        = useState(false);
    const [currentId,       setCurrentId]     = useState<number | null>(null);
    const [nome,            setNome]          = useState("");
    const [ativo,           setAtivo]         = useState("true");
    const [data,            setData]          = useState<TipoRedeSocial[]>([]);
    const [loading,         setLoading]       = useState(false);
    const [page,            setPage]          = useState(0);
    const [totalPages,      setTotalPages]    = useState(0);
    const [totalElements,   setTotalElements] = useState(0);
    const pageSize = 15;

    useEffect(() => {
            loadGrid();
        }, [page]);

    async function loadGrid(pagina = page) {
        setLoading(true);
        try {
        const params = new URLSearchParams({
            page: String(pagina),
            size: String(pageSize),
            sort: "nome",
        });
        const response = await api.get(`/tipos/redesocial?${params.toString()}`);
            setData(response.data.content);
            setTotalPages(response.data.totalPages);
            setTotalElements(response.data.totalElements);
        } catch {
            showMessage("error", "Erro ao carregar registros");
        } finally {
            setLoading(false);
        }
    }

    function handleClear() {
        setCurrentId(null);
        setNome("");
        setAtivo("true");
        setFormKey((prev) => prev + 1);
    }

    function handleEdit(row: TipoRedeSocial) {
        setCurrentId(row.id);
        setNome(row.nome);
        setAtivo(row.ativo ? "true" : "false");
        setFormKey((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function handleSubmit(data: Record<string, string>) {
        setSaving(true);
        try {
            const payload = { nome: data.nome, ativo: data.ativo === "true" };

            if (currentId) {
                await api.patch(`/tipos/redesocial/${currentId}`, payload);
                showMessage("success", "Registro atualizado com sucesso!");
            } else {
                await api.post("/tipos/redesocial", payload);
                showMessage("success", "Registro cadastrado com sucesso!");
            }

            handleClear();
            loadGrid(0);
            setPage(0);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse;
                showMessage("error", errData?.erro ?? "Erro ao salvar registro");
            } else {
                showMessage("error", "Erro inesperado ao salvar registro");
            }
        } finally {
            setSaving(false);
        }
    }

    async function handleToggleAtivo(id: number, ativoAtual: boolean) {
        try {
            await api.patch(`/tipos/redesocial/${id}`, { ativo: !ativoAtual });
            showMessage(
                "success",
                ativoAtual ? "Registro bloqueado!" : "Registro ativado!",
            );
            loadGrid();
        } catch {
            showMessage("error", "Erro ao atualizar registro");
        }
    }

    return (
        <TPage
            title       ="Tipos de Redes sociais"
            breadcrumb  ={["Cadastros", "Auxiliares", "Tipos de Redes sociais"]}
        >
        <TForm key={formKey} onSubmit={handleSubmit}>
            <TRow>
                <TCol>
                    <TEntry
                        name        ="nome"
                        label       ="Nome"
                        required
                        maxLength   ={100}
                        defaultValue={nome}
                        width       ="60%"
                    />
                </TCol>
            </TRow>
            <TRow>
                <TCol>
                    <TCombo
                        name        ="ativo"
                        label       ="Status"
                        width       ="200px"
                        defaultValue={ativo}
                        options     ={[
                            { value: "true",    label: "Ativo" },
                            { value: "false",   label: "Inativo" },
                        ]}
                    />
                </TCol>
            </TRow>

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
                {/* <TFormActionsRight>
                    <TButton
                        label   ="Salvar"
                        variant ="save"
                        type    ="submit"
                        loading ={saving}
                    />
                </TFormActionsRight> */}
            </TFormFooter>
        </TForm>

        <TDataGrid
            columns     ={columns}
            data        ={data}
            keyField    ="id"
            loading     ={loading}
            emptyMessage="Nenhum registro encontrado"
            actionsWidth="160px"
            actions     ={(row) => (
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
                    label   ={row.ativo ? ""      : ""}
                    variant ={row.ativo ? "block" : "unblock"}
                    onClick ={(e) => {
                        e?.stopPropagation();
                        ask(
                        `Deseja ${row.ativo ? "bloquear" : "ativar"} o tipo "${row.nome}"?`,
                        [
                            { label: "Cancelar", variant: "cancel", onClick: () => {} },
                            {
                                label:      row.ativo ? "Bloquear"  : "Ativar",
                                variant:    row.ativo ? "block"     : "unblock",
                                onClick: () => handleToggleAtivo(row.id, row.ativo),
                            },
                        ],
                        );
                    }}
                />
            </>
            )}
        />

        <TDataGridFooter
            page         ={page}
            totalPages   ={totalPages}
            totalElements={totalElements}
            pageSize     ={pageSize}
            onPageChange ={setPage}
        />
    </TPage>
    );
}