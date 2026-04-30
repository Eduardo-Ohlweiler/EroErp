package com.api.ero_erp.tipoendereco.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TipoEnderecoCreateDto (

        @Schema(description = "Nome do tipo", example = "Residencial")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
        String nome,

        @Schema(description = "Definir se o tipo esta ativo", example = "true")
        Boolean ativo
) {}
