package com.api.ero_erp.cest.dtos;

public record CestResponseDto(
        Long    id,
        String  codigo,
        String  descricao,
        Long    ncmId,
        String  ncmCodigo,
        String  ncmDescricao,
        Boolean ativo
) {}
