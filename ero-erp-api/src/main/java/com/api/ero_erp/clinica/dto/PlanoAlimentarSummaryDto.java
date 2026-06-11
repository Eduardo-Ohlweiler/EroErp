package com.api.ero_erp.clinica.dto;

import java.time.LocalDate;

public record PlanoAlimentarSummaryDto(
        Long      id,
        Long      pessoaId,
        String    pessoaNome,
        String    nome,
        LocalDate dataInicio,
        LocalDate dataFim,
        boolean   ativo
) {}
