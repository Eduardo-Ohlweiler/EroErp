package com.api.ero_erp.cidade.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CidadeCreateDto(

        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 150, message = "Nome deve ter no máximo 150 caracteres")
        String nome,

        @NotNull(message = "Estado é obrigatório")
        Long estadoId,

        @NotNull(message = "Código IBGE é obrigatório")
        Integer codigoIbge,

        Boolean ativo
) {}