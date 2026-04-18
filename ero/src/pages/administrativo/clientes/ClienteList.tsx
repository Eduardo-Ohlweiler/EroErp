import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { useMessage } from "../../../hooks/useMessage";
import type { TDataGridColumn } from "../../../types/TDataGridColumn";
import type { Cliente } from "../../../types/Cliente";
import { TPage } from "../../../components/tpage";
import { TButton } from "../../../components/tbutton";
import {
  TForm,
  TFormActionsLeft,
  //TFormActionsRight,
  TFormFooter,
} from "../../../components/tform";
import { TRow } from "../../../components/trow";
import { TCol } from "../../../components/tcol";
import { TEntry } from "../../../components/tentry";
import { TDataGrid } from "../../../components/tdatagrid";
import { TDataGridFooter } from "../../../components/tdatagridfooter";
import { useQuestion } from '../../../hooks/useQuestion';

const columns: TDataGridColumn<Cliente>[] = [
  { label: "ID", field: "id", width: "60px", align: "center" },
  { label: "Nome", field: "nome" },
  { label: "E-mail", field: "email" },
  { label: "Telefone", field: "telefone", width: "160px" },
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

export default function ClienteList() {
  const navigate                            = useNavigate();
  const { ask }                             = useQuestion();
  const { showMessage }                     = useMessage();
  const [data,          setData]            = useState<Cliente[]>([]);
  const [loading,       setLoading]         = useState(false);
  const [page,          setPage]            = useState(0);
  const [totalPages,    setTotalPages]      = useState(0);
  const [totalElements, setTotalElements]   = useState(0);
  const [filtroNome,    setFiltroNome]      = useState("");
  const [filtroEmail,   setFiltroEmail]     = useState("");
  const [resetKey, setResetKey] = useState(0)

  const pageSize = 15;

  useEffect(() => {
    load();
  }, [page]);

  async function load(nome = filtroNome, email = filtroEmail, pagina = page) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagina),
        size: String(pageSize),
        sort: "nome",
      });

      if (nome) params.append("nome", nome);
      if (email) params.append("email", email);

      const response = await api.get(`/clientes?${params.toString()}`);
      setData(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch {
      showMessage("error", "Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    setFiltroNome(formData.nome);
    setFiltroEmail(formData.email);
    setPage(0);
    load(formData.nome, formData.email, 0);
  }

    function handleLimpar() {
    setFiltroNome("")
    setFiltroEmail("")
    setResetKey((prev) => prev + 1)  // força remount do form
    setPage(0)
    load("", "", 0)
    }

  function handlePageChange(novaPagina: number) {
    setPage(novaPagina);
  }

  async function handleToggleAtivo(id: number, ativoAtual: boolean) {
    try {
      await api.patch(`/clientes/${id}`, { ativo: !ativoAtual });
      showMessage(
        "success",
        ativoAtual ? "Cliente bloqueado!" : "Cliente ativado!",
      );
      load();
    } catch {
      showMessage("error", "Erro ao atualizar cliente");
    }
  }

  return (
    <TPage
        title="Clientes"
        breadcrumb={["Administração", "Clientes"]}
      //   actions   ={
      //     <TButton
            //   label="Novo"
            //   variant="new"
            //   type="button"
            //   onClick={() => navigate("/clientes/novo")}
            // />
      //   }
    >
        {/* filtros */}
        <TForm key={resetKey} onSubmit={handleFiltrar}>
            <TRow>
                <TCol>
                    <TEntry
                        name="nome"
                        label="Nome"
                        placeholder="Filtrar por nome..."
                        defaultValue={filtroNome}
                        width="60%"
                    />
                </TCol>
            </TRow>
            <TRow>
                <TCol>
                    <TEntry
                        name="email"
                        label="E-mail"
                        placeholder="Filtrar por e-mail..."
                        defaultValue={filtroEmail}
                        width="60%"
                    />
                </TCol>
            </TRow>

            <TFormFooter>
                <TFormActionsLeft>
                    <TButton label="Filtrar" type="submit" />
                    <TButton
                    label="Novo"
                    variant="new"
                    type="button"
                    onClick={() => navigate("/clientes/novo")}
                    />
                    <TButton
                    label="Limpar"
                    variant="cancel"
                    type="button"
                    onClick={handleLimpar}
                    />
                </TFormActionsLeft>
                {/* <TFormActionsRight>
                    <TButton label="Filtrar" type="submit" />
                </TFormActionsRight> */}
            </TFormFooter>
        </TForm>

        <TDataGrid
            columns={columns}
            data={data}
            keyField="id"
            loading={loading}
            emptyMessage="Nenhum cliente encontrado"
            onRowClick={(row) => navigate(`/clientes/${row.id}`)}
            actions={(row) => (
            <TButton
              label={row.ativo ? "Bloquear" : "Ativar"}
              variant={row.ativo ? "block" : "unblock"}
              onClick={(e) => {
                e?.stopPropagation()
                ask(
                  `Deseja ${row.ativo ? "bloquear" : "ativar"} o cliente ${row.nome}?`,
                  [
                    {
                      label:   "Cancelar",
                      variant: "cancel",
                      onClick: () => {}
                    },
                    {
                      label:   row.ativo ? "Bloquear" : "Ativar",
                      variant: row.ativo ? "block"    : "unblock",
                      onClick: () => handleToggleAtivo(row.id, row.ativo)
                    }
                  ]
                )
              }}
            />
            )}
        />

        <TDataGridFooter
            page          ={page}
            totalPages    ={totalPages}
            totalElements ={totalElements}
            pageSize      ={pageSize}
            onPageChange  ={handlePageChange}
        />
    </TPage>
  );
}
