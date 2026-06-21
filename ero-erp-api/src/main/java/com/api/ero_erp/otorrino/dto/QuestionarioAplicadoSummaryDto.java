package com.api.ero_erp.otorrino.dto;

import java.time.LocalDate;

public record QuestionarioAplicadoSummaryDto(
        Long      id,
        Long      pessoaId,
        String    pessoaNome,
        String    questionarioCodigo,
        String    questionarioNome,
        LocalDate dataAplicacao,
        Integer   scoreTotal,
        String    classificacao
) {}
