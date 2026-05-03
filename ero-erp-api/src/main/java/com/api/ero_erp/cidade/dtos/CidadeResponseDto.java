package com.api.ero_erp.cidade.dtos;

import com.api.ero_erp.estado.entity.Estado;

public record CidadeResponseDto(
        Long    id,
        String  nome,
        Integer codigoIbge,
        Boolean ativo,
        Estado  estado
) {}