interface TFormProps {
  onSubmit: (data: Record<string, string>) => void
  children: React.ReactNode
  columns?: 1 | 2 | 3  // quantas colunas no grid
  submitLabel?: string
  onCancel?: () => void
}

export function TForm({ onSubmit, children, columns = 2, submitLabel = "Salvar", onCancel }: TFormProps) {

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const inputs = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea")
    const data: Record<string, string> = {}
    inputs.forEach((el) => {
      if (el.name) data[el.name] = el.value
    })
    onSubmit(data)
  }

  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
  }[columns]

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-6"
    >
      <div className={`grid ${gridClass} gap-4`}>
        {children}
      </div>

      {/* Ações */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#30363d]">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-md text-[#9da5b4] border border-[#30363d] hover:bg-[#2a313a] transition"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white transition"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}