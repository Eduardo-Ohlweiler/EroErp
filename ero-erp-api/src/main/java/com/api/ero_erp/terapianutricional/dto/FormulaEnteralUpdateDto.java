package com.api.ero_erp.terapianutricional.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record FormulaEnteralUpdateDto(

        @Schema(description = "Nome da fórmula enteral")
        @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
        String nome,

        @Schema(description = "Densidade calórica (kcal/ml)")
        BigDecimal densidadeKcalMl,

        @Schema(description = "Proteína por litro (g/L)")
        BigDecimal proteinaGL,

        @Schema(description = "Categoria da fórmula")
        @Size(max = 50, message = "Categoria deve ter no máximo 50 caracteres")
        String categoria,

        @Schema(description = "Carboidrato (g/L)")
        BigDecimal cho,

        @Schema(description = "Lipídio (g/L)")
        BigDecimal lip,

        @Schema(description = "Fibras (g/L)")
        BigDecimal fibras,

        @Schema(description = "Potássio (mg/L)")
        BigDecimal potassio,

        @Schema(description = "Osmolaridade (mOsm/L)")
        BigDecimal osmolaridade,

        @Schema(description = "Indica se a fórmula está ativa")
        Boolean ativo

) {}
