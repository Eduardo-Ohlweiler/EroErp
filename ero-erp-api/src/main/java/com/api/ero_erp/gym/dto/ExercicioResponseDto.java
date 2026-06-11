package com.api.ero_erp.gym.dto;

import java.time.LocalDateTime;

public record ExercicioResponseDto(
        Long          id,
        String        nome,
        String        descricao,
        boolean       ativo,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
