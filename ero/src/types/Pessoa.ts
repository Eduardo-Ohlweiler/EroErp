export type TipoPessoa = "PESSOA_FISICA" | "PESSOA_JURIDICA"

export interface TipoCadastro {
    id:    number
    nome:  string
    ativo: boolean
}

export interface EmailResponse {
    id:            number
    pessoaId:      number
    tipoEmailId:   number
    tipoEmailNome: string
    email:         string
    observacao:    string | null
    principal:     boolean
    createdAt:     string
    updatedAt:     string | null
}

export interface TelefoneResponse {
    id:               number,
    pessoaId:         number,
    tipoTelefoneId:   number,
    tipoTelefoneNome: string,
    numero:           string,
    observacao:       string | null,
    principal:        boolean,
    createdAt:        string,
    updatedAt:        string | null
}

export interface PessoaRequest {
    nome:                string
    tipoPessoa:          TipoPessoa
    dataNascimento?:     string
    cpf?:                string
    rg?:                 string
    cnh?:                string
    cnhCategoria?:       string
    cnhValidade?:        string
    cnpj?:               string
    inscricaoEstadual?:  string
    inscricaoMunicipal?: string
    nomeFantasia?:       string
    razaoSocial?:        string
    tiposCadastroIds?:   number[]
}

export interface PessoaResponse extends PessoaRequest {
    id:             number
    ativo:          boolean
    tiposCadastro:  TipoCadastro[]
    emails:         EmailResponse[]
    createdAt:      string
    createdById:    number | null
    createdByNome:  string | null
    updatedAt:      string | null
    updatedById:    number | null
    updatedByNome:  string | null
}

export interface PessoaSelect {
    id:        number
    nome:      string
    tipoPessoa: TipoPessoa
    cpf:       string | null
    cnpj:      string | null
}

