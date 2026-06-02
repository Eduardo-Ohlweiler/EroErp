package com.api.ero_erp.subgrupo.dtos;

import java.time.LocalDateTime;

public record SubgrupoResponseDto(
        Long          id,
        Long          clienteId,
        Long          grupoId,
        String        grupoNome,
        String        nome,
        Boolean       ativo,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
