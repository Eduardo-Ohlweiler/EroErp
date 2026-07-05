import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../../../services/api"
import { useMessage } from "../../../hooks/useMessage"
import { useQuestion } from "../../../hooks/useQuestion"
import type { TDataGridColumn } from "../../../types/TDataGridColumn"
import type { GrupoAcesso } from "../../../types/GrupoAcesso"
import { TPage } from "../../../components/tpage"
import { TButton } from "../../../components/tbutton"
import { TForm, TFormActionsLeft, TFormFooter } from "../../../components/tform"
import { TRow } from "../../../components/trow"
import { TCol } from "../../../components/tcol"
import { TEntry } from "../../../components/tentry"
import { TDataGrid } from "../../../components/tdatagrid"
import { TDataGridFooter } from "../../../components/tdatagridfooter"

const columns: TDataGridColumn<GrupoAcesso>[] = [
  { label: "ID",        field: "id",   width: "60px", align: "center" },
  { label: "Nome",      field: "nome", width: "220px" },
  { label: "Descrição", field: "descricao" },
  {
    label: "Perfis de acesso",
    field: "roles",
    render: (row) => row.roles.join(", "),
  },
]

export default function GrupoAcessoList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [data,          setData]          = useState<GrupoAcesso[]>([])
  const [loading,       setLoading]       = useState(false)
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [filtroNome,    setFiltroNome]    = useState("")
  const [resetKey,      setResetKey]      = useState(0)

  const pageSize = 15

  useEffect(() => {
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  async function load(nome = filtroNome, pagina = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(pagina),
        size: String(pageSize),
        sort: "nome",
      })

      if (nome)
        params.append("nome", nome)

      const response = await api.get(`/grupos-acesso?${params.toString()}`)

      setData(response.data.content)
      setTotalPages(response.data.totalPages)
      setTotalElements(response.data.totalElements)
    } catch {
      showMessage("error", "Erro ao carregar grupos de acesso")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    const nome = formData.nome || ""

    setFiltroNome(nome)
    setPage(0)

    load(nome, 0)
  }

  function handleLimpar() {
    setFiltroNome("")
    setResetKey((prev) => prev + 1)
    setPage(0)

    load("", 0)
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/grupos-acesso/${id}`)
      showMessage("success", "Grupo de acesso excluído!")
      load()
    } catch {
      showMessage("error", "Erro ao excluir grupo de acesso")
    }
  }

  return (
    <TPage title="Grupos de Acesso" breadcrumb={["Administração", "Grupos de Acesso"]}>
      <TForm key={resetKey} onSubmit={handleFiltrar}>
        <TRow>
          <TCol>
            <TEntry
              name        ="nome"
              label       ="Nome"
              placeholder ="Filtrar por nome..."
              width       ="50%"
              minWidth    ="200px"
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
              onClick ={() => navigate("/grupos-acesso/novo")}
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
        emptyMessage="Nenhum grupo de acesso encontrado"
        onRowClick  ={(row) => navigate(`/grupos-acesso/${row.id}`)}
        actions     ={(row) => (
          <TButton
            label   =""
            variant ="delete"
            onClick ={(e) => {
              e?.stopPropagation()

              ask(
                `Deseja excluir o grupo de acesso ${row.nome}? Os usuários vinculados perderão as permissões do grupo no próximo login.`,
                [
                  { label: "Cancelar", variant: "cancel", onClick: () => {} },
                  {
                    label:   "Excluir",
                    variant: "delete",
                    onClick: () => handleDelete(row.id),
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
