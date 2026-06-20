package com.api.ero_erp.terapianutricional.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RegistroDiarioUtiSummaryDto(
        Long       id,
        Long       pessoaId,
        String     pessoaNome,
        LocalDate  data,
        String     dieta,
        BigDecimal percRecebidoNe,
        BigDecimal volPrescrito24h,
        BigDecimal volRecebido24h,
        BigDecimal percRecebido
) {}
