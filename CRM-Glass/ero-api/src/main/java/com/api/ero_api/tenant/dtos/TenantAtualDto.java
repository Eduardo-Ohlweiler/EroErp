package com.api.ero_api.tenant.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

/** O que o front precisa do contratante logado: nome, exigência de 2FA e aparência. */
@Schema(description = "Contratante em que o usuário está atuando")
public record TenantAtualDto(UUID id, String nome, boolean exige2fa, AparenciaDto aparencia) {
}
