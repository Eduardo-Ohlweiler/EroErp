package com.api.ero_erp.subgrupo.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SubgrupoCreateDto(

        @Schema(description = "ID do grupo pai", example = "1")
        @NotNull(message = "Grupo é obrigatório")
        Long grupoId,

        @Schema(description = "Nome do subgrupo", example = "Bebidas Não Alcoólicas")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
        String nome
) {}
