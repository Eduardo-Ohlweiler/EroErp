package com.api.ero_erp.gym.dto;

import java.time.LocalDate;

public record PlanoTreinoSummaryDto(
        Long      id,
        Long      pessoaId,
        String    pessoaNome,
        String    nome,
        LocalDate dataInicio,
        LocalDate dataFim,
        boolean   ativo
) {}
