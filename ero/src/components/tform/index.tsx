interface TFormProps {
  id?:      string
  onSubmit: (data: Record<string, string>) => void
  children: React.ReactNode
}

export function TForm({ id, onSubmit, children }: TFormProps) {

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form    = e.currentTarget
    const inputs  = form.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("input, select, textarea")
    const data: Record<string, string> = {}
    inputs.forEach((el) => {
      if (!el.name) 
        return

      // Checkbox: só envia "true" se marcado, "false" se desmarcado
      if (el instanceof HTMLInputElement && el.type === "checkbox") {
          data[el.name] = el.checked ? el.value : "false"
          return
      }

      // Radio: ignora se não estiver marcado
      if (el instanceof HTMLInputElement && el.type === "radio") {
          if (el.checked) 
            data[el.name] = el.value
          return
      }
      data[el.name] = el.value
    })
    onSubmit(data)
  }

  return (
    <form
      id={id}
      onSubmit={handleSubmit}
      className="bg-(--bg-surface) border border-(--border) rounded-lg p-4 sm:p-6"
    >
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </form>
  )
}

export function TFormFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 mt-6 pt-4 border-t border-(--border)">
      {children}
    </div>
  )
}

export function TFormActionsLeft({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>
}

export function TFormActionsRight({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>
}