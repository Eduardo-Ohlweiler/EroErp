package com.api.ero_erp.terapianutricional.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AvaliacaoNutricionalUtiSummaryDto(
        Long       id,
        Long       pessoaId,
        String     pessoaNome,
        LocalDate  dataAvaliacao,
        BigDecimal pesoAtual,
        BigDecimal imc,
        String     classifImcOms,
        String     formulaNome
) {}
