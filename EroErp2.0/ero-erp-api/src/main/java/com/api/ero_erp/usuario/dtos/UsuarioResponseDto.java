package com.api.ero_erp.usuario.dtos;

import com.api.ero_erp.usuario.enums.Role;

import java.time.Instant;
import java.util.UUID;

public record UsuarioResponseDto(
        UUID id,
        UUID tenantId,
        String tenantNome,
        String nome,
        String email,
        String telefone,
        String codigoPais,
        Role role,
        Boolean ativo,
        Boolean bloqueado,
        Instant createdAt
) {}
