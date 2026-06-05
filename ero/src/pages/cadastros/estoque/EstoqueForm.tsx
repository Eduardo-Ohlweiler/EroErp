import { useState, useEffect }                              from "react"
import { useNavigate, useParams }                           from "react-router-dom"
import { api }                                              from "../../../services/api"
import axios                                                from "axios"
import type { EstoqueResponse }                             from "../../../types/Estoque"
import type { ErrorResponse }                               from "../../../types/ErrorResponse"
import { TPage }                                            from "../../../components/tpage"
import { TForm, TFormActionsLeft, TFormFooter }             from "../../../components/tform"
import { TRow }                                             from "../../../components/trow"
import { TCol }                                             from "../../../components/tcol"
import { TEntry }                                           from "../../../components/tentry"
import { TCombo }                                           from "../../../components/tcombo"
import { TDbCombo }                                         from "../../../components/tdbcombo"
import { TButton }                                          from "../../../components/tbutton"
import { useMessage }                                       from "../../../hooks/useMessage"

export default function EstoqueForm() {
  const { id }          = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const isEdit          = Boolean(id)

  const [saving,            setSaving]            = useState(false)
  const [loading,           setLoading]           = useState(false)
  const [formKey,           setFormKey]           = useState(0)
  const [emitenteId,        setEmitenteId]        = useState("")
  const [produtoId,         setProdutoId]         = useState("")
  const [quantidade,        setQuantidade]        = useState("")
  const [quantidadeMinima,  setQuantidadeMinima]  = useState("")
  const [precoVenda,        setPrecoVenda]        = useState("")
  //const [motivo,            setMotivo]            = useState("")
  const [bloqueado,         setBloqueado]         = useState("false")
  const [baixarEstoque,     setBaixarEstoque]     = useState("true")

  useEffect(() => {
    if (isEdit) loadEstoque()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadEstoque() {
    setLoading(true)
    try {
      const res = await api.get<EstoqueResponse>(`/estoque/${id}`)
      const e   = res.data
      setEmitenteId(String(e.emitenteId))
      setProdutoId(String(e.produtoId))
      setQuantidade(String(e.quantidade))
      setQuantidadeMinima(e.quantidadeMinima != null ? String(e.quantidadeMinima) : "")
      setPrecoVenda(e.precoVenda != null ? String(e.precoVenda) : "")
      setBloqueado(e.bloqueado ? "true" : "false")
      setBaixarEstoque(e.baixarEstoque ? "true" : "false")
      setFormKey((k) => k + 1)
    } catch {
      showMessage("error", "Erro ao carregar estoque")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(formData: Record<string, string>) {
    if (!emitenteId) { showMessage("error", "Emitente é obrigatório"); return }
    if (!produtoId)  { showMessage("error", "Produto é obrigatório");  return }

    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/estoque/${id}`, {
          precoVenda:      formData.precoVenda      ? Number(formData.precoVenda)      : null,
          quantidadeMinima:formData.quantidadeMinima? Number(formData.quantidadeMinima): null,
          bloqueado:       formData.bloqueado === "true",
          baixarEstoque:   formData.baixarEstoque === "true",
        })
        showMessage("success", "Estoque atualizado com sucesso!")
      } else {
        await api.post("/estoque", {
          emitenteId:        Number(emitenteId),
          produtoId:         Number(produtoId),
          quantidadeInicial: formData.quantidade       ? Number(formData.quantidade)       : 0,
          precoVenda:        formData.precoVenda        ? Number(formData.precoVenda)        : null,
          quantidadeMinima:  formData.quantidadeMinima  ? Number(formData.quantidadeMinima)  : null,
          baixarEstoque:     formData.baixarEstoque === "true",
          motivo:            formData.motivo            || null,
        })
        showMessage("success", "Estoque cadastrado com sucesso!")
        navigate("/estoque")
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const e = err.response?.data as ErrorResponse
        showMessage("error", e?.erro ?? "Erro ao salvar estoque")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <TPage title="Carregando..." breadcrumb={["Estoque", "Saldo"]}><div /></TPage>

  return (
    <TPage
      title     ={isEdit ? "Editar Estoque" : "Novo Estoque"}
      breadcrumb={["Estoque", "Saldo", isEdit ? "Editar" : "Novo"]}
    >
      <TForm key={formKey} onSubmit={handleSubmit}>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="emitenteId"
              label        ="Emitente"
              url          ="/emitentes/select"
              valueField   ="id"
              displayField ="pessoaNome"
              searchField  ="nome"
              placeholder  ="Selecione..."
              required
              width        ="50%"
              value        ={emitenteId}
              onChange     ={(val) => setEmitenteId(val)}
              disabled     ={isEdit}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="produtoId"
              label        ="Produto"
              url          ="/produtos/select"
              valueField   ="id"
              displayField ="nome"
              searchField  ="nome"
              placeholder  ="Selecione..."
              required
              width        ="50%"
              value        ={produtoId}
              onChange     ={(val) => setProdutoId(val)}
              disabled     ={isEdit}
            />
          </TCol>
        </TRow>

        {!isEdit && (
          <>
            <TRow>
              <TCol>
                <TEntry
                  name         ="quantidade"
                  label        ="Quantidade inicial"
                  mask         ="numerodecimal"
                  defaultValue ={quantidade}
                  width        ="200px"
                />
              </TCol>
            </TRow>
            <TRow>
              <TCol>
                <TEntry
                  name         ="motivo"
                  label        ="Motivo / Observação"
                  maxLength    ={255}
                  //defaultValue ={motivo}
                  width        ="50%"
                />
              </TCol>
            </TRow>
          </>
        )}

        <TRow>
          <TCol>
            <TEntry
              name         ="precoVenda"
              label        ="Preço de Venda"
              mask         ="moeda"
              defaultValue ={precoVenda}
              width        ="200px"
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry
              name         ="quantidadeMinima"
              label        ="Alerta — Quantidade Mínima"
              mask         ="numerodecimal"
              hint         ="Quando o estoque atingir este valor, aparece um alerta no dashboard"
              defaultValue ={quantidadeMinima}
              width        ="220px"
            />
          </TCol>
        </TRow>

        <TRow>
          <TCol>
            <TCombo
              name         ="baixarEstoque"
              label        ="Baixar Estoque"
              width        ="160px"
              defaultValue ={baixarEstoque}
              onChange     ={setBaixarEstoque}
              options      ={[
                { value: "true",  label: "Sim" },
                { value: "false", label: "Não" },
              ]}
            />
          </TCol>
        </TRow>

        {isEdit && (
          <TRow>
            <TCol>
              <TCombo
                name         ="bloqueado"
                label        ="Status"
                width        ="200px"
                defaultValue ={bloqueado}
                onChange     ={setBloqueado}
                options      ={[
                  { value: "false", label: "Ativo"     },
                  { value: "true",  label: "Bloqueado" },
                ]}
              />
            </TCol>
          </TRow>
        )}

        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Voltar" variant="cancel" type="button"
              onClick={() => navigate("/estoque")} />
            <TButton label="Salvar" variant="save" type="submit" loading={saving} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
