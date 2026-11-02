/** Erro, ou a ajuda — nunca os dois. Igual em todo campo do kit. */
export function RodapeDoCampo({
  erroId,
  ajudaId,
  error,
  ajuda,
}: {
  erroId: string
  ajudaId: string
  error?: string
  ajuda?: string
}) {
  if (error) {
    return (
      <span id={erroId} role="alert" className="text-caption text-danger">
        {error}
      </span>
    )
  }
  if (ajuda) {
    return (
      <span id={ajudaId} className="text-caption text-txt-muted">
        {ajuda}
      </span>
    )
  }
  return null
}
