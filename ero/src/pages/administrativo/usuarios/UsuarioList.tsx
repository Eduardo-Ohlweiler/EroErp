import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../../../services/api"
import { useMessage } from "../../../hooks/useMessage"
import { useQuestion } from "../../../hooks/useQuestion"
import type { TDataGridColumn } from "../../../types/TDataGridColumn"
import type { Usuario } from "../../../types/Usuario"
import { TPage } from "../../../components/tpage"
import { TButton } from "../../../components/tbutton"
import { TForm, TFormActionsLeft, TFormFooter } from "../../../components/tform"
import { TRow } from "../../../components/trow"
import { TCol } from "../../../components/tcol"
import { TEntry } from "../../../components/tentry"
import { TDbCombo } from "../../../components/tdbcombo"
import { TDataGrid } from "../../../components/tdatagrid"
import { TDataGridFooter } from "../../../components/tdatagridfooter"

const columns: TDataGridColumn<Usuario>[] = [
  { label: "ID",        field: "id",        width: "60px", align: "center" },
  { label: "Nome",      field: "nome" },
  { label: "E-mail",    field: "email" },
  { label: "Celular",   field: "telefone",  width: "160px", mask: "celular" },
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
]

export default function UsuarioList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [data,          setData]          = useState<Usuario[]>([])
  const [loading,       setLoading]       = useState(false)
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [filtroNome,    setFiltroNome]    = useState("")
  const [filtroEmail,   setFiltroEmail]   = useState("")
  const [filtroCliente, setFiltroCliente] = useState("")
  const [resetKey, setResetKey]           = useState(0)

  const pageSize = 15

  useEffect(() => {
    load()
  }, [page])

  async function load(
    nome      = filtroNome,
    email     = filtroEmail,
    clienteId = filtroCliente,
    pagina    = page
  ) {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(pagina),
        size: String(pageSize),
        sort: "nome",
      })

      if (nome) 
        params.append("nome", nome)
      if (email) 
        params.append("email", email)
      if (clienteId) 
        params.append("clienteId", clienteId)

      const response = await api.get(`/usuarios?${params.toString()}`)

      setData(response.data.content)
      setTotalPages(response.data.totalPages)
      setTotalElements(response.data.totalElements)
    } catch {
      showMessage("error", "Erro ao carregar usuários")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    const nome      = formData.nome   || ""
    const email     = formData.email  || ""
    const clienteId = filtroCliente

    setFiltroNome(nome)
    setFiltroEmail(email)
    setPage(0)

    load(nome, email, clienteId, 0)
  }

  function handleLimpar() {
    setFiltroNome("")
    setFiltroEmail("")
    setFiltroCliente("") 
    setResetKey((prev) => prev + 1)
    setPage(0)

    load("", "", "", 0)
  }

  async function handleToggleAtivo(id: number, ativoAtual: boolean) {
    try {
      await api.patch(`/usuarios/${id}`, { ativo: !ativoAtual })

      showMessage(
        "success",
        ativoAtual ? "Usuário bloqueado!" : "Usuário ativado!"
      )

      load()
    } catch {
      showMessage("error", "Erro ao atualizar usuário")
    }
  }

  return (
    <TPage title="Usuários" breadcrumb={["Administração", "Usuários"]}>
      <TForm key={resetKey} onSubmit  ={handleFiltrar}>
        <TRow>
          <TCol>
            <TDbCombo
              name        ="clienteId"
              label       ="Cliente"
              url         ="/clientes"
              valueField  ="id"
              displayField="nome"
              searchField ="nome"
              placeholder ="Todos os clientes..."
              width       ="60%"
              value       ={filtroCliente}              
              onChange    ={setFiltroCliente}        
            />
          </TCol>
        </TRow>

        <TRow>
          <TCol>
            <TEntry
              name        ="nome"
              label       ="Nome"
              placeholder ="Filtrar por nome..."
              width       ="60%"
            />
          </TCol>
        </TRow>

        <TRow>
          <TCol>
            <TEntry
              name        ="email"
              label       ="E-mail"
              placeholder ="Filtrar por e-mail..."
              width       ="60%"
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
              onClick ={() => navigate("/usuarios/novo")}
            />
            <TButton
              label   ="Limpar"
              variant ="cancel"
              type    ="button"
              onClick ={handleLimpar}
            />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        columns     ={columns}
        data        ={data}
        keyField    ="id"
        loading     ={loading}
        emptyMessage="Nenhum usuário encontrado"
        onRowClick  ={(row) => navigate(`/usuarios/${row.id}`)}
        actions     ={(row) => (
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
  )
}