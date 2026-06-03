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

export default function TransferenciaForm() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()

  const [saving,            setSaving]            = useState(false)
  const [produtoId,         setProdutoId]         = useState("")
  const [emitenteOrigemId,  setEmitenteOrigemId]  = useState("")
  const [emitenteDestinoId, setEmitenteDestinoId] = useState("")

  async function handleSubmit(formData: Record<string, string>) {
    if (!produtoId)         { showMessage("error", "Selecione o produto");          return }
    if (!emitenteOrigemId)  { showMessage("error", "Selecione o emitente de origem");  return }
    if (!emitenteDestinoId) { showMessage("error", "Selecione o emitente de destino"); return }
    if (!formData.quantidade || Number(formData.quantidade) <= 0) {
      showMessage("error", "Informe uma quantidade maior que zero")
      return
    }

    setSaving(true)
    try {
      await api.post("/estoque/transferencias", {
        produtoId:         Number(produtoId),
        emitenteOrigemId:  Number(emitenteOrigemId),
        emitenteDestinoId: Number(emitenteDestinoId),
        quantidade:        Number(formData.quantidade),
        observacao:        formData.observacao || null,
      })
      showMessage("success", "Transferência realizada com sucesso!")
      navigate("/estoque/transferencias")
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const e = err.response?.data as ErrorResponse
        showMessage("error", e?.erro ?? "Erro ao realizar transferência")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <TPage title="Nova Transferência de Estoque" breadcrumb={["Estoque", "Transferências", "Nova"]}>
      <TForm onSubmit={handleSubmit}>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="produtoId"
              label        ="Produto"
              url          ="/produtos/select"
              valueField   ="id"
              displayField ="nome"
              searchField  ="nome"
              placeholder  ="Buscar produto..."
              required
              width        ="50%"
              value        ={produtoId}
              onChange     ={(val) => setProdutoId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="emitenteOrigemId"
              label        ="Emitente de Origem"
              url          ="/emitentes/select"
              valueField   ="id"
              displayField ="pessoaNome"
              searchField  ="nome"
              placeholder  ="Selecione..."
              required
              width        ="50%"
              value        ={emitenteOrigemId}
              onChange     ={(val) => setEmitenteOrigemId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="emitenteDestinoId"
              label        ="Emitente de Destino"
              url          ="/emitentes/select"
              valueField   ="id"
              displayField ="pessoaNome"
              searchField  ="nome"
              placeholder  ="Selecione..."
              required
              width        ="50%"
              value        ={emitenteDestinoId}
              onChange     ={(val) => setEmitenteDestinoId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry
              name         ="quantidade"
              label        ="Quantidade a Transferir"
              mask         ="numerodecimal"
              required
              width        ="200px"
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry
              name         ="observacao"
              label        ="Observação"
              maxLength    ={255}
              width        ="50%"
            />
          </TCol>
        </TRow>

        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Voltar" variant="cancel" type="button"
              onClick={() => navigate("/estoque/transferencias")} />
            <TButton label="Transferir" variant="save" type="submit" loading={saving} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
