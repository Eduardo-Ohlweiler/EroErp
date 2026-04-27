package com.api.ero_erp.tipoemail.dtos;

import io.swagger.v3.oas.annotations.media.Schema;

public record TipoEmailUpdateDto (

        @Schema(description = "Nome do tipo", example = "Comercial")
        String nome,

        @Schema(description = "Definir se o tipo esta ativo", example = "true")
        Boolean ativo
) {}
