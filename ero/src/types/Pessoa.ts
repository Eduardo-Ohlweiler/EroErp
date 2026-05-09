export type TipoPessoa = 'PESSOA_FISICA' | 'PESSOA_JURIDICA';

export interface TipoCadastro {
    id:     number;
    nome:   string;
    ativo:  boolean;
}

export interface PessoaResponse {
    id:                   number;
    nome:                 string;
    tipoPessoa:           TipoPessoa;
    dataNascimento:       string | null;
    cpf:                  string | null;
    rg:                   string | null;
    cnh:                  string | null;
    cnhCategoria:         string | null;
    cnhValidade:          string | null;
    cnpj:                 string | null;
    inscricaoEstadual:    string | null;
    inscricaoMunicipal:   string | null;
    nomeFantasia:         string | null;
    razaoSocial:          string | null;
    ativo:                boolean;
    tiposCadastro:        TipoCadastro[];
    createdAt:            string;
    createdById:          number | null;
    createdByNome:        string | null;
    updatedAt:            string | null;
    updatedById:          number | null;
    updatedByNome:        string | null;
}

export interface PessoaSelect {
    id:         number;
    nome:       string;
    tipoPessoa: TipoPessoa;
    cpf:        string | null;
    cnpj:       string | null;
}

export interface PessoaCreate {
    nome:                   string;
    tipoPessoa:             TipoPessoa;
    dataNascimento?:        string;
    cpf?:                   string;
    rg?:                    string;
    cnh?:                   string;
    cnhCategoria?:          string;
    cnhValidade?:           string;
    cnpj?:                  string;
    inscricaoEstadual?:     string;
    inscricaoMunicipal?:    string;
    nomeFantasia?:          string;
    razaoSocial?:           string;
    tiposCadastroIds?:      number[];
}

export type PessoaUpdate = Omit<PessoaCreate, 'tipoPessoa'>;