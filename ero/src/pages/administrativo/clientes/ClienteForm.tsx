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

export default function ClienteForm() {

  const { id }          = useParams()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const isEdit          = !!id

  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [cliente,  setCliente]  = useState<Cliente | null>(null)

  useEffect(() => {
    if (isEdit) load()
  }, [id])

  async function load() {
    setLoading(true)
    try {
      const response = await api.get(`/clientes/${id}`)
      setCliente(response.data)
    } catch {
      showMessage("error", "Erro ao carregar cliente")
      navigate("/clientes")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(data: Record<string, string>) {
    setSaving(true)
    try {
      if (isEdit) {
        await api.patch(`/clientes/${id}`, data)
        showMessage("success", "Cliente atualizado com sucesso!")
      } else {
        await api.post("/clientes", data)
        showMessage("success", "Cliente cadastrado com sucesso!")
        navigate("/clientes")
      }
    } catch (err) {
        if (axios.isAxiosError(err)) {
            const data = err.response?.data as ErrorResponse
            showMessage("error", data?.erro ?? "Erro ao salvar cliente")
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
          <span className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title={isEdit ? "Editar Cliente" : "Novo Cliente"}
      breadcrumb={["Administração", "Clientes", isEdit ? "Editar" : "Novo"]}
    >
      <TForm onSubmit={handleSubmit}>

        <TRow>
          <TCol>
            <TEntry
              name="nome"
              label="Nome"
              required
              maxLength={255}
              defaultValue={cliente?.nome}
            />
          </TCol>
          <TCol>
            <TEntry
              name="email"
              label="E-mail"
              type="email"
              required
              maxLength={255}
              defaultValue={cliente?.email}
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
            />
          </TCol>
        </TRow>

        <TFormFooter>
          <TFormActionsLeft>
            <TButton
              label="Voltar"
              variant="secondary"
              onClick={() => navigate("/clientes")}
            />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton
              label="Salvar"
              type="submit"
              loading={saving}
            />
          </TFormActionsRight>
        </TFormFooter>

      </TForm>
    </TPage>
  )
}