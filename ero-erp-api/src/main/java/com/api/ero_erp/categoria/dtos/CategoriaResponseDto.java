package com.api.ero_erp.categoria.dtos;

import java.time.LocalDateTime;

public record CategoriaResponseDto(
        Long          id,
        Long          clienteId,
        String        nome,
        Boolean       ativo,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
