package com.api.ero_erp.terapianutricional.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record FormulaEnteralCreateDto(

        @Schema(description = "Nome da fórmula enteral")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
        String nome,

        @Schema(description = "Densidade calórica (kcal/ml)", example = "1.5")
        @NotNull(message = "Densidade (kcal/ml) é obrigatória")
        BigDecimal densidadeKcalMl,

        @Schema(description = "Proteína por litro (g/L)", example = "60")
        @NotNull(message = "Proteína (g/L) é obrigatória")
        BigDecimal proteinaGL,

        @Schema(description = "Categoria da fórmula", example = "Padrão")
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
