import { useNavigate } from "react-router-dom";
import type { Cidade } from "../../../types/Cidade";
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
import { TDataGrid } from '../../../components/tdatagrid/index';
import { TDataGridFooter } from "../../../components/tdatagridfooter";

const columns: TDataGridColumn<Cidade>[] = [
    { label: "ID",           field: "id",         width: "5%",  align: "center" },
    { label: "Nome",         field: "nome",       width: "35%",   align: "left" },
    {
        label: "Estado",
        width: "20%",
        render: (row) => `${row.estado.nome} (${row.estado.sigla})`
    },
    { label: "Cód. IBGE",   field: "codigoIbge",  width: "20%", align: "center" },
    {
        label: "Status", field: "ativo", width: "20%", align: "center",
        render: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white
            ${row.ativo ? "bg-(--success)" : "bg-(--danger)"}`}>
                {row.ativo ? "Ativo" : "Inativo"}
        </span>
        )
    },
]

export default function CidadeList() {

    const navigate                                      = useNavigate();
    const { ask }                                       = useQuestion();
    const { showMessage }                               = useMessage();

    const [data,                setData]                = useState<Cidade[]>([]);
    const [loading,             setLoading]             = useState(false);
    const [page,                setPage]                = useState(0);
    const [totalPages,          setTotalPages]          = useState(0);
    const [totalElements,       setTotalElements]       = useState(0);
    const [filtroNome,          setFiltroNome]          = useState("");
    const [filtroCodigoIbge,    setFiltroCodigoIbge]    = useState("");
    const [filtroAtivo,         setFiltroAtivo]         = useState("");
    const [filtroEstado,        setFiltroEstado]        = useState("");
    const [resetKey,            setResetKey]            = useState(0)

    const pageSize = 15;

    useEffect(() => {
        load();
    }, [page]);

    async function load(
        nome        = filtroNome,
        codigoIbge  = filtroCodigoIbge,
        ativo       = filtroAtivo,
        estadoId    = filtroEstado,
        pagina      = page
    ){
        setLoading(true);
        try{
            const params = new URLSearchParams({
                page: String(pagina),
                size: String(pageSize),
                sort: "nome"
            })
            if(nome)
                params.append("nome",       nome);
            if(estadoId && estadoId !== "")
                params.append("estadoId",   String(estadoId));
            if(codigoIbge)
                params.append("codigoIbge", codigoIbge);
            if(ativo)
                params.append("ativo",      ativo);

            const response = await api.get(`/cidades?${params.toString()}`);
            setData(response.data.content);
            setTotalPages(response.data.totalPages);
            setTotalElements(response.data.totalElements);
        } catch {
            showMessage("error", "Erro ao carregar cidades");
        } finally {
            setLoading(false);
        }
    }

    function handleFiltrar(formData: Record<string, string>) {
        const nome        = formData.nome      || "";
        const codigoIbge  = formData.codigoIbge|| "";
        const ativo       = formData.ativo     || "";
        const estadoId    = filtroEstado       || "";

        setFiltroNome(nome);
        setFiltroCodigoIbge(codigoIbge);
        setFiltroAtivo(ativo);
        setPage(0);

        load(nome, codigoIbge, ativo, estadoId, 0);
    }
    
    function handleLimpar() {
        setFiltroNome("")
        setFiltroCodigoIbge("")
        setFiltroAtivo("")
        setFiltroEstado("")
        setResetKey((prev) => prev + 1)
        setPage(0)
        load("", "", "", "", 0);
    }

    // function handlePageChange(novaPagina: number) {
    //     setPage(novaPagina);
    // }

    async function handleToggleAtivo(id: number, ativoAtual: boolean) {
        try {
            await api.patch(`/cidades/${id}`, { ativo: !ativoAtual });
            showMessage(
                "success",
                ativoAtual ? "Cidade desativada com sucesso" : "Cidade ativada com sucesso"
            );
            load();
        } catch {
            showMessage("error", "Erro ao atualizar status da cidade");
        }
    }

    return (
        <TPage 
            title       ="Cidades"
            breadcrumb  ={["Cadastros", "Auxiliares", "Cidades"]}
            //actions   ={
      //     <TButton
            //   label="Novo"
            //   variant="new"
            //   type="button"
            //   onClick={() => navigate("/cidades/novo")}
            // />
      //   }
        >
            <TForm 
                key     ={resetKey}
                onSubmit={handleFiltrar}
            >
                <TRow>
                    <TCol>
                        <TEntry 
                            name        ="nome"
                            label       ="Nome"
                            placeholder ="Filtrar por nome..."
                            defaultValue={filtroNome}
                            width       ="50%"
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TDbCombo
                            name        ="estadoId"
                            label       ="Estado"
                            url         ="/estados/select"
                            valueField  ="id"
                            displayField="nome"
                            searchField ="nome"
                            placeholder ="Todos os estados..."
                            width       ="50%"
                            value       ={filtroEstado}              
                            onChange    ={setFiltroEstado}        
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TEntry 
                            name        ="codigoIbge"
                            label       ="Código IBGE"
                            maxLength   ={7}
                            placeholder ="Filtrar por código IBGE..."
                            defaultValue={filtroCodigoIbge}
                            width       ="200px"
                            mask="numero"
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TCombo
                            name        ="ativo"
                            label       ="Status"
                            width       ="200px"
                            options     ={[
                                { value: "true",  label: "Ativo"     },
                                { value: "false", label: "Bloqueado"  },
                            ]}
                        />
                    </TCol>
                </TRow>
                <TFormFooter>
                    <TFormActionsLeft>
                    <TButton label="Filtrar" type="submit" />
                    <TButton
                        label   ="Novo"
                        variant ="new"
                        type    ="button"
                        onClick ={() => navigate("/cidades/novo")}
                    />
                    <TButton
                        label   ="Limpar"
                        variant ="cancel"
                        type    ="button"
                        onClick ={handleLimpar}
                    />
                    </TFormActionsLeft>
                </TFormFooter>

                <TDataGrid
                    columns     ={columns}
                    data        ={data}
                    keyField    ="id"
                    loading     ={loading}
                    emptyMessage="Nenhuma cidade encontrada"
                    onRowClick={(row) => navigate(`/cidades/${row.id}`)}
                    actions={(row) => (
                        <>
                            <TButton
                                label   =""
                                variant ="edit"
                                onClick ={() => navigate("/cidades/novo")}
                            />
                            <TButton
                                label   ={row.ativo ? ""  : ""}
                                variant ={row.ativo ? "block"     : "unblock"}
                                onClick ={(e) => {
                                e?.stopPropagation()

                                ask(
                                    `Deseja ${row.ativo ? "bloquear" : "ativar"} o usuário ${row.nome}?`,
                                    [
                                    { label: "Cancelar", variant: "cancel", onClick: () => {} },
                                    {
                                        label:    row.ativo ? "Bloquear"  : "Ativar",
                                        variant:  row.ativo ? "block"     : "unblock",
                                        onClick: () => handleToggleAtivo(row.id, row.ativo),
                                    },
                                    ]
                                )
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
            </TForm>
        </TPage>
    )
}