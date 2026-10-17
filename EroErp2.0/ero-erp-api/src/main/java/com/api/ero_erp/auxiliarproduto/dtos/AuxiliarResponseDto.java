package com.api.ero_erp.auxiliarproduto.dtos;

import java.time.Instant;
import java.util.UUID;

/** Grupo, categoria ou marca. */
public record AuxiliarResponseDto(
        UUID id,
        String nome,
        Boolean ativo,
        Instant createdAt,
        Instant updatedAt
) {}
