package com.api.ero_erp.config;

import com.api.ero_erp.usuario.enums.Role;

import java.util.UUID;

public record AuthDetails(
        UUID tenantId,
        UUID sessionId,
        Role role,
        boolean impersonating
) {}
