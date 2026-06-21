package com.api.ero_erp.otorrino.dto;

public record QuestionarioOpcaoDto(
        Long   id,
        int    ordem,
        String rotulo,
        int    valor
) {}
