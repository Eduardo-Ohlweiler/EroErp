package com.api.ero_erp.marca.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MarcaUpdateDto(

        @Schema(description = "Nome da marca", example = "Nestlé")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
        String nome,

        @Schema(description = "Situação da marca", example = "true")
        @NotNull(message = "Ativo é obrigatório")
        Boolean ativo
) {}
