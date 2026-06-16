package com.api.ero_erp.pediatria.dto;

import java.math.BigDecimal;

public record FormulaLacteaResponseDto(
        Long       id,
        String     nome,
        BigDecimal kcalPor100ml,
        BigDecimal proteinaPor100ml,
        boolean    ativo,
        boolean    global
) {}
