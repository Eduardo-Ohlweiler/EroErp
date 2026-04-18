import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { api } from "../../../services/api"
import { useMessage } from "../../../hooks/useMessage"
import { TPage } from "../../../components/tpage"
import { TForm, TFormFooter, TFormActionsLeft, TFormActionsRight } from "../../../components/tform"
import { TRow } from "../../../components/trow"
import { TEntry } from "../../../components/tentry"
import { TButton } from "../../../components/tbutton"
import type { Cliente } from "../../../types/Cliente"
import { TCol } from "../../../components/tcol"
import type { ErrorResponse } from "../../../types/ErrorResponse"
import axios from "axios"
import { TCombo } from "../../../components/tcombo"

export default function ClienteForm() {

  const { id: idParam }           = useParams()
  const navigate                  = useNavigate()
  const { showMessage }           = useMessage()

  const [currentId,setCurrentId]  = useState<string | undefined>(idParam)
  const isEdit                    = !!currentId

  const [loading,  setLoading]    = useState(false)
  const [saving,   setSaving]     = useState(false)
  const [cliente,  setCliente]    = useState<Cliente | null>(null)
  const [formKey,  setFormKey]    = useState(0)

  useEffect(() => {
    if (!currentId) return

    setLoading(true)
    api.get(`/clientes/${currentId}`)
      .then((response) => {
        setCliente(response.data)
      })
      .catch(() => {
        showMessage("error", "Erro ao carregar cliente")
        navigate("/clientes")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [currentId, navigate, showMessage])

  function handleNovo() {
    setCurrentId(undefined)  // limpa o id
    setCliente(null)
    setFormKey((prev) => prev + 1)
  }

  async function handleSubmit(data: Record<string, string>) {
    setSaving(true)
    try {
      const payload = {
        ...data,
        ativo: data.ativo === "true"
      }
      if (isEdit) {
        await api.patch(`/clientes/${currentId}`, payload)
        showMessage("success", "Cliente atualizado com sucesso!")
      } else {
        const response = await api.post("/clientes", payload)
        showMessage("success", "Cliente cadastrado com sucesso!")
        setCurrentId(String(response.data.id))
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errData = err.response?.data as ErrorResponse
        showMessage("error", errData?.erro ?? "Erro ao salvar cliente")
      } else {
        showMessage("error", "Erro inesperado ao salvar cliente")
      }
      } finally {
        setSaving(false)
      }
  }

  if (loading) {
    return (
      <TPage title="Carregando..." breadcrumb={["Administração", "Clientes"]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title={isEdit ? "Editar Cliente" : "Novo Cliente"}
      breadcrumb={["Administração", "Clientes", isEdit ? "Editar" : "Novo"]}
    >
      <TForm key={formKey} onSubmit={handleSubmit}>

        <TRow>
          <TCol>
            <TEntry
              name="nome"
              label="Nome"
              required
              maxLength={255}
              defaultValue={cliente?.nome}
              width="60%"
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry
              name="email"
              label="E-mail"
              type="email"
              required
              maxLength={255}
              defaultValue={cliente?.email}
              width="60%"
            />
          </TCol>
        </TRow>

        <TRow>
          <TCol>
            <TEntry
              name="telefone"
              label="Telefone"
              mask="celular"
              defaultValue={cliente?.telefone}
              width="200px"
            />
          </TCol>
        </TRow>
        <TRow>
        <TCol>
          <TCombo
            name="ativo"
            label="Status"
            width="200px"
            defaultValue={cliente ? (cliente.ativo ? "true" : "false") : "true"}
            options={[
              { value: "true",  label: "Ativo"    },
              { value: "false", label: "Bloqueado" },
            ]}
          />
        </TCol>
      </TRow>

        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Voltar" variant="cancel"  onClick={() => navigate("/clientes")} />
            <TButton label="Novo"   variant="new"     onClick={handleNovo} />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="Salvar" variant="save"    type="submit" loading={saving} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}