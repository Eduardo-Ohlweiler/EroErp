package com.api.ero_erp.tipotelefone.dtos;

import io.swagger.v3.oas.annotations.media.Schema;

public record TipoTelefoneUpdateDto (

        @Schema(description = "Nome do tipo", example = "Whatsapp")
        String nome,

        @Schema(description = "Definir se o tipo esta ativo", example = "true")
        Boolean ativo
) {}