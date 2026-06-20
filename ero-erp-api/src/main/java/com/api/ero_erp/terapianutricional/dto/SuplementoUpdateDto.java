package com.api.ero_erp.terapianutricional.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record SuplementoUpdateDto(

        @Schema(description = "Nome do suplemento")
        @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
        String nome,

        @Schema(description = "Quantidade de referência (g)")
        BigDecimal qtdG,

        @Schema(description = "Calorias (kcal)")
        BigDecimal kcal,

        @Schema(description = "Proteína (g)")
        BigDecimal ptn,

        @Schema(description = "Carboidrato (g)")
        BigDecimal cho,

        @Schema(description = "Açúcar (g)")
        BigDecimal acucar,

        @Schema(description = "Lipídio (g)")
        BigDecimal lip,

        @Schema(description = "Sódio (mg)")
        BigDecimal sodio,

        @Schema(description = "Potássio (mg)")
        BigDecimal potassio,

        @Schema(description = "Fósforo (mg)")
        BigDecimal fosforo,

        @Schema(description = "Ferro (mg)")
        BigDecimal ferro,

        @Schema(description = "Fibras (g)")
        BigDecimal fibras,

        @Schema(description = "Osmolaridade (mOsm/L)")
        BigDecimal osmolaridade,

        @Schema(description = "Indica se o suplemento está ativo")
        Boolean ativo

) {}
