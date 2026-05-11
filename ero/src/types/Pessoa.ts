export type TipoPessoa = "PESSOA_FISICA" | "PESSOA_JURIDICA"

export interface TipoCadastro {
    id: number
    nome: string
    ativo: boolean
}

export interface PessoaRequest {
    nome: string
    tipoPessoa: TipoPessoa
    dataNascimento?: string
    cpf?: string
    rg?: string
    cnh?: string
    cnhCategoria?: string
    cnhValidade?: string
    cnpj?: string
    inscricaoEstadual?: string
    inscricaoMunicipal?: string
    nomeFantasia?: string
    razaoSocial?: string
    tiposCadastroIds?: number[]
}

export interface PessoaResponse extends PessoaRequest {
    id: number
    ativo: boolean
    tiposCadastro: TipoCadastro[]
    createdAt: string
    createdById: number | null
    createdByNome: string | null
    updatedAt: string | null
    updatedById: number | null
    updatedByNome: string | null
}

export interface PessoaSelect {
    id: number
    nome: string
    tipoPessoa: TipoPessoa
    cpf: string | null
    cnpj: string | null
}