package com.api.ero_erp.pessoavinculo.dtos;

import com.api.ero_erp.pessoavinculo.enums.TipoVinculo;

import java.time.LocalDateTime;

public record PessoaVinculoResponseDto(
        Long          id,
        Long          pessoaId,
        String        pessoaNome,
        String        pessoaCpf,
        String        pessoaCnpj,
        TipoVinculo   tipo,
        String        tipoDescricao,
        String        observacao,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
