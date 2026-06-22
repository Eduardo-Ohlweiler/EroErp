import { useState, useEffect } from "react"
import { api } from "../../../services/api"
import { useMessage } from "../../../hooks/useMessage"
import axios from "axios"
import type { ErrorResponse } from "../../../types/ErrorResponse"
import type { WhatsappConfigGlobal } from "../../../types/WhatsappConfigGlobal"
import { TPage } from "../../../components/tpage"
import { TForm, TFormFooter, TFormActionsRight } from "../../../components/tform"
import { TRow } from "../../../components/trow"
import { TCol } from "../../../components/tcol"
import { TEntry } from "../../../components/tentry"
import { TCombo } from "../../../components/tcombo"
import { TButton } from "../../../components/tbutton"

export default function WhatsappConfigGlobalForm() {
  const { showMessage } = useMessage()

  const [config,  setConfig]  = useState<WhatsappConfigGlobal | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [formKey, setFormKey] = useState(0)

  const isEdit = !!config?.id

  useEffect(() => {
    setLoading(true)
    api.get("/whatsapp/config-global/ativa")
      .then((response) => setConfig(response.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function reload() {
    try {
      const response = await api.get("/whatsapp/config-global/ativa")
      setConfig(response.data)
      setFormKey((prev) => prev + 1)
    } catch {
      showMessage("error", "Erro ao recarregar configuração")
    }
  }

  async function handleSubmit(data: Record<string, string>) {
    setSaving(true)
    try {
      const payload = {
        ...data,
        ativo: data.ativo === "true",
      }

      if (isEdit) {
        await api.put(`/whatsapp/config-global/${config!.id}`, payload)
        showMessage("success", "Configuração atualizada com sucesso!")
      } else {
        await api.post("/whatsapp/config-global", payload)
        showMessage("success", "Configuração cadastrada com sucesso!")
      }

      await reload()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errData = err.response?.data as ErrorResponse
        showMessage("error", errData?.erro ?? "Erro ao salvar configuração")
      } else {
        showMessage("error", "Erro inesperado ao salvar configuração")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <TPage title="Carregando..." breadcrumb={["Administração", "WhatsApp", "Config. Global"]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title="Configuração Global do WhatsApp"
      breadcrumb={["Administração", "WhatsApp", "Config. Global"]}
    >
      <TForm key={formKey} onSubmit={handleSubmit}>

        <TRow>
          <TCol>
            <TEntry
              name         ="apiUrl"
              label        ="URL do servidor Evolution API"
              required
              maxLength    ={255}
              placeholder  ="https://evolution.meuservidor.com"
              defaultValue ={config?.apiUrl}
              width        ="50%"
              minWidth     ="200px"
            />
          </TCol>
        </TRow>

        <TRow>
          <TCol>
            <TEntry
              name         ="apiKey"
              label        ="API Key (chave global)"
              required
              maxLength    ={500}
              placeholder  ="minha-api-key-secreta"
              defaultValue ={config?.apiKey}
              width        ="50%"
              minWidth     ="200px"
            />
          </TCol>
        </TRow>

        <TRow>
          <TCol>
            <TCombo
              name         ="ativo"
              label        ="Status"
              width        ="200px"
              defaultValue ={config ? (config.ativo ? "true" : "false") : "true"}
              options      ={[
                { value: "true",  label: "Ativo"   },
                { value: "false", label: "Inativo" },
              ]}
            />
          </TCol>
        </TRow>

        <TFormFooter>
          <TFormActionsRight>
            <TButton label="Salvar" variant="save" type="submit" loading={saving} />
          </TFormActionsRight>
        </TFormFooter>

      </TForm>
    </TPage>
  )
}
