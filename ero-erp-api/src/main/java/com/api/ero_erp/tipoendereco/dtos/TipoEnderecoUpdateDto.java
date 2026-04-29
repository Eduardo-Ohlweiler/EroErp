package com.api.ero_erp.tipoendereco.dtos;

import io.swagger.v3.oas.annotations.media.Schema;

public record TipoEnderecoUpdateDto (

        @Schema(description = "Nome do tipo", example = "Residencial")
        String nome,

        @Schema(description = "Definir se o tipo esta ativo", example = "true")
        Boolean ativo
) {}