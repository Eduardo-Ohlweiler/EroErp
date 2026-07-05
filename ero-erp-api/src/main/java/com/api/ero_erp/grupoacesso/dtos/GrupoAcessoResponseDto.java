package com.api.ero_erp.grupoacesso.dtos;

import java.util.Set;

public record GrupoAcessoResponseDto(
        Long        id,
        String      nome,
        String      descricao,
        Set<String> roles
) {}
