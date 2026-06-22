import { useEffect, useState }                                    from "react"
import { useNavigate, useParams }                                  from "react-router-dom"
import axios                                                       from "axios"
import { api }                                                     from "../../../services/api"
import type { TipoPedidoResponse }                                 from "../../../types/Pedido"
import type { ErrorResponse }                                      from "../../../types/ErrorResponse"
import { TPage }                                                   from "../../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../../components/tform"
import { TRow }                                                    from "../../../components/trow"
import { TCol }                                                    from "../../../components/tcol"
import { TEntry }                                                  from "../../../components/tentry"
import { TCombo }                                                  from "../../../components/tcombo"
import { TButton }                                                 from "../../../components/tbutton"
import { useMessage }                                              from "../../../hooks/useMessage"

export default function TipoPedidoForm() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()

  const [formKey,    setFormKey]    = useState(0)
  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [tipoPedido, setTipoPedido] = useState<TipoPedidoResponse | null>(null)
  const [currentId,  setCurrentId]  = useState<string | undefined>(idParam)

  const isEdit = !!currentId

  useEffect(() => {
    if (!currentId) { setTipoPedido(null); return }
    setLoading(true)
    api.get<TipoPedidoResponse>(`/tipos-pedido/${currentId}`)
      .then(r => loadTipo(r.data))
      .catch(() => { showMessage("error", "Erro ao carregar tipo de pedido"); navigate("/pedidos/tipos") })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  function loadTipo(data: TipoPedidoResponse) {
    setTipoPedido(data)
    setFormKey(k => k + 1)
  }

  async function reload(id: string) {
    const r = await api.get<TipoPedidoResponse>(`/tipos-pedido/${id}`)
    loadTipo(r.data)
  }

  function handleNovo() {
    setCurrentId(undefined)
    setTipoPedido(null)
    setFormKey(k => k + 1)
  }

  async function handleSubmit(data: Record<string, string>) {
    if (!data.nome?.trim()) { showMessage("error", "Nome é obrigatório"); return }
    setSaving(true)
    try {
      const payload = {
        nome:             data.nome.trim(),
        movimentaEstoque: data.movimentaEstoque || "NENHUM",
        geraFinanceiro:   data.geraFinanceiro   || "NENHUM",
        ativo:            data.ativo !== "false",
      }
      if (isEdit) {
        await api.put(`/tipos-pedido/${currentId}`, payload)
        showMessage("success", "Tipo de pedido atualizado com sucesso!")
        await reload(currentId!)
      } else {
        const res = await api.post<TipoPedidoResponse>("/tipos-pedido", payload)
        showMessage("success", "Tipo de pedido criado com sucesso!")
        const novoId = String(res.data.id)
        setCurrentId(novoId)
        await reload(novoId)
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao salvar tipo de pedido")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <TPage title="Carregando..." breadcrumb={["Pedidos", "Auxiliar Pedidos", "Tipos de Pedido"]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title     ={isEdit ? `Tipo de Pedido — ${tipoPedido?.nome ?? ""}` : "Novo Tipo de Pedido"}
      breadcrumb={["Pedidos", "Auxiliar Pedidos", "Tipos de Pedido", isEdit ? "Editar" : "Novo"]}
    >
      <TForm key={formKey} onSubmit={handleSubmit}>
        <TRow>
          <TCol>
            <TEntry
              name        ="nome"
              label       ="Nome (*)"
              required
              width       ="50%"
              minWidth    ="200px"
              defaultValue={tipoPedido?.nome}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TCombo
              name        ="movimentaEstoque"
              label       ="Movimenta Estoque"
              width       ="200px"
              defaultValue={tipoPedido?.movimentaEstoque ?? "NENHUM"}
              options     ={[
                { value: "NENHUM",  label: "Não movimenta" },
                { value: "ENTRADA", label: "Entrada"       },
                { value: "SAIDA",   label: "Saída"         },
              ]}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TCombo
              name        ="geraFinanceiro"
              label       ="Gera Financeiro"
              width       ="200px"
              defaultValue={tipoPedido?.geraFinanceiro ?? "NENHUM"}
              options     ={[
                { value: "NENHUM",         label: "Não gera"         },
                { value: "CONTAS_RECEBER", label: "Contas a Receber" },
                { value: "CONTAS_PAGAR",   label: "Contas a Pagar"   },
              ]}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TCombo
              name        ="ativo"
              label       ="Status"
              width       ="200px"
              defaultValue={tipoPedido ? (tipoPedido.ativo ? "true" : "false") : "true"}
              options     ={[
                { value: "true",  label: "Ativo"   },
                { value: "false", label: "Inativo" },
              ]}
            />
          </TCol>
        </TRow>

        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Voltar" variant="cancel" type="button"
              onClick={() => navigate("/pedidos/tipos")} />
            <TButton label="Novo" variant="new" type="button" onClick={handleNovo} />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="Salvar" variant="save" type="submit" loading={saving} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
