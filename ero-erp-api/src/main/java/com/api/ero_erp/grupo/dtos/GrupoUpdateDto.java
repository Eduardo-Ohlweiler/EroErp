package com.api.ero_erp.grupo.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GrupoUpdateDto(

        @Schema(description = "Nome do grupo", example = "Alimentos")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
        String nome,

        @Schema(description = "Situação do grupo", example = "true")
        @NotNull(message = "Ativo é obrigatório")
        Boolean ativo
) {}
