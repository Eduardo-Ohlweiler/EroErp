package com.api.ero_erp.financeiro.tipocobranca.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

public record TipoCobrancaUpdateDto(

        @Schema(description = "Nome do tipo de cobrança", example = "Débito")
        @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
        String nome,

        @Schema(description = "Define se o tipo de cobrança está ativo", example = "true")
        Boolean ativo
) {}
