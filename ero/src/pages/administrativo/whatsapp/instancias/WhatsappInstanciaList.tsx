import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../../../../services/api"
import { useMessage } from "../../../../hooks/useMessage"
import { useQuestion } from "../../../../hooks/useQuestion"
import type { TDataGridColumn } from "../../../../types/TDataGridColumn"
import type { WhatsappInstancia } from "../../../../types/WhatsappInstancia"
import { TPage } from "../../../../components/tpage"
import { TButton } from "../../../../components/tbutton"
import { TForm, TFormActionsLeft, TFormFooter } from "../../../../components/tform"
import { TRow } from "../../../../components/trow"
import { TCol } from "../../../../components/tcol"
import { TEntry } from "../../../../components/tentry"
import { TDataGrid } from "../../../../components/tdatagrid"

const columns: TDataGridColumn<WhatsappInstancia>[] = [
  { label: "ID",            field: "id",           width: "5%",  align: "center" },
  { label: "Nome",          field: "nome",         width: "20%", align: "left" },
  { label: "Usuário",       field: "usuarioNome",  width: "20%", align: "left" },
  { 
    label: "Número",        
    field: "usuarioTelefone",       
    width: "10%",
    mask: "celular"
  },
  { label: "Instance Name", field: "instanceName", width: "15%" },
  { label: "Timezone",      field: "timezone",     width: "10%" },
  {
    label: "Antecedência",
    field: "antecedenciaMinutos",
    width: "10%",
    align: "center",
    render: (row) => <span>{row.antecedenciaMinutos} min</span>,
  },
  {
    label: "Status",
    field: "ativo",
    width: "10%",
    align: "center",
    render: (row) => (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium text-white
        ${row.ativo ? "bg-(--success)" : "bg-(--danger)"}`}
      >
        {row.ativo ? "Ativa" : "Inativa"}
      </span>
    ),
  },
]

export default function WhatsappInstanciaList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [data,        setData]        = useState<WhatsappInstancia[]>([])
  const [allData,     setAllData]     = useState<WhatsappInstancia[]>([])
  const [loading,     setLoading]     = useState(false)
  const [resetKey,    setResetKey]    = useState(0)
  const [filtroNome,  setFiltroNome]  = useState("")

  useEffect(() => {
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load(nome = filtroNome) {
    setLoading(true)
    try {
      const response = await api.get("/whatsapp/instancias")
      const result   = response.data as WhatsappInstancia[]
      setAllData(result)
      setData(nome
        ? result.filter((i) => i.nome.toLowerCase().includes(nome.toLowerCase()))
        : result
      )
    } catch {
      showMessage("error", "Erro ao carregar instâncias")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    const nome = formData.nome || ""
    setFiltroNome(nome)
    setData(nome
      ? allData.filter((i) => i.nome.toLowerCase().includes(nome.toLowerCase()))
      : allData
    )
  }

  function handleLimpar() {
    setFiltroNome("")
    setResetKey((prev) => prev + 1)
    setData(allData)
  }

  async function handleToggleAtivo(id: number, ativoAtual: boolean) {
    try {
      await api.put(`/whatsapp/instancias/${id}`, { ativo: !ativoAtual })
      showMessage("success", ativoAtual ? "Instância desativada!" : "Instância ativada!")
      load()
    } catch {
      showMessage("error", "Erro ao atualizar instância")
    }
  }

  return (
    <TPage title="Instâncias WhatsApp" breadcrumb={["WhatsApp", "Instâncias"]}>
      <TForm key={resetKey} onSubmit={handleFiltrar}>
        <TRow>
          <TCol>
            <TEntry
              name        ="nome"
              label       ="Nome"
              placeholder ="Filtrar por nome..."
              width       ="50%"
              minWidth     ="200px"
            />
          </TCol>
        </TRow>

        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Filtrar" type="submit" />
            <TButton
              label   ="Nova"
              variant ="new"
              type    ="button"
              onClick ={() => navigate("/whatsapp/instancias/novo")}
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
        emptyMessage="Nenhuma instância encontrada"
        onRowClick  ={(row) => navigate(`/whatsapp/instancias/${row.id}`)}
        actions     ={(row) => (
          <TButton
            label   =""
            variant ={row.ativo ? "block" : "unblock"}
            onClick ={(e) => {
              e?.stopPropagation()
              ask(
                `Deseja ${row.ativo ? "desativar" : "ativar"} a instância ${row.nome}?`,
                [
                  { label: "Cancelar", variant: "cancel",  onClick: () => {} },
                  {
                    label:   row.ativo ? "Desativar" : "Ativar",
                    variant: row.ativo ? "block"     : "unblock",
                    onClick: () => handleToggleAtivo(row.id, row.ativo),
                  },
                ]
              )
            }}
          />
        )}
      />
    </TPage>
  )
}
