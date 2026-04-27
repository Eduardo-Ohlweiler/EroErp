import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import type { TDataGridColumn } from "../../../types/TDataGridColumn"
import type { TipoTelefone } from "../../../types/TipoTelefone"
import { useMessage } from "../../../hooks/useMessage"
import { useQuestion } from "../../../hooks/useQuestion"
import { api } from "../../../services/api"
import { TPage } from "../../../components/tpage"
import { TForm, TFormActionsLeft, TFormFooter } from "../../../components/tform"
import { TRow } from "../../../components/trow"
import { TCol } from "../../../components/tcol"
import { TEntry } from "../../../components/tentry"
import { TButton } from "../../../components/tbutton"
import { TDataGrid } from "../../../components/tdatagrid"
import { TDataGridFooter } from "../../../components/tdatagridfooter"

const columns: TDataGridColumn<TipoTelefone>[] = [
  { label: "ID",   field: "id",   width: "60px", align: "center" },
  { label: "Nome", field: "nome" },
  {
    label: "Status", field: "ativo", width: "100px", align: "center",
    render: (row) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${row.ativo ? "bg-[var(--success)]" : "bg-[var(--danger)]"}`}>
        {row.ativo ? "Ativo" : "Inativo"}
      </span>
    )
  },
]

export default function TipoTelefoneList() {

  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [data,          setData]          = useState<TipoTelefone[]>([])
  const [loading,       setLoading]       = useState(false)
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [filtroNome,    setFiltroNome]    = useState("")
  const [resetKey,      setResetKey]      = useState(0)
  const pageSize = 15

  useEffect(() => { load() }, [page])

  async function load(nome = filtroNome, pagina = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pagina), size: String(pageSize), sort: "nome" })
      if (nome) params.append("nome", nome)
      const response = await api.get(`/tipos/telefone?${params.toString()}`)
      setData(response.data.content)
      setTotalPages(response.data.totalPages)
      setTotalElements(response.data.totalElements)
    } catch {
      showMessage("error", "Erro ao carregar tipos de telefone")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    setFiltroNome(formData.nome)
    setPage(0)
    load(formData.nome, 0)
  }

  function handleLimpar() {
    setFiltroNome("")
    setResetKey((prev) => prev + 1)
    setPage(0)
    load("", 0)
  }

  async function handleToggleAtivo(id: number, ativoAtual: boolean) {
    try {
      await api.patch(`/tipos/telefone/${id}`, { ativo: !ativoAtual })
      showMessage("success", ativoAtual ? "Registro bloqueado!" : "Registro ativado!")
      load()
    } catch {
      showMessage("error", "Erro ao atualizar registro")
    }
  }

  return (
    <TPage title="Tipos de Telefone" breadcrumb={["Cadastros", "Auxiliares", "Tipos de Telefone"]}>

      <TForm key={resetKey} onSubmit={handleFiltrar}>
        <TRow>
          <TCol>
            <TEntry name="nome" label="Nome" placeholder="Filtrar por nome..." width="60%" />
          </TCol>
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Filtrar" type="submit" />
            <TButton label="Novo"    variant="new"    type="button" onClick={() => navigate("/tipos/telefone/novo")} />
            <TButton label="Limpar"  variant="cancel" type="button" onClick={handleLimpar} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhum registro encontrado"
        actionsWidth ="160px"
        onRowClick   ={(row) => navigate(`/tipos/telefone/${row.id}`)}
        actions      ={(row) => (
          <TButton
            label   ={row.ativo ? "Bloquear" : "Ativar"}
            variant ={row.ativo ? "block" : "unblock"}
            onClick ={(e) => {
              e?.stopPropagation()
              ask(
                `Deseja ${row.ativo ? "bloquear" : "ativar"} o tipo "${row.nome}"?`,
                [
                  { label: "Cancelar", variant: "cancel",                      onClick: () => {} },
                  { label: row.ativo ? "Bloquear" : "Ativar",
                    variant: row.ativo ? "block" : "unblock",
                    onClick: () => handleToggleAtivo(row.id, row.ativo) }
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