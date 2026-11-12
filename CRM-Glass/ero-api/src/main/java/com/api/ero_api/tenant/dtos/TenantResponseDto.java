package com.api.ero_api.tenant.dtos;

import com.api.ero_api.tenant.enums.Fundo;
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
        @Schema(description = "Usuários ativos que o contratante pode ter (vazio = sem limite)") Integer limiteUsuarios,
        @Schema(description = "Usuários ativos hoje (o superadmin não conta)") long usuariosAtivos,
        AparenciaDto aparencia,
        @Schema(description = "Cena exclusiva vinculada (vazio = nenhuma)") Fundo fundoExclusivo,
        Instant createdAt,
        Instant updatedAt,
        UUID createdBy,
        UUID updatedBy,
        Long version) {
}
