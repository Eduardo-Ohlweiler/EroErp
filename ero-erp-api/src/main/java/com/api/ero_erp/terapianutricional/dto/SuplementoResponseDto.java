package com.api.ero_erp.terapianutricional.dto;

import java.math.BigDecimal;

public record SuplementoResponseDto(
        Long       id,
        String     nome,
        BigDecimal qtdG,
        BigDecimal kcal,
        BigDecimal ptn,
        BigDecimal cho,
        BigDecimal acucar,
        BigDecimal lip,
        BigDecimal sodio,
        BigDecimal potassio,
        BigDecimal fosforo,
        BigDecimal ferro,
        BigDecimal fibras,
        BigDecimal osmolaridade,
        boolean    ativo,
        boolean    global
) {}
