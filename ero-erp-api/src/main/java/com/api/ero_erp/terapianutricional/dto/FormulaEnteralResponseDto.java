package com.api.ero_erp.terapianutricional.dto;

import java.math.BigDecimal;

public record FormulaEnteralResponseDto(
        Long       id,
        String     nome,
        BigDecimal densidadeKcalMl,
        BigDecimal proteinaGL,
        String     categoria,
        BigDecimal cho,
        BigDecimal lip,
        BigDecimal fibras,
        BigDecimal potassio,
        BigDecimal osmolaridade,
        boolean    ativo,
        boolean    global
) {}
