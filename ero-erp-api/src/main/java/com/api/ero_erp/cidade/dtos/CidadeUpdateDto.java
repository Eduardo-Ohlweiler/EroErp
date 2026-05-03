package com.api.ero_erp.cidade.dtos;

import jakarta.validation.constraints.Size;

public record CidadeUpdateDto(

        @Size(max = 150, message = "Nome deve ter no máximo 150 caracteres")
        String nome,

        Long    estadoId,
        Integer codigoIbge,
        Boolean ativo
) {}