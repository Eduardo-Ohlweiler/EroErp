package com.api.ero_erp.auth.dtos;

import java.util.Set;

public record AuthResponseDto(
        String      token,
        Long        id,
        String      nome,
        String      email,
        Set<String> roles
) {}