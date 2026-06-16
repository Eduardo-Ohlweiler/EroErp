package com.api.ero_erp.pediatria.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record FormulaLacteaCreateDto(

        @Schema(description = "Nome da fórmula láctea")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
        String nome,

        @Schema(description = "Calorias por 100ml", example = "74.2")
        @NotNull(message = "Kcal por 100ml é obrigatório")
        BigDecimal kcalPor100ml,

        @Schema(description = "Proteína por 100ml", example = "1.38")
        @NotNull(message = "Proteína por 100ml é obrigatória")
        BigDecimal proteinaPor100ml,

        @Schema(description = "Indica se a fórmula está ativa")
        Boolean ativo

) {}
