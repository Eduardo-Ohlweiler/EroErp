package com.api.ero_erp.clinica.dto;

import java.time.LocalDateTime;

public record RefeicaoResponseDto(
        Long          id,
        String        nome,
        String        descricao,
        boolean       ativo,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
