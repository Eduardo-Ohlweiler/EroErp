package com.api.ero_erp.pessoa.dtos;

import com.api.ero_erp.pessoa.enums.TipoPessoa;

public record PessoaSelectDto(
        Long       id,
        String     nome,
        TipoPessoa tipoPessoa,
        String     cpf,
        String     cnpj
) {}