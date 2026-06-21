package com.api.ero_erp.otorrino.dto;

import java.time.LocalDate;

public record ExameLaudoSummaryDto(
        Long      id,
        Long      pessoaId,
        String    pessoaNome,
        LocalDate dataExame,
        String    tipoExame
) {}
