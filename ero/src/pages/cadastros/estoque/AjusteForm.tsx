import { useState }                                          from "react"
import { useNavigate }                                        from "react-router-dom"
import { api }                                                from "../../../services/api"
import axios                                                  from "axios"
import type { ErrorResponse }                                 from "../../../types/ErrorResponse"
import { TPage }                                              from "../../../components/tpage"
import { TForm, TFormActionsLeft, TFormFooter }               from "../../../components/tform"
import { TRow }                                               from "../../../components/trow"
import { TCol }                                               from "../../../components/tcol"
import { TEntry }                                             from "../../../components/tentry"
import { TDbCombo }                                           from "../../../components/tdbcombo"
import { TButton }                                            from "../../../components/tbutton"
import { useMessage }                                         from "../../../hooks/useMessage"

function displayEstoque(item: Record<string, unknown>): string {
  return `${item.produtoNome} — ${item.emitenteNome}`
}

export default function AjusteForm() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()

  const [saving,     setSaving]     = useState(false)
  const [estoqueId,  setEstoqueId]  = useState("")

  async function handleSubmit(formData: Record<string, string>) {
    if (!estoqueId) {
      showMessage("error", "Selecione o estoque a ser ajustado")
      return
    }
    if (!formData.quantidadeNova && formData.quantidadeNova !== "0") {
      showMessage("error", "Informe a nova quantidade")
      return
    }

    setSaving(true)
    try {
      await api.post("/estoque/ajustes", {
        estoqueId:     Number(estoqueId),
        quantidadeNova: Number(formData.quantidadeNova),
        motivo:         formData.motivo || null,
      })
      showMessage("success", "Ajuste realizado com sucesso!")
      navigate("/estoque/ajustes")
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const e = err.response?.data as ErrorResponse
        showMessage("error", e?.erro ?? "Erro ao realizar ajuste")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <TPage title="Novo Ajuste de Estoque" breadcrumb={["Estoque", "Ajustes", "Novo"]}>
      <TForm onSubmit={handleSubmit}>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="estoqueId"
              label        ="Produto / Emitente"
              url          ="/estoque"
              valueField   ="id"
              displayField ={displayEstoque}
              searchField  ="produtoNome"
              placeholder  ="Buscar produto no estoque..."
              required
              width        ="50%"
              value        ={estoqueId}
              onChange     ={(val) => setEstoqueId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry
              name         ="motivo"
              label        ="Motivo do Ajuste"
              maxLength    ={255}
              width        ="50%"
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry
              name         ="quantidadeNova"
              label        ="Nova Quantidade"
              mask         ="numerodecimal"
              required
              width        ="200px"
            />
          </TCol>
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Voltar" variant="cancel" type="button"
              onClick={() => navigate("/estoque/ajustes")} />
            <TButton label="Salvar" variant="save" type="submit" loading={saving} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
