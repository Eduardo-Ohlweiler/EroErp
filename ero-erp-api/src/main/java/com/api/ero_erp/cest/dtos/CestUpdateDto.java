package com.api.ero_erp.cest.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CestUpdateDto(

        @Schema(description = "Código CEST (7 ou 9 dígitos)", example = "0100100")
        @NotBlank(message = "Código é obrigatório")
        @Size(max = 9, message = "Código deve ter no máximo 9 caracteres")
        String codigo,

        @Schema(description = "Descrição do CEST", example = "Bebidas quentes")
        @NotBlank(message = "Descrição é obrigatória")
        @Size(max = 150, message = "Descrição deve ter no máximo 150 caracteres")
        String descricao,

        @Schema(description = "ID do NCM vinculado", example = "1")
        @NotNull(message = "NCM é obrigatório")
        Long ncmId,

        @Schema(description = "Status do CEST", example = "true")
        @NotNull(message = "Ativo é obrigatório")
        Boolean ativo
) {}
