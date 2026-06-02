package com.api.ero_erp.marca.dtos;

import java.time.LocalDateTime;

public record MarcaResponseDto(
        Long          id,
        Long          clienteId,
        String        nome,
        Boolean       ativo,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
