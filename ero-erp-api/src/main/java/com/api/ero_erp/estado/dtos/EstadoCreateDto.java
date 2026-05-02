package com.api.ero_erp.estado.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EstadoCreateDto(

        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
        String nome,

        @NotBlank(message = "Sigla é obrigatória")
        @Size(min = 2, max = 2, message = "Sigla deve ter exatamente 2 caracteres")
        String sigla,

        Integer codigoIbge
) {}
