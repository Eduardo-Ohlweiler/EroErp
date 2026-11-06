package com.api.ero_api.tenant.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

@Schema(description = "Contratante para seleção")
public record TenantSelectDto(UUID id, String nome) {
}
