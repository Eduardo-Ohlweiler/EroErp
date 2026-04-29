package com.api.ero_erp.tiporedesocial.dtos;

import io.swagger.v3.oas.annotations.media.Schema;

public record TipoRedeSocialUpdateDto (
        @Schema(description = "Nome do tipo", example = "Instagram")
        String nome,

        @Schema(description = "Definir se o tipo esta ativo", example = "true")
        Boolean ativo
) {}
