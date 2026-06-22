import { useNavigate } from "react-router-dom";
import type { PessoaResponse } from "../../../types/Pessoa";
import type { TDataGridColumn } from "../../../types/TDataGridColumn";
import { useQuestion } from "../../../hooks/useQuestion";
import { useMessage } from "../../../hooks/useMessage";
import { useEffect, useState } from "react";
import { api } from "../../../services/api";
import { TPage } from "../../../components/tpage";
import { TForm, TFormActionsLeft, TFormFooter } from "../../../components/tform";
import { TRow } from "../../../components/trow";
import { TCol } from "../../../components/tcol";
import { TEntry } from "../../../components/tentry";
import { TDbCombo } from "../../../components/tdbcombo";
import { TButton } from "../../../components/tbutton";
import { TCombo } from "../../../components/tcombo";
import { TDataGrid } from "../../../components/tdatagrid/index";
import { TDataGridFooter } from "../../../components/tdatagridfooter";

const columns: TDataGridColumn<PessoaResponse>[] = [
    { label: "ID",   field: "id",   width: "5%",  align: "center" },
    { label: "Nome", field: "nome", width: "25%", align: "left"   },
    {
        label: "Tipo de pessoa",
        width: "15%",
        align: "center",
        render: (row) => row.tipoPessoa === "PESSOA_FISICA" ? "Física" : "Jurídica"
    },
    {
        label: "Tipo de Cadastro",
        width: "15%",
        align: "left",
        render: (row) => (
            <div className="flex flex-col gap-0.5">
                {row.tiposCadastro.length === 0
                    ? <span className="text-(--text-muted)">-</span>
                    : row.tiposCadastro.map((tc) => (
                        <span key={tc.id} className="text-xs">
                            {tc.nome}
                        </span>
                    ))
                }
            </div>
        )
    },
    {
        label: "CPF / CNPJ",
        width: "20%",
        align: "left",
        mask: (row) => row.tipoPessoa === "PESSOA_FISICA" ? "cpf" : "cnpj",
        render: (row, mask) => {
            const valor = row.tipoPessoa === "PESSOA_FISICA" ? row.cpf : row.cnpj;
            return mask(valor ?? "");
        }
    },
    {
        label: "Status",
        field: "ativo",
        width: "20%",
        align: "center",
        render: (row) => (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white
                ${row.ativo ? "bg-(--success)" : "bg-(--danger)"}`}>
                {row.ativo ? "Ativo" : "Bloqueado"}
            </span>
        )
    },
];

export default function PessoaList() {

    const navigate            = useNavigate();
    const { ask }             = useQuestion();
    const { showMessage }     = useMessage();

    const [data,            setData]            = useState<PessoaResponse[]>([]);
    const [loading,         setLoading]         = useState(false);
    const [page,            setPage]            = useState(0);
    const [totalPages,      setTotalPages]      = useState(0);
    const [totalElements,   setTotalElements]   = useState(0);
    const [filtroNome,      setFiltroNome]      = useState("");
    const [filtroCpf,       setFiltroCpf]       = useState("");
    const [filtroCnpj,      setFiltroCnpj]      = useState("");
    const [filtroAtivo,     setFiltroAtivo]     = useState("");
    const [filtroTipo,      setFiltroTipo]      = useState("");
    const [filtroTipoCad,   setFiltroTipoCad]   = useState("");
    const [resetKey,        setResetKey]        = useState(0);

    const pageSize = 15;

    useEffect(() => {
        load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    async function load(
        nome          = filtroNome,
        cpf           = filtroCpf,
        cnpj          = filtroCnpj,
        ativo         = filtroAtivo,
        tipoPessoa    = filtroTipo,
        tipoCadastroId = filtroTipoCad,
        pagina        = page
    ) {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(pagina),
                size: String(pageSize),
                sort: "nome"
            });
            if (nome)           
                params.append("nome",           nome);
            if (cpf)            
                params.append("cpf",            cpf);
            if (cnpj)           
                params.append("cnpj",           cnpj);
            if (ativo)          
                params.append("ativo",          ativo);
            if (tipoPessoa)     
                params.append("tipoPessoa",     tipoPessoa);
            if (tipoCadastroId) 
                params.append("tipoCadastroId", tipoCadastroId);

            const response = await api.get(`/pessoas?${params.toString()}`);
            setData(response.data.content);
            setTotalPages(response.data.totalPages);
            setTotalElements(response.data.totalElements);
        } catch {
            showMessage("error", "Erro ao carregar pessoas");
        } finally {
            setLoading(false);
        }
    }

    function handleFiltrar(formData: Record<string, string>) {
        const nome        = formData.nome       || "";
        const cpf         = formData.cpf        || "";
        const cnpj        = formData.cnpj       || "";
        const ativo       = formData.ativo      || "";
        const tipoPessoa  = formData.tipoPessoa || "";

        setFiltroNome(nome);
        setFiltroCpf(cpf);
        setFiltroCnpj(cnpj);
        setFiltroAtivo(ativo);
        setFiltroTipo(tipoPessoa);
        setPage(0);

        load(nome, cpf, cnpj, ativo, tipoPessoa, filtroTipoCad, 0);
    }

    function handleLimpar() {
        setFiltroNome("");
        setFiltroCpf("");
        setFiltroCnpj("");
        setFiltroAtivo("");
        setFiltroTipo("");
        setFiltroTipoCad("");
        setResetKey((prev) => prev + 1);
        setPage(0);
        load("", "", "", "", "", "", 0);
    }

    async function handleToggleAtivo(id: number, ativoAtual: boolean) {
        try {
            await api.patch(`/pessoas/${id}/ativo?ativo=${!ativoAtual}`);
            showMessage(
                "success",
                ativoAtual ? "Pessoa bloqueada com sucesso" : "Pessoa ativada com sucesso"
            );
            load();
        } catch {
            showMessage("error", "Erro ao atualizar status da pessoa");
        }
    }

    return (
        <TPage
            title      ="Pessoas"
            breadcrumb ={["Cadastros", "Pessoas"]}
            // actions    ={
            //     <TButton
            //         label   ="Novo"
            //         variant ="new"
            //         type    ="button"
            //         onClick ={() => navigate("/pessoas/novo")}
            //     />
            // }
        >
            <TForm key={resetKey} onSubmit={handleFiltrar}>
                <TRow>
                    <TCol>
                        <TEntry
                            name        ="nome"
                            label       ="Nome"
                            placeholder ="Filtrar por nome..."
                            defaultValue={filtroNome}
                            width       ="50%"
                            minWidth    ="200px"
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TCombo
                            name    ="tipoPessoa"
                            label   ="Tipo de pessoa"
                            width   ="200px"
                            options ={[
                                { value: "PESSOA_FISICA",   label: "Pessoa Física"   },
                                { value: "PESSOA_JURIDICA", label: "Pessoa Jurídica" },
                            ]}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TEntry
                            name        ="cpf"
                            label       ="CPF"
                            placeholder ="Filtrar por CPF..."
                            defaultValue={filtroCpf}
                            width       ="200px"
                            mask        ="cpf"
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TEntry
                            name        ="cnpj"
                            label       ="CNPJ"
                            placeholder ="Filtrar por CNPJ..."
                            defaultValue={filtroCnpj}
                            width       ="200px"
                            mask        ="cnpj"
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TDbCombo
                            name        ="tipoCadastroId"
                            label       ="Tipo de Cadastro"
                            url         ="/tipos/cadastro/select"
                            valueField  ="id"
                            displayField="nome"
                            searchField ="nome"
                            placeholder ="Todos..."
                            width       ="200px"
                            value       ={filtroTipoCad}
                            onChange    ={setFiltroTipoCad}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TCombo
                            name    ="ativo"
                            label   ="Status"
                            width   ="200px"
                            options ={[
                                { value: "true",  label: "Ativo"    },
                                { value: "false", label: "Bloqueado" },
                            ]}
                        />
                    </TCol>
                </TRow>
                <TFormFooter>
                    <TFormActionsLeft>
                        <TButton label="Filtrar"  type="submit" />
                        <TButton
                            label   ="Limpar"
                            variant ="cancel"
                            type    ="button"
                            onClick ={handleLimpar}
                        />
                        <TButton
                            label   ="Novo"
                            variant ="new"
                            type    ="button"
                            onClick ={() => navigate("/pessoas/novo")}
                        />
                    </TFormActionsLeft>
                </TFormFooter>

                <TDataGrid
                    columns     ={columns}
                    data        ={data}
                    keyField    ="id"
                    loading     ={loading}
                    emptyMessage="Nenhuma pessoa encontrada"
                    onRowClick  ={(row) => navigate(`/pessoas/${row.id}`)}
                    actions={(row) => (
                        <>
                            <TButton
                                label   =""
                                variant ="edit"
                                onClick ={(e) => {
                                    e?.stopPropagation();
                                    navigate(`/pessoas/${row.id}`);
                                }}
                            />
                            <TButton
                                label   =""
                                variant ={row.ativo ? "block" : "unblock"}
                                onClick ={(e) => {
                                    e?.stopPropagation();
                                    ask(
                                        `Deseja ${row.ativo ? "bloquear" : "ativar"} ${row.nome}?`,
                                        [
                                            { label: "Cancelar", variant: "cancel",  onClick: () => {} },
                                            {
                                                label:   row.ativo ? "Bloquear" : "Ativar",
                                                variant: row.ativo ? "block"    : "unblock",
                                                onClick: () => handleToggleAtivo(row.id, row.ativo),
                                            },
                                        ]
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
            </TForm>
        </TPage>
    );
}