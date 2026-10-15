package com.api.ero_erp.auth.dtos;

import com.api.ero_erp.tenant.enums.PaletaSistema;
import com.api.ero_erp.usuario.enums.Role;

import java.util.UUID;

public record AuthResponseDto(
        String accessToken,
        String refreshToken,
        UUID usuarioId,
        String nome,
        String email,
        Role role,
        UUID tenantId,
        String tenantNome,
        /** Paleta do tenant efetivo — muda junto com ele na troca de tenant. */
        PaletaSistema paleta,
        boolean impersonating
) {}
