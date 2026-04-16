interface TFormProps {
  onSubmit: (data: Record<string, string>) => void
  children: React.ReactNode
}

export function TForm({ onSubmit, children }: TFormProps) {

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const inputs = form.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("input, select, textarea")
    const data: Record<string, string> = {}
    inputs.forEach((el) => {
      if (!el.name) return
      data[el.name] = el.value
    })
    onSubmit(data)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-6"
    >
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </form>
  )
}

export function TFormFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-between mt-6 pt-4 border-t border-[var(--border)]">
      {children}
    </div>
  )
}

export function TFormActionsLeft({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2">{children}</div>
}

export function TFormActionsRight({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2">{children}</div>
}