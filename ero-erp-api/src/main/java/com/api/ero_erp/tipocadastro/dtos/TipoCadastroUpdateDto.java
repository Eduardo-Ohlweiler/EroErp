package com.api.ero_erp.tipocadastro.dtos;

import io.swagger.v3.oas.annotations.media.Schema;

public record TipoCadastroUpdateDto (

        @Schema(description = "Nome do tipo", example = "Cliente")
        String nome,

        @Schema(description = "Definir se o tipo esta ativo", example = "true")
        Boolean ativo
) {}
