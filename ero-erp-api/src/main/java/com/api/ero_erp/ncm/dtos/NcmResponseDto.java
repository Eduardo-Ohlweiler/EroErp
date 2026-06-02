package com.api.ero_erp.ncm.dtos;

public record NcmResponseDto(
        Long    id,
        String  codigo,
        String  descricao,
        Boolean ativo
) {}
