package com.api.ero_erp.ncm.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record NcmUpdateDto(

        @Schema(description = "Código NCM (8 dígitos)", example = "22011000")
        @NotBlank(message = "Código é obrigatório")
        @Size(max = 8, message = "Código deve ter no máximo 8 caracteres")
        String codigo,

        @Schema(description = "Descrição do NCM", example = "Águas minerais naturais")
        @NotBlank(message = "Descrição é obrigatória")
        @Size(max = 150, message = "Descrição deve ter no máximo 150 caracteres")
        String descricao,

        @Schema(description = "Status do NCM", example = "true")
        @NotNull(message = "Ativo é obrigatório")
        Boolean ativo
) {}
