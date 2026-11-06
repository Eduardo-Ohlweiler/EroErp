package com.api.ero_api.tenant.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

@Schema(description = "Contratante")
public record TenantResponseDto(
        UUID id,
        String nome,
        String documento,
        String email,
        boolean ativo,
        boolean exige2fa,
        String corDestaque,
        Instant createdAt,
        Instant updatedAt,
        UUID createdBy,
        UUID updatedBy,
        Long version) {
}
