package com.api.ero_api.tenant.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

/** O que o front precisa do contratante logado: nome e identidade visual. */
@Schema(description = "Contratante em que o usuário está atuando")
public record TenantAtualDto(UUID id, String nome, String corDestaque, boolean exige2fa) {
}
