export function formatarDocumento(documento: string | null): string {
    if (!documento) return "—"
    const n = documento.replace(/\D/g, "")
    if (n.length === 11) return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    if (n.length === 14) return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    return documento
}

export function displayPessoa(item: Record<string, unknown>): string {
    const nome     = String(item.nome ?? "")
    const cpf      = item.cpf  ? String(item.cpf)  : null
    const cnpj     = item.cnpj ? String(item.cnpj) : null
    const doc      = cpf ?? cnpj ?? null
    return doc ? `${nome}  (${formatarDocumento(doc)})` : nome
}

export function displayEmitente(item: Record<string, unknown>): string {
    const nome = String(item.pessoaNome ?? "")
    const doc  = item.pessoaDocumento ? String(item.pessoaDocumento) : null
    return doc ? `${nome}  (${formatarDocumento(doc)})` : nome
}
