package com.api.ero_erp.filial.mapper;

import com.api.ero_erp.filial.dtos.FilialResponseDto;
import com.api.ero_erp.filial.dtos.FilialSelectDto;
import com.api.ero_erp.filial.entity.Filial;
import com.api.ero_erp.pessoa.entity.Pessoa;

public final class FilialMapper {

    private FilialMapper() {}

    public static FilialResponseDto toResponse(Filial filial) {
        Pessoa pessoa = filial.getPessoa();
        Filial matriz = filial.getMatriz();
        return new FilialResponseDto(
                filial.getId(),
                pessoa.getId(),
                pessoa.getNome(),
                pessoa.getNomeFantasia(),
                pessoa.getTipoPessoa(),
                documento(pessoa),
                filial.getTipo(),
                matriz != null ? matriz.getId() : null,
                matriz != null ? matriz.getPessoa().getNome() : null,
                filial.getCor(),
                filial.getAtivo(),
                filial.getCreatedAt(),
                filial.getUpdatedAt());
    }

    public static FilialSelectDto toSelect(Filial filial) {
        Pessoa pessoa = filial.getPessoa();
        return new FilialSelectDto(
                filial.getId(),
                pessoa.getNome(),
                documento(pessoa),
                filial.getTipo(),
                filial.getCor());
    }

    private static String documento(Pessoa pessoa) {
        return pessoa.ehPessoaFisica() ? pessoa.getCpf() : pessoa.getCnpj();
    }
}
