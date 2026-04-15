package com.api.ero_erp.usuario.dtos;

import java.time.LocalDateTime;
import java.util.Set;

public record UsuarioResponseDto(

        Long            id,
        String          nome,
        String          email,
        String          telefone,
        Boolean         ativo,
        Long            clienteId,
        LocalDateTime   createdAt,
        LocalDateTime   updatedAt,
        Long            createdBy,
        Long            updatedBy,
        Set<String>     roles
) {}
