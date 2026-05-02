package com.api.ero_erp.estado.dtos;

import jakarta.validation.constraints.Size;

public record EstadoUpdateDto(

        @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
        String nome,

        @Size(min = 2, max = 2, message = "Sigla deve ter exatamente 2 caracteres")
        String sigla,

        Integer codigoIbge,
        Boolean ativo
) {}