import { useState } from "react"
import { TWindow } from "../twindow"
import { TText } from "../ttext"
import { TButton } from "../tbutton"
import { useMessage } from "../../hooks/useMessage"

interface AssumirWindowProps {
  open:     boolean
  onClose:  () => void
  onConfirmar: (motivo: string) => Promise<void>
}

export function AssumirWindow({ open, onClose, onConfirmar }: AssumirWindowProps) {
  const { showMessage } = useMessage()
  const [motivo, setMotivo] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function handleConfirmar() {
    const texto = motivo.trim()
    if (!texto) {
      showMessage("warning", "Informe o motivo para assumir o atendimento.")
      return
    }
    setSalvando(true)
    try {
      await onConfirmar(texto)
      setMotivo("")
    } finally {
      setSalvando(false)
    }
  }

  function handleClose() {
    setMotivo("")
    onClose()
  }

  return (
    <TWindow
      title="Assumir atendimento"
      open={open}
      onClose={handleClose}
      width="500px"
      actions={
        <>
          <TButton label="Cancelar" variant="cancel" type="button" onClick={handleClose} />
          <TButton label="Assumir" variant="confirm" type="button" loading={salvando} onClick={handleConfirmar} />
        </>
      }
    >
      <p className="mb-3 text-sm text-(--text-secondary)">
        Este atendimento já possui um dono. Informe o motivo para assumi-lo.
      </p>
      <TText
        name="motivo"
        label="Motivo"
        required
        placeholder="Descreva o motivo da reassunção..."
        defaultValue={motivo}
        onChange={setMotivo}
        height="120px"
      />
    </TWindow>
  )
}
