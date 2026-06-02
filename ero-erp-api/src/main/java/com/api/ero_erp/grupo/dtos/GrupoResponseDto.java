package com.api.ero_erp.grupo.dtos;

import java.time.LocalDateTime;

public record GrupoResponseDto(
        Long          id,
        Long          clienteId,
        String        nome,
        Boolean       ativo,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
