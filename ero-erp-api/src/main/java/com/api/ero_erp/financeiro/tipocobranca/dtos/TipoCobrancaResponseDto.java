package com.api.ero_erp.financeiro.tipocobranca.dtos;

public record TipoCobrancaResponseDto(
        Long    id,
        String  nome,
        Boolean ativo
) {}
