package com.api.ero_erp.pediatria.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record FormulaLacteaUpdateDto(

        @Schema(description = "Nome da fórmula láctea")
        @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
        String nome,

        @Schema(description = "Calorias por 100ml")
        BigDecimal kcalPor100ml,

        @Schema(description = "Proteína por 100ml")
        BigDecimal proteinaPor100ml,

        @Schema(description = "Indica se a fórmula está ativa")
        Boolean ativo

) {}
