package com.api.ero_erp.clinica.dto;

import java.time.LocalDate;

public record FichaAnamnesesSummaryDto(
        Long      id,
        Long      pessoaId,
        String    pessoaNome,
        String    finalidade,
        String    templateNome,
        LocalDate dataPreenchimento,
        String    emitenteNome
) {}
