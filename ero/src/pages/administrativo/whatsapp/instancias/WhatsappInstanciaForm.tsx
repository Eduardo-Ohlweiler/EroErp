import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { api } from "../../../../services/api"
import { useMessage } from "../../../../hooks/useMessage"
import axios from "axios"
import type { ErrorResponse } from "../../../../types/ErrorResponse"
import type { WhatsappInstancia } from "../../../../types/WhatsappInstancia"
import { TPage } from "../../../../components/tpage"
import { TForm, TFormFooter, TFormActionsLeft, TFormActionsRight } from "../../../../components/tform"
import { TRow } from "../../../../components/trow"
import { TCol } from "../../../../components/tcol"
import { TEntry } from "../../../../components/tentry"
import { TCombo } from "../../../../components/tcombo"
import { TButton } from "../../../../components/tbutton"
import { TSpace } from "../../../../components/tspace"
import { TDbCombo } from "../../../../components/tdbcombo"

export default function WhatsappInstanciaForm() {
  const { id: idParam } = useParams()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()

  const [currentId,  setCurrentId]  = useState<string | undefined>(idParam)
  const isEdit                      = !!currentId

  const [formKey,    setFormKey]    = useState(0)
  const [usuarioId,  setUsuarioId]  = useState("")
  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [instancia,  setInstancia]  = useState<WhatsappInstancia | null>(null)

  useEffect(() => {
    if (!currentId) return

    setLoading(true)
    api.get(`/whatsapp/instancias/${currentId}`)
      .then((response) => {
        setInstancia(response.data)
        setUsuarioId(String(response.data.usuarioId))
    })
      .catch(() => {
        showMessage("error", "Erro ao carregar instância")
        navigate("/whatsapp/instancias")
      })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  function handleNovo() {
    setCurrentId(undefined)
    setInstancia(null)
    setUsuarioId("")
    setFormKey((prev) => prev + 1)
  }

  async function reload(id: string) {
    try {
      const response = await api.get(`/whatsapp/instancias/${id}`)
      setInstancia(response.data)
      setFormKey((prev) => prev + 1)
    } catch {
      showMessage("error", "Erro ao recarregar instância")
    }
  }

  async function handleSubmit(data: Record<string, string>) {
    setSaving(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { createdAt, updatedAt, ...rest } = data
      const payload = {
        ...rest,
        ativo:               data.ativo === "true",
        antecedenciaMinutos: data.antecedenciaMinutos ? Number(data.antecedenciaMinutos) : undefined,
      }

      if (isEdit) {
        await api.put(`/whatsapp/instancias/${currentId}`, payload)
        showMessage("success", "Instância atualizada com sucesso!")
        await reload(currentId!)
      } else {
        const response = await api.post("/whatsapp/instancias", payload)
        showMessage("success", "Instância cadastrada com sucesso!")
        const novoId = String(response.data.id)
        setCurrentId(novoId)
        await reload(novoId)
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errData = err.response?.data as ErrorResponse
        showMessage("error", errData?.erro ?? "Erro ao salvar instância")
      } else {
        showMessage("error", "Erro inesperado ao salvar instância")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <TPage title="Carregando..." breadcrumb={["WhatsApp", "Instâncias"]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title={isEdit ? "Editar Instância" : "Nova Instância"}
      breadcrumb={["WhatsApp", "Instâncias", isEdit ? "Editar" : "Nova"]}
    >
      <TForm key={formKey} onSubmit={handleSubmit}>

        <TRow>
          <TCol>
            <TEntry
              name         ="nome"
              label        ="Nome"
              required
              maxLength    ={100}
              placeholder  ="Ex: Comercial, Suporte..."
              defaultValue ={instancia?.nome}
              width        ="60%"
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry
              name         ="instanceName"
              label        ="Instance Name (Evolution API)"
              required     ={!isEdit}
              disabled     ={isEdit}
              maxLength    ={100}
              placeholder  ="Ex: minha-empresa-comercial"
              defaultValue ={instancia?.instanceName}
              width        ="60%"
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
              <TDbCombo
                  name         ="usuarioId"
                  label        ="Usuário"
                  url          ="/usuarios/select"
                  valueField   ="id"
                  displayField ="nome"
                  searchField  ="nome"
                  placeholder  ="Selecione o usuário..."
                  width        ="60%"
                  value        ={usuarioId}
                  onChange     ={(val) => setUsuarioId(val)}
              />
          </TCol>
      </TRow>
        <TRow>
          <TCol>
            <TEntry
              name         ="token"
              label        ="Token da instância"
              maxLength    ={500}
              defaultValue ={instancia?.token}
              width        ="60%"
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry
              name         ="timezone"
              label        ="Fuso horário"
              maxLength    ={50}
              defaultValue ={instancia?.timezone ?? "America/Sao_Paulo"}
              width        ="200px"
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry
              name         ="antecedenciaMinutos"
              label        ="Antecedência (minutos)"
              defaultValue ={String(instancia?.antecedenciaMinutos ?? 60)}
              width        ="200px"
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TCombo
              name         ="ativo"
              label        ="Status"
              width        ="200px"
              defaultValue ={instancia ? (instancia.ativo ? "true" : "false") : "true"}
              options      ={[
                { value: "true",  label: "Ativa"   },
                { value: "false", label: "Inativa" },
              ]}
            />
          </TCol>
        </TRow>

        {isEdit && (
          <TRow>
            <TCol>
              <TEntry
                name         ="createdAt"
                label        ="Criado em"
                disabled
                width        ="160px"
                defaultValue ={instancia?.createdAt
                  ? new Date(instancia.createdAt).toLocaleString("pt-BR")
                  : "—"}
              />
            </TCol>
            <TCol>
              <TEntry
                name         ="updatedAt"
                label        ="Alterado em"
                disabled
                width        ="160px"
                defaultValue ={instancia?.updatedAt
                  ? new Date(instancia.updatedAt).toLocaleString("pt-BR")
                  : "—"}
              />
            </TCol>
            <TSpace />
          </TRow>
        )}

        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Voltar" variant="cancel" onClick={() => navigate("/whatsapp/instancias")} />
            <TButton label="Nova"   variant="new"    onClick={handleNovo} />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="Salvar" variant="save" type="submit" loading={saving} />
          </TFormActionsRight>
        </TFormFooter>

      </TForm>
    </TPage>
  )
}
