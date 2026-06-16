package com.api.ero_erp.pediatria.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AvaliacaoPediatricaSummaryDto(
        Long       id,
        Long       pessoaId,
        String     pessoaNome,
        LocalDate  dataAvaliacao,
        Integer    idadeMeses,
        Integer    idadeSemanas,
        BigDecimal peso,
        BigDecimal imc,
        String     classifImcIdade,
        String     formulaNome
) {}
